
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
import { useLocations, type Location } from "@/contexts/LocationContext";
import { LocationFormDialog } from "./LocationFormDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LocationComboboxProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

export function LocationCombobox({ value, onChange, disabled }: LocationComboboxProps) {
  const { locations, getLocationById } = useLocations();
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [isLocationDialogOpen, setIsLocationDialogOpen] = React.useState(false);
  const [locationNameToCreate, setLocationNameToCreate] = React.useState("");

  const selectedLocation = value ? getLocationById(value) : null;

  const filteredLocations = React.useMemo(() => {
    if (!inputValue) {
      return locations;
    }
    return locations.filter((location) =>
      location.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      (location.address && location.address.toLowerCase().includes(inputValue.toLowerCase()))
    );
  }, [locations, inputValue]);

  const handleSelectLocation = (locationId: string | undefined) => {
    onChange(locationId);
    setOpen(false);
    setInputValue("");
  };

  const handleOpenNewLocationDialog = () => {
    setLocationNameToCreate(inputValue);
    setIsLocationDialogOpen(true);
    setOpen(false);
  };

  const handleLocationAdded = (newLocationId: string) => {
    onChange(newLocationId);
    setIsLocationDialogOpen(false);
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
            {selectedLocation
              ? selectedLocation.name
              : "Selecione um local"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar local..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <ScrollArea className="h-auto max-h-60">
                <CommandEmpty
                  className={cn(
                    "py-6 text-center text-sm",
                    inputValue && "cursor-pointer hover:bg-accent"
                  )}
                  onClick={inputValue ? handleOpenNewLocationDialog : undefined}
                >
                  {inputValue
                    ? `Nenhum local encontrado. Cadastrar "${inputValue}"?`
                    : "Nenhum local encontrado."}
                </CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    key="__NO_LOCATION__"
                    value=""
                    onSelect={() => {
                      handleSelectLocation(undefined);
                    }}
                    className="flex justify-between items-center"
                  >
                    Nenhum local selecionado
                    <Check
                      className={cn(
                        "h-4 w-4",
                        !value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                  {filteredLocations.map((location) => (
                    <CommandItem
                      key={location.id}
                      value={location.id}
                      onSelect={() => {
                        handleSelectLocation(location.id);
                      }}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{location.name}</span>
                        {location.address && <span className="text-xs text-muted-foreground ml-2">({location.address.substring(0,20)}{location.address.length > 20 ? '...' : ''})</span>}
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === location.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
                {inputValue && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleOpenNewLocationDialog}
                        value={`__add__${inputValue}`}
                        className="text-primary hover:!bg-primary/10 cursor-pointer"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Cadastrar "{inputValue}" como novo local
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isLocationDialogOpen && (
        <LocationFormDialog
          open={isLocationDialogOpen}
          onOpenChange={setIsLocationDialogOpen}
          initialData={locationNameToCreate ? { name: locationNameToCreate } : null}
          onLocationAdded={handleLocationAdded}
        />
      )}
    </>
  );
}
