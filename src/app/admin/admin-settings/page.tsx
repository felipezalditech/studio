
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
import { Palette, UploadCloud, XCircle, Save } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useLoginScreenBranding, type LoginScreenBrandingConfig } from '@/hooks/useLoginScreenBranding';

const loginScreenBrandingSchema = z.object({
  logoUrl: z.string().optional(),
});
type LoginScreenBrandingFormValues = z.infer<typeof loginScreenBrandingSchema>;

export default function AdminPersonalizationPage() {
  const [loginScreenBranding, setLoginScreenBranding] = useLoginScreenBranding();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<LoginScreenBrandingFormValues>({
    resolver: zodResolver(loginScreenBrandingSchema),
    defaultValues: {
      logoUrl: loginScreenBranding.logoUrl || '',
    },
  });

  useEffect(() => {
    form.reset({ logoUrl: loginScreenBranding.logoUrl || '' });
  }, [loginScreenBranding, form]);

  const onSubmit = (data: LoginScreenBrandingFormValues) => {
    setLoginScreenBranding((prev) => ({ ...prev, logoUrl: data.logoUrl || '' }));
    toast({ title: "Sucesso!", description: "Logo da tela de login atualizada." });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personalização do sistema</h1>
          <p className="text-muted-foreground">
            Customize a aparência da tela de login e outros elementos visuais.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-5 w-5 text-primary" />
            Personalização da tela de login
          </CardTitle>
          <CardDescription>
            Ajuste o logo, imagem de fundo e cores dos botões da sua página de login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-lg font-semibold">
                       <UploadCloud className="mr-2 h-5 w-5" />
                      Logo na tela de login
                    </FormLabel>
                     <FormDescription className="pb-2">
                        Faça o upload do logo que será exibido na tela de login unificada.
                      </FormDescription>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        ref={logoInputRef}
                        onChange={(e) => handleLogoChange(e, field.onChange)}
                        className="cursor-pointer max-w-md"
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Pré-visualização do logo:</p>
                        <div className="relative w-40 h-40 border rounded-md overflow-hidden group bg-muted/20">
                           <Image
                            src={field.value}
                            alt="Pré-visualização do Logo da Tela de Login"
                            layout="fill"
                            objectFit="contain"
                            data-ai-hint="login screen logo preview"
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
              
              <div className="space-y-4 mt-8">
                <div>
                  <h3 className="text-lg font-semibold">Imagem de fundo da tela de login</h3>
                  <p className="text-muted-foreground">
                    (Em desenvolvimento) Escolha uma imagem de fundo para a página de login.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Cores do botão de login</h3>
                  <p className="text-muted-foreground">
                    (Em desenvolvimento) Personalize as cores do botão principal da tela de login.
                  </p>
                </div>
                 <div className="pt-6 flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
