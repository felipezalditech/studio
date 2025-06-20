
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UITableFooter } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building, CheckCircle, Info, PlusCircle, ShoppingCart, Tag, Trash2 } from 'lucide-react';
import type { ExtractNFeDataOutput, NFeProduct } from '@/ai/flows/extract-nfe-data-flow';
import type { Supplier, Endereco } from '@/contexts/SupplierContext';
import { useSuppliers } from '@/contexts/SupplierContext';
import { SupplierFormDialog, type SupplierFormValues } from '@/components/suppliers/SupplierFormDialog';
import { useImportSettings } from '@/contexts/ImportSettingsContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/components/assets/columns';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { maskCEP, maskCNPJ } from '@/lib/utils';
import type { Asset } from '@/components/assets/types';
import { parseISO } from 'date-fns';


export interface AssetImportTask {
  assetData: Partial<Omit<Asset, 'id' | 'currentValue' | 'categoryId' | 'modelId' | 'locationId' | 'assetTag' | 'serialNumber' | 'additionalInfo' | 'imageDateUris' | 'invoiceFileDataUri' | 'invoiceFileName'>>;
  originalNFeProductDescription: string; // Para usar como nome padrão ou referência
}

interface ItemActionQuantities {
  depreciableQty: number;
  patrimonyQty: number;
}

interface NFePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeData: ExtractNFeDataOutput | null;
  onImportItems: (tasks: AssetImportTask[], supplierId: string | undefined, nfeDetails: ExtractNFeDataOutput) => void;
}


