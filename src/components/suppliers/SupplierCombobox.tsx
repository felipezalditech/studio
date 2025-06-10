
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSuppliers, type Supplier } from "@/contexts/SupplierContext";
import { SupplierFormDialog } from "./SupplierFormDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SupplierComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  disableQuickAdd?: boolean; // Nova propriedade
}

export function SupplierCombobox({ value, onChange, disabled, disableQuickAdd = false }: SupplierComboboxProps) {
  const { suppliers, getSupplierById } = useSuppliers();
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = React.useState(false);
  const [supplierNameToCreate, setSupplierNameToCreate] = React.useState("");

  const selectedSupplier = value ? getSupplierById(value) : null;

  const filteredSuppliers = React.useMemo(() => {
    if (!inputValue) {
      return suppliers;
    }
    const lowerInputValue = inputValue.toLowerCase();
    return suppliers.filter((supplier) =>
      (supplier.nomeFantasia && supplier.nomeFantasia.toLowerCase().includes(lowerInputValue)) ||
      (supplier.razaoSocial && supplier.razaoSocial.toLowerCase().includes(lowerInputValue)) ||
      (supplier.cnpj && supplier.cnpj.includes(inputValue)) ||
      (supplier.cpf && supplier.cpf.includes(inputValue))
    );
  }, [suppliers, inputValue]);

  const handleSelectSupplier = (supplierId: string) => {
    onChange(supplierId);
    setOpen(false);
    setInputValue("");
  };

  const handleOpenNewSupplierDialog = () => {
    if (disableQuickAdd) return;
    setSupplierNameToCreate(inputValue);
    setIsSupplierDialogOpen(true);
    setOpen(false);
  };

  const handleSupplierAdded = (newSupplierId: string) => {
    onChange(newSupplierId);
    setIsSupplierDialogOpen(false);
    setInputValue("");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", !value && "text-muted-foreground")}
            disabled={disabled}
          >
            {selectedSupplier
              ? `${selectedSupplier.nomeFantasia || selectedSupplier.razaoSocial} (${selectedSupplier.type === 'juridica' ? selectedSupplier.cnpj?.substring(0,10) : selectedSupplier.cpf?.substring(0,9)}...)`
              : "Todos os fornecedores"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar fornecedor..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <ScrollArea className="h-auto max-h-60">
                <CommandEmpty
                  className={cn(
                    "py-6 text-center text-sm",
                    inputValue && !disableQuickAdd && "cursor-pointer hover:bg-accent"
                  )}
                  onClick={inputValue && !disableQuickAdd ? handleOpenNewSupplierDialog : undefined}
                >
                  {inputValue
                    ? (disableQuickAdd ? `Nenhum fornecedor encontrado com "${inputValue}".` : `Nenhum fornecedor encontrado. Cadastrar "${inputValue}"?`)
                    : "Nenhum fornecedor encontrado."}
                </CommandEmpty>
                <CommandGroup>
                   <CommandItem
                      key="__ALL_SUPPLIERS__"
                      value=""
                      onSelect={() => {
                        handleSelectSupplier(""); // Use an empty string or a specific sentinel value
                      }}
                      className="flex justify-between items-center"
                    >
                      Todos os fornecedores
                      <Check
                        className={cn(
                          "h-4 w-4",
                          !value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  {filteredSuppliers.map((supplier) => (
                    <CommandItem
                      key={supplier.id}
                      value={supplier.id}
                      onSelect={() => {
                        handleSelectSupplier(supplier.id);
                      }}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{supplier.nomeFantasia || supplier.razaoSocial}</span>
                        <span className="text-xs text-muted-foreground ml-2">({supplier.type === 'juridica' ? supplier.cnpj : supplier.cpf})</span>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === supplier.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
                {inputValue && !disableQuickAdd && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleOpenNewSupplierDialog}
                        value={`__add__${inputValue}`}
                        className="text-primary hover:!bg-primary/10 cursor-pointer"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Cadastrar "{inputValue}" como novo fornecedor
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isSupplierDialogOpen && !disableQuickAdd && (
        <SupplierFormDialog
          open={isSupplierDialogOpen}
          onOpenChange={setIsSupplierDialogOpen}
          initialData={supplierNameToCreate ? { nomeFantasia: supplierNameToCreate } as Partial<Supplier> : null}
          onSupplierAdded={handleSupplierAdded}
        />
      )}
    </>
  );
}
