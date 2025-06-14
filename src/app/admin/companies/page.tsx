
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, Edit2, Trash2, MoreHorizontal, Search, Building2 } from 'lucide-react';
import type { ClientCompany, EnderecoEmpresa, SituacaoICMSEmpresa } from '@/types/admin'; 
import { Input } from '@/components/ui/input';
import { CompanyFormDialog } from '@/components/admin/companies/CompanyFormDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/hooks/use-toast';

const now = new Date().toISOString();
const defaultAddress: EnderecoEmpresa = { cep: '00000-000', estado: 'SP', cidade: 'São Paulo', bairro: 'Centro', rua: 'Rua Padrão', numero: '123', complemento: ''};

const initialCompanies: ClientCompany[] = [
  { 
    id: 'comp-001', 
    type: 'juridica',
    razaoSocial: 'Empresa Alpha Soluções Tecnológicas LTDA',
    nomeFantasia: 'AlphaTec', 
    cnpj: '11.222.333/0001-44', 
    situacaoIcms: 'contribuinte',
    inscricaoEstadual: '123.456.789.112',
    responsavelNome: 'Carlos Silva', 
    emailFaturamento: 'faturamento@alphatec.com', 
    contactPhone: '(11) 99999-0001', 
    endereco: {...defaultAddress, rua: 'Rua da AlphaTec', cep: '11111-111'},
    status: 'active', 
    createdAt: now, 
    updatedAt: now 
  },
  { 
    id: 'comp-002', 
    type: 'juridica',
    razaoSocial: 'Beta Consultoria e Serviços S/A',
    nomeFantasia: 'BetaConsult', 
    cnpj: '44.555.666/0001-77', 
    situacaoIcms: 'isento',
    responsavelNome: 'Ana Costa', 
    emailFaturamento: 'financeiro@betaconsult.com.br', 
    contactPhone: '(21) 88888-0002', 
    endereco: {...defaultAddress, cidade: 'Rio de Janeiro', estado: 'RJ', rua: 'Av. BetaConsult', cep: '22222-222'},
    status: 'pending_payment', 
    createdAt: now, 
    updatedAt: now 
  },
  { 
    id: 'comp-003', 
    type: 'fisica',
    razaoSocial: 'Pedro Almeida Desenvolvimento Individual',
    nomeFantasia: 'Pedro Dev', 
    cpf: '123.456.789-00',
    situacaoIcms: 'nao_contribuinte',
    responsavelNome: 'Pedro Almeida', 
    emailFaturamento: 'pedro.almeida.dev@email.com', 
    contactPhone: '(31) 77777-0003', 
    endereco: {...defaultAddress, cidade: 'Belo Horizonte', estado: 'MG', rua: 'Rua dos Códigos', cep: '33333-333'},
    status: 'trial', 
    createdAt: now, 
    updatedAt: now 
  },
];


