
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
import type { Location } from '@/types/location';
import { useLocations } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const locationFormSchema = z.object({
  name: z.string().min(2, "Nome do local deve ter no mínimo 2 caracteres."),
  address: z.string().optional(),
});

export type LocationFormValues = z.infer<typeof locationFormSchema>;

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<Location> | null;
  onLocationAdded?: (locationId: string) => void;
}

export function LocationFormDialog({ open, onOpenChange, initialData, onLocationAdded }: LocationFormDialogProps) {
  const { addLocation: addLocationToContext, updateLocation: updateLocationInContext } = useLocations();
  const { toast } = useToast();

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialData?.name || '',
        address: initialData?.address || '',
      });
    }
  }, [initialData, form, open]);

  function onSubmit(data: LocationFormValues) {
    if (initialData && initialData.id) {
      updateLocationInContext({ ...initialData, ...data, id: initialData.id });
      toast({ title: "Sucesso!", description: "Local atualizado." });
    } else {
      const newLocation = addLocationToContext(data);
      toast({ title: "Sucesso!", description: "Local adicionado." });
      if (onLocationAdded && newLocation) {
        onLocationAdded(newLocation.id);
      }
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{initialData && initialData.id ? 'Editar local' : 'Adicionar novo local'}</DialogTitle>
          <DialogDescription>
            {initialData && initialData.id ? 'Modifique os dados do local abaixo.' : 'Preencha os dados para cadastrar um novo local.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do local</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Escritório Central, Almoxarifado" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Rua Exemplo, 123, Bairro, Cidade - UF" {...field} value={field.value ?? ''} />
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
                {form.formState.isSubmitting ? "Salvando..." : (initialData && initialData.id ? "Salvar alterações" : "Adicionar local")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
