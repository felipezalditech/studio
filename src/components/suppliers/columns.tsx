
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Supplier } from '@/contexts/SupplierContext';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox"; // Importar Checkbox

const getSituacaoIcmsLabel = (situacao: Supplier['situacaoIcms']) => {
  switch (situacao) {
    case 'contribuinte': return 'Contribuinte';
    case 'nao_contribuinte': return 'Não Contribuinte';
    case 'isento': return 'Isento';
    default: return 'N/A';
  }
};

const getDocument = (supplier: Supplier) => {
  if (supplier.type === 'juridica') {
    return supplier.cnpj || 'N/A';
  }
  return supplier.cpf || 'N/A';
};

export const getSupplierColumns = (
  onEdit: (supplier: Supplier) => void,
  onDelete: (supplierId: string) => void
): ColumnDef<Supplier>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todas as linhas"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Tipo
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (row.original.type === 'fisica' ? 'Física' : 'Jurídica'),
  },
  {
    accessorKey: "nomeFantasia",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nome Fantasia / Nome
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => row.original.nomeFantasia || (row.original.type === 'fisica' ? row.original.razaoSocial : 'N/A'),
  },
  {
    accessorKey: "razaoSocial",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Razão Social / Nome Completo
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "document",
    header: "CNPJ/CPF",
    cell: ({ row }) => getDocument(row.original),
  },
  {
    accessorKey: "situacaoIcms",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Situação ICMS
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => getSituacaoIcmsLabel(row.original.situacaoIcms),
  },
  {
    accessorKey: "inscricaoEstadual",
    header: "Inscrição Estadual",
    cell: ({ row }) => row.original.inscricaoEstadual || 'N/A',
  },
  {
    accessorKey: "responsavelNome",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Responsável
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "emailFaturamento",
    header: "E-mail Faturamento",
  },
  {
    accessorKey: "endereco",
    header: "Endereço",
    cell: ({ row }) => {
      const { endereco } = row.original;
      return `${endereco.rua}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade}/${endereco.estado}, CEP: ${endereco.cep}`;
    },
    enableSorting: false,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(supplier)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(supplier.id)}
                className="text-red-600 hover:!text-red-600 focus:text-red-600 focus:!bg-red-100 dark:focus:!bg-red-700/50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true, // Coluna de ações pode ser escondida
  },
];
