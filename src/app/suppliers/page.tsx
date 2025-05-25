
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { useSuppliers, type Supplier } from '@/contexts/SupplierContext';
import { SupplierFormDialog, type SupplierFormValues } from '@/components/suppliers/SupplierFormDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'; // Importado
import { useToast } from '@/hooks/use-toast';

export default function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false); // Estado para o diálogo de confirmação
  const [supplierToDeleteId, setSupplierToDeleteId] = useState<string | null>(null); // Estado para o ID do fornecedor a ser excluído
  const { toast } = useToast();

  const handleOpenDialog = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleSubmitSupplier = (data: SupplierFormValues) => {
    if (editingSupplier) {
      updateSupplier({ ...editingSupplier, ...data });
      toast({ title: "Sucesso!", description: "Fornecedor atualizado." });
    } else {
      addSupplier(data);
      toast({ title: "Sucesso!", description: "Fornecedor adicionado." });
    }
    setIsDialogOpen(false);
  };

  const handleDeleteSupplierRequest = (supplierId: string) => {
    setSupplierToDeleteId(supplierId);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteSupplier = () => {
    if (supplierToDeleteId) {
      deleteSupplier(supplierToDeleteId);
      toast({ title: "Sucesso!", description: "Fornecedor excluído." });
      setSupplierToDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Fornecedores</h1>
          <p className="text-muted-foreground">Adicione, edite ou remova fornecedores.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Fornecedor
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
          <CardDescription>Fornecedores cadastrados no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum fornecedor cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{supplier.nomeFantasia}</TableCell>
                    <TableCell>{supplier.razaoSocial}</TableCell>
                    <TableCell>{supplier.cnpj}</TableCell>
                    <TableCell>{supplier.contato}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(supplier)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteSupplierRequest(supplier.id)} // Alterado
                            className="text-red-600 hover:!text-red-600 focus:text-red-600 focus:!bg-red-100 dark:focus:!bg-red-700/50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isDialogOpen && (
        <SupplierFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmitAction={handleSubmitSupplier}
          initialData={editingSupplier}
        />
      )}

      <ConfirmationDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={confirmDeleteSupplier}
        title="Confirmar Exclusão de Fornecedor"
        description={`Tem certeza que deseja excluir o fornecedor "${suppliers.find(s => s.id === supplierToDeleteId)?.nomeFantasia || ''}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
