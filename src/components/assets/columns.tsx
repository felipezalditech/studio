
"use client";

import type { ColumnDef, HeaderContext } from "@tanstack/react-table";
import type { Asset } from "./types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Eye, Edit2, Archive, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return format(date, 'PPP', { locale: ptBR }); // e.g. 15 de jan. de 2023
  } catch (error) {
    return dateString; // Fallback if date is invalid
  }
};

// Reusable header component for sorting
const SortableHeader = <TData, TValue>({ column, title }: { column: HeaderContext<TData, TValue>['column'], title: string }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-4"
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};


export const columns: ColumnDef<Asset>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar tudo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "purchaseDate",
    header: ({ column }) => <SortableHeader column={column} title="Data da Compra" />,
    cell: ({ row }) => formatDate(row.getValue("purchaseDate")),
  },
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="Nome" />,
  },
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => <SortableHeader column={column} title="Nº Fatura" />,
  },
  {
    accessorKey: "serialNumber",
    header: ({ column }) => <SortableHeader column={column} title="Nº Série" />,
  },
  {
    accessorKey: "assetTag",
    header: ({ column }) => <SortableHeader column={column} title="Etiqueta do Ativo" />,
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => <SortableHeader column={column} title="Fornecedor" />,
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader column={column} title="Categoria" />,
  },
  {
    accessorKey: "purchaseValue",
    header: ({ column }) => <SortableHeader column={column} title="Valor de Compra" />,
    cell: ({ row }) => formatCurrency(row.getValue("purchaseValue")),
  },
  {
    accessorKey: "currentValue",
    header: ({ column }) => <SortableHeader column={column} title="Valor Atual" />,
    cell: ({ row }) => formatCurrency(row.getValue("currentValue")),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => {
      const asset = row.original;
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
              <DropdownMenuItem onClick={() => alert(`Visualizar detalhes do ativo: ${asset.name}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert(`Editar ativo: ${asset.name}`)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert(`Baixar ativo: ${asset.name}`)}>
                <Archive className="mr-2 h-4 w-4" />
                Baixar Ativo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (confirm(`Tem certeza que deseja deletar permanentemente o ativo: ${asset.name}?`)) {
                    alert(`Ativo ${asset.name} deletado.`);
                  }
                }}
                className="text-red-600 hover:!text-red-600 focus:text-red-600 focus:!bg-red-100 dark:focus:!bg-red-700/50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar Permanentemente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true, // Permitir ocultar esta coluna se desejado
  },
];

