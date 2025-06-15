
"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { useSuppliers, type Supplier, type SituacaoICMS, type Endereco } from '@/contexts/SupplierContext';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { maskCPF, maskCNPJ, maskCEP } from '@/lib/utils';

const UFS = [
  { value: 'AC', label: 'Acre' }, { value: 'AL', label: 'Alagoas' }, { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' }, { value: 'BA', label: 'Bahia' }, { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espírito Santo' }, { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' }, { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' }, { value: 'PA', label: 'Pará' }, { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' }, { value: 'PE', label: 'Pernambuco' }, { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'RN', label: 'Rio Grande do Norte' }, { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' }, { value: 'RR', label: 'Roraima' }, { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' }, { value: 'SE', label: 'Sergipe' }, { value: 'TO', label: 'Tocantins' }
];

const situacaoICMSOptions: { value: SituacaoICMS; label: string }[] = [
  { value: 'contribuinte', label: 'Contribuinte' },
  { value: 'nao_contribuinte', label: 'Não Contribuinte' },
  { value: 'isento', label: 'Isento' },
];

const baseSchema = z.object({
  razaoSocial: z.string().min(3, "Este campo deve ter no mínimo 3 caracteres."),
  nomeFantasia: z.string().optional(),
  situacaoIcms: z.enum(['contribuinte', 'nao_contribuinte', 'isento'], {
    required_error: "Situação do ICMS é obrigatória."
  }),
  inscricaoEstadual: z.string().optional(),
  responsavelNome: z.string().min(3, "Nome do responsável é obrigatório."),
  emailFaturamento: z.string().email("E-mail de faturamento inválido.").min(1, "E-mail de faturamento é obrigatório."),
  endereco: z.object({
    cep: z.string().min(1, "CEP é obrigatório.").refine(value => /^\d{5}-\d{3}$/.test(value), { message: "CEP inválido. Use XXXXX-XXX." }),
    estado: z.string().min(1, "Estado é obrigatório."),
    cidade: z.string().min(1, "Cidade é obrigatória."),
    bairro: z.string().min(1, "Bairro é obrigatório."),
    rua: z.string().min(1, "Rua é obrigatória."),
    numero: z.string().min(1, "Número é obrigatório."),
    complemento: z.string().optional(),
  }),
});

const supplierFormSchema = z.discriminatedUnion("type", [
  baseSchema.extend({
    type: z.literal("juridica"),
    nomeFantasia: z.string().min(2, "Nome fantasia deve ter no mínimo 2 caracteres."),
    cnpj: z.string().refine(value => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value), {
        message: "CNPJ inválido. Use XX.XXX.XXX/XXXX-XX.",
    }),
    cpf: z.string().optional(), // CPF não é usado para jurídica, mas precisa estar no schema base para Zod
  }),
  baseSchema.extend({
    type: z.literal("fisica"),
    cpf: z.string().refine(value => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value), {
        message: "CPF inválido. Use XXX.XXX.XXX-XX.",
    }),
    cnpj: z.string().optional(), // CNPJ não é usado para física
  }),
]).refine(data => {
  if (data.situacaoIcms === 'contribuinte' && (!data.inscricaoEstadual || data.inscricaoEstadual.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Inscrição Estadual é obrigatória para contribuintes de ICMS.",
  path: ["inscricaoEstadual"],
});


export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Supplier | Partial<Supplier> | null; // Permite Partial para criação inicial
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
      situacaoIcms: (initialData as Supplier)?.situacaoIcms || 'nao_contribuinte',
      inscricaoEstadual: (initialData as Supplier)?.inscricaoEstadual || '',
      responsavelNome: (initialData as Supplier)?.responsavelNome || '',
      emailFaturamento: (initialData as Supplier)?.emailFaturamento || '',
      endereco: {
        cep: (initialData as Supplier)?.endereco?.cep || '',
        estado: (initialData as Supplier)?.endereco?.estado || '',
        cidade: (initialData as Supplier)?.endereco?.cidade || '',
        bairro: (initialData as Supplier)?.endereco?.bairro || '',
        rua: (initialData as Supplier)?.endereco?.rua || '',
        numero: (initialData as Supplier)?.endereco?.numero || '',
        complemento: (initialData as Supplier)?.endereco?.complemento || '',
      },
    },
  });

  const selectedType = form.watch('type');
  const selectedSituacaoIcms = form.watch('situacaoIcms');

  useEffect(() => {
    if (open) {
      const defaultEndereco: Endereco = { cep: '', estado: '', cidade: '', bairro: '', rua: '', numero: '', complemento: '' };
      form.reset({
        type: (initialData as Supplier)?.type || 'juridica',
        razaoSocial: initialData?.razaoSocial || '',
        nomeFantasia: initialData?.nomeFantasia || '',
        cnpj: initialData?.cnpj ? maskCNPJ(initialData.cnpj) : '',
        cpf: initialData?.cpf ? maskCPF(initialData.cpf) : '',
        situacaoIcms: (initialData as Supplier)?.situacaoIcms || 'nao_contribuinte',
        inscricaoEstadual: (initialData as Supplier)?.inscricaoEstadual || '',
        responsavelNome: (initialData as Supplier)?.responsavelNome || '',
        emailFaturamento: (initialData as Supplier)?.emailFaturamento || '',
        endereco: {
          ...defaultEndereco,
          ...(initialData?.endereco || {}),
          cep: initialData?.endereco?.cep ? maskCEP(initialData.endereco.cep) : '',
        }
      });
    }
  }, [initialData, form, open]);

  useEffect(() => {
    if (selectedType === 'fisica') {
      form.setValue('cnpj', undefined);
      form.clearErrors('cnpj');
      form.trigger('cpf');
    } else if (selectedType === 'juridica') {
      form.setValue('cpf', undefined);
      form.clearErrors('cpf');
      form.trigger('cnpj');
    }
    form.trigger('nomeFantasia'); // Revalidar nomeFantasia pois a obrigatoriedade muda
    form.trigger('razaoSocial');
  }, [selectedType, form]);


  function onSubmit(data: SupplierFormValues) {
    const dataToSave: Omit<Supplier, 'id'> = {
      type: data.type,
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.type === 'juridica' ? data.nomeFantasia! : (data.nomeFantasia || data.razaoSocial),
      cnpj: data.type === 'juridica' ? data.cnpj : undefined,
      cpf: data.type === 'fisica' ? data.cpf : undefined,
      situacaoIcms: data.situacaoIcms,
      inscricaoEstadual: data.situacaoIcms === 'contribuinte' ? data.inscricaoEstadual : undefined,
      responsavelNome: data.responsavelNome,
      emailFaturamento: data.emailFaturamento,
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
      <DialogContent className="sm:max-w-2xl"> {/* Aumentado para acomodar mais campos */}
        <DialogHeader>
          <DialogTitle>{initialData && 'id' in initialData && initialData.id ? 'Editar fornecedor' : 'Adicionar novo fornecedor'}</DialogTitle>
          <DialogDescription>
            {initialData && 'id' in initialData && initialData.id ? 'Modifique os dados do fornecedor abaixo.' : 'Preencha os dados para cadastrar um novo fornecedor.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[75vh] overflow-y-auto pr-3">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de cadastro *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value as 'fisica' | 'juridica')}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="juridica" />
                        </FormControl>
                        <FormLabel className="font-normal">Pessoa jurídica</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="fisica" />
                        </FormControl>
                        <FormLabel className="font-normal">Pessoa física</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === 'juridica' ? (
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="XX.XXX.XXX/XXXX-XX"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="XXX.XXX.XXX-XX"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(maskCPF(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="razaoSocial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{selectedType === 'fisica' ? 'Nome completo *' : 'Razão social *'}</FormLabel>
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
                  <FormLabel>Nome fantasia {selectedType === 'fisica' ? '(opcional)' : '*'}</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Loja Exemplo ou Apelido" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="situacaoIcms"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Situação quanto ao ICMS *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value as SituacaoICMS)} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a situação do ICMS" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {situacaoICMSOptions.map(option => (
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

            {selectedSituacaoIcms === 'contribuinte' && (
                 <FormField
                    control={form.control}
                    name="inscricaoEstadual"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Inscrição Estadual *</FormLabel>
                        <FormControl>
                            <Input placeholder="Número da Inscrição Estadual" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            <FormField
              control={form.control}
              name="responsavelNome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do responsável pela empresa *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Maria Souza" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailFaturamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail para faturamento *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="faturamento@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 pt-2">
              <h3 className="text-md font-semibold">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="endereco.cep"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>CEP *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="XXXXX-XXX" 
                          {...field} 
                          onChange={(e) => field.onChange(maskCEP(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endereco.estado"
                  render={({ field }) => (
                    <FormItem  className="md:col-span-2">
                      <FormLabel>Estado *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UFS.map(uf => (
                            <SelectItem key={uf.value} value={uf.value}>
                              {uf.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="endereco.cidade"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <FormControl>
                            <Input placeholder="Sua cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="endereco.bairro"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bairro *</FormLabel>
                        <FormControl>
                            <Input placeholder="Seu bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="endereco.rua"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel>Rua *</FormLabel>
                        <FormControl>
                            <Input placeholder="Nome da rua" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="endereco.numero"
                    render={({ field }) => (
                        <FormItem className="md:col-span-1">
                        <FormLabel>Número *</FormLabel>
                        <FormControl>
                            <Input placeholder="123 ou S/N" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </div>
              <FormField
                control={form.control}
                name="endereco.complemento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Apto, Bloco, Sala" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit" // Mantido como submit pois o form tem seu próprio onSubmit
                disabled={form.formState.isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? "Salvando..." : (initialData && 'id' in initialData && initialData.id ? "Salvar alterações" : "Adicionar fornecedor")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

