
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, Edit2, Trash2, MoreHorizontal, Search, Building2 } from 'lucide-react';
import type { ClientCompany } from '@/types/admin'; // Supondo que você tenha este tipo definido
import { Input } from '@/components/ui/input';
// import { CompanyFormDialog } from '@/components/admin/companies/CompanyFormDialog'; // Será criado depois
// import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'; // Já existe
import { useToast } from '@/hooks/use-toast';

// Mock data inicial - em um sistema real, isso viria de um backend/localStorage persistente
const initialCompanies: ClientCompany[] = [
  // { id: 'comp-001', name: 'Empresa Alpha LTDA', cnpj: '11.222.333/0001-44', contactName: 'Carlos Silva', contactEmail: 'carlos@alpha.com', contactPhone: '(11) 99999-0001', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // { id: 'comp-002', name: 'Soluções Beta S/A', cnpj: '44.555.666/0001-77', contactName: 'Ana Costa', contactEmail: 'ana@beta.com', contactPhone: '(21) 88888-0002', status: 'pending_payment', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
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
    // setIsFormDialogOpen(true); // Habilitar quando o CompanyFormDialog for criado
    alert(`Funcionalidade "Adicionar/Editar Empresa" (ID: ${company?.id || 'Novo'}) a ser implementada.`);
  };

  const handleDeleteRequest = (company: ClientCompany) => {
    setCompanyToDelete(company);
    // setIsConfirmDeleteDialogOpen(true); // Habilitar quando a lógica de deleção for implementada
    alert(`Funcionalidade "Excluir Empresa" (ID: ${company.id}) a ser implementada.`);
  };

  const confirmDelete = () => {
    if (!companyToDelete) return;
    // Lógica para deletar a empresa
    // setCompanies(prev => prev.filter(c => c.id !== companyToDelete.id));
    toast({ title: "Sucesso!", description: `Empresa "${companyToDelete.name}" excluída.` });
    setCompanyToDelete(null);
    setIsConfirmDeleteDialogOpen(false);
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.cnpj && company.cnpj.includes(searchTerm)) ||
    company.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusLabel = (status: ClientCompany['status']) => {
    const map = {
      active: 'Ativa',
      inactive: 'Inativa',
      pending_payment: 'Pag. Pendente',
      trial: 'Teste',
    };
    return map[status] || status;
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
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-10">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">Nenhuma empresa encontrada</p>
              <p className="text-muted-foreground">
                {searchTerm ? `Nenhuma empresa corresponde à sua busca "${searchTerm}".` : "Cadastre a primeira empresa cliente para começar."}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenFormDialog()} className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Empresa
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Nome da Empresa</TableHead>
                    <TableHead className="min-w-[150px]">CNPJ</TableHead>
                    <TableHead className="min-w-[180px]">Email de Contato</TableHead>
                    <TableHead className="min-w-[120px]">Telefone</TableHead>
                    <TableHead className="min-w-[100px]">Status Licença</TableHead>
                    <TableHead className="text-right w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.cnpj || 'N/A'}</TableCell>
                      <TableCell>{company.contactEmail}</TableCell>
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
                            <DropdownMenuItem onClick={() => alert(`Visualizar licenças de ${company.name}`)}>
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

      {/* 
      {isFormDialogOpen && (
        <CompanyFormDialog
          open={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          initialData={editingCompany}
          // onSubmitAction={handleSubmitCompany} // Será implementada
        />
      )}

      {companyToDelete && (
        <ConfirmationDialog
          open={isConfirmDeleteDialogOpen}
          onOpenChange={setIsConfirmDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Confirmar exclusão de empresa"
          description={`Tem certeza que deseja excluir a empresa "${companyToDelete.name}"? Esta ação não pode ser desfeita e removerá todas as licenças associadas.`}
        />
      )}
      */}
    </div>
  );
}
