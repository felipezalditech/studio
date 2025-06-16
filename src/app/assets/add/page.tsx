
"use client";

import React, { useState, useRef, useEffect } from 'react'; 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from '@/components/ui/card';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAssets } from '@/contexts/AssetContext';
import { useCategories } from '@/contexts/CategoryContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Save, UploadCloud, XCircle, HelpCircle, FileText, AlertTriangle, ListChecks, Forward, Paperclip, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Asset } from '@/components/assets/types';
import Image from 'next/image';
import { SupplierCombobox } from '@/components/suppliers/SupplierCombobox';
import { LocationCombobox } from '@/components/locations/LocationCombobox';
import { AssetModelCombobox } from '@/components/asset-models/AssetModelCombobox';
import { extractNFeData, type ExtractNFeDataOutput, type NFeProduct } from '@/ai/flows/extract-nfe-data-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NFePreviewDialog, type AssetImportTask } from '@/components/nfe/NFePreviewDialog';
import { Badge } from '@/components/ui/badge';


const MAX_PHOTOS = 10;

const assetFormSchema = z.object({
  aplicarRegrasDepreciacao: z.boolean({ required_error: "O campo 'Depreciável' é obrigatório." }),
  arquivado: z.boolean({ required_error: "O campo 'Arquivar' é obrigatório." }),
  name: z.string().min(1, "Nome do ativo é obrigatório."),
  modelId: z.string().optional(),
  assetTag: z.string().min(1, "Número de patrimônio é obrigatório."),
  serialNumber: z.string().optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória."),
  supplier: z.string().min(1, "Fornecedor é obrigatório."),
  locationId: z.string().optional(),
  purchaseDate: z.date({
    required_error: "Data da compra é obrigatória.",
    invalid_type_error: "Formato de data inválido.",
  }),
  invoiceNumber: z.string().min(1, "Número da nota fiscal é obrigatório."),
  purchaseValue: z.coerce.number().min(0.01, "Valor de compra deve ser maior que zero."),
  previouslyDepreciatedValue: z.coerce.number().min(0, "Valor já depreciado não pode ser negativo.").optional(),
  additionalInfo: z.string().optional(),
  imageDateUris: z.array(z.string()).max(MAX_PHOTOS, `Máximo de ${MAX_PHOTOS} fotos permitidas.`).optional(),
  invoiceFileDataUri: z.string().optional(),
  invoiceFileName: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

export default function AddAssetPage() {
  const { addAsset } = useAssets();
  const { categories } = useCategories();
  const { toast } = useToast();
  const router = useRouter();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);
  const nfeFileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingNFe, setIsProcessingNFe] = useState(false);
  const [nfeImportError, setNfeImportError] = useState<string | null>(null);
  const [extractedNFeData, setExtractedNFeData] = useState<ExtractNFeDataOutput | null>(null);
  const [isNFePreviewOpen, setIsNFePreviewOpen] = useState(false);
  const [assetImportQueue, setAssetImportQueue] = useState<AssetImportTask[]>([]);
  const [currentSupplierIdForQueue, setCurrentSupplierIdForQueue] = useState<string | undefined>(undefined);


  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      aplicarRegrasDepreciacao: true,
      arquivado: false,
      name: '',
      modelId: undefined,
      assetTag: '',
      serialNumber: '',
      categoryId: '',
      supplier: '',
      locationId: undefined,
      purchaseDate: undefined,
      invoiceNumber: '',
      purchaseValue: 0,
      previouslyDepreciatedValue: undefined,
      additionalInfo: '',
      imageDateUris: [],
      invoiceFileDataUri: undefined,
      invoiceFileName: undefined,
    },
  });

  const resetFormForNewAsset = () => {
    form.reset({
      aplicarRegrasDepreciacao: true,
      arquivado: false,
      name: '',
      modelId: undefined,
      assetTag: '', 
      serialNumber: '',
      categoryId: '', 
      supplier: currentSupplierIdForQueue || '', 
      locationId: undefined,
      purchaseDate: undefined, 
      invoiceNumber: '', 
      purchaseValue: 0, 
      previouslyDepreciatedValue: 0,
      additionalInfo: '',
      imageDateUris: [],
      invoiceFileDataUri: undefined,
      invoiceFileName: undefined,
    });
    setImagePreviews([]);
  };

  const processNextAssetInQueue = () => {
    if (assetImportQueue.length > 0) {
      const nextTask = assetImportQueue[0];
      setAssetImportQueue(prev => prev.slice(1));

      resetFormForNewAsset(); 

      form.setValue('name', nextTask.nfeProduct.description || '');
      form.setValue('purchaseValue', nextTask.nfeProduct.unitValue || 0);
      form.setValue('invoiceNumber', nextTask.nfeDetails.invoiceNumber || '');
      if (nextTask.nfeDetails.emissionDate) {
        const parsedDate = parseISO(nextTask.nfeDetails.emissionDate);
        if (isValidDate(parsedDate)) {
          form.setValue('purchaseDate', parsedDate);
        }
      }
      if (currentSupplierIdForQueue) {
         form.setValue('supplier', currentSupplierIdForQueue);
      }
      form.setValue('aplicarRegrasDepreciacao', nextTask.assetType === 'depreciable');
      form.setValue('previouslyDepreciatedValue', 0); 

      toast({
        title: `Preparando Ativo ${assetImportQueue.length} de ${assetImportQueue.length + (assetImportQueue.length > 0 ? 0 : -1) + 1}`,
        description: `Preencha os dados para: ${nextTask.nfeProduct.description}.`,
        duration: 7000
      });
      return true; 
    }
    return false; 
  };


  function onSubmit(data: AssetFormValues) {
    if (!data.aplicarRegrasDepreciacao && (data.purchaseValue - (data.previouslyDepreciatedValue || 0)) < 0) {
       toast({
            title: "Erro de validação",
            description: "Para ativos não depreciáveis, o valor já depreciado não pode ser maior que o valor de compra.",
            variant: "destructive",
        });
        return;
    }

    const assetDataToSave: Omit<Asset, 'id' | 'currentValue'> = {
      ...data,
      modelId: data.modelId || undefined,
      purchaseDate: format(data.purchaseDate, 'yyyy-MM-dd'),
      imageDateUris: data.imageDateUris || [],
      previouslyDepreciatedValue: data.previouslyDepreciatedValue,
      locationId: data.locationId || undefined,
      additionalInfo: data.additionalInfo || undefined,
      serialNumber: data.serialNumber || undefined,
      invoiceFileDataUri: data.invoiceFileDataUri || undefined,
      invoiceFileName: data.invoiceFileName || undefined,
    };
    addAsset(assetDataToSave as Omit<Asset, 'id'>);
    toast({
      title: "Sucesso!",
      description: `Ativo "${data.name}" adicionado.`,
    });

    if (!processNextAssetInQueue()) {
      
      router.push('/assets');
    }
  }
  
  
  useEffect(() => {
    if (assetImportQueue.length > 0 && form.formState.isSubmitSuccessful === false) { 
      processNextAssetInQueue();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetImportQueue, form.formState.isSubmitSuccessful]); 


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (value: string[]) => void) => {
    const files = event.target.files;
    if (files) {
      const currentUris = form.getValues('imageDateUris') || [];
      const availableSlots = MAX_PHOTOS - currentUris.length;

      if (availableSlots <= 0) {
        toast({
          title: "Limite de fotos atingido",
          description: `Você já adicionou o máximo de ${MAX_PHOTOS} fotos.`,
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const filesToProcess = Array.from(files).slice(0, availableSlots);

      if (files.length > filesToProcess.length) {
        toast({
          title: "Algumas fotos não adicionadas",
          description: `Você selecionou ${files.length} fotos, mas só ${availableSlots > 1 ? 'podiam' : 'podia'} ser adicionada${availableSlots > 1 ? 's' : ''} mais ${filesToProcess.length}. As primeiras ${filesToProcess.length} foram adicionadas.`,
          variant: "default",
        });
      }

      const newPreviewsArray = [...imagePreviews];
      const newUrisArray = [...currentUris];

      let filesRead = 0;
      if (filesToProcess.length === 0) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          newPreviewsArray.push(result);
          newUrisArray.push(result);
          filesRead++;
          if (filesRead === filesToProcess.length) {
            setImagePreviews(newPreviewsArray);
            fieldOnChange(newUrisArray);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (indexToRemove: number, fieldOnChange: (value: string[]) => void) => {
    const currentPreviews = [...imagePreviews];
    const currentUris = [...(form.getValues('imageDateUris') || [])];

    currentPreviews.splice(indexToRemove, 1);
    currentUris.splice(indexToRemove, 1);

    setImagePreviews(currentPreviews);
    fieldOnChange(currentUris);
  };

  const handleNFeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/xml") {
      setIsProcessingNFe(true);
      setNfeImportError(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const xmlContent = e.target?.result as string;
        try {
          const extractedData: ExtractNFeDataOutput = await extractNFeData(xmlContent);
          setExtractedNFeData(extractedData);
          setIsNFePreviewOpen(true);
          
        } catch (error) {
          console.error("Erro ao processar NF-e:", error);
          let errorMessage = "Não foi possível processar o XML da NF-e. Verifique o arquivo ou tente novamente.";
          if (error instanceof Error) {
            errorMessage = `Erro na importação: ${error.message}. Verifique o console para detalhes.`;
          }
          setNfeImportError(errorMessage);
          toast({
            title: "Erro na Importação da NF-e",
            description: errorMessage.substring(0,150),
            variant: "destructive",
            duration: 10000,
          });
        } finally {
          setIsProcessingNFe(false);
          if (nfeFileInputRef.current) {
            nfeFileInputRef.current.value = '';
          }
        }
      };
      reader.readAsText(file);
    } else if (file) {
      setNfeImportError("Formato de arquivo inválido. Por favor, selecione um arquivo .xml.");
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione um arquivo XML.",
        variant: "destructive",
      });
      if (nfeFileInputRef.current) {
        nfeFileInputRef.current.value = '';
      }
    }
  };

  const handleImportTasksFromNFe = (tasks: AssetImportTask[], supplierId: string | undefined, nfeDetails: ExtractNFeDataOutput) => {
    if (tasks.length === 0) {
      toast({ title: "Nenhum item selecionado da NF-e", description: "Nenhum item foi marcado para importação.", variant: "default" });
      setIsNFePreviewOpen(false);
      return;
    }
    setAssetImportQueue(tasks);
    setCurrentSupplierIdForQueue(supplierId);
    
    setIsNFePreviewOpen(false);
    
  };

  const handleNFePreviewDialogClose = (openState: boolean) => {
    setIsNFePreviewOpen(openState);
    if (!openState) { 
      if (assetImportQueue.length === 0) {
        setExtractedNFeData(null);
        setCurrentSupplierIdForQueue(undefined);
        if (nfeFileInputRef.current) {
          nfeFileInputRef.current.value = ''; 
        }
      }
    }
  };

  const handleInvoiceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('invoiceFileDataUri', reader.result as string);
        form.setValue('invoiceFileName', file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveInvoiceFile = () => {
    form.setValue('invoiceFileDataUri', undefined);
    form.setValue('invoiceFileName', undefined);
    if (invoiceFileInputRef.current) {
      invoiceFileInputRef.current.value = '';
    }
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

  const watchedInvoiceFileName = form.watch('invoiceFileName');
  const watchedInvoiceFileDataUri = form.watch('invoiceFileDataUri');


  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {assetImportQueue.length > 0 ? `Cadastrando Ativo (Restam ${assetImportQueue.length})` : 'Adicionar novo ativo'}
            </h1>
            <p className="text-muted-foreground">
              {assetImportQueue.length > 0 ? `Preencha os dados para o ativo atual. Nome na NF-e: ${form.getValues('name') || 'Carregando...'}` : 'Preencha os campos abaixo para cadastrar um novo ativo.'}
            </p>
          </div>
           <div>
            <Button onClick={() => nfeFileInputRef.current?.click()} disabled={isProcessingNFe || assetImportQueue.length > 0} variant="default">
              <FileText className="mr-2 h-4 w-4" />
              {isProcessingNFe ? "Processando NF-e..." : "Importar Dados da NF-e (XML)"}
            </Button>
            <Input
              type="file"
              accept=".xml"
              ref={nfeFileInputRef}
              onChange={handleNFeUpload}
              className="hidden"
              disabled={assetImportQueue.length > 0}
            />
          </div>
        </div>
        {nfeImportError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro na importação</AlertTitle>
            <AlertDescription>{nfeImportError}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Detalhes do ativo</CardTitle>
            <CardDesc>
              Preencha as informações nas abas abaixo.
            </CardDesc>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-foreground hover:text-primary hover:bg-primary/10">Dados Gerais</TabsTrigger>
                    <TabsTrigger value="purchase" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-foreground hover:text-primary hover:bg-primary/10">Compra e Valores</TabsTrigger>
                    <TabsTrigger value="others" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-foreground hover:text-primary hover:bg-primary/10">Outros e Fotos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-6">
                    <div className="flex flex-row flex-wrap gap-x-6 gap-y-4 items-start">
                       <FormField
                        control={form.control}
                        name="aplicarRegrasDepreciacao"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <div className="flex items-center h-8">
                              <FormLabel>Depreciável *</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Selecione "Não" se o ativo não deve ser depreciado (ex: já totalmente depreciado, controle apenas patrimonial).</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="aplicarRegrasDepreciacao"
                                />
                                <label htmlFor="aplicarRegrasDepreciacao" className="text-sm text-muted-foreground cursor-pointer">
                                  {field.value ? "Sim" : "Não"}
                                </label>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="arquivado"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <div className="flex items-center h-8">
                              <FormLabel>Arquivar *</FormLabel>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Marque "Sim" para arquivar o ativo. Ativos arquivados geralmente não são incluídos em cálculos ou relatórios operacionais, mas permanecem registrados para fins históricos.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                            </div>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="arquivado"
                                />
                                <label htmlFor="arquivado" className="text-sm text-muted-foreground cursor-pointer">
                                  {field.value ? "Sim" : "Não"}
                                </label>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                             <div className="flex items-center h-8">
                              <FormLabel>Nome do ativo (no sistema) *</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="Ex: Notebook Dell XPS 15 (Sala Reunião)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="modelId"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <div className="flex items-center h-8">
                              <FormLabel>Modelo</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Digite para buscar. Se o modelo não existir, a opção para cadastrá-lo aparecerá. Clique no campo para ver todos os modelos.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <AssetModelCombobox
                              value={field.value}
                              onChange={field.onChange}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="assetTag"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                             <div className="flex items-center h-8">
                              <FormLabel>Nº de patrimônio *</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="Ex: ZDI-00123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="serialNumber"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                             <div className="flex items-center h-8">
                              <FormLabel>Nº de série</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="Ex: SN-ABC123XYZ" {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <div className="flex items-center h-8">
                              <FormLabel>Categoria *</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Cadastre categorias na tela de "Configurações". A categoria define as regras de depreciação se aplicável.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.length === 0 ? (
                                  <SelectItem value="no-categories" disabled>Nenhuma categoria cadastrada</SelectItem>
                                ) : (
                                  categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="supplier"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <div className="flex items-center h-8">
                                <FormLabel>Fornecedor *</FormLabel>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Este campo é preenchido pela NF-e. Se precisar alterar, cancele a importação e ajuste manualmente.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            <SupplierCombobox
                              value={field.value}
                              onChange={field.onChange}
                              disabled={assetImportQueue.length > 0 || !!currentSupplierIdForQueue}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="locationId"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2 space-y-0.5">
                            <div className="flex items-center h-8">
                              <FormLabel>Local alocado</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Digite para buscar ou clique para ver opções. Se não encontrar, pode cadastrar um novo local. Cadastre locais na tela de "Configurações".</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <LocationCombobox
                              value={field.value}
                              onChange={field.onChange}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="purchase" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                      <FormField
                        control={form.control}
                        name="purchaseDate"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                             <div className="flex items-center h-8">
                              <FormLabel>Data da compra *</FormLabel>
                               <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Preenchido automaticamente pela NF-e durante a importação.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                      (assetImportQueue.length > 0 || !!extractedNFeData) && "bg-muted/50 cursor-not-allowed"
                                    )}
                                    disabled={assetImportQueue.length > 0 || !!extractedNFeData}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: ptBR })
                                    ) : (
                                      <span>Escolha uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                  locale={ptBR}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="invoiceNumber"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <div className="flex items-center h-8">
                              <FormLabel>Nº da nota fiscal *</FormLabel>
                               <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Preenchido automaticamente pela NF-e durante a importação.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                            </div>
                            <FormControl>
                              <Input
                                placeholder="Ex: NF-000123456"
                                {...field}
                                readOnly={assetImportQueue.length > 0 || !!extractedNFeData}
                                className={(assetImportQueue.length > 0 || !!extractedNFeData) ? "bg-muted/50 cursor-not-allowed" : ""}
                               />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="purchaseValue"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <div className="flex items-center h-8">
                              <FormLabel>Valor de compra (R$) *</FormLabel>
                               <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Preenchido automaticamente com o valor unitário do item da NF-e.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Ex: 2500.00"
                                {...field}
                                readOnly={assetImportQueue.length > 0 || !!extractedNFeData}
                                className={(assetImportQueue.length > 0 || !!extractedNFeData) ? "bg-muted/50 cursor-not-allowed" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="previouslyDepreciatedValue"
                        render={({ field }) => (
                          <FormItem className="space-y-0.5">
                            <div className="flex items-center h-8">
                              <FormLabel>Valor depreciado R$</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Informe se o ativo foi adquirido usado e já possuía depreciação acumulada. Este valor será subtraído do valor de compra para definir o valor atual inicial. Para itens de NF-e, geralmente é 0.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="Ex: 500.00" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="invoiceFileDataUri" 
                        render={({ field }) => (
                          <FormItem className="md:col-span-3 space-y-0.5">
                            <div className="flex items-center h-8">
                              <FormLabel className="flex items-center">
                                <Paperclip className="mr-2 h-5 w-5" />
                                Anexo da Nota Fiscal (PDF ou Imagem)
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                type="file"
                                accept="application/pdf,image/*"
                                ref={invoiceFileInputRef}
                                onChange={handleInvoiceFileChange}
                                className="hidden"
                                disabled={!!watchedInvoiceFileName}
                              />
                            </FormControl>
                             {!watchedInvoiceFileName ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => invoiceFileInputRef.current?.click()}
                                >
                                  <UploadCloud className="mr-2 h-4 w-4" />
                                  Selecionar arquivo
                                </Button>
                              ) : (
                                <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/30">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <span className="text-sm text-foreground truncate flex-1" title={watchedInvoiceFileName}>
                                    {watchedInvoiceFileName}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewFile(watchedInvoiceFileDataUri, watchedInvoiceFileName)}
                                    title="Visualizar anexo"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownloadFile(watchedInvoiceFileDataUri, watchedInvoiceFileName)}
                                    title="Baixar anexo"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRemoveInvoiceFile}
                                    title="Remover anexo"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="others" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 items-start">
                      <FormField
                          control={form.control}
                          name="additionalInfo"
                          render={({ field }) => (
                            <FormItem className="space-y-0.5">
                              <div className="flex items-center h-8">
                                <FormLabel>Informações adicionais</FormLabel>
                              </div>
                              <FormControl>
                                <Textarea
                                  placeholder="Detalhes extras sobre o ativo, condições, observações, etc."
                                  className="resize-y h-10 min-h-[40px]"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="imageDateUris"
                          render={({ field }) => (
                            <FormItem className="space-y-0.5">
                              <div className="flex items-center h-8">
                                <FormLabel className="flex items-center">
                                  <UploadCloud className="mr-2 h-5 w-5" />
                                  Fotos do ativo (Máx. {MAX_PHOTOS})
                                </FormLabel>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Formatos suportados: JPG, PNG, GIF, etc. Você pode adicionar até {MAX_PHOTOS} fotos.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <FormControl>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  ref={fileInputRef}
                                  onChange={(e) => handleImageChange(e, field.onChange as any)}
                                  className="cursor-pointer"
                                  disabled={(form.getValues('imageDateUris')?.length || 0) >= MAX_PHOTOS}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {imagePreviews.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Pré-visualização ({imagePreviews.length}/{MAX_PHOTOS}):</p>
                            <div className="flex flex-wrap gap-4 p-2 border rounded-md">
                              {imagePreviews.map((previewUrl, index) => (
                                <div key={index} className="relative w-32 h-32 border rounded-md overflow-hidden group">
                                  <Image src={previewUrl} alt={`Pré-visualização ${index + 1}`} layout="fill" objectFit="contain" data-ai-hint="asset photo preview" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleRemoveImage(index, form.setValue.bind(form, 'imageDateUris') as any)}
                                    className="absolute top-1 right-1 h-6 w-6 opacity-70 group-hover:opacity-100"
                                    title="Remover imagem"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                         <p className="text-sm text-muted-foreground">
                           Fotos adicionadas: {form.getValues('imageDateUris')?.length || 0}/{MAX_PHOTOS}.
                         </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 pt-6">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting || isProcessingNFe}>
                    <Save className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? "Salvando..." : (assetImportQueue.length > 0 ? `Salvar Ativo (${assetImportQueue.length} na fila)` : "Salvar ativo")}
                  </Button>
                   {assetImportQueue.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (processNextAssetInQueue()) {
                          toast({ title: "Item pulado", description: "Carregando próximo item da fila de importação."});
                        } else {
                          toast({ title: "Fila vazia", description: "Não há mais itens na fila de importação.", variant: "default"});
                          router.push('/assets'); 
                        }
                      }}
                      title="Pular este item e ir para o próximo da NF-e"
                    >
                      <Forward className="mr-2 h-4 w-4" />
                      Pular Item
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
         {assetImportQueue.length > 0 && (
            <Alert>
              <ListChecks className="h-4 w-4" />
              <AlertTitle>Fila de Importação da NF-e Ativa</AlertTitle>
              <AlertDescription>
                Você está processando itens de uma Nota Fiscal.
                Restam <Badge variant="secondary">{assetImportQueue.length}</Badge> ativo(s) na fila após este.
                Complete o cadastro atual e salve para prosseguir, ou pule para o próximo.
              </AlertDescription>
            </Alert>
        )}
      </div>
      {extractedNFeData && (
        <NFePreviewDialog
          open={isNFePreviewOpen}
          onOpenChange={handleNFePreviewDialogClose}
          nfeData={extractedNFeData}
          onImportItems={handleImportTasksFromNFe}
        />
      )}
    </>
  );
}

