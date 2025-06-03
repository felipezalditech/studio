
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
} from '@/components/ui/form';
import type { AssetModel } from '@/types/assetModel';
import { useAssetModels } from '@/contexts/AssetModelContext';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const assetModelFormSchema = z.object({
  name: z.string().min(2, "Nome do modelo deve ter no mínimo 2 caracteres."),
  description: z.string().optional(),
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
      name: initialData?.name || '',
      description: initialData?.description || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialData?.name || '',
        description: initialData?.description || '',
      });
    }
  }, [initialData, form, open]);

  function onSubmit(data: AssetModelFormValues) {
    if (initialData && initialData.id) {
      updateAssetModel({ ...initialData, ...data, id: initialData.id });
      toast({ title: "Sucesso!", description: "Modelo de ativo atualizado." });
    } else {
      const newModel = addAssetModel(data);
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-3">
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
                type="button"
                onClick={form.handleSubmit(onSubmit)}
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
