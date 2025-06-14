
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import NextImage from 'next/image';
import Cropper, { type Area } from 'react-easy-crop';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDescUI } from "@/components/ui/form";
import { Palette, UploadCloud, XCircle, Save, ImageIcon as ImageIconLucide, Brush, Square, Type, Columns2, Eye, Spline, ImageUp, CheckCircle2, Crop } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useLoginScreenBranding } from '@/hooks/useLoginScreenBranding';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';


const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
const optionalHexColor = z.string().regex(hexColorRegex, "Cor inválida. Use o formato hexadecimal (ex: #RRGGBB).").optional().or(z.literal(''));

const loginScreenBrandingSchema = z.object({
  logoUrl: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  loginButtonColor: optionalHexColor,
  cardBackgroundColor: optionalHexColor,
  inputBackgroundColor: optionalHexColor,
  inputBorderColor: optionalHexColor,
  labelTextColor: optionalHexColor,
  descriptionTextColor: optionalHexColor,
});
type LoginScreenBrandingFormValues = z.infer<typeof loginScreenBrandingSchema>;


const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Retorna um novo canvas contendo a imagem rotacionada.
 */
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}


async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  outputOptions: { type?: 'image/jpeg' | 'image/png'; quality?: number; maxWidth?: number; maxHeight?: number } = {}
): Promise<string | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  const tempCropCanvas = document.createElement('canvas');
  tempCropCanvas.width = pixelCrop.width;
  tempCropCanvas.height = pixelCrop.height;
  const tempCropCtx = tempCropCanvas.getContext('2d');
  if (!tempCropCtx) return null;
  tempCropCtx.putImageData(data, 0, 0);

  let outputWidth = pixelCrop.width;
  let outputHeight = pixelCrop.height;

  if (outputOptions.maxWidth && outputOptions.maxHeight) {
    const ratio = Math.min(outputOptions.maxWidth / outputWidth, outputOptions.maxHeight / outputHeight);
    if (ratio < 1) { 
        outputWidth *= ratio;
        outputHeight *= ratio;
    }
  } else if (outputOptions.maxWidth) {
    if (outputWidth > outputOptions.maxWidth) {
        const ratio = outputOptions.maxWidth / outputWidth;
        outputWidth = outputOptions.maxWidth;
        outputHeight *= ratio;
    }
  } else if (outputOptions.maxHeight) {
    if (outputHeight > outputOptions.maxHeight) {
        const ratio = outputOptions.maxHeight / outputHeight;
        outputHeight = outputOptions.maxHeight;
        outputWidth *= ratio;
    }
  }

  outputWidth = Math.round(outputWidth);
  outputHeight = Math.round(outputHeight);
  
  if (outputWidth === 0 || outputHeight === 0) {
    console.warn("Output dimensions for cropped image are zero. Check crop area and resize options.");
    outputWidth = Math.max(1, outputWidth);
    outputHeight = Math.max(1, outputHeight);
}


  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = outputWidth;
  finalCanvas.height = outputHeight;
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) return null;

  finalCtx.drawImage(tempCropCanvas, 0, 0, pixelCrop.width, pixelCrop.height, 0, 0, outputWidth, outputHeight);
  
  return new Promise((resolve, reject) => {
    try {
        const outputType = outputOptions.type || 'image/jpeg';
        const outputQuality = outputOptions.quality || 0.85;
        const dataUrl = finalCanvas.toDataURL(outputType, outputType === 'image/jpeg' ? outputQuality : undefined);
        resolve(dataUrl);
      } catch (e: any) {
        console.error("Erro ao converter canvas para Data URL:", e);
        reject(new Error(`Erro ao gerar a imagem final (toDataURL): ${e.message}`))
      }
  });
}


