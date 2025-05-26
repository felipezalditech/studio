
"use client";

import React, { useState, useEffect, useRef } from 'react'; // Adicionado useRef
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image'; // Adicionado Image
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Layers, SettingsIcon, PlusCircle, Edit2, Trash2, MoreHorizontal, MapPin, Building2, UploadCloud, XCircle } from "lucide-react";
import { useCategories, type AssetCategory } from '@/contexts/CategoryContext';
import { CategoryFormDialog, type CategoryFormValues } from '@/components/categories/CategoryFormDialog';
import { useLocations, type Location } from '@/contexts/LocationContext';
import { LocationFormDialog, type LocationFormValues } from '@/components/locations/LocationFormDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/contexts/BrandingContext';

const brandingFormSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório").max(50, "Nome da empresa muito longo"),
  logoUrl: z.string().optional(), // Alterado para aceitar Data URI ou string vazia
});
type BrandingFormValues = z.infer<typeof brandingFormSchema>;

export default function SettingsPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { locations, addLocation, updateLocation, deleteLocation } = useLocations();
  const { brandingConfig, setBrandingConfig } = useBranding();
  const { toast } = useToast();

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'category' | 'location' } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const brandingForm = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: brandingConfig,
  });

  useEffect(() => {
    brandingForm.reset(brandingConfig);
  }, [brandingConfig, brandingForm]);

  const onBrandingSubmit = (data: BrandingFormValues) => {
    setBrandingConfig(data);
    toast({ title: "Sucesso!", description: "Configurações de marca atualizadas." });
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (value: string) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        fieldOnChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenCategoryDialog = (category: AssetCategory | null = null) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleSubmitCategory = (data: CategoryFormValues) => {
    const categoryDataToSave: Omit<AssetCategory, 'id'> = {
      name: data.name,
      depreciationMethod: data.depreciationMethod,
      residualValuePercentage: data.residualValuePercentage,
      usefulLifeInYears: data.usefulLifeInYears === null || data.usefulLifeInYears === undefined ? undefined : Number(data.usefulLifeInYears),
      depreciationRateType: data.depreciationRateType,
      depreciationRateValue: data.depreciationRateValue === null || data.depreciationRateValue === undefined ? undefined : Number(data.depreciationRateValue),
    };

    if (editingCategory) {
      updateCategory({ ...editingCategory, ...categoryDataToSave });
      toast({ title: "Sucesso!", description: "Categoria atualizada." });
    } else {
      addCategory(categoryDataToSave);
      toast({ title: "Sucesso!", description: "Categoria adicionada." });
    }
    setIsCategoryDialogOpen(false);
  };

  const handleOpenLocationDialog = (location: Location | null = null) => {
    setEditingLocation(location);
    setIsLocationDialogOpen(true);
  };

  const handleSubmitLocation = (data: LocationFormValues) => {
    if (editingLocation) {
      updateLocation({ ...editingLocation, ...data });
      toast({ title: "Sucesso!", description: "Local atualizado." });
    } else {
      addLocation(data);
      toast({ title: "Sucesso!", description: "Local adicionado." });
    }
    setIsLocationDialogOpen(false);
  };

  const handleDeleteRequest = (id: string, type: 'category' | 'location') => {
    setItemToDelete({ id, type });
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'category') {
      deleteCategory(itemToDelete.id);
      toast({ title: "Sucesso!", description: "Categoria excluída." });
    } else if (itemToDelete.type === 'location') {
      deleteLocation(itemToDelete.id);
      toast({ title: "Sucesso!", description: "Local excluído." });
    }
    setItemToDelete(null);
  };


  const getDepreciationMethodLabel = (method: AssetCategory['depreciationMethod']) => {
    if (method === 'linear') return 'Linear';
    if (method === 'reducing_balance') return 'Saldos Decrescentes';
    return method;
  }

  const getDepreciationRateTypeLabel = (type?: 'annual' | 'monthly') => {
    if (type === 'annual') return 'Anual';
    if (type === 'monthly') return 'Mensal';
    return 'N/A';
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações gerais da aplicação e as regras de negócio.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Building2 className="mr-2 h-5 w-5" />
            Dados da empresa
          </CardTitle>
          <CardDescription>
            Defina o nome e o logo da sua empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...brandingForm}>
            <form onSubmit={brandingForm.handleSubmit(onBrandingSubmit)} className="space-y-6">
              <FormField
                control={brandingForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Sua Empresa LTDA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={brandingForm.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <UploadCloud className="mr-2 h-5 w-5" />
                      Logo da Empresa
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        ref={logoInputRef}
                        onChange={(e) => handleLogoChange(e, field.onChange)}
                        className="cursor-pointer"
                      />
                    </FormControl>
                     <FormDescription>
                        Selecione uma imagem (PNG, JPG, etc.). O logo aparecerá nos relatórios.
                      </FormDescription>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Pré-visualização do Logo:</p>
                        <div className="relative w-40 h-40 border rounded-md overflow-hidden group">
                           <Image 
                            src={field.value} 
                            alt="Pré-visualização do Logo" 
                            layout="fill" 
                            objectFit="contain" 
                            data-ai-hint="company logo preview"
                           />
                           <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                field.onChange('');
                                if (logoInputRef.current) {
                                  logoInputRef.current.value = ''; // Limpa o input de arquivo
                                }
                              }}
                              className="absolute top-1 right-1 h-7 w-7 opacity-70 group-hover:opacity-100"
                              title="Remover Logo"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit">Salvar Alterações de Marca</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-xl">
              <Layers className="mr-2 h-5 w-5" />
              Gerenciar Categorias de Ativos
            </CardTitle>
            <CardDescription>
              Defina as categorias de ativos e suas respectivas regras de depreciação.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenCategoryDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Categoria
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma categoria cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Método Depreciação</TableHead>
                  <TableHead className="text-center">Vida Útil (Anos)</TableHead>
                  <TableHead className="text-center">Tx. Depreciação</TableHead>
                  <TableHead className="text-center">Tipo Taxa</TableHead>
                  <TableHead className="text-center">Valor Residual (%)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{getDepreciationMethodLabel(category.depreciationMethod)}</TableCell>
                    <TableCell className="text-center">{category.usefulLifeInYears ?? 'N/A'}</TableCell>
                    <TableCell className="text-center">{category.depreciationRateValue !== undefined ? `${category.depreciationRateValue}%` : 'N/A'}</TableCell>
                    <TableCell className="text-center">{getDepreciationRateTypeLabel(category.depreciationRateType)}</TableCell>
                    <TableCell className="text-center">{category.residualValuePercentage}%</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenCategoryDialog(category)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteRequest(category.id, 'category')}
                            className="text-red-600 hover:!text-red-600 focus:text-red-600 focus:!bg-red-100 dark:focus:!bg-red-700/50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-xl">
              <MapPin className="mr-2 h-5 w-5" />
              Gerenciar Locais dos Ativos
            </CardTitle>
            <CardDescription>
              Defina os locais onde os ativos podem ser alocados.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenLocationDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Local
          </Button>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum local cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Local</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>{location.name}</TableCell>
                    <TableCell>{location.address || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenLocationDialog(location)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteRequest(location.id, 'location')}
                            className="text-red-600 hover:!text-red-600 focus:text-red-600 focus:!bg-red-100 dark:focus:!bg-red-700/50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Outras Configurações
          </CardTitle>
          <CardDescription>
            Opções gerais da aplicação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Outras opções de configuração da aplicação estarão disponíveis aqui.
          </p>
          <Button variant="outline" disabled>
            Acessar (Em Breve)
          </Button>
        </CardContent>
      </Card>

      {isCategoryDialogOpen && (
        <CategoryFormDialog
          open={isCategoryDialogOpen}
          onOpenChange={setIsCategoryDialogOpen}
          onSubmitAction={handleSubmitCategory}
          initialData={editingCategory}
        />
      )}

      {isLocationDialogOpen && (
        <LocationFormDialog
          open={isLocationDialogOpen}
          onOpenChange={setIsLocationDialogOpen}
          onSubmitAction={handleSubmitLocation}
          initialData={editingLocation}
        />
      )}

      <ConfirmationDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={`Confirmar Exclusão de ${itemToDelete?.type === 'category' ? 'Categoria' : 'Local'}`}
        description={`Tem certeza que deseja excluir ${itemToDelete?.type === 'category' ? 'a categoria selecionada' : 'o local selecionado'}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
    
    