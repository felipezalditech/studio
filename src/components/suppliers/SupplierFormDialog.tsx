
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { useSuppliers, type Supplier } from '@/contexts/SupplierContext';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { maskCPF, maskCNPJ } from '@/lib/utils';

const supplierFormSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("juridica"),
    razaoSocial: z.string().min(3, "Razão Social deve ter no mínimo 3 caracteres."),
    nomeFantasia: z.string().min(2, "Nome Fantasia deve ter no mínimo 2 caracteres."),
    cnpj: z.string().refine(value => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value) || /^\d{14}$/.test(value), {
        message: "CNPJ inválido. Use XX.XXX.XXX/XXXX-XX ou XXXXXXXXXXXXXX.",
    }),
    contato: z.string().min(5, "Contato é obrigatório."),
    endereco: z.string().min(5, "Endereço é obrigatório."),
    cpf: z.string().optional(), 
  }),
  z.object({
    type: z.literal("fisica"),
    razaoSocial: z.string().min(3, "Nome Completo deve ter no mínimo 3 caracteres."),
    nomeFantasia: z.string().optional(),
    cpf: z.string().refine(value => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value) || /^\d{11}$/.test(value), {
        message: "CPF inválido. Use XXX.XXX.XXX-XX ou XXXXXXXXXXX.",
    }),
    contato: z.string().min(5, "Contato é obrigatório."),
    endereco: z.string().min(5, "Endereço é obrigatório."),
    cnpj: z.string().optional(), 
  }),
]);

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Supplier | Partial<Supplier> | null;
  onSupplierAdded?: (supplierId: string) => void;
}

export function SupplierFormDialog({ open, onOpenChange, initialData, onSupplierAdded }: SupplierFormDialogProps) {
  const { addSupplier: addSupplierToContext, updateSupplier: updateSupplierInContext } = useSuppliers();
  const { toast } = useToast();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      type: (initialData as Supplier)?.type || 'juridica',
      razaoSocial: initialData?.razaoSocial || '',
      nomeFantasia: initialData?.nomeFantasia || '',
      cnpj: (initialData as Supplier)?.cnpj || '',
      cpf: (initialData as Supplier)?.cpf || '',
      contato: initialData?.contato || '',
      endereco: initialData?.endereco || '',
    },
  });

  const selectedType = form.watch('type');

  useEffect(() => {
    if (open) {
      form.reset({
        type: (initialData as Supplier)?.type || 'juridica',
        razaoSocial: initialData?.razaoSocial || '',
        nomeFantasia: initialData?.nomeFantasia || '',
        cnpj: (initialData as Supplier)?.cnpj || '',
        cpf: (initialData as Supplier)?.cpf || '',
        contato: initialData?.contato || '',
        endereco: initialData?.endereco || '',
      });
    }
  }, [initialData, form, open]);

  useEffect(() => {
    if (selectedType === 'fisica') {
      form.setValue('cnpj', undefined);
      form.trigger('cpf'); 
    } else if (selectedType === 'juridica') {
      form.setValue('cpf', undefined);
      form.trigger('cnpj'); 
      if (!form.getValues('nomeFantasia')) { 
        form.trigger('nomeFantasia');
      }
    }
  }, [selectedType, form]);


  function onSubmit(data: SupplierFormValues) {
    const dataToSave: Omit<Supplier, 'id'> = {
        type: data.type,
        razaoSocial: data.razaoSocial,
        nomeFantasia: data.nomeFantasia || '', 
        cnpj: data.type === 'juridica' ? data.cnpj : undefined,
        cpf: data.type === 'fisica' ? data.cpf : undefined,
        contato: data.contato,
        endereco: data.endereco,
    };

    if (initialData && 'id' in initialData && initialData.id) {
      updateSupplierInContext({ ...dataToSave, id: initialData.id });
      toast({ title: "Sucesso!", description: "Fornecedor atualizado." });
    } else {
      const newSupplier = addSupplierToContext(dataToSave);
      toast({ title: "Sucesso!", description: "Fornecedor adicionado." });
      if (onSupplierAdded && newSupplier) {
        onSupplierAdded(newSupplier.id);
      }
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{initialData && 'id' in initialData && initialData.id ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</DialogTitle>
          <DialogDescription>
            {initialData && 'id' in initialData && initialData.id ? 'Modifique os dados do fornecedor abaixo.' : 'Preencha os dados para cadastrar um novo fornecedor.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-3">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Cadastro</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="juridica" />
                        </FormControl>
                        <FormLabel className="font-normal">Pessoa Jurídica</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="fisica" />
                        </FormControl>
                        <FormLabel className="font-normal">Pessoa Física</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="razaoSocial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{selectedType === 'fisica' ? 'Nome Completo' : 'Razão Social'}</FormLabel>
                  <FormControl>
                    <Input placeholder={selectedType === 'fisica' ? 'Ex: João da Silva' : 'Ex: Empresa Exemplo LTDA ME'} {...field} />
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
                  <FormLabel>Nome Fantasia {selectedType === 'fisica' && '(Opcional)'}</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Loja Exemplo ou Apelido" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === 'juridica' && (
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="XX.XXX.XXX/XXXX-XX" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(maskCNPJ(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedType === 'fisica' && (
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="XXX.XXX.XXX-XX" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(maskCPF(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={form.formState.isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? "Salvando..." : (initialData && 'id' in initialData && initialData.id ? "Salvar Alterações" : "Adicionar Fornecedor")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
