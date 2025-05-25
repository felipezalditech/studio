
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAssets } from '@/contexts/AssetContext';
import { useSuppliers } from '@/contexts/SupplierContext'; // Importado
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Asset } from '@/components/assets/types';

const assetFormSchema = z.object({
  name: z.string().min(1, "Nome do ativo é obrigatório."),
  purchaseDate: z.date({
    required_error: "Data da compra é obrigatória.",
    invalid_type_error: "Formato de data inválido.",
  }),
  invoiceNumber: z.string().min(1, "Número da nota fiscal é obrigatório."),
  serialNumber: z.string().optional(),
  assetTag: z.string().min(1, "Número de patrimônio é obrigatório."),
  supplier: z.string().min(1, "Fornecedor é obrigatório."), // Agora será o ID do fornecedor
  category: z.string().min(1, "Categoria é obrigatória."),
  purchaseValue: z.coerce.number().min(0.01, "Valor de compra deve ser maior que zero."),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

export default function AddAssetPage() {
  const { addAsset } = useAssets();
  const { suppliers } = useSuppliers(); // Usando o contexto de fornecedores
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: '',
      purchaseDate: undefined,
      invoiceNumber: '',
      serialNumber: '',
      assetTag: '',
      supplier: '', // Inicialmente vazio
      category: '',
      purchaseValue: 0,
    },
  });

  function onSubmit(data: AssetFormValues) {
    const assetDataToSave: Omit<Asset, 'id'> = {
      ...data,
      purchaseDate: format(data.purchaseDate, 'yyyy-MM-dd'),
      currentValue: data.purchaseValue,
      // supplier já é o ID do fornecedor vindo do formulário
    };
    addAsset(assetDataToSave);
    toast({
      title: "Sucesso!",
      description: "Ativo adicionado com sucesso.",
    });
    router.push('/assets');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Adicionar Novo Ativo</h1>
          <p className="text-muted-foreground">Preencha os campos abaixo para cadastrar um novo ativo.</p>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Detalhes do Ativo</CardTitle>
          <CardDescription>Forneça todas as informações relevantes sobre o novo ativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Ativo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Notebook Dell XPS 15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assetTag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº de Patrimônio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: ZDI-00123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Eletrônicos, Móveis" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um fornecedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.length === 0 ? (
                            <SelectItem value="no-suppliers" disabled>Nenhum fornecedor cadastrado</SelectItem>
                          ) : (
                            suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.nomeFantasia} ({supplier.razaoSocial})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Cadastre fornecedores na tela de "Fornecedores".
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data da Compra</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Escolha uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº da Nota Fiscal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: NF-000123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº de Série (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: SN-ABC123XYZ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="purchaseValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de Compra (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 2500.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-6">
                 <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {form.formState.isSubmitting ? "Salvando..." : "Salvar Ativo"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
