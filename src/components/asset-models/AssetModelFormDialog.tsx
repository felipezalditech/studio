
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import type { AssetModel } from '@/types/assetModel';
import { useAssetModels } from '@/contexts/AssetModelContext';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const assetModelFormSchema = z.object({
  name: z.string().min(2, "Nome do modelo deve ter no mínimo 2 caracteres."),
  description: z.string().optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  width: z.coerce.number().positive("Largura deve ser um número positivo.").optional().nullable(),
  height: z.coerce.number().positive("Altura deve ser um número positivo.").optional().nullable(),
  weight: z.coerce.number().positive("Peso deve ser um número positivo.").optional().nullable(),
});

export type AssetModelFormValues = z.infer<typeof assetModelFormSchema>;

interface AssetModelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AssetModel | null;
  onModelAdded?: (modelId: string) => void;
}

export function AssetModelFormDialog({ open, onOpenChange, initialData, onModelAdded }: AssetModelFormDialogProps) {
  const { addAssetModel, updateAssetModel } = useAssetModels();
  const { toast } = useToast();

  const form = useForm<AssetModelFormValues>({
    resolver: zodResolver(assetModelFormSchema),
    defaultValues: {
      name: '',
      description: '',
      brand: '',
      color: '',
      width: undefined,
      height: undefined,
      weight: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialData?.name || '',
        description: initialData?.description || '',
        brand: initialData?.brand || '',
        color: initialData?.color || '',
        width: initialData?.width ?? undefined,
        height: initialData?.height ?? undefined,
        weight: initialData?.weight ?? undefined,
      });
    }
  }, [initialData, form, open]);

  function onSubmit(data: AssetModelFormValues) {
    const dataToSave = {
      ...data,
      width: data.width === null ? undefined : data.width,
      height: data.height === null ? undefined : data.height,
      weight: data.weight === null ? undefined : data.weight,
    };

    if (initialData && initialData.id) {
      updateAssetModel({ ...initialData, ...dataToSave, id: initialData.id });
      toast({ title: "Sucesso!", description: "Modelo de ativo atualizado." });
    } else {
      const newModel = addAssetModel(dataToSave);
      toast({ title: "Sucesso!", description: "Modelo de ativo adicionado." });
      if (onModelAdded && newModel) {
        onModelAdded(newModel.id);
      }
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar modelo de ativo' : 'Adicionar novo modelo de ativo'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Modifique os dados do modelo de ativo abaixo.' : 'Preencha os dados para cadastrar um novo modelo de ativo.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do modelo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Notebook Dell XPS 15, Cadeira Ergonômica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Dell, Flexform" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Preto, Prata com detalhes azuis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Largura (opcional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="cm" {...field} value={field.value ?? ''} />
                    </FormControl>
                     <FormDescription className="text-xs">Em centímetros (cm)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altura (opcional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="cm" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription className="text-xs">Em centímetros (cm)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (opcional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="kg" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription className="text-xs">Em quilogramas (kg)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes adicionais sobre o modelo..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit" // Alterado de button para submit
                disabled={form.formState.isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? "Salvando..." : (initialData ? "Salvar alterações" : "Adicionar modelo")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
