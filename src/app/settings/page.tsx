
"use client";

import React, { useEffect, useRef } from 'react'; // Removed useState
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { SettingsIcon, Building2, UploadCloud, XCircle } from "lucide-react"; // Removed Layers, MapPin, PlusCircle, Edit2, Trash2, MoreHorizontal
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/contexts/BrandingContext';

const brandingFormSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório").max(50, "Nome da empresa muito longo"),
  logoUrl: z.string().optional(), 
});
type BrandingFormValues = z.infer<typeof brandingFormSchema>;

export default function SettingsPage() {
  const { brandingConfig, setBrandingConfig } = useBranding();
  const { toast } = useToast();
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
                                  logoInputRef.current.value = ''; 
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
    </div>
  );
}
