
"use client";

import React, { useState } from "react"; // Added React import
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useBranding } from "@/contexts/BrandingContext";
import { Settings } from "lucide-react";


const brandingFormSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório").max(50, "Nome da empresa muito longo"),
  logoUrl: z.string().url("Por favor, insira uma URL válida para o logo").or(z.literal("")),
});

type BrandingFormValues = z.infer<typeof brandingFormSchema>;

export function BrandingModal() {
  const { brandingConfig, setBrandingConfig } = useBranding();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: brandingConfig,
  });

  const onSubmit = (data: BrandingFormValues) => {
    setBrandingConfig(data);
    setIsOpen(false);
  };
  
  // Sync form default values if brandingConfig changes externally
  React.useEffect(() => {
    form.reset(brandingConfig);
  }, [brandingConfig, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="w-9 h-9">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Personalizar Marca</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Personalizar Marca</DialogTitle>
          <DialogDescription>
            Defina o nome e o logo da sua empresa. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Sua Empresa LTDA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Logo</FormLabel>
                  <FormControl>
                    <Input placeholder="https://exemplo.com/logo.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
