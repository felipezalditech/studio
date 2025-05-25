
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
  FormDescription,
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
  usefulLifeInYears: z.coerce.number().min(0, "Vida útil não pode ser negativa.").max(100, "Vida útil máxima de 100 anos.").optional(),
  residualValuePercentage: z.coerce.number().min(0, "Valor residual não pode ser negativo.").max(100, "Valor residual não pode exceder 100%."),
  depreciationRateType: z.enum(['annual', 'monthly']).optional(),
  depreciationRateValue: z.coerce.number().min(0, "Taxa de depreciação não pode ser negativa.").max(100, "Taxa de depreciação não pode exceder 100%.").optional(),
}).refine(data => {
  // Se um dos campos de taxa explícita for preenchido, o outro também deve ser.
  if (data.depreciationRateType && data.depreciationRateValue === undefined) return false;
  if (data.depreciationRateValue !== undefined && !data.depreciationRateType) return false;
  // Pelo menos a vida útil OU a taxa explícita (tipo e valor) devem ser fornecidas
  if (data.usefulLifeInYears === undefined && (data.depreciationRateType === undefined || data.depreciationRateValue === undefined)) return false;
  return true;
}, {
  message: "Defina a depreciação pela Vida Útil OU forneça um Tipo de Taxa e um Valor de Taxa.",
  // Você pode direcionar a mensagem de erro para um campo específico se desejar,
  // mas uma mensagem geral no formulário pode ser suficiente.
  // path: ["usefulLifeInYears"], // Ou outro campo relevante
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
  // { value: 'reducing_balance', label: 'Saldos Decrescentes (Não implementado)' },
];

const depreciationRateTypeOptions: { value: 'annual' | 'monthly'; label: string }[] = [
  { value: 'annual', label: 'Anual (%)' },
  { value: 'monthly', label: 'Mensal (%)' },
];

export function CategoryFormDialog({ open, onOpenChange, onSubmitAction, initialData }: CategoryFormDialogProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initialData || {
      name: '',
      depreciationMethod: 'linear',
      usefulLifeInYears: 5,
      residualValuePercentage: 10,
      depreciationRateType: undefined,
      depreciationRateValue: undefined,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        usefulLifeInYears: initialData.usefulLifeInYears ?? undefined,
        depreciationRateType: initialData.depreciationRateType ?? undefined,
        depreciationRateValue: initialData.depreciationRateValue ?? undefined,
      });
    } else {
      form.reset({
        name: '',
        depreciationMethod: 'linear',
        usefulLifeInYears: 5,
        residualValuePercentage: 10,
        depreciationRateType: undefined,
        depreciationRateValue: undefined,
      });
    }
  }, [initialData, form, open]);

  function onSubmit(data: CategoryFormValues) {
    const dataToSubmit: CategoryFormValues = {
        ...data,
        usefulLifeInYears: data.usefulLifeInYears === 0 ? undefined : data.usefulLifeInYears, // Trata 0 como não definido se necessário
    };
    onSubmitAction(dataToSubmit);
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
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-3"
          >
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
                    <Input type="number" placeholder="Ex: 5 (deixe 0 ou vazio se usar taxa)" {...field} />
                  </FormControl>
                   <FormDescription>
                    Preencha se a depreciação for baseada na vida útil.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="depreciationRateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Taxa de Depreciação (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo (se usar taxa)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {depreciationRateTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione se a depreciação for baseada em uma taxa percentual.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="depreciationRateValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Taxa de Depreciação (%, opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 20 (para 20%)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Percentual da taxa de depreciação, se aplicável.
                  </FormDescription>
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
                    Percentual do valor de compra que o ativo terá ao final de sua depreciação.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={form.handleSubmit(onSubmit)} // Alterado para chamar o submit do form
            disabled={form.formState.isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {form.formState.isSubmitting ? "Salvando..." : (initialData ? "Salvar Alterações" : "Adicionar Categoria")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

