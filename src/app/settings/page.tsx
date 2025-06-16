
"use client";

import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { SettingsIcon, Building2, UploadCloud, XCircle, FileCog, Truck } from "lucide-react"; // Added FileCog
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/contexts/BrandingContext';
import { useImportSettings, type ImportSettingsConfig } from '@/contexts/ImportSettingsContext'; // New import
import { Switch } from '@/components/ui/switch'; // New import
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // New import

const brandingFormSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório").max(50, "Nome da empresa muito longo"),
  logoUrl: z.string().optional(),
});
type BrandingFormValues = z.infer<typeof brandingFormSchema>;

const importSettingsFormSchema = z.object({
  allocateFreight: z.boolean(),
  freightDilutionScope: z.enum(['all_nfe_items', 'imported_items_only']),
});
type ImportSettingsFormValues = z.infer<typeof importSettingsFormSchema>;

export default function SettingsPage() {
  const { brandingConfig, setBrandingConfig } = useBranding();
  const { importSettings, setImportSettings } = useImportSettings(); // New hook
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const brandingForm = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: brandingConfig,
  });

  const importSettingsForm = useForm<ImportSettingsFormValues>({ // New form
    resolver: zodResolver(importSettingsFormSchema),
    defaultValues: importSettings,
  });

  useEffect(() => {
    brandingForm.reset(brandingConfig);
  }, [brandingConfig, brandingForm]);

  useEffect(() => { // New effect for import settings
    importSettingsForm.reset(importSettings);
  }, [importSettings, importSettingsForm]);

  const onBrandingSubmit = (data: BrandingFormValues) => {
    setBrandingConfig(data);
    toast({ title: "Sucesso!", description: "Configurações de marca atualizadas." });
  };

  const onImportSettingsSubmit = (data: ImportSettingsFormValues) => { // New submit handler
    setImportSettings(data);
    toast({ title: "Sucesso!", description: "Regras de importação atualizadas." });
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

  const watchedAllocateFreight = importSettingsForm.watch('allocateFreight');

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
                    <FormLabel>Nome da empresa</FormLabel>
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
                      Logo da empresa
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
                        <p className="text-sm font-medium text-muted-foreground">Pré-visualização do logo:</p>
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
                                  logoInputRef.current.value = '';
                                }
                              }}
                              className="absolute top-1 right-1 h-7 w-7 opacity-70 group-hover:opacity-100"
                              title="Remover logo"
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
                <Button type="submit">Salvar alterações de marca</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* New Card for Import Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <FileCog className="mr-2 h-5 w-5" />
            Regras de Importação da NF-e
          </CardTitle>
          <CardDescription>
            Defina como o valor do frete da NF-e será tratado ao importar ativos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...importSettingsForm}>
            <form onSubmit={importSettingsForm.handleSubmit(onImportSettingsSubmit)} className="space-y-6">
              <FormField
                control={importSettingsForm.control}
                name="allocateFreight"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Alocar valor do frete na base de cálculo dos produtos?
                      </FormLabel>
                      <FormDescription>
                        Se "Sim", o valor do frete da NF-e será adicionado ao custo dos produtos importados.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchedAllocateFreight && (
                <FormField
                  control={importSettingsForm.control}
                  name="freightDilutionScope"
                  render={({ field }) => (
                    <FormItem className="space-y-3 rounded-lg border p-4">
                      <FormLabel className="text-base">
                        Diluir frete entre:
                      </FormLabel>
                      <FormDescription>
                        Escolha como o valor total do frete será distribuído.
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="all_nfe_items" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Todos os produtos da NF-e (base original)
                               <FormDescription className="!mt-0.5 text-xs">
                                O frete é dividido entre todos os itens originais da NF-e. Os itens importados recebem sua cota original.
                              </FormDescription>
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="imported_items_only" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Apenas produtos selecionados para importação
                               <FormDescription className="!mt-0.5 text-xs">
                                O frete total é recalculado e dividido apenas entre os itens que serão efetivamente importados.
                              </FormDescription>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="flex justify-end">
                <Button type="submit">Salvar regras de importação</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Outras configurações
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
            Acessar (em breve)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
