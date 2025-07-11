
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MapPin, PlusCircle, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { useLocations, type Location } from '@/contexts/LocationContext';
import { useAssets } from '@/contexts/AssetContext'; // Importar useAssets
import { LocationFormDialog } from '@/components/locations/LocationFormDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/hooks/use-toast';

export default function ManageLocationsPage() {
  const { locations, deleteLocation: deleteLocationFromContext } = useLocations();
  const { assets } = useAssets(); // Obter lista de ativos
  const { toast } = useToast();

  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const handleOpenLocationDialog = (location: Location | null = null) => {
    setEditingLocation(location);
    setIsLocationDialogOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setItemToDeleteId(id);
    setIsConfirmDeleteDialogOpen(true);
  };

  const isLocationInUse = (locationIdToCheck: string): boolean => {
    return assets.some(asset => asset.locationId === locationIdToCheck);
  };

  const confirmDelete = () => {
    if (!itemToDeleteId) return;

    if (isLocationInUse(itemToDeleteId)) {
      const locationDetails = locations.find(l => l.id === itemToDeleteId);
      const locationName = locationDetails?.name || "Este local";
      toast({
        title: "Exclusão não permitida",
        description: `O local "${locationName}" está vinculado a um ou mais ativos e não pode ser excluído.`,
        variant: "destructive",
      });
    } else {
      deleteLocationFromContext(itemToDeleteId);
      toast({ title: "Sucesso!", description: "Local excluído." });
    }
    setItemToDeleteId(null);
    setIsConfirmDeleteDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gerenciar locais dos ativos</h1>
        <p className="text-muted-foreground">Defina os locais onde os ativos podem ser alocados.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-xl">
              <MapPin className="mr-2 h-5 w-5" />
              Lista de locais
            </CardTitle>
            <CardDescription>
              Locais cadastrados no sistema.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenLocationDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar local
          </Button>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum local cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do local</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>{location.name}</TableCell>
                    <TableCell>{location.address || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenLocationDialog(location)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteRequest(location.id)}
                            className="text-red-600 hover:!text-red-600 focus:text-red-600 focus:!bg-red-100 dark:focus:!bg-red-700/50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isLocationDialogOpen && (
        <LocationFormDialog
          open={isLocationDialogOpen}
          onOpenChange={setIsLocationDialogOpen}
          initialData={editingLocation}
        />
      )}

      <ConfirmationDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Confirmar exclusão de local"
        description="Tem certeza que deseja excluir o local selecionado? Esta ação não pode ser desfeita."
      />
    </div>
  );
}

