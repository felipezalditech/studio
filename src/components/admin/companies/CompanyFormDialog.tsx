
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { ClientCompany, SituacaoICMSEmpresa, EnderecoEmpresa } from '@/types/admin';
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

const situacaoICMSOptions: { value: SituacaoICMSEmpresa; label: string }[] = [
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
  contactPhone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending_payment', 'trial']),
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

const companyFormSchema = z.discriminatedUnion("type", [
  baseSchema.extend({
    type: z.literal("juridica"),
    nomeFantasia: z.string().min(2, "Nome fantasia deve ter no mínimo 2 caracteres."),
    cnpj: z.string().refine(value => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value), {
        message: "CNPJ inválido. Use XX.XXX.XXX/XXXX-XX.",
    }),
    cpf: z.string().optional(),
  }),
  baseSchema.extend({
    type: z.literal("fisica"),
    cpf: z.string().refine(value => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value), {
        message: "CPF inválido. Use XXX.XXX.XXX-XX.",
    }),
    cnpj: z.string().optional(),
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

export type CompanyFormValues = Omit<ClientCompany, 'id' | 'createdAt' | 'updatedAt'>;

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitAction: (data: CompanyFormValues, id?: string) => void;
  initialData?: ClientCompany | null;
}

export function CompanyFormDialog({ open, onOpenChange, onSubmitAction, initialData }: CompanyFormDialogProps) {
  const defaultEndereco: EnderecoEmpresa = { cep: '', estado: '', cidade: '', bairro: '', rua: '', numero: '', complemento: '' };
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: initialData ? {
        ...initialData,
        cnpj: initialData.cnpj || undefined,
        cpf: initialData.cpf || undefined,
        inscricaoEstadual: initialData.inscricaoEstadual || undefined,
        contactPhone: initialData.contactPhone || undefined,
        nomeFantasia: initialData.nomeFantasia || '',
    } : {
      type: 'juridica',
      razaoSocial: '',
      nomeFantasia: '',
      situacaoIcms: 'nao_contribuinte',
      responsavelNome: '',
      emailFaturamento: '',
      status: 'active',
      endereco: defaultEndereco,
      cnpj: undefined,
      cpf: undefined,
      inscricaoEstadual: undefined,
      contactPhone: undefined,
    },
  });

  const selectedType = form.watch('type');
  const selectedSituacaoIcms = form.watch('situacaoIcms');

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
            ...initialData,
            cnpj: initialData.cnpj ? maskCNPJ(initialData.cnpj) : undefined,
            cpf: initialData.cpf ? maskCPF(initialData.cpf) : undefined,
            inscricaoEstadual: initialData.inscricaoEstadual || undefined,
            contactPhone: initialData.contactPhone || undefined,
            nomeFantasia: initialData.nomeFantasia || '',
            endereco: {
                ...defaultEndereco,
                ...(initialData.endereco || {}),
                cep: initialData.endereco?.cep ? maskCEP(initialData.endereco.cep) : '',
            }
        });
      } else {
        form.reset({
          type: 'juridica',
          razaoSocial: '',
          nomeFantasia: '',
          situacaoIcms: 'nao_contribuinte',
          responsavelNome: '',
          emailFaturamento: '',
          status: 'active',
          endereco: defaultEndereco,
          cnpj: undefined,
          cpf: undefined,
          inscricaoEstadual: undefined,
          contactPhone: undefined,
        });
      }
    }
  }, [initialData, form, open, defaultEndereco]);

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
    form.trigger('nomeFantasia');
    form.trigger('razaoSocial');
  }, [selectedType, form]);

  function onSubmit(data: CompanyFormValues) {
    const dataToSave: CompanyFormValues = {
      ...data,
      nomeFantasia: data.type === 'juridica' ? data.nomeFantasia! : (data.nomeFantasia || data.razaoSocial),
      cnpj: data.type === 'juridica' ? data.cnpj : undefined,
      cpf: data.type === 'fisica' ? data.cpf : undefined,
      inscricaoEstadual: data.situacaoIcms === 'contribuinte' ? data.inscricaoEstadual : undefined,
    };
    onSubmitAction(dataToSave, initialData?.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Empresa Cliente' : 'Adicionar Nova Empresa Cliente'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Modifique os dados da empresa abaixo.' : 'Preencha os dados para cadastrar uma nova empresa cliente.'}
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
                    <Input placeholder="Ex: Loja Exemplo ou Apelido" {...field} value={field.value || ''} />
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
                    <Select onValueChange={(value) => field.onChange(value as SituacaoICMSEmpresa)} value={field.value}>
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
                  <FormLabel>Nome do responsável/contato *</FormLabel>
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
                  <FormLabel>E-mail de faturamento/contato *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contato@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Telefone de Contato (opcional)</FormLabel>
                    <FormControl>
                        <Input placeholder="(XX) XXXXX-XXXX" {...field} value={field.value || ''} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <Input placeholder="Apto, Bloco, Sala" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status da Licença da Empresa *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status da licença" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="inactive">Inativa</SelectItem>
                      <SelectItem value="pending_payment">Pagamento Pendente</SelectItem>
                      <SelectItem value="trial">Período de Teste</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? "Salvando..." : (initialData ? "Salvar alterações" : "Adicionar Empresa")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

