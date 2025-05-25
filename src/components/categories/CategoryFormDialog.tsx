
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  FormDescription, // Added FormDescription to import
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { AssetCategory, DepreciationMethod } from '@/types/category';
import { Save } from 'lucide-react';

const categoryFormSchema = z.object({
  name: z.string().min(2, "Nome da categoria deve ter no mínimo 2 caracteres."),
  depreciationMethod: z.enum(['linear', 'reducing_balance'], {
    required_error: "Método de depreciação é obrigatório."
  }),
  usefulLifeInYears: z.coerce.number().min(1, "Vida útil deve ser no mínimo 1 ano.").max(100, "Vida útil máxima de 100 anos."),
  residualValuePercentage: z.coerce.number().min(0, "Valor residual não pode ser negativo.").max(100, "Valor residual não pode exceder 100%.")
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitAction: (data: CategoryFormValues) => void;
  initialData?: AssetCategory | null;
}

const depreciationMethodOptions: { value: DepreciationMethod; label: string }[] = [
  { value: 'linear', label: 'Linear (Linha Reta)' },
  // { value: 'reducing_balance', label: 'Saldos Decrescentes (Não implementado)' }, // Exemplo de outro método
];

export function CategoryFormDialog({ open, onOpenChange, onSubmitAction, initialData }: CategoryFormDialogProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initialData || {
      name: '',
      depreciationMethod: 'linear',
      usefulLifeInYears: 5,
      residualValuePercentage: 10,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        name: '',
        depreciationMethod: 'linear',
        usefulLifeInYears: 5,
        residualValuePercentage: 10,
      });
    }
  }, [initialData, form, open]);

  function onSubmit(data: CategoryFormValues) {
    onSubmitAction(data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Categoria' : 'Adicionar Nova Categoria'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Modifique os dados da categoria abaixo.' : 'Preencha os dados para cadastrar uma nova categoria e suas regras de depreciação.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Eletrônicos de Escritório" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="depreciationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Depreciação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {depreciationMethodOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usefulLifeInYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vida Útil (em anos)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="residualValuePercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Residual (Percentual %)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 10 (para 10%)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Percentual do valor de compra que o ativo terá ao final de sua vida útil.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? "Salvando..." : (initialData ? "Salvar Alterações" : "Adicionar Categoria")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
