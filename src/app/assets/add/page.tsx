
"use client";

import React, { useState, useRef } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAssets } from '@/contexts/AssetContext';
import { useCategories } from '@/contexts/CategoryContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Save, UploadCloud, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Asset } from '@/components/assets/types';
import Image from 'next/image';
import { SupplierCombobox } from '@/components/suppliers/SupplierCombobox';
import { LocationCombobox } from '@/components/locations/LocationCombobox';
import { AssetModelCombobox } from '@/components/asset-models/AssetModelCombobox';

const MAX_PHOTOS = 10;

const assetFormSchema = z.object({
  aplicarRegrasDepreciacao: z.boolean({ required_error: "O campo 'Depreciável *' é obrigatório." }),
  arquivado: z.boolean({ required_error: "O campo 'Arquivar *' é obrigatório." }),
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
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

export default function AddAssetPage() {
  const { addAsset } = useAssets();
  const { categories } = useCategories();
  const { toast } = useToast();
  const router = useRouter();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    },
  });

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
    };
    addAsset(assetDataToSave as Omit<Asset, 'id'>);
    toast({
      title: "Sucesso!",
      description: "Ativo adicionado com sucesso.",
    });
    router.push('/assets');
  }

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

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Adicionar novo ativo</h1>
            <p className="text-muted-foreground">Preencha os campos abaixo para cadastrar um novo ativo.</p>
          </div>
        </div>

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
                          <FormItem>
                            <div className="flex items-center min-h-7 mb-1">
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
                          <FormItem>
                            <div className="flex items-center min-h-7 mb-1">
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
                          <FormItem>
                             <div className="flex items-center min-h-7 mb-1">
                              <FormLabel>Nome do ativo *</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="Ex: Notebook Dell XPS 15" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="modelId"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center min-h-7 mb-1">
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
                          <FormItem>
                             <div className="flex items-center min-h-7 mb-1">
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
                          <FormItem>
                             <div className="flex items-center min-h-7 mb-1">
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
                          <FormItem>
                            <div className="flex items-center min-h-7 mb-1">
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <FormItem>
                            <div className="flex items-center min-h-7 mb-1">
                                <FormLabel>Fornecedor *</FormLabel>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Digite para buscar. Se o fornecedor não existir, a opção para cadastrá-lo aparecerá. Clique no campo para ver todos os fornecedores.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            <SupplierCombobox
                              value={field.value}
                              onChange={field.onChange}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="locationId"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <div className="flex items-center min-h-7 mb-1">
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
                          <FormItem>
                            <FormLabel>Data da compra *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
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
                          <FormItem>
                            <FormLabel>Nº da nota fiscal *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: NF-000123456" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                     
                      <FormField
                        control={form.control}
                        name="purchaseValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor de compra (R$) *</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="Ex: 2500.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="previouslyDepreciatedValue"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center">
                              <FormLabel>Valor depreciado R$</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" type="button" className="ml-1.5 h-7 w-7">
                                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Informe se o ativo foi adquirido usado e já possuía depreciação acumulada. Este valor será subtraído do valor de compra para definir o valor atual inicial.</p>
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
                    </div>
                  </TabsContent>

                  <TabsContent value="others" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 items-start">
                      <FormField
                          control={form.control}
                          name="additionalInfo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Informações adicionais</FormLabel>
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
                            <FormItem>
                              <div className="flex items-center">
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
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? "Salvando..." : "Salvar ativo"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
