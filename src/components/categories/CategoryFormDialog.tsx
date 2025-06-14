
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
  const hasUsefulLife = data.usefulLifeInYears !== undefined && data.usefulLifeInYears > 0;
  const hasRateInfo = data.depreciationRateType !== undefined && data.depreciationRateValue !== undefined;

  if (hasUsefulLife && hasRateInfo) {
    // Permitir ambos, mas um terá precedência ou serão usados em cálculos diferentes (a lógica de cálculo em si não está aqui)
    return true;
  }
  if (!hasUsefulLife && !hasRateInfo) {
    return false; // Pelo menos um método (vida útil ou taxa) deve ser definido
  }
  return true;
}, {
  message: "Defina a depreciação pela Vida Útil (com valor maior que 0) OU forneça um Tipo de Taxa e um Valor de Taxa.",
  path: ["usefulLifeInYears"], // Pode apontar para um campo geral ou o primeiro campo da dupla
}).refine(data => {
    // Se vida útil não for fornecida (ou for 0), então tipo e valor da taxa são obrigatórios
    const usefulLifeProvided = data.usefulLifeInYears !== undefined && data.usefulLifeInYears > 0;
    if (!usefulLifeProvided) {
        return data.depreciationRateType !== undefined && data.depreciationRateValue !== undefined;
    }
    return true;
}, {
    message: "Se a Vida útil não for informada (ou for 0), o Tipo de Taxa e o Valor da Taxa são obrigatórios.",
    path: ["depreciationRateType"], // Ou depreciationRateValue, para onde a mensagem de erro deve apontar
});


export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitAction: (data: CategoryFormValues) => void;
  initialData?: AssetCategory | null;
}

const depreciationMethodOptions: { value: DepreciationMethod; label: string }[] = [
  { value: 'linear', label: 'Linear (linha reta)' },
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

  const watchedUsefulLife = form.watch("usefulLifeInYears");
  const isRateRequired = watchedUsefulLife === undefined || watchedUsefulLife <= 0;

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
    };
    onSubmitAction(dataToSubmit);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar categoria' : 'Adicionar nova categoria'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Modifique os dados da categoria abaixo.' : 'Preencha os dados para cadastrar uma nova categoria e suas regras de depreciação.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-3"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da categoria *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Eletrônicos de Escritório" {...field} value={field.value ?? ''} />
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
                  <FormLabel>Método de depreciação *</FormLabel>
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
                  <FormLabel>Vida útil (em anos)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 5 (deixe 0 ou vazio se usar taxa)" {...field} value={field.value ?? ''} />
                  </FormControl>
                   <FormDescription>
                    Preencha se a depreciação for baseada na vida útil (maior que 0). Se não, defina a taxa abaixo.
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
                  <FormLabel>Tipo de taxa de depreciação {isRateRequired ? '*' : '(opcional)'}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de taxa" />
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
                    Obrigatório se a vida útil não for definida (ou for 0).
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
                  <FormLabel>Taxa de depreciação (%) {isRateRequired ? '*' : '(opcional)'}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 20 (para 20%)" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>
                    Obrigatório se a vida útil não for definida (ou for 0).
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
                  <FormLabel>Valor residual (percentual %) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 10 (para 10%)" {...field} value={field.value ?? ''} />
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
             {form.formState.errors.usefulLifeInYears && form.formState.errors.usefulLifeInYears.type === "custom" && (
                 <p className="text-sm font-medium text-destructive">{form.formState.errors.usefulLifeInYears.message}</p>
            )}
            {form.formState.errors.depreciationRateType && form.formState.errors.depreciationRateType.type === "custom" && (
                 <p className="text-sm font-medium text-destructive">{form.formState.errors.depreciationRateType.message}</p>
            )}
          </form>
        </Form>
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
            {form.formState.isSubmitting ? "Salvando..." : (initialData ? "Salvar alterações" : "Adicionar categoria")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

