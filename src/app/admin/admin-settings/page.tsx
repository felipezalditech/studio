
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import NextImage from 'next/image';
import Cropper, { type Area, type Point } from 'react-easy-crop';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDescUI } from "@/components/ui/form";
import { Palette, UploadCloud, XCircle, Save, ImageIcon as ImageIconLucide, Brush, Square, Type, Columns2, Eye, Spline, ImageUp, Scissors, CheckCircle2, AlertCircle, ZoomIn } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useLoginScreenBranding } from '@/hooks/useLoginScreenBranding';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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

const LOGO_OUTPUT_WIDTH = 240;
const LOGO_OUTPUT_HEIGHT = 80;


export default function AdminPersonalizationPage() {
  const [loginScreenBranding, setLoginScreenBranding] = useLoginScreenBranding();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
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

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous'); 
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string | null> => {
    if (!pixelCrop || typeof pixelCrop.width !== 'number' || typeof pixelCrop.height !== 'number' || typeof pixelCrop.x !== 'number' || typeof pixelCrop.y !== 'number') {
      console.error('pixelCrop inválido:', pixelCrop);
      throw new Error("Dados de corte inválidos recebidos.");
    }
    if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
      console.error('Dimensões de corte inválidas:', pixelCrop);
      throw new Error("A área de corte selecionada tem dimensões inválidas (largura ou altura zero ou negativa).");
    }

    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = LOGO_OUTPUT_WIDTH;
    canvas.height = LOGO_OUTPUT_HEIGHT;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error("Não foi possível obter o contexto 2D do canvas.");
    }
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    try {
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        LOGO_OUTPUT_WIDTH,
        LOGO_OUTPUT_HEIGHT
      );
    } catch (e: any) {
      console.error("Erro ao desenhar imagem no canvas:", e);
      throw new Error(`Erro ao processar a imagem (drawImage): ${e.message}`);
    }

    return new Promise((resolve, reject) => {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (e: any) {
        console.error("Erro ao converter canvas para Data URL:", e);
        reject(new Error(`Erro ao gerar a imagem final (toDataURL): ${e.message}`))
      }
    });
  };


  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // For direct use without cropping:
        form.setValue('logoUrl', result);
        toast({
          title: "Logo atualizada!",
          description: "A nova logo foi definida.",
          action: <CheckCircle2 className="text-green-500" />,
        });
      };
      reader.readAsDataURL(file);
    }
     if (logoInputRef.current) {
        logoInputRef.current.value = '';
    }
  };
  
  const handleConfirmCrop = async () => {
    if (!imageToCrop || !croppedAreaPixels) {
      toast({
        title: "Erro no corte",
        description: "Não foi possível cortar a imagem. Verifique se uma área foi selecionada.",
        variant: "destructive",
      });
      return;
    }
    try {
      const croppedImageUrl = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (croppedImageUrl) {
        form.setValue('logoUrl', croppedImageUrl);
      }
      toast({
        title: "Logo atualizada!",
        description: "A nova logo foi cortada e definida.",
        action: <CheckCircle2 className="text-green-500" />,
      });
    } catch (e: any) {
      toast({
        title: "Erro ao cortar imagem",
        description: e.message || "Ocorreu um erro desconhecido.",
        variant: "destructive",
        action: <AlertCircle className="text-red-500" />,
      });
    } finally {
      setIsCropDialogOpen(false);
      setImageToCrop(null);
      setCroppedAreaPixels(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  };


  const handleBackgroundImageFileChange = (
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
     if (bgImageInputRef.current) {
        bgImageInputRef.current.value = '';
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
    previewInputStyle.borderColor = 'hsl(var(--border))'; // Cor padrão da borda do ShadCN
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
                                onChange={handleLogoFileChange} // Direct usage, no cropping
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
                                  layout="fill"
                                  objectFit="contain"
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
                            Se nenhuma imagem for selecionada, uma cor padrão será usada na coluna da direita.
                          </FormDescUI>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                type="file"
                                accept="image/*"
                                ref={bgImageInputRef}
                                onChange={(e) => handleBackgroundImageFileChange(e, field.onChange)}
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
                            Para "Acesse sua conta...". Deixe em branco para padrão.
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
                                <div className="mx-auto mb-1 mt-1 h-[14px] w-auto max-w-[50px] relative"> {/* Adjusted height and max-width */}
                                  <NextImage src={watchedValues.logoUrl} alt="Preview Logo" layout="fill" objectFit="contain" data-ai-hint="login logo dynamic preview"/>
                                </div>
                              ) : (
                                <div className="h-[14px] w-14 bg-muted/70 rounded mx-auto mb-1 mt-1 flex items-center justify-center text-[8px]" style={previewDescriptionStyle}>Logo Aqui</div>
                              )}

                              <p className="text-center text-[8px] mb-2" style={previewDescriptionStyle}>
                                Acesse sua conta Zaldi Imo
                              </p>

                              <div className="mb-1.5">
                                <label className="block text-[8px] font-medium mb-0.5" style={previewLabelStyle}>E-mail</label>
                                <div className="h-4 rounded-sm" style={previewInputStyle}></div>
                              </div>

                              <div className="mb-1.5">
                                <label className="block text-[8px] font-medium mb-0.5" style={previewLabelStyle}>Senha</label>
                                <div className="h-4 rounded-sm" style={previewInputStyle}></div>
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
      
      {isCropDialogOpen && imageToCrop && (
        <Dialog open={isCropDialogOpen} onOpenChange={(open) => {
            if (!open) {
                setIsCropDialogOpen(false);
                setImageToCrop(null);
                setCroppedAreaPixels(null);
            }
        }}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center"><Scissors className="mr-2 h-5 w-5"/>Cortar Logo</DialogTitle>
              <DialogDescription>
                Ajuste a imagem para o formato 3:1 (largura:altura). A altura final será de 28px.
              </DialogDescription>
            </DialogHeader>
            <div className="relative w-full h-[300px] bg-muted/50 my-4">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={LOGO_OUTPUT_WIDTH / LOGO_OUTPUT_HEIGHT} // 3:1
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition={false}
              />
            </div>
            <div className="flex items-center gap-4">
              <ZoomIn className="h-5 w-5 text-muted-foreground" />
              <Slider
                min={0.2}
                max={4}
                step={0.01}
                value={[zoom]}
                onValueChange={(val) => setZoom(val[0])}
                className="flex-1"
              />
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => {
                  setIsCropDialogOpen(false);
                  setImageToCrop(null);
                  setCroppedAreaPixels(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmCrop}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar Corte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

    

    