export default function AdminPersonalizationPage() {
  const [loginScreenBranding, setLoginScreenBranding] = useLoginScreenBranding();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [currentFieldToUpdate, setCurrentFieldToUpdate] = useState<'logoUrl' | 'backgroundImageUrl' | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);


  const form = useForm<LoginScreenBrandingFormValues>({
    resolver: zodResolver(loginScreenBrandingSchema),
    defaultValues: {
      logoUrl: loginScreenBranding.logoUrl || '',
      backgroundImageUrl: loginScreenBranding.backgroundImageUrl || '',
      loginButtonColor: loginScreenBranding.loginButtonColor || '#3F51B5',
      cardBackgroundColor: loginScreenBranding.cardBackgroundColor || '',
      inputBackgroundColor: loginScreenBranding.inputBackgroundColor || '',
      inputBorderColor: loginScreenBranding.inputBorderColor || '',
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
      inputBorderColor: loginScreenBranding.inputBorderColor || '',
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
      inputBorderColor: data.inputBorderColor || '',
      labelTextColor: data.labelTextColor || '',
      descriptionTextColor: data.descriptionTextColor || '',
    }));
    toast({ title: "Sucesso!", description: "Personalização da tela de login atualizada." });
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleShowCroppedImage = useCallback(async () => {
    if (!imageToCrop || !croppedAreaPixels || !currentFieldToUpdate) {
      return;
    }
    try {
      const options = currentFieldToUpdate === 'logoUrl'
        ? { type: 'image/png' as const, maxWidth: 480, maxHeight: Math.round((480 * 56) / 240) } 
        : { type: 'image/jpeg' as const, quality: 0.85, maxWidth: 1024, maxHeight: 1024 };

      const croppedImage = await getCroppedImg(
        imageToCrop,
        croppedAreaPixels,
        0, 
        { horizontal: false, vertical: false },
        options
      );

      if (croppedImage) {
        form.setValue(currentFieldToUpdate, croppedImage);
        toast({
          title: `${currentFieldToUpdate === 'logoUrl' ? 'Logo' : 'Imagem de fundo'} atualizada!`,
          description: `A nova imagem foi definida.`,
          action: <CheckCircle2 className="text-green-500" />,
        });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao cortar imagem", description: "Não foi possível processar a imagem.", variant: "destructive" });
    }
    setIsCropperOpen(false);
    setImageToCrop(null);
    setCurrentFieldToUpdate(null);
  }, [imageToCrop, croppedAreaPixels, currentFieldToUpdate, form, toast]);


  const handleFileChangeForCropping = (event: React.ChangeEvent<HTMLInputElement>, fieldToUpdate: 'logoUrl' | 'backgroundImageUrl') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setCurrentFieldToUpdate(fieldToUpdate);
        setIsCropperOpen(true);
        setZoom(1); 
        setCrop({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };


  const getPreviewLoginButtonTextColor = (hexColor: string | undefined): string => {
    if (!hexColor || !hexColor.startsWith('#')) return '#FFFFFF';
    const hex = hexColor.replace('#', '');

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
        return '#FFFFFF';
    }

    const r = parseInt(rStr, 16);
    const g = parseInt(gStr, 16);
    const b = parseInt(bStr, 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) return '#FFFFFF';

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 125 ? '#000000' : '#FFFFFF';
  };


  const previewRightPanelStyle: React.CSSProperties = {};
  if (watchedValues.backgroundImageUrl) {
    previewRightPanelStyle.backgroundImage = `url(${watchedValues.backgroundImageUrl})`;
    previewRightPanelStyle.backgroundSize = 'cover';
    previewRightPanelStyle.backgroundPosition = 'center';
    previewRightPanelStyle.backgroundRepeat = 'no-repeat';
  } else {
    previewRightPanelStyle.backgroundColor = 'hsl(var(--muted) / 0.4)';
  }

  const previewLeftPanelStyle: React.CSSProperties = {};
  if (watchedValues.cardBackgroundColor) {
    previewLeftPanelStyle.backgroundColor = watchedValues.cardBackgroundColor;
  } else {
    previewLeftPanelStyle.backgroundColor = 'hsl(var(--background))';
  }

  const previewInputStyle: React.CSSProperties = {
    backgroundColor: watchedValues.inputBackgroundColor || 'hsl(var(--input))',
    borderColor: watchedValues.inputBorderColor || 'hsl(var(--border))',
    borderWidth: '1px',
    borderStyle: 'solid',
  };


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
    backgroundColor: watchedValues.loginButtonColor || '#3F51B5',
    color: getPreviewLoginButtonTextColor(watchedValues.loginButtonColor || '#3F51B5'),
  };


  return (
    <>
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
                  <div className="space-y-8">
                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-lg font-semibold">
                            <ImageUp className="mr-2 h-5 w-5" />
                            Logo na tela de login
                          </FormLabel>
                           <FormDescUI className="pb-2">
                            A logo será exibida com altura máxima de 28 pixels na tela de login, mantendo a proporção original.
                          </FormDescUI>
                          <div className="flex items-center gap-2">
                            <FormControl>
                               <Input
                                type="file"
                                accept="image/*"
                                ref={logoInputRef}
                                onChange={(e) => handleFileChangeForCropping(e, 'logoUrl')}
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
                                title="Remover logo atual"
                                className="shrink-0"
                              >
                                <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                              </Button>
                            )}
                          </div>
                          {field.value && (
                            <div className="mt-4 space-y-2">
                              <FormDescUI>Logo atual:</FormDescUI>
                               <div className="relative w-auto max-w-[240px] h-7 border rounded-md overflow-hidden group bg-muted/20 p-1">
                                <NextImage
                                  src={field.value}
                                  alt="Pré-visualização do Logo"
                                  fill
                                  style={{objectFit:"contain"}}
                                  data-ai-hint="company settings logo current"
                                />
                              </div>
                            </div>
                          )}
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
                            <ImageIconLucide className="mr-2 h-5 w-5" />
                            Imagem de fundo da tela de login
                          </FormLabel>
                          <FormDescUI className="pb-2">
                            Para melhor ajuste com `background-size: cover`, recomendamos uma imagem com cerca de 1200px de largura por 1400px de altura (ou 1200x1200px). Imagens com alta resolução e proporção próxima a retrato ou quadrada tendem a ter menos cortes visíveis e mantêm boa qualidade.
                          </FormDescUI>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                type="file"
                                accept="image/*"
                                ref={bgImageInputRef}
                                onChange={(e) => handleFileChangeForCropping(e, 'backgroundImageUrl')}
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
                           {field.value && (
                            <div className="mt-4 space-y-2">
                              <FormDescUI>Imagem de fundo atual:</FormDescUI>
                               <div className="relative w-full max-w-xs h-32 border rounded-md overflow-hidden group bg-muted/20 p-1">
                                <NextImage
                                  src={field.value}
                                  alt="Pré-visualização da Imagem de Fundo"
                                  fill
                                  style={{objectFit:"contain"}}
                                  data-ai-hint="background image preview"
                                />
                              </div>
                            </div>
                          )}
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
                            Cor de fundo do painel de login
                          </FormLabel>
                          <FormDescUI className="pb-2">
                            Deixe em branco para usar a cor padrão do tema (coluna da esquerda).
                          </FormDescUI>
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
                      name="loginButtonColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-lg font-semibold">
                            <Brush className="mr-2 h-5 w-5" />
                            Cor do botão de login
                          </FormLabel>
                          <FormDescUI className="pb-2">
                            Escolha a cor de fundo para o botão principal.
                          </FormDescUI>
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
                      name="inputBackgroundColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-lg font-semibold">
                            <Columns2 className="mr-2 h-5 w-5" />
                            Cor de fundo dos campos de entrada
                          </FormLabel>
                          <FormDescUI className="pb-2">
                            Deixe em branco para usar a cor padrão do tema.
                          </FormDescUI>
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
                      name="inputBorderColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-lg font-semibold">
                            <Spline className="mr-2 h-5 w-5" />
                            Cor da borda dos campos de entrada
                          </FormLabel>
                          <FormDescUI className="pb-2">
                            Deixe em branco para usar a cor padrão do tema.
                          </FormDescUI>
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
                          <FormDescUI className="pb-2">
                            Para "E-mail" e "Senha". Deixe em branco para padrão.
                          </FormDescUI>
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
                          <FormDescUI className="pb-2">
                            Para "Bem vindo...". Deixe em branco para padrão.
                          </FormDescUI>
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

                  {/* Preview Section */}
                  <div className="mt-8 md:mt-0 md:sticky md:top-20 self-start">
                      <div className="flex items-center mb-2 text-lg font-semibold">
                          <Eye className="mr-2 h-5 w-5 text-primary" />
                          Pré-visualização da tela de login
                      </div>
                      <div
                        className="relative w-full aspect-video max-h-[450px] sm:max-h-[400px] border-2 border-border rounded-xl overflow-hidden shadow-lg"
                      >
                        <div className="flex h-full w-full">
                          {/* Coluna Esquerda (Formulário Preview) */}
                          <div
                            className="w-2/5 flex flex-col items-center justify-center p-3"
                            style={previewLeftPanelStyle}
                          >
                            <div className="w-full max-w-[90%] space-y-2">
                              {watchedValues.logoUrl ? (
                                <div className="mx-auto mb-2 mt-1 h-[14px] w-auto max-w-[50px] relative">
                                  <NextImage src={watchedValues.logoUrl} alt="Preview Logo" fill style={{objectFit:"contain"}} data-ai-hint="login logo dynamic preview"/>
                                </div>
                              ) : (
                                 <div className="h-[14px] w-14 bg-muted/70 rounded mx-auto mb-1.5 mt-1 flex items-center justify-center text-[8px]" style={previewDescriptionStyle}>Logo Aqui</div>
                              )}

                              <p className="text-center text-[13px] font-bold mb-1.5" style={previewDescriptionStyle}>
                                Bem vindo ao Zaldi Imo
                              </p>

                              <div className="mb-1.5">
                                <div
                                  className="h-7 rounded-sm px-1.5 py-0.5 flex flex-col justify-center border"
                                  style={previewInputStyle}
                                >
                                  <span className="block text-[7px] font-medium leading-none" style={previewLabelStyle}>
                                    E-mail
                                  </span>
                                  <span className="block text-[6px] leading-none" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    Informe seu E-mail
                                  </span>
                                </div>
                              </div>

                              <div className="mb-1.5">
                                <div
                                  className="h-7 rounded-sm px-1.5 py-0.5 flex flex-col justify-center border"
                                  style={previewInputStyle}
                                >
                                  <span className="block text-[7px] font-medium leading-none" style={previewLabelStyle}>
                                    Senha
                                  </span>
                                  <span className="block text-[6px] leading-none" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    Informe sua senha
                                  </span>
                                </div>
                              </div>


                              <div className="h-5 rounded-sm flex items-center justify-center text-[8px] font-medium" style={previewLoginButtonStyle}>
                                Entrar
                              </div>
                            </div>
                          </div>

                          {/* Coluna Direita (Visual Preview) */}
                          <div className="w-3/5" style={previewRightPanelStyle}>
                            {!watchedValues.backgroundImageUrl && (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIconLucide className="w-12 h-12 text-muted-foreground/30" />
                              </div>
                            )}
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

      {isCropperOpen && imageToCrop && (
        <Dialog open={isCropperOpen} onOpenChange={(open) => { if (!open) { setIsCropperOpen(false); setImageToCrop(null); }}}>
          <DialogContent className="min-w-[80vw] md:min-w-[60vw] lg:min-w-[50vw] xl:min-w-[40vw] h-[80vh] flex flex-col p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center"><Crop className="mr-2"/>Cortar Imagem</DialogTitle>
            </DialogHeader>
            <div className="relative flex-grow">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={currentFieldToUpdate === 'logoUrl' ? (240/56) : (4/3)}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="p-4 border-t space-y-4">
               <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Zoom:</span>
                <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.01}
                    onValueChange={(value) => setZoom(value[0])}
                    className="w-[calc(100%-50px)]"
                />
              </div>
              <DialogFooter className="gap-2 sm:justify-end">
                <Button variant="outline" onClick={() => { setIsCropperOpen(false); setImageToCrop(null); }}>Cancelar</Button>
                <Button onClick={handleShowCroppedImage}>Aplicar Corte</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

    
