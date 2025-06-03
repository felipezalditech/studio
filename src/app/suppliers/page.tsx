
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { useSuppliers, type Supplier } from '@/contexts/SupplierContext';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/hooks/use-toast';

export default function SuppliersPage() {
  const { suppliers, deleteSupplier } = useSuppliers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [supplierToDeleteId, setSupplierToDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
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

  const getDocument = (supplier: Supplier) => {
    if (supplier.type === 'juridica') {
      return supplier.cnpj || 'N/A';
    }
    return supplier.cpf || 'N/A';
  };

  const getSupplierTypeLabel = (type: 'fisica' | 'juridica') => {
    return type === 'fisica' ? 'Física' : 'Jurídica';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar fornecedores</h1>
          <p className="text-muted-foreground">Adicione, edite ou remova fornecedores.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar fornecedor
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de fornecedores</CardTitle>
          <CardDescription>Fornecedores cadastrados no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum fornecedor cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome fantasia</TableHead>
                  <TableHead>Razão social / Nome completo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{supplier.nomeFantasia || (supplier.type === 'fisica' ? 'N/A' : supplier.razaoSocial)}</TableCell>
                    <TableCell>{supplier.razaoSocial}</TableCell>
                    <TableCell>{getSupplierTypeLabel(supplier.type)}</TableCell>
                    <TableCell>{getDocument(supplier)}</TableCell>
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
                            onClick={() => handleDeleteSupplierRequest(supplier.id)}
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
          initialData={editingSupplier}
        />
      )}

      <ConfirmationDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={confirmDeleteSupplier}
        title="Confirmar exclusão de fornecedor"
        description={`Tem certeza que deseja excluir o fornecedor "${suppliers.find(s => s.id === supplierToDeleteId)?.nomeFantasia || suppliers.find(s => s.id === supplierToDeleteId)?.razaoSocial || ''}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
