
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
import type { Supplier } from '@/contexts/SupplierContext';
import { Save } from 'lucide-react';

const supplierFormSchema = z.object({
  razaoSocial: z.string().min(3, "Razão social deve ter no mínimo 3 caracteres."),
  nomeFantasia: z.string().min(2, "Nome fantasia deve ter no mínimo 2 caracteres."),
  cnpj: z.string().refine(value => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value) || /^\d{14}$/.test(value) , "CNPJ inválido. Use XX.XXX.XXX/XXXX-XX ou XXXXXXXXXXXXXX."),
  contato: z.string().min(5, "Contato é obrigatório."),
  endereco: z.string().min(5, "Endereço é obrigatório."),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitAction: (data: SupplierFormValues) => void;
  initialData?: Supplier | null; // Pode ser Supplier ou null para novo
}

export function SupplierFormDialog({ open, onOpenChange, onSubmitAction, initialData }: SupplierFormDialogProps) {
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: initialData || {
      razaoSocial: '',
      nomeFantasia: '',
      cnpj: '',
      contato: '',
      endereco: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        razaoSocial: '',
        nomeFantasia: '',
        cnpj: '',
        contato: '',
        endereco: '',
      });
    }
  }, [initialData, form, open]); // Reset form when initialData changes or dialog opens

  function onSubmit(data: SupplierFormValues) {
    onSubmitAction(data);
    onOpenChange(false); // Fecha o diálogo após submeter
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Modifique os dados do fornecedor abaixo.' : 'Preencha os dados para cadastrar um novo fornecedor.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="razaoSocial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão Social</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Empresa Exemplo LTDA ME" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nomeFantasia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Fantasia</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Loja Exemplo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="XX.XXX.XXX/XXXX-XX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato (Telefone/Email)</FormLabel>
                  <FormControl>
                    <Input placeholder="(XX) XXXXX-XXXX ou email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Completo</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Rua Exemplo, 123, Bairro, Cidade - UF, CEP XXXXX-XXX" {...field} />
                  </FormControl>
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
                {form.formState.isSubmitting ? "Salvando..." : (initialData ? "Salvar Alterações" : "Adicionar Fornecedor")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
