
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
import { Palette, UploadCloud, XCircle, Save, Image as ImageIcon, Brush } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useLoginScreenBranding, type LoginScreenBrandingConfig } from '@/hooks/useLoginScreenBranding';

const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;

const loginScreenBrandingSchema = z.object({
  logoUrl: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  loginButtonColor: z.string().regex(hexColorRegex, "Cor inválida. Use o formato hexadecimal (ex: #RRGGBB).").optional(),
});
type LoginScreenBrandingFormValues = z.infer<typeof loginScreenBrandingSchema>;

export default function AdminPersonalizationPage() {
  const [loginScreenBranding, setLoginScreenBranding] = useLoginScreenBranding();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<LoginScreenBrandingFormValues>({
    resolver: zodResolver(loginScreenBrandingSchema),
    defaultValues: {
      logoUrl: loginScreenBranding.logoUrl || '',
      backgroundImageUrl: loginScreenBranding.backgroundImageUrl || '',
      loginButtonColor: loginScreenBranding.loginButtonColor || '#3F51B5',
    },
  });

  useEffect(() => {
    form.reset({
      logoUrl: loginScreenBranding.logoUrl || '',
      backgroundImageUrl: loginScreenBranding.backgroundImageUrl || '',
      loginButtonColor: loginScreenBranding.loginButtonColor || '#3F51B5',
    });
  }, [loginScreenBranding, form]);

  const onSubmit = (data: LoginScreenBrandingFormValues) => {
    setLoginScreenBranding((prev) => ({
      ...prev,
      logoUrl: data.logoUrl || '',
      backgroundImageUrl: data.backgroundImageUrl || '',
      loginButtonColor: data.loginButtonColor || '#3F51B5',
    }));
    toast({ title: "Sucesso!", description: "Personalização da tela de login atualizada." });
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldOnChange: (value: string) => void
  ) => {
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
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
                        onChange={(e) => handleFileChange(e, field.onChange)}
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

              <FormField
                control={form.control}
                name="backgroundImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-lg font-semibold">
                       <ImageIcon className="mr-2 h-5 w-5" />
                      Imagem de fundo da tela de login
                    </FormLabel>
                     <FormDescription className="pb-2">
                        Faça o upload da imagem de fundo para a tela de login. Se nenhuma imagem for selecionada, uma cor padrão será usada.
                      </FormDescription>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        ref={bgImageInputRef}
                        onChange={(e) => handleFileChange(e, field.onChange)}
                        className="cursor-pointer max-w-md"
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Pré-visualização da imagem de fundo:</p>
                        <div className="relative w-full max-w-md h-64 border rounded-md overflow-hidden group bg-muted/20">
                           <Image
                            src={field.value}
                            alt="Pré-visualização da Imagem de Fundo da Tela de Login"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="login screen background preview"
                           />
                           <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                field.onChange('');
                                if (bgImageInputRef.current) {
                                  bgImageInputRef.current.value = '';
                                }
                              }}
                              className="absolute top-2 right-2 h-8 w-8 opacity-70 group-hover:opacity-100"
                              title="Remover imagem de fundo"
                            >
                              <XCircle className="h-5 w-5" />
                            </Button>
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="loginButtonColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-lg font-semibold">
                      <Brush className="mr-2 h-5 w-5" />
                      Cor do botão de login
                    </FormLabel>
                    <FormDescription className="pb-2">
                      Escolha a cor de fundo para o botão principal da tela de login.
                    </FormDescription>
                    <div className="flex items-center gap-4 max-w-md">
                      <FormControl>
                        <Input
                          type="color"
                          {...field}
                          className="w-20 h-10 p-1 cursor-pointer"
                        />
                      </FormControl>
                      <div className="w-24 h-10 rounded-md border flex items-center justify-center" style={{ backgroundColor: field.value }}>
                        <span className="text-xs" style={{ color: field.value && parseInt(field.value.substring(1,3), 16) * 0.299 + parseInt(field.value.substring(3,5), 16) * 0.587 + parseInt(field.value.substring(5,7), 16) * 0.114 > 186 ? '#000000' : '#FFFFFF' }}>
                          Cor
                        </span>
                      </div>
                       <span className="text-sm text-muted-foreground">{field.value}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-6 flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