export default function ManageCompaniesPage() {
  const [companies, setCompanies] = useState<ClientCompany[]>(initialCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ClientCompany | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<ClientCompany | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleOpenFormDialog = (company: ClientCompany | null = null) => {
    setEditingCompany(company);
    setIsFormDialogOpen(true);
  };

  const handleDeleteRequest = (company: ClientCompany) => {
    setCompanyToDelete(company);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!companyToDelete) return;
    setCompanies(prev => prev.filter(c => c.id !== companyToDelete.id));
    toast({ title: "Sucesso!", description: `Empresa "${companyToDelete.nomeFantasia || companyToDelete.razaoSocial}" excluída.` });
    setCompanyToDelete(null);
    setIsConfirmDeleteDialogOpen(false);
  };
  
  const handleSubmitCompany = (data: Omit<ClientCompany, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => {
    const nowISO = new Date().toISOString();
    if (id) { // Editing existing company
      setCompanies(prevCompanies => 
        prevCompanies.map(c => c.id === id ? { ...c, ...data, updatedAt: nowISO } : c)
      );
      toast({ title: "Sucesso!", description: "Empresa atualizada." });
    } else { // Adding new company
      const newCompany: ClientCompany = {
        id: `comp-${Date.now()}`,
        ...data,
        createdAt: nowISO,
        updatedAt: nowISO,
      };
      setCompanies(prevCompanies => [...prevCompanies, newCompany]);
      toast({ title: "Sucesso!", description: "Empresa adicionada." });
    }
    setIsFormDialogOpen(false);
    setEditingCompany(null);
  };


  const filteredCompanies = companies.filter(company => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const numbersOnlySearchTerm = searchTerm.replace(/\D/g, '');

    const nameMatch = (company.nomeFantasia || '').toLowerCase().includes(lowerSearchTerm) || 
                      (company.razaoSocial || '').toLowerCase().includes(lowerSearchTerm);
    
    const doc = company.type === 'juridica' ? company.cnpj : company.cpf;
    const docMatch = doc && numbersOnlySearchTerm.length > 0 && doc.replace(/\D/g, '').includes(numbersOnlySearchTerm);
    
    const emailMatch = (company.emailFaturamento || '').toLowerCase().includes(lowerSearchTerm);
    const responsavelMatch = (company.responsavelNome || '').toLowerCase().includes(lowerSearchTerm);
    
    if (searchTerm === "") return true;
    return nameMatch || !!docMatch || emailMatch || responsavelMatch;
  });

  const getStatusLabel = (status: ClientCompany['status']) => {
    const map = {
      active: 'Ativa',
      inactive: 'Inativa',
      pending_payment: 'Pag. Pendente',
      trial: 'Teste',
    };
    return map[status] || status;
  };

  const getDocument = (company: ClientCompany) => {
    if (company.type === 'juridica') {
      return company.cnpj || 'N/A';
    }
    return company.cpf || 'N/A';
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Empresas Clientes</h1>
          <p className="text-muted-foreground">Adicione, visualize e edite as empresas que utilizam o sistema.</p>
        </div>
        <Button onClick={() => handleOpenFormDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Empresa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
          <CardDescription>
            Empresas clientes cadastradas no sistema Zaldi Imo.
          </CardDescription>
           <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ/CPF, responsável ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length === 0 && searchTerm ? (
             <div className="text-center py-10">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">Nenhuma empresa encontrada</p>
              <p className="text-muted-foreground">
                Nenhuma empresa corresponde à sua busca "{searchTerm}".
              </p>
            </div>
          ) : filteredCompanies.length === 0 && !searchTerm ? (
             <div className="text-center py-10">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">Nenhuma empresa cadastrada</p>
              <p className="text-muted-foreground">
                Cadastre a primeira empresa cliente para começar.
              </p>
              <Button onClick={() => handleOpenFormDialog()} className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Empresa
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Nome Fantasia</TableHead>
                    <TableHead className="min-w-[180px]">Razão Social</TableHead>
                    <TableHead className="min-w-[140px]">CNPJ/CPF</TableHead>
                    <TableHead className="min-w-[180px]">Responsável</TableHead>
                    <TableHead className="min-w-[180px]">Email Faturamento</TableHead>
                     <TableHead className="min-w-[120px]">Telefone</TableHead>
                    <TableHead className="min-w-[100px]">Status Licença</TableHead>
                    <TableHead className="text-right w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.nomeFantasia || (company.type === 'fisica' ? company.razaoSocial : 'N/A')}</TableCell>
                      <TableCell>{company.razaoSocial}</TableCell>
                      <TableCell>{getDocument(company)}</TableCell>
                      <TableCell>{company.responsavelNome || 'N/A'}</TableCell>
                      <TableCell>{company.emailFaturamento}</TableCell>
                      <TableCell>{company.contactPhone || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          company.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
                          company.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                          company.status === 'trial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100' :
                          'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                        }`}>
                          {getStatusLabel(company.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => alert(`Visualizar licenças de ${company.nomeFantasia || company.razaoSocial}`)}>
                              Gerenciar Licenças
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenFormDialog(company)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Editar Empresa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteRequest(company)}
                              className="text-red-600 hover:!text-red-600 focus:text-red-600 focus:!bg-red-100 dark:focus:!bg-red-700/50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir Empresa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isFormDialogOpen && (
        <CompanyFormDialog
          open={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          onSubmitAction={handleSubmitCompany}
          initialData={editingCompany}
        />
      )}

      {companyToDelete && (
        <ConfirmationDialog
          open={isConfirmDeleteDialogOpen}
          onOpenChange={setIsConfirmDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Confirmar exclusão de empresa"
          description={`Tem certeza que deseja excluir a empresa "${companyToDelete.nomeFantasia || companyToDelete.razaoSocial}"? Esta ação não pode ser desfeita e removerá todas as licenças associadas.`}
        />
      )}
    </div>
  );
}
