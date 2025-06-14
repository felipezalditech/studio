
"use client";

import React, { useState, useMemo } from 'react';
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PlusCircle, ChevronDown, Edit2, Trash2, MoreHorizontal } from 'lucide-react'; // Import MoreHorizontal
import { useSuppliers, type Supplier } from '@/contexts/SupplierContext';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/hooks/use-toast';
import { getSupplierColumns } from '@/components/suppliers/columns'; // Importar a definição das colunas
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function SuppliersPage() {
  const { suppliers, deleteSupplier } = useSuppliers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [supplierToDeleteId, setSupplierToDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

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

  const columns = useMemo(
    () => getSupplierColumns(handleOpenDialog, handleDeleteSupplierRequest),
    [] // Dependencies: handleOpenDialog and handleDeleteSupplierRequest might change if they depend on state/props from this component
  );

  const table = useReactTable({
    data: suppliers,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const getColumnDisplayName = (columnId: string): string => {
    const nameMap: Record<string, string> = {
      type: "Tipo",
      nomeFantasia: "Nome Fantasia / Nome",
      razaoSocial: "Razão Social / Nome Completo",
      document: "CNPJ/CPF",
      situacaoIcms: "Situação ICMS",
      inscricaoEstadual: "Inscrição Estadual",
      responsavelNome: "Responsável",
      emailFaturamento: "E-mail Faturamento",
      endereco: "Endereço",
      actions: "Ações",
    };
    return nameMap[columnId] || columnId;
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
          <div className="flex items-center justify-between pt-4">
            <Input
              placeholder="Buscar em todos os campos..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Colunas <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {getColumnDisplayName(column.id)}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum fornecedor cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} className="whitespace-nowrap">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        Nenhum resultado encontrado para a busca.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
           <div className="flex items-center justify-between space-x-2 p-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-muted-foreground">Linhas por página:</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 50, 100].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Página {table.getState().pagination.pageIndex + 1} de{" "}
                    {table.getPageCount()}
                  </span>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Anterior
                  </Button>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Próximo
                  </Button>
              </div>
            </div>
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
