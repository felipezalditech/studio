
"use client";

import React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Asset } from "./types";
import type { Supplier } from "@/contexts/SupplierContext"; // Importar Supplier
import { useAssets } from "@/contexts/AssetContext";
import { useSuppliers } from "@/contexts/SupplierContext"; // Importar useSuppliers
import { formatDate, formatCurrency } from "@/components/assets/columns"; // Importar helpers
import { Trash2, ExternalLink } from 'lucide-react'; // Mantido ExternalLink para a ação de abrir em nova aba
import { useToast } from '@/hooks/use-toast';

interface AssetDetailsDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetDetailsDialog({ asset, open, onOpenChange }: AssetDetailsDialogProps) {
  const { updateAsset } = useAssets();
  const { getSupplierById } = useSuppliers(); // Obter função para buscar fornecedor
  const { toast } = useToast();

  if (!asset) return null;

  const supplier = getSupplierById(asset.supplier); // Buscar dados do fornecedor

  const handleRemoveImage = () => {
    if (confirm("Tem certeza que deseja remover a foto deste ativo?")) {
      updateAsset({ ...asset, imageDataUri: undefined });
      toast({
        title: "Foto Removida",
        description: "A foto do ativo foi removida com sucesso.",
      });
    }
  };

  const handleViewImageFull = () => {
    if (asset.imageDataUri) {
      window.open(asset.imageDataUri, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Ativo: {asset.name}</DialogTitle>
          <DialogDescription>
            Informações completas sobre o ativo selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div>
            <h3 className="font-semibold mb-2 text-lg">Informações Gerais</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Nome:</strong> {asset.name}</p>
              <p><strong>Patrimônio:</strong> {asset.assetTag}</p>
              <p><strong>Categoria:</strong> {asset.category}</p>
              <p><strong>Fornecedor:</strong> {supplier?.nomeFantasia || asset.supplier}</p>
              <p><strong>Data da Compra:</strong> {formatDate(asset.purchaseDate)}</p>
              <p><strong>Nº Nota Fiscal:</strong> {asset.invoiceNumber}</p>
              <p><strong>Nº Série:</strong> {asset.serialNumber || "N/A"}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-lg">Valores</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Valor de Compra:</strong> {formatCurrency(asset.purchaseValue)}</p>
              <p><strong>Valor Atual:</strong> {formatCurrency(asset.currentValue)}</p>
            </div>

            {asset.imageDataUri && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-lg">Foto do Ativo</h3>
                <div className="relative w-full h-64 border rounded-md overflow-hidden">
                  <Image src={asset.imageDataUri} alt={`Foto de ${asset.name}`} layout="fill" objectFit="contain" />
                </div>
                <div className="flex space-x-2 mt-2">
                  <Button variant="outline" size="sm" onClick={handleViewImageFull} title="Visualizar Foto">
                    <ExternalLink className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Visualizar</span>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleRemoveImage} title="Excluir Foto">
                    <Trash2 className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Excluir Foto</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
