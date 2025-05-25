
"use client";

import type { ColumnDef, HeaderContext } from "@tanstack/react-table";
import type { Asset } from "./types";
import type { Supplier } from "@/contexts/SupplierContext";
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
import { useAssets } from "@/contexts/AssetContext";
import { useToast } from "@/hooks/use-toast";

// Helper function to format currency - Exportada
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

// Helper function to format date - Exportada
export const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return formatDateFn(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", dateString, error);
    return dateString; 
  }
};

// Reusable header component for sorting
const SortableHeader = <TData, TValue>({ column, title }: { column: HeaderContext<TData, TValue>['column'], title: string }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="p-0 gap-1 h-auto focus-visible:ring-inset hover:bg-transparent" // Removido -ml-4
    >
      {title}
      <ArrowUpDown className="h-3 w-3" /> {/* Ícone menor */}
    </Button>
  );
};

export const getColumns = (
  supplierNameMap: Map<string, string>,
  getSupplierById: (id: string) => Supplier | undefined,
  onViewDetails: (asset: Asset) => void // Callback para visualizar detalhes
): ColumnDef<Asset>[] => [
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
    header: ({ column }) => <SortableHeader column={column} title="Data Compra" />,
    cell: ({ row }) => formatDate(row.getValue("purchaseDate")),
  },
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="Nome do Ativo" />,
  },
  {
    accessorKey: "assetTag", 
    header: ({ column }) => <SortableHeader column={column} title="Patrimônio" />,
  },
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => <SortableHeader column={column} title="Nota Fiscal" />,
  },
  {
    accessorKey: "serialNumber",
    header: ({ column }) => <SortableHeader column={column} title="Nº de Série" />,
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader column={column} title="Categoria" />,
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => <SortableHeader column={column} title="Fornecedor" />,
    cell: ({ row }) => {
      const supplierId = row.getValue("supplier") as string;
      return supplierNameMap.get(supplierId) || supplierId || "Desconhecido";
    },
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
    header: () => <div className="text-right pr-0">Ações</div>, // Removido pr-2
    cell: function ActionsCell({ row }) {
      const asset = row.original;
      const { deleteAsset } = useAssets();
      const { toast } = useToast();

      const handleDelete = () => {
        if (confirm(`Tem certeza que deseja deletar permanentemente o ativo: ${asset.name}?`)) {
          deleteAsset(asset.id);
          toast({
            title: "Sucesso!",
            description: `Ativo "${asset.name}" deletado.`,
          });
        }
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
                onClick={handleDelete}
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
