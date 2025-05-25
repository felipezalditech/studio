
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
import { parseISO, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    // Updated date format to dd/MM/yyyy
    return format(date, 'dd/MM/yyyy', { locale: ptBR }); 
  } catch (error) {
    if (dateString && typeof dateString === 'string') {
        // Attempt to handle if dateString is already in dd/MM/yyyy or similar
        const parts = dateString.split(/[-/]/);
        if (parts.length === 3) {
            // Assuming dd/MM/yyyy or yyyy/MM/dd or MM/dd/yyyy
            // For simplicity, if it's already somewhat formatted, return as is or a specific known input format
            // This fallback might need refinement based on actual invalid date strings received
            if (parts[0].length === 4) { // yyyy-MM-dd
                return format(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])), 'dd/MM/yyyy', { locale: ptBR });
            } else if (parts[2].length === 4) { // dd-MM-yyyy or MM-dd-yyyy
                 // Check if parts[0] is month or day based on value
                const d = parseInt(parts[0]);
                const m = parseInt(parts[1]);
                if (m > 0 && m <=12) { // Likely dd/MM/yyyy
                    return format(new Date(parseInt(parts[2]), m - 1, d), 'dd/MM/yyyy', { locale: ptBR });
                }
                // Could be MM/dd/yyyy - this part can get complex without knowing exact formats
            }
        }
    }
    return dateString; // Fallback if date is invalid or not in expected ISO format
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
    header: ({ column }) => <SortableHeader column={column} title="Nome do Ativo" />, // Traduzido
  },
  {
    accessorKey: "assetTag", // "Patrimônio"
    header: ({ column }) => <SortableHeader column={column} title="Patrimônio" />, // Traduzido
  },
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => <SortableHeader column={column} title="Nota Fiscal" />, // Traduzido
  },
  {
    accessorKey: "serialNumber",
    header: ({ column }) => <SortableHeader column={column} title="Nº de Série" />, // Traduzido
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader column={column} title="Categoria" />,
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => <SortableHeader column={column} title="Fornecedor" />,
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
    header: () => <div className="text-right pr-4">Ações</div>, // Adicionado padding para alinhar com botão
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
              <DropdownMenuItem onClick={() => console.log(`Visualizar detalhes do ativo: ${asset.name}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log(`Editar ativo: ${asset.name}`)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log(`Baixar ativo: ${asset.name}`)}>
                <Archive className="mr-2 h-4 w-4" />
                Baixar Ativo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (confirm(`Tem certeza que deseja deletar permanentemente o ativo: ${asset.name}?`)) {
                    console.log(`Ativo ${asset.name} deletado.`);
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
    enableHiding: true,
  },
];
