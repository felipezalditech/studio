
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { FileCog } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useImportSettings, type ImportSettingsConfig } from '@/contexts/ImportSettingsContext';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const importSettingsFormSchema = z.object({
  allocateFreight: z.boolean(),
  freightDilutionScope: z.enum(['all_nfe_items', 'imported_items_only']),
});
type ImportSettingsFormValues = z.infer<typeof importSettingsFormSchema>;

export default function ImportRulesSettingsPage() {
  const { importSettings, setImportSettings } = useImportSettings();
  const { toast } = useToast();

  const importSettingsForm = useForm<ImportSettingsFormValues>({
    resolver: zodResolver(importSettingsFormSchema),
    defaultValues: importSettings,
  });

  useEffect(() => {
    importSettingsForm.reset(importSettings);
  }, [importSettings, importSettingsForm]);

  const onImportSettingsSubmit = (data: ImportSettingsFormValues) => {
    setImportSettings(data);
    toast({ title: "Sucesso!", description: "Regras de importação atualizadas." });
  };

  const watchedAllocateFreight = importSettingsForm.watch('allocateFreight');

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Regras de Importação da NF-e</h1>
        <p className="text-muted-foreground">Defina como o valor do frete da NF-e será tratado ao importar ativos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <FileCog className="mr-2 h-5 w-5" />
            Configuração de Alocação de Frete
          </CardTitle>
          <CardDescription>
            Ajuste como o frete é incorporado ao custo dos produtos durante a importação de NF-e.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...importSettingsForm}>
            <form onSubmit={importSettingsForm.handleSubmit(onImportSettingsSubmit)} className="space-y-6">
              <FormField
                control={importSettingsForm.control}
                name="allocateFreight"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Alocar valor do frete na base de cálculo dos produtos?
                      </FormLabel>
                      <FormDescription>
                        Se "Sim", o valor do frete da NF-e será adicionado ao custo dos produtos importados.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchedAllocateFreight && (
                <FormField
                  control={importSettingsForm.control}
                  name="freightDilutionScope"
                  render={({ field }) => (
                    <FormItem className="space-y-3 rounded-lg border p-4">
                      <FormLabel className="text-base">
                        Diluir frete entre:
                      </FormLabel>
                      <FormDescription>
                        Escolha como o valor total do frete será distribuído.
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="all_nfe_items" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Todos os produtos da NF-e (base original)
                               <FormDescription className="!mt-0.5 text-xs">
                                O frete é dividido entre todos os itens originais da NF-e. Os itens importados recebem sua cota original.
                              </FormDescription>
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="imported_items_only" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Apenas produtos selecionados para importação
                               <FormDescription className="!mt-0.5 text-xs">
                                O frete total é recalculado e dividido apenas entre os itens que serão efetivamente importados.
                              </FormDescription>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="flex justify-end">
                <Button type="submit">Salvar regras de importação</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
