"use client";

import type { ColumnDef, HeaderContext } from "@tanstack/react-table";
import type { Asset } from "./types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { parseISO, format } from 'date-fns';

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return format(date, 'PPP'); // e.g. Jan 15th, 2023
  } catch (error) {
    // console.error('Error formatting date:', dateString, error); // You can uncomment this for debugging
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
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "purchaseDate",
    header: ({ column }) => <SortableHeader column={column} title="Purchase Date" />,
    cell: ({ row }) => formatDate(row.getValue("purchaseDate")),
  },
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
  },
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => <SortableHeader column={column} title="Invoice #" />,
  },
  {
    accessorKey: "serialNumber",
    header: ({ column }) => <SortableHeader column={column} title="Serial #" />,
  },
  {
    accessorKey: "assetTag",
    header: ({ column }) => <SortableHeader column={column} title="Asset Tag" />,
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => <SortableHeader column={column} title="Supplier" />,
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader column={column} title="Category" />,
  },
  {
    accessorKey: "purchaseValue",
    header: ({ column }) => <SortableHeader column={column} title="Purchase Value" />,
    cell: ({ row }) => formatCurrency(row.getValue("purchaseValue")),
  },
  {
    accessorKey: "currentValue",
    header: ({ column }) => <SortableHeader column={column} title="Current Value" />,
    cell: ({ row }) => formatCurrency(row.getValue("currentValue")),
  },
];
