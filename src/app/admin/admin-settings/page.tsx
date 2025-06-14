
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription as DialogDesc } from "@/components/ui/dialog"; // Renomeado DialogDescription para evitar conflito
import { Slider } from "@/components/ui/slider";
import { Palette, UploadCloud, XCircle, Save, ImageIcon as ImageIconLucide, Brush, Square, Type, Columns2, Eye, Spline, Crop, ZoomIn, ZoomOut } from "lucide-react"; // Renomeado Image para ImageIconLucide
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
  inputBorderColor: optionalHexColor,
  labelTextColor: optionalHexColor,
  descriptionTextColor: optionalHexColor,
});
type LoginScreenBrandingFormValues = z.infer<typeof loginScreenBrandingSchema>;

// Helper function to create a cropped image (typically used with react-easy-crop)
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image(); // Usar window.Image para evitar conflito com next/image
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Needed to avoid tainted canvases
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  if (!pixelCrop || typeof pixelCrop.width !== 'number' || typeof pixelCrop.height !== 'number' || typeof pixelCrop.x !== 'number' || typeof pixelCrop.y !== 'number') {
    console.error("Dados de corte (pixelCrop) inválidos:", pixelCrop);
    throw new Error("Dados de corte (pixelCrop) fornecidos são inválidos.");
  }
  if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
    console.error("Dimensões de corte inválidas:", pixelCrop);
    throw new Error("Dimensões de corte inválidas (largura ou altura zero/negativa).");
  }

  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error("Não foi possível obter o contexto 2D do canvas.");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  try {
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
  } catch (e: any) {
    console.error("Erro durante ctx.drawImage:", e, { sourceDimensions: { w: image.width, h: image.height }, crop: pixelCrop });
    throw new Error(`Falha ao desenhar a imagem no canvas: ${e.message}`);
  }
  
  try {
    const dataUrl = canvas.toDataURL('image/png');
    if (!dataUrl || dataUrl === "data:,") { 
        console.error("canvas.toDataURL retornou um valor inválido/vazio", { dataUrl });
        throw new Error("Falha ao gerar Data URL da imagem cortada (retorno vazio).");
    }
    return dataUrl;
  } catch (e: any) {
    console.error("Erro durante canvas.toDataURL:", e, { canvasWidth: canvas.width, canvasHeight: canvas.height });
    throw new Error(`Falha ao exportar o canvas para Data URL: ${e.message}`);
  }
}


