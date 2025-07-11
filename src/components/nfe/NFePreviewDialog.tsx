
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UITableFooter } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building, CheckCircle, Info, PlusCircle, ShoppingCart, Tag, Trash2, Forward, ListChecks, ArrowLeft, Save, UploadCloud, XCircle, FileText, Paperclip, Eye, Download } from 'lucide-react';
import type { ExtractNFeDataOutput, NFeProduct } from '@/ai/flows/extract-nfe-data-flow';
import type { Supplier } from '@/contexts/SupplierContext';
import { useSuppliers } from '@/contexts/SupplierContext';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { useImportSettings } from '@/contexts/ImportSettingsContext';
import { useAssets } from '@/contexts/AssetContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/components/assets/columns';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { maskCEP, maskCNPJ } from '@/lib/utils';
import { parseISO } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { AssetModelCombobox } from '@/components/asset-models/AssetModelCombobox';
import { LocationCombobox } from '@/components/locations/LocationCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/contexts/CategoryContext';
import { useRouter } from 'next/navigation';
import type { Asset } from '@/components/assets/types';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ImportPreparationTask {
  originalNFeProductDescription: string;
  purchaseValue: number;
  invoiceNumber: string;
  purchaseDate: string;
  supplierId: string;
}

const MAX_PHOTOS = 10;

const assetDetailSchema = z.object({
  assetTag: z.string().min(1, "Obrigatório"),
  serialNumber: z.string().optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  modelId: z.string().optional(),
  locationId: z.string().optional(),
  additionalInfo: z.string().optional(),
  previouslyDepreciatedValue: z.coerce.number().min(0, "Não pode ser negativo.").optional(),
  aplicarRegrasDepreciacao: z.boolean(),
  imageDateUris: z.array(z.string()).max(MAX_PHOTOS, `Máximo de ${MAX_PHOTOS} fotos.`).optional(),
  invoiceFileDataUri: z.string().optional(),
  invoiceFileName: z.string().optional(),
});

const detailFormSchema = z.object({
  assets: z.array(assetDetailSchema),
});

type DetailFormValues = z.infer<typeof detailFormSchema>;


interface NFePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeData: ExtractNFeDataOutput | null;
}


