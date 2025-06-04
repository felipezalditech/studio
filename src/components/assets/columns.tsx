
"use client";

import type { ColumnDef, HeaderContext } from "@tanstack/react-table";
import type { AssetWithCalculatedValues } from "@/app/assets/page";
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
import { parseISO, format as formatDateFn } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (amount: number) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(0);
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

export const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return formatDateFn(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    return dateString;
  }
};

const SortableHeader = <TData, TValue>({ column, title }: { column: HeaderContext<TData, TValue>['column'], title: string }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="p-0 gap-1 h-auto focus-visible:ring-inset hover:bg-transparent"
    >
      {title}
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  );
};

export const getColumns = (
  onViewDetails: (asset: AssetWithCalculatedValues) => void,
  onDeleteAssetRequest: (asset: AssetWithCalculatedValues) => void,
  onEditAsset: (asset: AssetWithCalculatedValues) => void
): ColumnDef<AssetWithCalculatedValues>[] => [
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
    header: ({ column }) => <SortableHeader column={column} title="Data compra" />,
    cell: ({ row }) => formatDate(row.getValue("purchaseDate")),
  },
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="Nome do ativo" />,
  },
  {
    accessorKey: "modelName", // Changed from model to modelName
    header: ({ column }) => <SortableHeader column={column} title="Modelo" />,
    cell: ({ row }) => row.original.modelName || "N/A",
  },
  {
    accessorKey: "assetTag",
    header: ({ column }) => <SortableHeader column={column} title="Patrimônio" />,
  },
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => <SortableHeader column={column} title="Nota fiscal" />,
  },
  {
    accessorKey: "serialNumber",
    header: ({ column }) => <SortableHeader column={column} title="Nº de série" />,
    cell: ({ row }) => row.getValue("serialNumber") || "N/A",
  },
  {
    accessorKey: "categoryName",
    header: ({ column }) => <SortableHeader column={column} title="Categoria" />,
    cell: ({ row }) => {
      return row.original.categoryName || "Desconhecida";
    },
  },
  {
    accessorKey: "supplierName",
    header: ({ column }) => <SortableHeader column={column} title="Fornecedor" />,
    cell: ({ row }) => {
      return row.original.supplierName || "Desconhecido";
    },
  },
  {
    accessorKey: "locationName",
    header: ({ column }) => <SortableHeader column={column} title="Local alocado" />,
    cell: ({ row }) => {
      return row.original.locationName || "N/A";
    },
  },
  {
    accessorKey: "purchaseValue",
    header: ({ column }) => <SortableHeader column={column} title="Valor de compra" />,
    cell: ({ row }) => formatCurrency(row.getValue("purchaseValue")),
  },
  {
    accessorKey: "depreciatedValue",
    header: ({ column }) => <SortableHeader column={column} title="Valor depreciado" />,
    cell: ({ row }) => formatCurrency(row.original.depreciatedValue),
  },
  {
    accessorKey: "calculatedCurrentValue",
    header: ({ column }) => <SortableHeader column={column} title="Valor atual" />,
    cell: ({ row }) => formatCurrency(row.original.calculatedCurrentValue),
  },
  {
    id: "actions",
    header: () => <div className="text-right pr-0">Ações</div>,
    cell: function ActionsCell({ row }) {
      const asset = row.original;

      const handleDeleteRequest = () => {
        onDeleteAssetRequest(asset);
      };

      const handleEditRequest = () => {
        onEditAsset(asset);
      };

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
              <DropdownMenuItem onClick={() => onViewDetails(asset)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEditRequest}>
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log(`Baixar ativo: ${asset.name}`)} disabled>
                <Archive className="mr-2 h-4 w-4" />
                Baixar ativo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteRequest}
                className="text-red-600 hover:!text-red-600 focus:text-red-600 focus:!bg-red-100 dark:focus:!bg-red-700/50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar permanentemente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true, // A coluna Ações pode ser escondida, mas não a de seleção
  },
];
