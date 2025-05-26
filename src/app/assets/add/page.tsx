
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAssets } from '@/contexts/AssetContext';
import { useSuppliers } from '@/contexts/SupplierContext';
import { useCategories } from '@/contexts/CategoryContext';
import { useLocations } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Save, UploadCloud, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Asset } from '@/components/assets/types';
import Image from 'next/image';

const MAX_PHOTOS = 10;
const NO_LOCATION_SELECTED_VALUE = "__NO_LOCATION_SELECTED__";

const assetFormSchema = z.object({
  name: z.string().min(1, "Nome do ativo é obrigatório."),
  assetTag: z.string().min(1, "Número de patrimônio é obrigatório."),
  purchaseDate: z.date({
    required_error: "Data da compra é obrigatória.",
    invalid_type_error: "Formato de data inválido.",
  }),
  serialNumber: z.string().optional(),
  invoiceNumber: z.string().min(1, "Número da nota fiscal é obrigatório."),
  supplier: z.string().min(1, "Fornecedor é obrigatório."),
  categoryId: z.string().min(1, "Categoria é obrigatória."),
  purchaseValue: z.coerce.number().min(0.01, "Valor de compra deve ser maior que zero."),
  previouslyDepreciatedValue: z.coerce.number().min(0, "Valor já depreciado não pode ser negativo.").optional(),
  locationId: z.string().optional(),
  additionalInfo: z.string().optional(),
  imageDateUris: z.array(z.string()).max(MAX_PHOTOS, `Máximo de ${MAX_PHOTOS} fotos permitidas.`).optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

export default function AddAssetPage() {
  const { addAsset } = useAssets();
  const { suppliers } = useSuppliers();
  const { categories } = useCategories();
  const { locations } = useLocations();
  const { toast } = useToast();
  const router = useRouter();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: '',
      assetTag: '',
      purchaseDate: undefined,
      serialNumber: '',
      invoiceNumber: '',
      supplier: '',
      categoryId: '',
      purchaseValue: 0,
      previouslyDepreciatedValue: undefined,
      locationId: '',
      additionalInfo: '',
      imageDateUris: [],
    },
  });

  function onSubmit(data: AssetFormValues) {
    const initialCurrentValue = data.purchaseValue - (data.previouslyDepreciatedValue || 0);
    if (initialCurrentValue < 0) {
        toast({
            title: "Erro de Validação",
            description: "O valor já depreciado não pode ser maior que o valor de compra.",
            variant: "destructive",
        });
        return;
    }

    const assetDataToSave: Omit<Asset, 'id'> = {
      ...data,
      purchaseDate: format(data.purchaseDate, 'yyyy-MM-dd'),
      currentValue: initialCurrentValue,
      imageDateUris: data.imageDateUris || [],
      previouslyDepreciatedValue: data.previouslyDepreciatedValue,
      locationId: data.locationId || undefined,
      additionalInfo: data.additionalInfo || undefined,
    };
    addAsset(assetDataToSave);
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
          title: "Limite de Fotos Atingido",
          description: `Você já adicionou o máximo de ${MAX_PHOTOS} fotos.`,
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const filesToProcess = Array.from(files).slice(0, availableSlots);

      if (files.length > filesToProcess.length) {
        toast({
          title: "Algumas Fotos Não Adicionadas",
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Adicionar Novo Ativo</h1>
          <p className="text-muted-foreground">Preencha os campos abaixo para cadastrar um novo ativo.</p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Detalhes do Ativo</CardTitle>
          <CardDescription>Forneça todas as informações relevantes sobre o novo ativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Ativo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Notebook Dell XPS 15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assetTag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº de Patrimônio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: ZDI-00123" {...field} />
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
                      <FormLabel>Categoria</FormLabel>
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
                      <FormDescription>
                        Cadastre categorias na tela de "Configurações".
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um fornecedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.length === 0 ? (
                            <SelectItem value="no-suppliers" disabled>Nenhum fornecedor cadastrado</SelectItem>
                          ) : (
                            suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.nomeFantasia} ({supplier.razaoSocial})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Cadastre fornecedores na tela de "Fornecedores".
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local Alocado</FormLabel>
                      <Select
                        onValueChange={(selectedValue) => {
                          field.onChange(selectedValue === NO_LOCATION_SELECTED_VALUE ? '' : selectedValue);
                        }}
                        value={field.value === '' || field.value === undefined ? NO_LOCATION_SELECTED_VALUE : field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um local" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value={NO_LOCATION_SELECTED_VALUE}>Nenhum local selecionado</SelectItem>
                          {locations.length === 0 ? (
                             <SelectItem value="no-locations-disabled" disabled>Nenhum local cadastrado</SelectItem>
                          ) : (
                            locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Cadastre locais na tela de "Configurações".
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem> {/* Removido className="flex flex-col" */}
                      <FormLabel>Data da Compra</FormLabel>
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
                      <FormLabel>Nº da Nota Fiscal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: NF-000123456" {...field} />
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
                      <FormLabel>Nº de Série (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: SN-ABC123XYZ" {...field} />
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
                      <FormLabel>Valor de Compra (R$)</FormLabel>
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
                      <FormLabel>Valor Já Depreciado (R$, Opcional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 500.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Informe se o ativo foi adquirido usado e já possuía depreciação acumulada.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 lg:col-span-2">
                      <FormLabel>Informações Adicionais (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detalhes extras sobre o ativo, condições, observações, etc."
                          className="resize-y min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2 pt-4">
                <FormField
                  control={form.control}
                  name="imageDateUris"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <UploadCloud className="mr-2 h-5 w-5" />
                        Fotos do Ativo (Máx. {MAX_PHOTOS})
                      </FormLabel>
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
                      <FormDescription>
                        Formatos suportados: JPG, PNG, GIF, etc. Você pode adicionar até {MAX_PHOTOS} fotos.
                         Fotos adicionadas: {form.getValues('imageDateUris')?.length || 0}/{MAX_PHOTOS}.
                      </FormDescription>
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
                              title="Remover esta imagem"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-6">
                 <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {form.formState.isSubmitting ? "Salvando..." : "Salvar Ativo"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    