export function NFePreviewDialog({ open, onOpenChange, nfeData }: NFePreviewDialogProps) {
  const router = useRouter();
  const { addAsset } = useAssets();
  const { categories } = useCategories();
  const [step, setStep] = useState<'selection' | 'details'>('selection');
  const [supplierOnRecord, setSupplierOnRecord] = useState<Supplier | null | undefined>(undefined);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [importTasks, setImportTasks] = useState<ImportPreparationTask[]>([]);
  
  const [displayableProducts, setDisplayableProducts] = useState<NFeProduct[]>([]);
  const [itemActions, setItemActions] = useState<Map<number, { processQty: number }>>(new Map());
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  const invoiceFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const imageFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);


  const { getSupplierByDocument } = useSuppliers();
  const { importSettings } = useImportSettings();
  const { toast } = useToast();

  const detailForm = useForm<DetailFormValues>({
    resolver: zodResolver(detailFormSchema),
    defaultValues: {
      assets: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: detailForm.control,
    name: "assets",
  });
  
  const watchedAssets = detailForm.watch('assets');

  const resetDialogState = () => {
    setStep('selection');
    setDisplayableProducts([]); 
    setItemActions(new Map());
    setSelectedItems(new Set());
    setSupplierOnRecord(undefined);
    setImportTasks([]);
    detailForm.reset({ assets: [] });
  };
  
  useEffect(() => {
    if (open && nfeData) {
      resetDialogState();
      const products = nfeData.products || [];
      setDisplayableProducts(products);

      if (nfeData.supplierCNPJ) {
        const foundSupplier = getSupplierByDocument(nfeData.supplierCNPJ.replace(/\D/g, ''));
        setSupplierOnRecord(foundSupplier || null);
      } else {
        setSupplierOnRecord(null);
      }

      const initialActions = new Map<number, { processQty: number }>();
      products.forEach((_product, index) => {
        initialActions.set(index, { processQty: 0 });
      });
      setItemActions(initialActions);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nfeData, getSupplierByDocument]);


  const handleQuantityChange = (
    productIndex: number,
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
      const updatedAction = { processQty: Math.min(numValue, product.quantity || 0) };
      newActions.set(productIndex, updatedAction);
      return newActions;
    });
  };

  const handleAdvanceToDetailsStep = () => {
    if (!nfeData) {
      toast({ title: "Erro interno", description: "Dados da NF-e não encontrados.", variant: "destructive" });
      return;
    }

    let rawTasksForPreparation: { product: NFeProduct }[] = [];
    displayableProducts.forEach((product, index) => {
      const actions = itemActions.get(index);
      if (!actions || !product) return;

      for (let i = 0; i < actions.processQty; i++) {
        rawTasksForPreparation.push({ product: { ...product } });
      }
    });

    const totalProcessQty = rawTasksForPreparation.length;

    if (totalProcessQty === 0) {
      toast({ title: "Nenhum item para importar", description: "Por favor, defina a 'Qtde. a Processar' para pelo menos um item.", variant: "default" });
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

    let finalPreparationTasks: ImportPreparationTask[] = [];
    const shippingValue = nfeData.shippingValue || 0;
    const nfePurchaseDate = nfeData.emissionDate ? parseISO(nfeData.emissionDate) : new Date();

    const mapToImportPreparationTask = (
        tasksToProcess: typeof rawTasksForPreparation,
        totalProductValueForFreightCalc: number
      ): ImportPreparationTask[] => {
      return tasksToProcess.map(rawTask => {
        const { product } = rawTask;
        let freightPerUnit = 0;
        if (importSettings.allocateFreight && shippingValue > 0 && totalProductValueForFreightCalc > 0 && product.totalValue && product.quantity && product.quantity > 0) {
          const productLineFreightShare = (product.totalValue / totalProductValueForFreightCalc) * shippingValue;
          freightPerUnit = productLineFreightShare / product.quantity;
        }

        const task: ImportPreparationTask = {
          originalNFeProductDescription: product.description || '',
          purchaseValue: (product.unitValue || 0) + freightPerUnit,
          invoiceNumber: nfeData.invoiceNumber || '',
          purchaseDate: nfePurchaseDate.toISOString(), 
          supplierId: supplierOnRecord!.id,
        };
        return task;
      });
    };

    if (importSettings.allocateFreight && shippingValue > 0 && nfeData.products && nfeData.products.length > 0) {
      if (importSettings.freightDilutionScope === 'all_nfe_items') {
        const totalOriginalNFeProductValue = (nfeData.products || []).reduce((sum, p) => sum + (p.totalValue || 0), 0);
        finalPreparationTasks = mapToImportPreparationTask(rawTasksForPreparation, totalOriginalNFeProductValue);
      } else { 
        const productLinesBeingImported = displayableProducts.filter((_p, index) => {
          const actions = itemActions.get(index);
          return actions && (actions.processQty > 0);
        });
        const totalValueOfProductLinesBeingImported = productLinesBeingImported.reduce((sum, p) => sum + (p.totalValue || 0), 0);
        finalPreparationTasks = mapToImportPreparationTask(rawTasksForPreparation, totalValueOfProductLinesBeingImported);
      }
    } else {
      finalPreparationTasks = mapToImportPreparationTask(rawTasksForPreparation, 0); 
    }
    
    setImportTasks(finalPreparationTasks);
    detailForm.reset({
      assets: finalPreparationTasks.map(() => ({
        assetTag: '',
        serialNumber: '',
        categoryId: '',
        modelId: undefined,
        locationId: undefined,
        additionalInfo: '',
        previouslyDepreciatedValue: 0,
        aplicarRegrasDepreciacao: true,
        imageDateUris: [],
        invoiceFileDataUri: undefined,
        invoiceFileName: undefined,
      })),
    });
    setStep('details');
  };

  const handleFinalSubmit = (data: DetailFormValues) => {
    if (!supplierOnRecord || importTasks.length === 0) {
      toast({ title: "Erro", description: "Não há dados suficientes para a importação.", variant: "destructive" });
      return;
    }
    
    data.assets.forEach((assetDetails, index) => {
      const task = importTasks[index];
      const assetDataToSave: Omit<Asset, 'id' | 'currentValue' | 'arquivado'> = {
        name: task.originalNFeProductDescription,
        purchaseDate: task.purchaseDate,
        invoiceNumber: task.invoiceNumber,
        supplier: task.supplierId,
        purchaseValue: task.purchaseValue,
        aplicarRegrasDepreciacao: assetDetails.aplicarRegrasDepreciacao,
        ...assetDetails,
        modelId: assetDetails.modelId || undefined,
        locationId: assetDetails.locationId || undefined,
        serialNumber: assetDetails.serialNumber || undefined,
        additionalInfo: assetDetails.additionalInfo || undefined,
        previouslyDepreciatedValue: assetDetails.previouslyDepreciatedValue || 0,
        imageDateUris: assetDetails.imageDateUris || [],
        invoiceFileDataUri: assetDetails.invoiceFileDataUri || undefined,
        invoiceFileName: assetDetails.invoiceFileName || undefined,
      };
       addAsset(assetDataToSave as Omit<Asset, 'id'>);
    });

    toast({
      title: "Importação Concluída!",
      description: `${data.assets.length} novo(s) ativo(s) foram cadastrados com sucesso.`,
    });
    onOpenChange(false);
    router.push('/assets');
  };


  const handleSupplierAdded = (newSupplierId: string) => {
    const newlyAddedSupplier = getSupplierByDocument(nfeData?.supplierCNPJ?.replace(/\D/g, '') || "");
    setSupplierOnRecord(newlyAddedSupplier || null);
    setIsSupplierFormOpen(false);
    toast({ title: "Fornecedor cadastrado!", description: "Agora você pode prosseguir com a importação dos itens.", icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
  };

  const supplierForFormDialog = useMemo(() => {
    if (!nfeData) return null;
    return {
      type: 'juridica' as const,
      razaoSocial: nfeData.supplierName || '',
      nomeFantasia: nfeData.supplierName || '',
      cnpj: nfeData.supplierCNPJ ? maskCNPJ(nfeData.supplierCNPJ.replace(/\D/g, '')) : '',
      inscricaoEstadual: nfeData.supplierIE || '',
      situacaoIcms: (nfeData.supplierIE && nfeData.supplierIE.toUpperCase() !== "ISENTO" && nfeData.supplierIE.trim() !== "" && nfeData.supplierIE.toUpperCase() !== "NAO CONTRIBUINTE") ? 'contribuinte' as const : 'nao_contribuinte' as const,
      responsavelNome: '',
      emailFaturamento: nfeData.supplierEmail || '',
      endereco: {
        cep: nfeData.supplierAddress?.zipCode ? maskCEP(nfeData.supplierAddress.zipCode.replace(/\D/g, '')) : '',
        estado: nfeData.supplierAddress?.state || '',
        cidade: nfeData.supplierAddress?.city || '',
        bairro: nfeData.supplierAddress?.neighborhood || '',
        rua: nfeData.supplierAddress?.street || '',
        numero: nfeData.supplierAddress?.number || '',
        complemento: nfeData.supplierAddress?.complement || '',
      },
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
  
    const newActions = new Map<number, { processQty: number }>();
    newDisplayableProducts.forEach((product, newIndex) => {
      const oldIndex = displayableProducts.findIndex(p => p === product);
      if (oldIndex !== -1 && itemActions.has(oldIndex)) {
        newActions.set(newIndex, itemActions.get(oldIndex)!);
      } else {
        newActions.set(newIndex, { processQty: 0 });
      }
    });
    setItemActions(newActions);
        
    toast({ title: "Itens removidos", description: `${selectedItems.size} item(ns) foram removidos da lista de importação.` });
    setSelectedItems(new Set()); 
    setIsConfirmDeleteDialogOpen(false);
  };

  const handleInvoiceFileChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        detailForm.setValue(`assets.${index}.invoiceFileDataUri`, reader.result as string, { shouldValidate: true });
        detailForm.setValue(`assets.${index}.invoiceFileName`, file.name, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveInvoiceFile = (index: number) => {
    detailForm.setValue(`assets.${index}.invoiceFileDataUri`, undefined);
    detailForm.setValue(`assets.${index}.invoiceFileName`, undefined);
    const ref = invoiceFileInputRefs.current[index];
    if (ref) {
      ref.value = '';
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const files = event.target.files;
    if (files) {
        const currentUris = detailForm.getValues(`assets.${index}.imageDateUris`) || [];
        const availableSlots = MAX_PHOTOS - currentUris.length;

        if (availableSlots <= 0) {
            toast({ title: "Limite de fotos atingido", description: `Máximo de ${MAX_PHOTOS} fotos por ativo.`, variant: "destructive" });
            const ref = imageFileInputRefs.current[index];
            if (ref) ref.value = '';
            return;
        }

        const filesToProcess = Array.from(files).slice(0, availableSlots);
        const newUrisArray = [...currentUris];
        let filesRead = 0;

        filesToProcess.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                newUrisArray.push(result);
                filesRead++;
                if (filesRead === filesToProcess.length) {
                    detailForm.setValue(`assets.${index}.imageDateUris`, newUrisArray, { shouldValidate: true });
                    const ref = imageFileInputRefs.current[index];
                    if (ref) ref.value = '';
                }
            };
            reader.readAsDataURL(file);
        });
    }
};

  const handleRemoveImage = (assetIndex: number, imageIndex: number) => {
    const currentUris = detailForm.getValues(`assets.${assetIndex}.imageDateUris`) || [];
    const updatedUris = currentUris.filter((_, i) => i !== imageIndex);
    detailForm.setValue(`assets.${assetIndex}.imageDateUris`, updatedUris, { shouldValidate: true });
  };


  const handleDownloadFile = (dataUri: string | undefined, fileName: string | undefined) => {
    if (!dataUri || !fileName) return;
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewFile = (dataUri: string | undefined, fileName: string | undefined) => {
    if (!dataUri || !fileName) return;
    const newWindow = window.open();
    if (newWindow) {
      if (dataUri.startsWith('data:application/pdf')) {
        newWindow.document.write(
          `<iframe src="${dataUri}" width="100%" height="100%" title="Visualizar ${fileName}"></iframe>`
        );
      } else if (dataUri.startsWith('data:image/')) {
        newWindow.document.write(
          `<img src="${dataUri}" alt="Visualizar ${fileName}" style="max-width:100%; max-height:100vh; margin:auto; display:block;" />`
        );
      } else {
         newWindow.document.write(`<p>Não é possível visualizar este tipo de arquivo diretamente. Faça o download.</p><p><a href="${dataUri}" download="${fileName}">Baixar ${fileName}</a></p>`);
      }
      newWindow.document.title = `Visualizar: ${fileName}`;
    } else {
      toast({
        title: "Bloqueio de Pop-up",
        description: "Por favor, desabilite o bloqueador de pop-ups para visualizar o arquivo.",
        variant: "destructive"
      });
    }
  };


  if (!nfeData) return null;

  const totalOriginalQty = displayableProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const totalProcessQty = Array.from(itemActions.values()).reduce((sum, action) => sum + action.processQty, 0);
  const totalIgnoredQty = totalOriginalQty - totalProcessQty;

  const renderSelectionStep = () => (
    <>
      <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
        <DialogTitle>Etapa 1: Seleção de Itens da NF-e: {nfeData.invoiceNumber || "Número Desconhecido"}</DialogTitle>
        <DialogDescription>
        Revise os dados da NF-e. Para cada item, defina a quantidade a processar e exclua os que não serão importados.
        </DialogDescription>
      </DialogHeader>
      
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full p-6">
          <div className="space-y-4">
              <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm border-b pb-3">
                  <div><strong>Fornecedor:</strong> {nfeData.supplierName || "Não informado"}</div>
                  <div><strong>CNPJ:</strong> {nfeData.supplierCNPJ ? maskCNPJ(nfeData.supplierCNPJ.replace(/\D/g, '')) : "Não informado"}</div>
                  <div><strong>IE:</strong> {nfeData.supplierIE || "Não informada"}</div>
                  <div><strong>E-mail:</strong> {nfeData.supplierEmail || "Não informado"}</div>
                  <div><strong>Data Emissão:</strong> {nfeData.emissionDate ? new Date(nfeData.emissionDate).toLocaleDateString('pt-BR') : "Não informada"}</div>
                  <div><strong>Valor Total NF-e:</strong> {formatCurrency(nfeData.nfeTotalValue || 0)}</div>
                  <div><strong>Valor Frete:</strong> {formatCurrency(nfeData.shippingValue || 0)}</div>
                  </div>

                  {supplierOnRecord === undefined && ( <Alert variant="default"> <Info className="h-4 w-4" /> <AlertTitle>Verificando Fornecedor</AlertTitle> <AlertDescription>Aguarde...</AlertDescription> </Alert> )}
                  {supplierOnRecord === null && nfeData.supplierCNPJ && ( <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400"> <Building className="h-4 w-4" /> <AlertTitle>Fornecedor não cadastrado</AlertTitle> <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"> <span>O fornecedor <Badge variant="secondary">{nfeData.supplierName || maskCNPJ(nfeData.supplierCNPJ.replace(/\D/g, ''))}</Badge> não foi encontrado.</span> <Button onClick={() => setIsSupplierFormOpen(true)} size="sm" variant="outline" className="shrink-0 border-yellow-500 hover:bg-yellow-50 text-yellow-700 dark:border-yellow-400 dark:hover:bg-yellow-700/20 dark:text-yellow-300"> <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar</Button> </AlertDescription> </Alert> )}
                  {supplierOnRecord && ( <Alert variant="default" className="border-green-500 text-green-700 dark:border-green-400 dark:text-green-300 [&>svg]:text-green-500 dark:[&>svg]:text-green-400"> <CheckCircle className="h-4 w-4" /> <AlertTitle>Fornecedor Localizado</AlertTitle> <AlertDescription> Fornecedor: <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">{supplierOnRecord.nomeFantasia || supplierOnRecord.razaoSocial}</Badge> (CNPJ: {supplierOnRecord.cnpj ? maskCNPJ(supplierOnRecord.cnpj.replace(/\D/g, '')) : 'N/A'}). </AlertDescription> </Alert> )}
              </div>
              
              <div className="flex justify-between items-center px-1">
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
                          <TableHead className="text-center w-36">Qtde. a Processar</TableHead>
                          <TableHead className="text-right w-28">Qtde. a Ignorar</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                      {displayableProducts.length > 0 ? (
                      displayableProducts.map((product, index) => {
                          const actions = itemActions.get(index) || { processQty: 0 };
                          const remainingToIgnore = (product.quantity || 0) - actions.processQty;
                          
                          return (
                          <TableRow key={`product-${index}-${product.description}`} data-state={selectedItems.has(index) ? "selected" : ""}>
                              <TableCell className="p-1 text-center"> <Checkbox checked={selectedItems.has(index)} onCheckedChange={() => handleToggleSelectItem(index)} /> </TableCell>
                              <TableCell className="font-medium">{product.description || "Produto sem descrição"}</TableCell>
                              <TableCell className="text-right">{product.quantity?.toFixed(2) || "0.00"}</TableCell>
                              <TableCell className="text-right">{formatCurrency(product.unitValue || 0)}</TableCell>
                              <TableCell className="px-1"> <Input type="number" min="0" max={(product.quantity || 0)} value={actions.processQty.toString()} onChange={(e) => handleQuantityChange(index, e.target.value)} className="h-8 text-sm text-center" /> </TableCell>
                              <TableCell className="text-right">{remainingToIgnore.toFixed(2)}</TableCell>
                          </TableRow>
                          );
                      })
                      ) : (
                      <TableRow> <TableCell colSpan={6} className="h-24 text-center"> Nenhum produto para exibir. </TableCell> </TableRow>
                      )}
                      </TableBody>
                      {displayableProducts.length > 0 && (
                      <UITableFooter>
                          <TableRow>
                          <TableHead className="text-left font-semibold p-1" colSpan={4}>TOTAIS:</TableHead>
                          <TableHead className="text-center font-semibold">{totalProcessQty.toFixed(2)}</TableHead>
                          <TableHead className="text-right font-semibold">{totalIgnoredQty.toFixed(2)}</TableHead>
                          </TableRow>
                      </UITableFooter>
                      )}
                  </Table>
              </div>
            </div>
        </ScrollArea>
      </div>

      <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
        <div className="text-sm text-muted-foreground flex-1">
            Total de itens na NF-e: {displayableProducts.length}. Serão processados {totalProcessQty} unidade(s) como ativo(s).
        </div>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button onClick={handleAdvanceToDetailsStep} disabled={totalProcessQty === 0 || supplierOnRecord === undefined || (!supplierOnRecord && !!nfeData.supplierCNPJ)} >
        <Forward className="mr-2 h-4 w-4" /> Avançar para Cadastro ({totalProcessQty})
        </Button>
      </DialogFooter>
    </>
  );

  const renderDetailsStep = () => (
    <Form {...detailForm}>
      <form onSubmit={detailForm.handleSubmit(handleFinalSubmit)} className="flex flex-col h-full">
        <DialogHeader className="p-6 pb-4 border-t flex-shrink-0">
          <DialogTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5" />Etapa 2: Detalhamento dos Ativos ({fields.length})</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para cada ativo que será importado. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full px-6">
            <Accordion type="multiple" defaultValue={['item-0']} className="w-full">
            {fields.map((field, index) => {
                const task = importTasks[index];
                const imagePreviews = watchedAssets[index]?.imageDateUris || [];
                const isDepreciable = watchedAssets[index]?.aplicarRegrasDepreciacao;
                const assetFormState = watchedAssets[index];
                return (
                <AccordionItem value={`item-${index}`} key={field.id}>
                    <AccordionTrigger>
                      <div className='flex items-center gap-3 w-full text-sm'>
                        <Badge variant="outline" className="shrink-0 px-2">{index + 1}</Badge>
                        <span className="truncate flex-1 text-left font-medium">{task.originalNFeProductDescription}</span>
                         {isDepreciable ? (
                            <Badge variant="default" className="shrink-0">Depreciável</Badge>
                        ) : (
                            <Badge variant="secondary" className="shrink-0">Patrimônio</Badge>
                        )}
                        <span className="text-sm text-muted-foreground shrink-0">({formatCurrency(task.purchaseValue)})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 p-2">
                        <FormField
                            control={detailForm.control}
                            name={`assets.${index}.aplicarRegrasDepreciacao`}
                            render={({ field: formField }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 md:col-span-2">
                                <div className="space-y-0.5">
                                    <FormLabel>Ativo Depreciável?</FormLabel>
                                    <FormDescription>
                                        Ative se este item deve seguir as regras de depreciação. Desative para controle apenas de patrimônio.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={formField.value}
                                        onCheckedChange={formField.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={detailForm.control}
                            name={`assets.${index}.assetTag`}
                            render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>Nº de Patrimônio *</FormLabel>
                                <FormControl><Input placeholder="Ex: ZDI-00123" {...formField} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={detailForm.control}
                            name={`assets.${index}.serialNumber`}
                            render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>Nº de Série</FormLabel>
                                <FormControl><Input placeholder="Ex: SN-ABC123XYZ" {...formField} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={detailForm.control}
                            name={`assets.${index}.categoryId`}
                            render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>Categoria *</FormLabel>
                                <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={detailForm.control}
                            name={`assets.${index}.modelId`}
                            render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>Modelo</FormLabel>
                                <AssetModelCombobox value={formField.value} onChange={formField.onChange} />
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={detailForm.control}
                            name={`assets.${index}.locationId`}
                            render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>Local Alocado</FormLabel>
                                <LocationCombobox value={formField.value} onChange={formField.onChange} />
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={detailForm.control}
                            name={`assets.${index}.previouslyDepreciatedValue`}
                            render={({ field: formField }) => (
                                <FormItem>
                                    <FormLabel>Valor Depreciado Anteriormente</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="R$ 0,00" {...formField} value={formField.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={detailForm.control}
                            name={`assets.${index}.additionalInfo`}
                            render={({ field: formField }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Informações Adicionais</FormLabel>
                                <FormControl><Textarea placeholder="Detalhes extras sobre o ativo..." {...formField} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        {/* Invoice File Upload */}
                        <FormField
                            control={detailForm.control}
                            name={`assets.${index}.invoiceFileDataUri`}
                            render={({ field: formField }) => (
                                <FormItem className="space-y-1 md:col-span-2">
                                    <FormLabel>Anexo da Nota Fiscal</FormLabel>
                                    <FormControl>
                                    <Input
                                        type="file"
                                        accept="application/pdf,image/*"
                                        ref={(el) => (invoiceFileInputRefs.current[index] = el)}
                                        onChange={(e) => handleInvoiceFileChange(e, index)}
                                        className="hidden"
                                        disabled={!!assetFormState?.invoiceFileName}
                                    />
                                    </FormControl>
                                    {!assetFormState?.invoiceFileName ? (
                                    <Button type="button" variant="outline" className="w-full" onClick={() => invoiceFileInputRefs.current[index]?.click()}>
                                        <UploadCloud className="mr-2 h-4 w-4" /> Selecionar Arquivo
                                    </Button>
                                    ) : (
                                    <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/30 h-10">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-sm text-foreground truncate flex-1" title={assetFormState.invoiceFileName}>{assetFormState.invoiceFileName}</span>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleViewFile(assetFormState.invoiceFileDataUri, assetFormState.invoiceFileName)} title="Visualizar"><Eye className="h-4 w-4" /></Button>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleDownloadFile(assetFormState.invoiceFileDataUri, assetFormState.invoiceFileName)} title="Baixar"><Download className="h-4 w-4" /></Button>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInvoiceFile(index)} title="Remover" className="text-destructive hover:text-destructive"><XCircle className="h-4 w-4" /></Button>
                                    </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Image Upload */}
                        <FormField
                            control={detailForm.control}
                            name={`assets.${index}.imageDateUris`}
                            render={({ field: formField }) => (
                                <FormItem className="space-y-1 md:col-span-2">
                                    <FormLabel>Fotos do Ativo (Máx. {MAX_PHOTOS})</FormLabel>
                                    <FormControl>
                                        <Input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        ref={el => (imageFileInputRefs.current[index] = el)}
                                        onChange={(e) => handleImageChange(e, index)}
                                        className="w-full"
                                        disabled={(assetFormState?.imageDateUris?.length || 0) >= MAX_PHOTOS}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    {imagePreviews.length > 0 && (
                                        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                            {imagePreviews.map((previewUrl, imgIndex) => (
                                                <div key={imgIndex} className="relative w-full aspect-square border rounded-md overflow-hidden group">
                                                    <Image src={previewUrl} alt={`Preview ${imgIndex + 1}`} layout="fill" objectFit="contain" />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => handleRemoveImage(index, imgIndex)}
                                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                                        title="Remover imagem"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </FormItem>
                            )}
                        />
                    </div>
                    </AccordionContent>
                </AccordionItem>
                );
            })}
            </Accordion>
          </ScrollArea>
        </div>
        
        <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
          <Button variant="outline" type="button" onClick={() => setStep('selection')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Seleção
          </Button>
          <Button type="submit" disabled={detailForm.formState.isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {detailForm.formState.isSubmitting ? 'Salvando...' : `Finalizar Importação (${fields.length})`}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0">
            {step === 'selection' ? renderSelectionStep() : renderDetailsStep()}
        </DialogContent>
      </Dialog>

      {isSupplierFormOpen && supplierForFormDialog && ( <SupplierFormDialog open={isSupplierFormOpen} onOpenChange={setIsSupplierFormOpen} initialData={supplierForFormDialog} onSupplierAdded={handleSupplierAdded} /> )}
      <ConfirmationDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen} onConfirm={confirmDeleteSelectedItems} title="Confirmar Exclusão de Itens" description={`Tem certeza que deseja remover os ${selectedItems.size} itens selecionados da lista de importação? Esta ação não pode ser desfeita para esta sessão.`} confirmButtonText="Sim, Remover" confirmButtonVariant="destructive" />
    </>
  );
}
