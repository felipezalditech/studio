
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
import { Palette, UploadCloud, XCircle, Save, Image as ImageIcon, Brush, Square, Type, Columns2, Eye } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useLoginScreenBranding, type LoginScreenBrandingConfig } from '@/hooks/useLoginScreenBranding';
import { cn } from '@/lib/utils';

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

  const watchedValues = form.watch();

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
    } else {
      // If no file is selected (e.g., user cancels file dialog), clear the field
      fieldOnChange('');
    }
  };

  const getPreviewLoginButtonTextColor = (hexColor: string | undefined): string => {
    if (!hexColor || !hexColor.startsWith('#')) return '#FFFFFF'; // Default to white for invalid or no color
    const hex = hexColor.replace('#', '');
    
    // Handle 3-digit hex
    let rStr, gStr, bStr;
    if (hex.length === 3) {
        rStr = hex[0] + hex[0];
        gStr = hex[1] + hex[1];
        bStr = hex[2] + hex[2];
    } else if (hex.length === 6) {
        rStr = hex.substring(0, 2);
        gStr = hex.substring(2, 4);
        bStr = hex.substring(4, 6);
    } else {
        return '#FFFFFF'; // Invalid hex length
    }

    const r = parseInt(rStr, 16);
    const g = parseInt(gStr, 16);
    const b = parseInt(bStr, 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) return '#FFFFFF'; // Parsing failed

    // Calculate brightness (standard formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 125 ? '#000000' : '#FFFFFF'; // Return black for light backgrounds, white for dark
  };


  const previewPageStyle: React.CSSProperties = {};
  if (watchedValues.backgroundImageUrl) {
    previewPageStyle.backgroundImage = `url(${watchedValues.backgroundImageUrl})`;
    previewPageStyle.backgroundSize = 'cover';
    previewPageStyle.backgroundPosition = 'center';
    previewPageStyle.backgroundRepeat = 'no-repeat';
  } else {
    previewPageStyle.backgroundColor = 'hsl(var(--muted) / 0.4)'; // Fallback similar to login page
  }

  const previewCardStyle: React.CSSProperties = {};
  if (watchedValues.cardBackgroundColor) {
    previewCardStyle.backgroundColor = watchedValues.cardBackgroundColor;
  } else {
    previewCardStyle.backgroundColor = 'hsl(var(--card))'; // Fallback from theme
  }

  const previewInputStyle: React.CSSProperties = {};
  if (watchedValues.inputBackgroundColor) {
    previewInputStyle.backgroundColor = watchedValues.inputBackgroundColor;
  } else {
     previewInputStyle.backgroundColor = 'hsl(var(--input))'; // Fallback from theme
  }
  
  const previewLabelStyle: React.CSSProperties = {};
  if (watchedValues.labelTextColor) {
    previewLabelStyle.color = watchedValues.labelTextColor;
  } else {
    previewLabelStyle.color = 'hsl(var(--foreground))';
  }

  const previewDescriptionStyle: React.CSSProperties = {};
  if (watchedValues.descriptionTextColor) {
    previewDescriptionStyle.color = watchedValues.descriptionTextColor;
  } else {
     previewDescriptionStyle.color = 'hsl(var(--muted-foreground))';
  }

  const previewLoginButtonStyle: React.CSSProperties = {
    backgroundColor: watchedValues.loginButtonColor || '#3F51B5', // Default or theme primary
    color: getPreviewLoginButtonTextColor(watchedValues.loginButtonColor || '#3F51B5'),
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
            Ajuste o logo, imagem de fundo e cores dos elementos da sua página de login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Coluna de Formulário */}
                <div className="space-y-8">
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
                          Faça o upload do logo que será exibido na tela de login.
                        </FormDescription>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              ref={logoInputRef}
                              onChange={(e) => handleFileChange(e, field.onChange)}
                              className="cursor-pointer flex-grow"
                            />
                          </FormControl>
                          {field.value && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                field.onChange('');
                                if (logoInputRef.current) logoInputRef.current.value = '';
                              }}
                              title="Remover logo selecionado"
                              className="shrink-0"
                            >
                              <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
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
                          Se nenhuma imagem for selecionada, uma cor padrão será usada.
                        </FormDescription>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              ref={bgImageInputRef}
                              onChange={(e) => handleFileChange(e, field.onChange)}
                              className="cursor-pointer flex-grow"
                            />
                          </FormControl>
                          {field.value && (
                             <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                field.onChange('');
                                if (bgImageInputRef.current) bgImageInputRef.current.value = '';
                              }}
                              title="Remover imagem de fundo selecionada"
                              className="shrink-0"
                            >
                              <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
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
                          Escolha a cor de fundo para o botão principal.
                        </FormDescription>
                        <div className="flex items-center gap-2 max-w-md">
                          <FormControl>
                            <Input type="color" {...field} className="w-12 h-10 p-1 cursor-pointer rounded-md border" />
                          </FormControl>
                          <span className="text-sm text-muted-foreground">{field.value || '#3F51B5 (Padrão)'}</span>
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
                          Deixe em branco para usar a cor padrão do tema.
                        </FormDescription>
                        <div className="flex items-center gap-2 max-w-md">
                          <FormControl>
                            <Input type="color" {...field} className="w-12 h-10 p-1 cursor-pointer rounded-md border"/>
                          </FormControl>
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
                          <Columns2 className="mr-2 h-5 w-5" />
                          Cor de fundo dos campos de entrada
                        </FormLabel>
                        <FormDescription className="pb-2">
                          Deixe em branco para usar a cor padrão do tema.
                        </FormDescription>
                        <div className="flex items-center gap-2 max-w-md">
                          <FormControl>
                            <Input type="color" {...field} className="w-12 h-10 p-1 cursor-pointer rounded-md border"/>
                          </FormControl>
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
                          Para "Email" e "Senha". Deixe em branco para padrão.
                        </FormDescription>
                        <div className="flex items-center gap-2 max-w-md">
                          <FormControl>
                            <Input type="color" {...field} className="w-12 h-10 p-1 cursor-pointer rounded-md border"/>
                          </FormControl>
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
                          <Type className="mr-2 h-5 w-5" />
                          Cor do texto da descrição
                        </FormLabel>
                        <FormDescription className="pb-2">
                          Para "Acesse sua conta...". Deixe em branco para padrão.
                        </FormDescription>
                        <div className="flex items-center gap-2 max-w-md">
                          <FormControl>
                            <Input type="color" {...field} className="w-12 h-10 p-1 cursor-pointer rounded-md border"/>
                          </FormControl>
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
                </div>

                {/* Coluna de Pré-visualização */}
                <div className="mt-8 md:mt-0 md:sticky md:top-20 self-start">
                    <div className="flex items-center mb-2 text-lg font-semibold">
                        <Eye className="mr-2 h-5 w-5 text-primary" />
                        Pré-visualização da tela de login
                    </div>
                    <div 
                        className="relative w-full aspect-video max-h-[450px] sm:max-h-[400px] border-2 border-border rounded-xl overflow-hidden shadow-lg"
                        style={previewPageStyle}
                    >
                        <div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[300px] p-5 rounded-lg shadow-2xl backdrop-blur-sm bg-opacity-80" 
                            style={previewCardStyle}
                        >
                            {watchedValues.logoUrl ? (
                                <div className="mx-auto mb-3 h-10 w-auto max-w-[120px] relative">
                                    <Image src={watchedValues.logoUrl} alt="Preview Logo" layout="fill" objectFit="contain" data-ai-hint="login logo dynamic preview"/>
                                </div>
                            ) : (
                                <div className="h-10 w-24 bg-muted/70 rounded mx-auto mb-3 flex items-center justify-center text-xs" style={{color: previewDescriptionStyle.color || 'hsl(var(--muted-foreground))'}}>Logo Aqui</div>
                            )}
                            
                            <p className="text-center text-[10px] mb-4" style={previewDescriptionStyle}>
                                Acesse sua conta Zaldi Imo
                            </p>
                            
                            <div className="mb-2.5">
                                <label className="block text-[10px] font-medium mb-0.5" style={previewLabelStyle}>Email</label>
                                <div className="h-7 rounded-sm" style={previewInputStyle}></div>
                            </div>
                            
                            <div className="mb-3">
                                <label className="block text-[10px] font-medium mb-0.5" style={previewLabelStyle}>Senha</label>
                                <div className="h-7 rounded-sm" style={previewInputStyle}></div>
                            </div>
                            
                            <div className="h-8 rounded-md flex items-center justify-center text-xs font-medium" style={previewLoginButtonStyle}>
                                Entrar
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