export function NFePreviewDialog({ open, onOpenChange, nfeData, onImportItems }: NFePreviewDialogProps) {
  const [supplierOnRecord, setSupplierOnRecord] = useState<Supplier | null | undefined>(undefined);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  
  const [displayableProducts, setDisplayableProducts] = useState<NFeProduct[]>([]);
  const [itemActions, setItemActions] = useState<Map<number, ItemActionQuantities>>(new Map());
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);


  const { getSupplierByDocument } = useSuppliers();
  const { importSettings } = useImportSettings();
  const { toast } = useToast();


  useEffect(() => {
    if (open && nfeData) {
      const products = nfeData.products || [];
      setDisplayableProducts(products);

      if (nfeData.supplierCNPJ) {
        const foundSupplier = getSupplierByDocument(nfeData.supplierCNPJ.replace(/\D/g, ''));
        setSupplierOnRecord(foundSupplier || null);
      } else {
        setSupplierOnRecord(null);
      }

      const initialActions = new Map<number, ItemActionQuantities>();
      products.forEach((_product, index) => {
        initialActions.set(index, { depreciableQty: 0, patrimonyQty: 0 });
      });
      setItemActions(initialActions);
      setSelectedItems(new Set());


    } else if (!open) {
      setDisplayableProducts([]);
      setItemActions(new Map());
      setSelectedItems(new Set());
      setSupplierOnRecord(undefined);
    }
  }, [open, nfeData, getSupplierByDocument]);

  const handleQuantityChange = (
    productIndex: number,
    type: 'depreciableQty' | 'patrimonyQty',
    value: string
  ) => {
    const product = displayableProducts[productIndex];
    if (!product) return;

    let numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
      numValue = 0;
    }

    setItemActions(prevActions => {
      const newActions = new Map(prevActions);
      const currentAction = newActions.get(productIndex) || { depreciableQty: 0, patrimonyQty: 0 };
      const updatedAction = { ...currentAction };

      if (type === 'depreciableQty') {
        updatedAction.depreciableQty = Math.min(numValue, (product.quantity || 0) - updatedAction.patrimonyQty);
      } else { 
        updatedAction.patrimonyQty = Math.min(numValue, (product.quantity || 0) - updatedAction.depreciableQty);
      }
      
      if (updatedAction.depreciableQty + updatedAction.patrimonyQty > (product.quantity || 0)) {
        if (type === 'depreciableQty') {
            updatedAction.depreciableQty = (product.quantity || 0) - updatedAction.patrimonyQty;
        } else {
            updatedAction.patrimonyQty = (product.quantity || 0) - updatedAction.depreciableQty;
        }
      }
      newActions.set(productIndex, updatedAction);
      return newActions;
    });
  };

  const handleImport = () => {
    if (!nfeData) {
      toast({ title: "Erro interno", description: "Dados da NF-e não encontrados.", variant: "destructive" });
      return;
    }

    let rawTasks: { product: NFeProduct, assetType: 'depreciable' | 'patrimony' }[] = [];
    displayableProducts.forEach((product, index) => {
      const actions = itemActions.get(index);
      if (!actions || !product) return;

      for (let i = 0; i < actions.depreciableQty; i++) {
        rawTasks.push({ product: { ...product }, assetType: 'depreciable' });
      }
      for (let i = 0; i < actions.patrimonyQty; i++) {
        rawTasks.push({ product: { ...product }, assetType: 'patrimony' });
      }
    });

    if (rawTasks.length === 0) {
      toast({ title: "Nenhum item para importar", description: "Por favor, defina quantidades para 'Ativo Depreciável' ou 'Patrimônio'.", variant: "default" });
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
      setIsSupplierFormOpen(true);
      return;
    }
    
    if (!supplierOnRecord && !nfeData.supplierCNPJ) {
        toast({ title: "Fornecedor Inválido", description: "Não foi possível identificar o fornecedor da NF-e.", variant: "destructive" });
        return;
    }

    let finalTasks: AssetImportTask[] = [];
    const shippingValue = nfeData.shippingValue || 0;
    const nfePurchaseDate = nfeData.emissionDate ? parseISO(nfeData.emissionDate) : new Date();


    const mapToAssetImportTask = (
        tasksToProcess: typeof rawTasks,
        totalProductValueForFreightCalc: number
      ): AssetImportTask[] => {
      return tasksToProcess.map(rawTask => {
        const { product, assetType } = rawTask;
        let freightPerUnit = 0;
        if (importSettings.allocateFreight && shippingValue > 0 && totalProductValueForFreightCalc > 0 && product.totalValue && product.quantity && product.quantity > 0) {
          const productLineFreightShare = (product.totalValue / totalProductValueForFreightCalc) * shippingValue;
          freightPerUnit = productLineFreightShare / product.quantity;
        }

        const assetData: Partial<Omit<Asset, 'id' | 'currentValue'>> = {
          name: product.description || '', // This will be the default, editable name
          purchaseValue: (product.unitValue || 0) + freightPerUnit,
          invoiceNumber: nfeData.invoiceNumber || '',
          purchaseDate: nfePurchaseDate.toISOString(), 
          supplier: supplierOnRecord!.id,
          aplicarRegrasDepreciacao: assetType === 'depreciable',
          arquivado: false, // Default
          previouslyDepreciatedValue: 0, // Default
        };
        return { assetData, originalNFeProductDescription: product.description || '' };
      });
    };


    if (importSettings.allocateFreight && shippingValue > 0 && nfeData.products && nfeData.products.length > 0) {
      if (importSettings.freightDilutionScope === 'all_nfe_items') {
        const totalOriginalNFeProductValue = (nfeData.products || []).reduce((sum, p) => sum + (p.totalValue || 0), 0);
        finalTasks = mapToAssetImportTask(rawTasks, totalOriginalNFeProductValue);
      } else { 
        const productLinesBeingImported = displayableProducts.filter((_p, index) => {
          const actions = itemActions.get(index);
          return actions && (actions.depreciableQty > 0 || actions.patrimonyQty > 0);
        });
        const totalValueOfProductLinesBeingImported = productLinesBeingImported.reduce((sum, p) => sum + (p.totalValue || 0), 0);
        finalTasks = mapToAssetImportTask(rawTasks, totalValueOfProductLinesBeingImported);
      }
    } else {
      finalTasks = mapToAssetImportTask(rawTasks, 0); 
    }
    
    onImportItems(finalTasks, supplierOnRecord?.id, nfeData);
    onOpenChange(false);
  };

  const handleSupplierAdded = (newSupplierId: string) => {
    const newlyAddedSupplier = getSupplierByDocument(nfeData?.supplierCNPJ?.replace(/\D/g, '') || "");
    setSupplierOnRecord(newlyAddedSupplier || null);
    setIsSupplierFormOpen(false);
    toast({ title: "Fornecedor cadastrado!", description: "Agora você pode prosseguir com a importação dos itens.", icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
  };

  const supplierForFormDialog = useMemo(() => {
    if (!nfeData) return null;
    const nfeAddress = nfeData.supplierAddress;
    const initialEndereco: Endereco = {
        cep: nfeAddress?.zipCode ? maskCEP(nfeAddress.zipCode.replace(/\D/g, '')) : '',
        estado: nfeAddress?.state || '',
        cidade: nfeAddress?.city || '',
        bairro: nfeAddress?.neighborhood || '',
        rua: nfeAddress?.street || '',
        numero: nfeAddress?.number || '',
        complemento: nfeAddress?.complement || '',
    };
    return {
      type: 'juridica' as 'juridica',
      razaoSocial: nfeData.supplierName || '',
      nomeFantasia: nfeData.supplierName || '',
      cnpj: nfeData.supplierCNPJ ? maskCNPJ(nfeData.supplierCNPJ.replace(/\D/g, '')) : '',
      inscricaoEstadual: nfeData.supplierIE || '',
      situacaoIcms: (nfeData.supplierIE && nfeData.supplierIE.toUpperCase() !== "ISENTO" && nfeData.supplierIE.trim() !== "" && nfeData.supplierIE.toUpperCase() !== "NAO CONTRIBUINTE") ? 'contribuinte' : 'nao_contribuinte',
      responsavelNome: '',
      emailFaturamento: nfeData.supplierEmail || '',
      endereco: initialEndereco,
    };
  }, [nfeData]);


  const handleToggleSelectItem = (index: number) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        newSelection.add(index);
      }
      return newSelection;
    });
  };

  const handleToggleSelectAllItems = () => {
    if (selectedItems.size === displayableProducts.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(displayableProducts.map((_, i) => i)));
    }
  };

  const handleDeleteSelectedItems = () => {
    setIsConfirmDeleteDialogOpen(true);
  };
  
  const confirmDeleteSelectedItems = () => {
    const newDisplayableProducts = displayableProducts.filter((_, index) => !selectedItems.has(index));
    setDisplayableProducts(newDisplayableProducts);
  
    const newActions = new Map<number, ItemActionQuantities>();
    
    newDisplayableProducts.forEach((product, newIndex) => {
        const oldIndex = displayableProducts.findIndex(p => p.description === product.description && p.quantity === product.quantity && p.unitValue === product.unitValue); 
        if (oldIndex !== -1) {
            newActions.set(newIndex, itemActions.get(oldIndex) || { depreciableQty: 0, patrimonyQty: 0 });
        } else { 
            newActions.set(newIndex, { depreciableQty: 0, patrimonyQty: 0 });
        }
    });
    setItemActions(newActions);
        
    toast({ title: "Itens removidos", description: `${selectedItems.size} item(ns) foram removidos da lista de importação.` });
    setSelectedItems(new Set()); 
    setIsConfirmDeleteDialogOpen(false);
  };


  if (!nfeData) return null;

  const totalOriginalQty = displayableProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const totalDepreciableQty = Array.from(itemActions.values()).reduce((sum, action) => sum + action.depreciableQty, 0);
  const totalPatrimonyQty = Array.from(itemActions.values()).reduce((sum, action) => sum + action.patrimonyQty, 0);
  const totalProcessedQty = totalDepreciableQty + totalPatrimonyQty;
  const totalIgnoredQty = totalOriginalQty - totalProcessedQty;


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pré-visualização da NF-e: {nfeData.invoiceNumber || "Número Desconhecido"}</DialogTitle>
            <DialogDescription>
              Revise os dados. Para cada item, defina as quantidades que serão importadas como ativo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-1 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-1 text-sm border-b pb-3 mb-3">
              <div><strong>Fornecedor:</strong> {nfeData.supplierName || "Não informado"}</div>
              <div><strong>CNPJ:</strong> {nfeData.supplierCNPJ ? maskCNPJ(nfeData.supplierCNPJ.replace(/\D/g, '')) : "Não informado"}</div>
              <div><strong>IE:</strong> {nfeData.supplierIE || "Não informada"}</div>
              <div><strong>E-mail:</strong> {nfeData.supplierEmail || "Não informado"}</div>
              <div><strong>Data Emissão:</strong> {nfeData.emissionDate ? new Date(nfeData.emissionDate).toLocaleDateString('pt-BR') : "Não informada"}</div>
              <div><strong>Valor Total NF-e:</strong> {formatCurrency(nfeData.nfeTotalValue || 0)}</div>
              <div><strong>Valor Frete:</strong> {formatCurrency(nfeData.shippingValue || 0)}</div>
            </div>

            {supplierOnRecord === undefined && ( <Alert variant="default" className="mb-3"> <Info className="h-4 w-4" /> <AlertTitle>Verificando Fornecedor</AlertTitle> <AlertDescription>Aguarde...</AlertDescription> </Alert> )}
            {supplierOnRecord === null && nfeData.supplierCNPJ && ( <Alert variant="default" className="mb-3 border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400"> <Building className="h-4 w-4" /> <AlertTitle>Fornecedor não cadastrado</AlertTitle> <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"> <span>O fornecedor <Badge variant="secondary">{nfeData.supplierName || maskCNPJ(nfeData.supplierCNPJ.replace(/\D/g, ''))}</Badge> não foi encontrado.</span> <Button onClick={() => setIsSupplierFormOpen(true)} size="sm" variant="outline" className="shrink-0 border-yellow-500 hover:bg-yellow-50 text-yellow-700 dark:border-yellow-400 dark:hover:bg-yellow-700/20 dark:text-yellow-300"> <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar</Button> </AlertDescription> </Alert> )}
            {supplierOnRecord && ( <Alert variant="default" className="mb-3 border-green-500 text-green-700 dark:border-green-400 dark:text-green-300 [&>svg]:text-green-500 dark:[&>svg]:text-green-400"> <CheckCircle className="h-4 w-4" /> <AlertTitle>Fornecedor Localizado</AlertTitle> <AlertDescription> Fornecedor: <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">{supplierOnRecord.nomeFantasia || supplierOnRecord.razaoSocial}</Badge> (CNPJ: {supplierOnRecord.cnpj ? maskCNPJ(supplierOnRecord.cnpj.replace(/\D/g, '')) : 'N/A'}). </AlertDescription> </Alert> )}

            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold flex items-center"> <ShoppingCart className="mr-2 h-5 w-5 text-primary" /> Itens da Nota Fiscal </h3>
              {displayableProducts.length > 0 && ( <Button onClick={handleDeleteSelectedItems} variant="destructive" size="sm" disabled={selectedItems.size === 0}> <Trash2 className="mr-2 h-4 w-4" /> Excluir Selecionados ({selectedItems.size}) </Button> )}
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 p-1 text-center"> <Checkbox checked={selectedItems.size > 0 && selectedItems.size === displayableProducts.length && displayableProducts.length > 0} onCheckedChange={handleToggleSelectAllItems} disabled={displayableProducts.length === 0} aria-label="Selecionar todos" /> </TableHead>
                    <TableHead className="min-w-[200px]">Produto (Descrição)</TableHead>
                    <TableHead className="text-right w-20">Qtde. NF</TableHead>
                    <TableHead className="text-right w-28">Vlr. Unit.</TableHead>
                    <TableHead className="text-center w-36">Qtde. Depreciável</TableHead>
                    <TableHead className="text-center w-36">Qtde. Patrimônio</TableHead>
                    <TableHead className="text-right w-28">Qtde. Ignorar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayableProducts.length > 0 ? (
                    displayableProducts.map((product, index) => {
                      const actions = itemActions.get(index) || { depreciableQty: 0, patrimonyQty: 0 };
                      const remainingToIgnore = (product.quantity || 0) - actions.depreciableQty - actions.patrimonyQty;
                      
                      return (
                        <TableRow key={`product-${index}-${product.description}`} data-state={selectedItems.has(index) && "selected"}>
                          <TableCell className="p-1 text-center"> <Checkbox checked={selectedItems.has(index)} onCheckedChange={() => handleToggleSelectItem(index)} /> </TableCell>
                          <TableCell className="font-medium">{product.description || "Produto sem descrição"}</TableCell>
                          <TableCell className="text-right">{product.quantity?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.unitValue || 0)}</TableCell>
                          <TableCell className="px-1"> <Input type="number" min="0" max={(product.quantity || 0) - actions.patrimonyQty} value={actions.depreciableQty.toString()} onChange={(e) => handleQuantityChange(index, 'depreciableQty', e.target.value)} className="h-8 text-sm text-center" /> </TableCell>
                          <TableCell className="px-1"> <Input type="number" min="0" max={(product.quantity || 0) - actions.depreciableQty} value={actions.patrimonyQty.toString()} onChange={(e) => handleQuantityChange(index, 'patrimonyQty', e.target.value)} className="h-8 text-sm text-center" /> </TableCell>
                          <TableCell className="text-right">{remainingToIgnore.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow> <TableCell colSpan={7} className="h-24 text-center"> Nenhum produto para exibir. </TableCell> </TableRow>
                  )}
                </TableBody>
                {displayableProducts.length > 0 && (
                  <UITableFooter>
                    <TableRow>
                      <TableHead className="text-left font-semibold p-1" colSpan={4}>TOTAIS:</TableHead>
                      <TableHead className="text-center font-semibold">{totalDepreciableQty.toFixed(2)}</TableHead>
                      <TableHead className="text-center font-semibold">{totalPatrimonyQty.toFixed(2)}</TableHead>
                      <TableHead className="text-right font-semibold">{totalIgnoredQty.toFixed(2)}</TableHead>
                    </TableRow>
                  </UITableFooter>
                )}
              </Table>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
                Total de itens na NF-e: {displayableProducts.length}. Serão processados {totalProcessedQty} unidade(s) como ativo(s).
            </div>
          </div>

          <DialogFooter className="mt-auto pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={totalProcessedQty === 0 || supplierOnRecord === undefined || (!supplierOnRecord && !!nfeData.supplierCNPJ)} >
              <Tag className="mr-2 h-4 w-4" /> Importar {totalProcessedQty > 0 ? `${totalProcessedQty} Ativo(s)` : "Ativos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isSupplierFormOpen && supplierForFormDialog && ( <SupplierFormDialog open={isSupplierFormOpen} onOpenChange={setIsSupplierFormOpen} initialData={supplierForFormDialog as Partial<SupplierFormValues>} onSupplierAdded={handleSupplierAdded} /> )}
      <ConfirmationDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen} onConfirm={confirmDeleteSelectedItems} title="Confirmar Exclusão de Itens" description={`Tem certeza que deseja remover os ${selectedItems.size} itens selecionados da lista de importação? Esta ação não pode ser desfeita para esta sessão.`} confirmButtonText="Sim, Remover" confirmButtonVariant="destructive" />
    </>
  );
}
