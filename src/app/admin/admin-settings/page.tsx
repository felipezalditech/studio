
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
import { Palette, UploadCloud, XCircle, Save, Image as ImageIcon, Brush, Square, Type, Columns } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useLoginScreenBranding, type LoginScreenBrandingConfig } from '@/hooks/useLoginScreenBranding';

const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
const optionalHexColor = z.string().regex(hexColorRegex, "Cor inválida. Use o formato hexadecimal (ex: #RRGGBB).").optional().or(z.literal(''));


const loginScreenBrandingSchema = z.object({
  logoUrl: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  loginButtonColor: optionalHexColor,
  cardBackgroundColor: optionalHexColor,
  inputBackgroundColor: optionalHexColor,
  labelTextColor: optionalHexColor,
  descriptionTextColor: optionalHexColor,
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
      cardBackgroundColor: loginScreenBranding.cardBackgroundColor || '',
      inputBackgroundColor: loginScreenBranding.inputBackgroundColor || '',
      labelTextColor: loginScreenBranding.labelTextColor || '',
      descriptionTextColor: loginScreenBranding.descriptionTextColor || '',
    },
  });

  useEffect(() => {
    form.reset({
      logoUrl: loginScreenBranding.logoUrl || '',
      backgroundImageUrl: loginScreenBranding.backgroundImageUrl || '',
      loginButtonColor: loginScreenBranding.loginButtonColor || '#3F51B5',
      cardBackgroundColor: loginScreenBranding.cardBackgroundColor || '',
      inputBackgroundColor: loginScreenBranding.inputBackgroundColor || '',
      labelTextColor: loginScreenBranding.labelTextColor || '',
      descriptionTextColor: loginScreenBranding.descriptionTextColor || '',
    });
  }, [loginScreenBranding, form]);

  const onSubmit = (data: LoginScreenBrandingFormValues) => {
    setLoginScreenBranding((prev) => ({
      ...prev,
      logoUrl: data.logoUrl || '',
      backgroundImageUrl: data.backgroundImageUrl || '',
      loginButtonColor: data.loginButtonColor || '#3F51B5',
      cardBackgroundColor: data.cardBackgroundColor || '',
      inputBackgroundColor: data.inputBackgroundColor || '',
      labelTextColor: data.labelTextColor || '',
      descriptionTextColor: data.descriptionTextColor || '',
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

  const getBrightness = (hexColor: string): number => {
    if (!hexColor || !hexColorRegex.test(hexColor)) return 128; // Default to mid-brightness
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
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
                      <div 
                        className="w-24 h-10 rounded-md border flex items-center justify-center" 
                        style={{ 
                          backgroundColor: field.value || 'transparent',
                          color: field.value && getBrightness(field.value) > 125 ? '#000000' : '#FFFFFF'
                        }}
                      >
                        <span className="text-xs">Cor</span>
                      </div>
                       <span className="text-sm text-muted-foreground">{field.value || 'Padrão'}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cardBackgroundColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-lg font-semibold">
                      <Square className="mr-2 h-5 w-5" />
                      Cor de fundo do card de login
                    </FormLabel>
                    <FormDescription className="pb-2">
                      Escolha a cor de fundo para o card (caixa) de login. Deixe em branco para usar a cor padrão do tema.
                    </FormDescription>
                    <div className="flex items-center gap-4 max-w-md">
                      <FormControl>
                        <Input
                          type="color"
                          {...field}
                          className="w-20 h-10 p-1 cursor-pointer"
                        />
                      </FormControl>
                      <div 
                        className="w-24 h-10 rounded-md border" 
                        style={{ backgroundColor: field.value || 'transparent' }}
                      ></div>
                       <span className="text-sm text-muted-foreground">{field.value || 'Padrão do tema'}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="inputBackgroundColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-lg font-semibold">
                      <Columns className="mr-2 h-5 w-5" /> {/* Usando ícone alternativo */}
                      Cor de fundo dos campos de entrada
                    </FormLabel>
                    <FormDescription className="pb-2">
                      Escolha a cor de fundo para os campos de email e senha. Deixe em branco para usar a cor padrão do tema.
                    </FormDescription>
                    <div className="flex items-center gap-4 max-w-md">
                      <FormControl>
                        <Input
                          type="color"
                          {...field}
                          className="w-20 h-10 p-1 cursor-pointer"
                        />
                      </FormControl>
                       <div 
                        className="w-24 h-10 rounded-md border" 
                        style={{ backgroundColor: field.value || 'transparent' }}
                      ></div>
                       <span className="text-sm text-muted-foreground">{field.value || 'Padrão do tema'}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="labelTextColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-lg font-semibold">
                      <Type className="mr-2 h-5 w-5" />
                      Cor do texto dos rótulos
                    </FormLabel>
                    <FormDescription className="pb-2">
                      Escolha a cor do texto para os rótulos "Email" e "Senha". Deixe em branco para usar a cor padrão do tema.
                    </FormDescription>
                    <div className="flex items-center gap-4 max-w-md">
                      <FormControl>
                        <Input
                          type="color"
                          {...field}
                          className="w-20 h-10 p-1 cursor-pointer"
                        />
                      </FormControl>
                       <div 
                        className="w-24 h-10 rounded-md border flex items-center justify-center" 
                        style={{ backgroundColor: field.value || 'transparent', color: field.value && getBrightness(field.value) > 125 ? '#000000' : '#FFFFFF' }}
                      >
                         <span className="text-xs" style={{ color: field.value && getBrightness(field.value) > 125 ? '#000000' : '#FFFFFF' }}>
                            Aa
                          </span>
                      </div>
                       <span className="text-sm text-muted-foreground">{field.value || 'Padrão do tema'}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="descriptionTextColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-lg font-semibold">
                      <Type className="mr-2 h-5 w-5" /> {/* Ícone repetido, mas ok por enquanto */}
                      Cor do texto da descrição
                    </FormLabel>
                    <FormDescription className="pb-2">
                      Escolha a cor do texto para a descrição "Acesse sua conta Zaldi Imo". Deixe em branco para usar a cor padrão do tema.
                    </FormDescription>
                    <div className="flex items-center gap-4 max-w-md">
                      <FormControl>
                        <Input
                          type="color"
                          {...field}
                          className="w-20 h-10 p-1 cursor-pointer"
                        />
                      </FormControl>
                       <div 
                        className="w-24 h-10 rounded-md border flex items-center justify-center" 
                        style={{ backgroundColor: field.value || 'transparent' }}
                      >
                         <span className="text-xs" style={{ color: field.value && getBrightness(field.value) > 125 ? '#000000' : '#FFFFFF' }}>
                            Aa
                          </span>
                      </div>
                       <span className="text-sm text-muted-foreground">{field.value || 'Padrão do tema'}</span>
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
