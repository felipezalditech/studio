
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
import type { Supplier } from "@/contexts/SupplierContext";
import { useAssets } from "@/contexts/AssetContext";
import { useSuppliers } from "@/contexts/SupplierContext";
import { formatDate, formatCurrency } from "@/components/assets/columns";
import { Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssetDetailsDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetDetailsDialog({ asset, open, onOpenChange }: AssetDetailsDialogProps) {
  const { updateAsset } = useAssets();
  const { getSupplierById } = useSuppliers();
  const { toast } = useToast();

  if (!asset) return null;

  const supplier = getSupplierById(asset.supplier);

  const handleRemoveImage = () => {
    if (confirm("Tem certeza que deseja remover a foto deste ativo?")) {
      // Create a new asset object without imageDataUri
      const { imageDataUri, ...assetWithoutImage } = asset;
      updateAsset({ ...assetWithoutImage, imageDataUri: undefined });
      toast({
        title: "Foto Removida",
        description: "A foto do ativo foi removida com sucesso.",
      });
      // Consider closing and re-opening the dialog or managing internal state
      // For simplicity, current asset data in dialog will update on next open
      // or if the parent component forces a re-render of this dialog with new props.
      // To immediately reflect, we can call onOpenChange(false) then onOpenChange(true)
      // but this can be jarring. Best might be to manage asset data locally in dialog
      // or ensure parent re-renders with fresh asset from context.
      // For now, relying on context update and potential re-render.
    }
  };

  const handleDownloadImage = () => {
    if (asset.imageDataUri) {
      const link = document.createElement('a');
      link.href = asset.imageDataUri;
      const mimeTypeMatch = asset.imageDataUri.match(/data:image\/([^;]+);/);
      const extension = mimeTypeMatch ? mimeTypeMatch[1] : 'png'; // Default to png if type not found
      link.download = `foto_ativo_${asset.assetTag || asset.id}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Download Iniciado",
        description: "O download da foto do ativo foi iniciado.",
      });
    } else {
      toast({
        title: "Sem Imagem",
        description: "Este ativo não possui uma foto para baixar.",
        variant: "default",
      });
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

            {asset.imageDataUri ? (
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-lg">Foto do Ativo</h3>
                <div className="relative w-full h-64 border rounded-md overflow-hidden bg-muted/20">
                  <Image 
                    src={asset.imageDataUri} 
                    alt={`Foto de ${asset.name}`} 
                    layout="fill" 
                    objectFit="contain"
                    data-ai-hint="asset photo detail"
                  />
                </div>
                <div className="flex space-x-2 mt-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadImage} title="Baixar Foto">
                    <Download className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Baixar Foto</span>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleRemoveImage} title="Excluir Foto">
                    <Trash2 className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Excluir Foto</span>
                  </Button>
                </div>
              </div>
            ) : (
                 <div className="mt-6">
                    <h3 className="font-semibold mb-2 text-lg">Foto do Ativo</h3>
                    <p className="text-sm text-muted-foreground">Nenhuma foto cadastrada para este ativo.</p>
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
