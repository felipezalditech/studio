
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
import { useAssetModels, type AssetModel } from "@/contexts/AssetModelContext";
import { AssetModelFormDialog } from "./AssetModelFormDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AssetModelComboboxProps {
  value: string | undefined; // Stores modelId
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  disableQuickAdd?: boolean; // Nova propriedade
}

export function AssetModelCombobox({ value, onChange, disabled, disableQuickAdd = false }: AssetModelComboboxProps) {
  const { assetModels, getAssetModelById } = useAssetModels();
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [isAssetModelDialogOpen, setIsAssetModelDialogOpen] = React.useState(false);
  const [modelNameToCreate, setModelNameToCreate] = React.useState("");

  const selectedModel = value ? getAssetModelById(value) : null;

  const filteredModels = React.useMemo(() => {
    if (!inputValue) {
      return assetModels;
    }
    const lowerInputValue = inputValue.toLowerCase();
    return assetModels.filter((model) =>
      model.name.toLowerCase().includes(lowerInputValue) ||
      (model.brand && model.brand.toLowerCase().includes(lowerInputValue))
    );
  }, [assetModels, inputValue]);

  const handleSelectModel = (modelId: string | undefined) => {
    onChange(modelId);
    setOpen(false);
    setInputValue("");
  };

  const handleOpenNewModelDialog = () => {
    if (disableQuickAdd) return;
    setModelNameToCreate(inputValue);
    setIsAssetModelDialogOpen(true);
    setOpen(false);
  };

  const handleModelAdded = (newModelId: string) => {
    onChange(newModelId); // Select the newly added model
    setIsAssetModelDialogOpen(false);
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
            {selectedModel
              ? `${selectedModel.name} ${selectedModel.brand ? `(${selectedModel.brand})` : ''}`
              : "Selecione um modelo"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}> {/* We handle filtering manually */}
            <CommandInput
              placeholder="Buscar modelo..."
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
                  onClick={inputValue && !disableQuickAdd ? handleOpenNewModelDialog : undefined}
                >
                  {inputValue
                    ? (disableQuickAdd ? `Nenhum modelo encontrado com "${inputValue}".` : `Nenhum modelo encontrado. Cadastrar "${inputValue}"?`)
                    : "Nenhum modelo encontrado."}
                </CommandEmpty>
                <CommandGroup>
                   <CommandItem
                    key="__NO_MODEL__"
                    value=""
                    onSelect={() => {
                      handleSelectModel(undefined);
                    }}
                    className="flex justify-between items-center"
                  >
                    Nenhum modelo (opcional)
                    <Check
                      className={cn(
                        "h-4 w-4",
                        !value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                  {filteredModels.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.id} // Store model.id as the value
                      onSelect={() => {
                        handleSelectModel(model.id);
                      }}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{model.name}</span>
                        {model.brand && <span className="text-xs text-muted-foreground ml-2">({model.brand})</span>}
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === model.id ? "opacity-100" : "opacity-0"
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
                        onSelect={handleOpenNewModelDialog}
                        value={`__add__${inputValue}`}
                        className="text-primary hover:!bg-primary/10 cursor-pointer"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Cadastrar "{inputValue}" como novo modelo
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isAssetModelDialogOpen && !disableQuickAdd && (
        <AssetModelFormDialog
          open={isAssetModelDialogOpen}
          onOpenChange={setIsAssetModelDialogOpen}
          initialData={modelNameToCreate ? { name: modelNameToCreate } : null}
          onModelAdded={handleModelAdded}
        />
      )}
    </>
  );
}
