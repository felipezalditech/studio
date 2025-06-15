
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building, CheckCircle, Info, PlusCircle, ShoppingCart, Tag, Truck, Users } from 'lucide-react';
import type { ExtractNFeDataOutput, NFeProduct } from '@/ai/flows/extract-nfe-data-flow';
import type { Supplier } from '@/contexts/SupplierContext';
import { useSuppliers } from '@/contexts/SupplierContext';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/components/assets/columns'; // Usar formatação consistente
import { Badge } from '@/components/ui/badge';

interface NFePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeData: ExtractNFeDataOutput | null;
  onImportItems: (selectedProducts: NFeProduct[], supplierId: string | undefined, nfeDetails: ExtractNFeDataOutput) => void;
}

export function NFePreviewDialog({ open, onOpenChange, nfeData, onImportItems }: NFePreviewDialogProps) {
  const [selectedProductIndexes, setSelectedProductIndexes] = useState<number[]>([]);
  const [supplierOnRecord, setSupplierOnRecord] = useState<Supplier | null | undefined>(undefined); // undefined: loading, null: not found
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  
  const { getSupplierByDocument } = useSuppliers();
  const { toast } = useToast();

  useEffect(() => {
    if (open && nfeData?.supplierCNPJ) {
      const foundSupplier = getSupplierByDocument(nfeData.supplierCNPJ);
      setSupplierOnRecord(foundSupplier || null);
    } else if (open) {
      setSupplierOnRecord(null); // No CNPJ, so not found
    }
    setSelectedProductIndexes([]); // Reset selection when dialog opens or nfeData changes
  }, [open, nfeData, getSupplierByDocument]);

  const handleProductSelection = (index: number, checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedProductIndexes(prev => [...prev, index]);
    } else {
      setSelectedProductIndexes(prev => prev.filter(i => i !== index));
    }
  };

  const handleSelectAllProducts = (checked: boolean | 'indeterminate') => {
    if (checked === true && nfeData?.products) {
      setSelectedProductIndexes(nfeData.products.map((_, index) => index));
    } else {
      setSelectedProductIndexes([]);
    }
  };
  
  const handleImport = () => {
    if (!nfeData || !nfeData.products) {
      toast({ title: "Erro interno", description: "Dados da NF-e não encontrados.", variant: "destructive" });
      return;
    }
    const itemsToImport = selectedProductIndexes.map(index => nfeData.products![index]);
    if (itemsToImport.length === 0) {
      toast({ title: "Nenhum item selecionado", description: "Por favor, selecione ao menos um item da nota para importar.", variant: "default" });
      return;
    }

    if (supplierOnRecord === undefined) {
      toast({ title: "Aguarde", description: "Verificando dados do fornecedor...", variant: "default" });
      return;
    }

    if (!supplierOnRecord && nfeData.supplierCNPJ) {
      toast({
        title: "Fornecedor não cadastrado",
        description: `O fornecedor ${nfeData.supplierName || nfeData.supplierCNPJ} não está cadastrado. Por favor, cadastre-o antes de importar.`,
        variant: "default",
        duration: 7000,
      });
      setIsSupplierFormOpen(true); // Abre o modal de cadastro
      return;
    }
    
    if (!supplierOnRecord && !nfeData.supplierCNPJ) {
        // Este caso é menos provável se o fluxo sempre extrair CNPJ, mas é uma salvaguarda
        toast({ title: "Fornecedor Inválido", description: "Não foi possível identificar o fornecedor da NF-e.", variant: "destructive" });
        return;
    }

    onImportItems(itemsToImport, supplierOnRecord?.id, nfeData);
    onOpenChange(false); 
  };

  const handleSupplierAdded = (newSupplierId: string) => {
    const newlyAddedSupplier = getSupplierByDocument(nfeData?.supplierCNPJ || "");
    setSupplierOnRecord(newlyAddedSupplier || null);
    setIsSupplierFormOpen(false);
    toast({ title: "Fornecedor cadastrado!", description: "Agora você pode prosseguir com a importação dos itens.", icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
  };

  const supplierForFormDialog = useMemo(() => {
    if (!nfeData) return null;
    return {
      type: 'juridica' as 'juridica', // Assumindo jurídica pelo CNPJ
      razaoSocial: nfeData.supplierName || '',
      nomeFantasia: nfeData.supplierName || '', // Pode ser melhorado se xFant existir no XML
      cnpj: nfeData.supplierCNPJ || '',
      // Inicializar outros campos obrigatórios do SupplierFormDialog se necessário
      // Ex: emailFaturamento, endereco, responsavelNome podem precisar de valores padrão ou serem opcionais no form.
      // Por agora, o SupplierFormDialog já tem seus próprios defaults.
    };
  }, [nfeData]);


  if (!nfeData) return null;

  const allProductsSelected = nfeData.products ? selectedProductIndexes.length === nfeData.products.length : false;
  const someProductsSelected = selectedProductIndexes.length > 0 && !allProductsSelected;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pré-visualização da NF-e: {nfeData.invoiceNumber || "Número Desconhecido"}</DialogTitle>
            <DialogDescription>
              Revise os dados extraídos da Nota Fiscal Eletrônica e selecione os itens que deseja importar como ativos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-1 text-sm border-b pb-3 mb-3">
            <div><strong>Fornecedor:</strong> {nfeData.supplierName || "Não informado"}</div>
            <div><strong>CNPJ:</strong> {nfeData.supplierCNPJ || "Não informado"}</div>
            <div><strong>Data Emissão:</strong> {nfeData.emissionDate ? new Date(nfeData.emissionDate).toLocaleDateString('pt-BR') : "Não informada"}</div>
            <div><strong>Valor Total NF-e:</strong> {formatCurrency(nfeData.nfeTotalValue || 0)}</div>
            <div><strong>Valor Frete:</strong> {formatCurrency(nfeData.shippingValue || 0)}</div>
          </div>

          {supplierOnRecord === undefined && (
            <Alert variant="default" className="mb-3">
              <Info className="h-4 w-4" />
              <AlertTitle>Verificando Fornecedor</AlertTitle>
              <AlertDescription>Aguarde enquanto verificamos se o fornecedor já está cadastrado...</AlertDescription>
            </Alert>
          )}
          {supplierOnRecord === null && nfeData.supplierCNPJ && (
            <Alert variant="default" className="mb-3 border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
              <Building className="h-4 w-4" />
              <AlertTitle>Fornecedor não cadastrado</AlertTitle>
              <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span>O fornecedor <Badge variant="secondary">{nfeData.supplierName || nfeData.supplierCNPJ}</Badge> não foi encontrado no sistema.</span>
                <Button onClick={() => setIsSupplierFormOpen(true)} size="sm" variant="outline" className="shrink-0 border-yellow-500 hover:bg-yellow-50 text-yellow-700 dark:border-yellow-400 dark:hover:bg-yellow-700/20 dark:text-yellow-300">
                  <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Fornecedor
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {supplierOnRecord && (
             <Alert variant="default" className="mb-3 border-green-500 text-green-700 dark:border-green-400 dark:text-green-300 [&>svg]:text-green-500 dark:[&>svg]:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Fornecedor Localizado</AlertTitle>
              <AlertDescription>
                Fornecedor: <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">{supplierOnRecord.nomeFantasia || supplierOnRecord.razaoSocial}</Badge> (CNPJ: {supplierOnRecord.cnpj}).
              </AlertDescription>
            </Alert>
          )}

          <h3 className="text-lg font-semibold mb-2 flex items-center"><ShoppingCart className="mr-2 h-5 w-5 text-primary" /> Itens da Nota Fiscal</h3>
          <ScrollArea className="flex-grow border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allProductsSelected || (someProductsSelected ? 'indeterminate' : false)}
                      onCheckedChange={handleSelectAllProducts}
                      aria-label="Selecionar todos os produtos"
                    />
                  </TableHead>
                  <TableHead>Produto (Descrição)</TableHead>
                  <TableHead className="text-right w-24">Qtde.</TableHead>
                  <TableHead className="text-right w-32">Vlr. Unit.</TableHead>
                  <TableHead className="text-right w-32">Vlr. Total Item</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nfeData.products && nfeData.products.length > 0 ? (
                  nfeData.products.map((product, index) => (
                    <TableRow key={index} data-state={selectedProductIndexes.includes(index) && "selected"}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProductIndexes.includes(index)}
                          onCheckedChange={(checked) => handleProductSelection(index, checked)}
                          aria-label={`Selecionar produto ${product.description || `item ${index + 1}`}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.description || "Produto sem descrição"}</TableCell>
                      <TableCell className="text-right">{product.quantity?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.unitValue || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.totalValue || 0)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum produto encontrado nesta NF-e.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          {nfeData.products && nfeData.products.length > 0 && (
            <div className="text-sm text-muted-foreground mt-2">
                {selectedProductIndexes.length} de {nfeData.products.length} item(ns) selecionado(s).
            </div>
          )}


          <DialogFooter className="mt-auto pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              onClick={handleImport}
              disabled={selectedProductIndexes.length === 0 || supplierOnRecord === undefined || (!supplierOnRecord && !!nfeData.supplierCNPJ)}
            >
              <Tag className="mr-2 h-4 w-4" /> Importar {selectedProductIndexes.length > 0 ? `${selectedProductIndexes.length} Item(s)` : "Item(s) Selecionado(s)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isSupplierFormOpen && supplierForFormDialog && (
        <SupplierFormDialog
          open={isSupplierFormOpen}
          onOpenChange={setIsSupplierFormOpen}
          initialData={supplierForFormDialog}
          onSupplierAdded={handleSupplierAdded}
        />
      )}
    </>
  );
}