export default function AdminPersonalizationPage() {
  const [loginScreenBranding, setLoginScreenBranding] = useLoginScreenBranding();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  // State for image cropping
  const [imageSrcForCropper, setImageSrcForCropper] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);


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

  const handleBgFileChange = (
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
      fieldOnChange('');
    }
  };
  
  const handleLogoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrcForCropper(reader.result as string);
        setIsCropDialogOpen(true);
        if (logoInputRef.current) {
          logoInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixelsValue: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  }, []);

  const handleConfirmCrop = async () => {
    if (!imageSrcForCropper || !croppedAreaPixels) {
      toast({ variant: "destructive", title: "Erro ao cortar", description: "Imagem original ou área de corte não definida." });
      setIsCropDialogOpen(false);
      setImageSrcForCropper(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
      return;
    }
    
    try {
      const croppedImage = await getCroppedImg(imageSrcForCropper, croppedAreaPixels);
      if (croppedImage) {
        form.setValue('logoUrl', croppedImage);
      } else {
         // Should not happen if getCroppedImg throws on failure
        throw new Error("A função getCroppedImg retornou um valor nulo inesperadamente.");
      }
    } catch (e: any) {
      console.error("Falha ao confirmar corte:", e);
      toast({ variant: "destructive", title: "Erro ao cortar imagem", description: e.message || "Não foi possível processar o corte da imagem." });
    }
    setIsCropDialogOpen(false);
    setImageSrcForCropper(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
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


  const previewPageStyle: React.CSSProperties = {};
  if (watchedValues.backgroundImageUrl) {
    previewPageStyle.backgroundImage = `url(${watchedValues.backgroundImageUrl})`;
    previewPageStyle.backgroundSize = 'cover';
    previewPageStyle.backgroundPosition = 'center';
    previewPageStyle.backgroundRepeat = 'no-repeat';
  } else {
    previewPageStyle.backgroundColor = 'hsl(var(--muted) / 0.4)';
  }

  const previewCardStyle: React.CSSProperties = {};
  if (watchedValues.cardBackgroundColor) {
    previewCardStyle.backgroundColor = watchedValues.cardBackgroundColor;
  } else {
    previewCardStyle.backgroundColor = 'hsl(var(--card))';
  }

  const previewInputStyle: React.CSSProperties = {};
  if (watchedValues.inputBackgroundColor) {
    previewInputStyle.backgroundColor = watchedValues.inputBackgroundColor;
  } else {
     previewInputStyle.backgroundColor = 'hsl(var(--input))';
  }
  if (watchedValues.inputBorderColor) {
    previewInputStyle.borderColor = watchedValues.inputBorderColor;
    previewInputStyle.borderWidth = '1px';
    previewInputStyle.borderStyle = 'solid';
  } else {
    previewInputStyle.borderColor = 'hsl(var(--border))';
    previewInputStyle.borderWidth = '1px';
    previewInputStyle.borderStyle = 'solid';
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
                            <UploadCloud className="mr-2 h-5 w-5" />
                            Logo na tela de login
                          </FormLabel>
                          <FormDescription className="pb-2">
                            Altura máxima: 40 pixels. A largura será ajustada para manter a proporção.
                            Selecione uma imagem para abrir o editor de corte.
                          </FormDescription>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                type="file"
                                accept="image/*"
                                ref={logoInputRef}
                                onChange={handleLogoFileSelect}
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
                                title="Remover logo"
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
                            <ImageIconLucide className="mr-2 h-5 w-5" />
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
                                onChange={(e) => handleBgFileChange(e, field.onChange)}
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
                      name="inputBorderColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-lg font-semibold">
                            <Spline className="mr-2 h-5 w-5" />
                            Cor da borda dos campos de entrada
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
                            Para "E-mail" e "Senha". Deixe em branco para padrão.
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
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[280px] p-4 rounded-lg shadow-2xl backdrop-blur-sm bg-opacity-80"
                              style={previewCardStyle}
                          >
                              {watchedValues.logoUrl ? (
                                  <div className="mx-auto mb-2 h-8 w-auto max-w-[100px] relative">
                                      <Image src={watchedValues.logoUrl} alt="Preview Logo" layout="fill" objectFit="contain" data-ai-hint="login logo dynamic preview" />
                                  </div>
                              ) : (
                                  <div className="h-8 w-20 bg-muted/70 rounded mx-auto mb-2 flex items-center justify-center text-[9px]" style={{color: previewDescriptionStyle.color || 'hsl(var(--muted-foreground))'}}>Logo Aqui</div>
                              )}

                              <p className="text-center text-[10px] mb-3" style={previewDescriptionStyle}>
                                  Acesse sua conta Zaldi Imo
                              </p>

                              <div className="mb-2">
                                  <label className="block text-[10px] font-medium mb-0.5" style={previewLabelStyle}>E-mail</label>
                                  <div className="h-6 rounded-sm" style={previewInputStyle}></div>
                              </div>

                              <div className="mb-2">
                                  <label className="block text-[10px] font-medium mb-0.5" style={previewLabelStyle}>Senha</label>
                                  <div className="h-6 rounded-sm" style={previewInputStyle}></div>
                              </div>

                              <div className="h-7 rounded-md flex items-center justify-center text-[10px] font-medium" style={previewLoginButtonStyle}>
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

      {isCropDialogOpen && imageSrcForCropper && (
        <Dialog open={isCropDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCropDialogOpen(false);
            setImageSrcForCropper(null); 
            setCroppedAreaPixels(null);
          } else {
            setIsCropDialogOpen(true);
          }
        }}>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Crop className="mr-2 h-5 w-5" />
                Ajustar Logo
              </DialogTitle>
              <DialogDesc> {/* Usando DialogDesc aqui */}
                Ajuste o zoom e a área de corte da sua logo. A proporção é de 3:1.
              </DialogDesc>
            </DialogHeader>
            <div className="relative h-64 w-full bg-muted my-4">
              <Cropper
                image={imageSrcForCropper}
                crop={crop}
                zoom={zoom}
                aspect={3 / 1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={true}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ZoomOut className="h-5 w-5 text-muted-foreground" />
                <Slider
                  min={1}
                  max={3}
                  step={0.01}
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                  className="flex-1"
                />
                <ZoomIn className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => {
                setIsCropDialogOpen(false);
                setImageSrcForCropper(null);
                setCroppedAreaPixels(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmCrop}>
                <Crop className="mr-2 h-4 w-4" />
                Confirmar Corte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
