
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
import { Trash2, Download, XCircle } from 'lucide-react'; // Adicionado XCircle
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

  const handleRemoveImage = (indexToRemove: number) => {
    if (!asset || !asset.imageDateUris) return;
    if (confirm(`Tem certeza que deseja remover esta foto do ativo ${asset.name}?`)) {
      const updatedImageUris = asset.imageDateUris.filter((_, index) => index !== indexToRemove);
      updateAsset({ ...asset, imageDateUris: updatedImageUris });
      toast({
        title: "Foto Removida",
        description: "A foto selecionada foi removida com sucesso.",
      });
    }
  };

  const handleDownloadImage = (imageDataUri: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageDataUri;
    const mimeTypeMatch = imageDataUri.match(/data:image\/([^;]+);/);
    const extension = mimeTypeMatch ? mimeTypeMatch[1] : 'png';
    link.download = `foto_ativo_${asset.assetTag || asset.id}_${index + 1}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Download Iniciado",
      description: "O download da foto do ativo foi iniciado.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"> {/* Aumentado max-width */}
        <DialogHeader>
          <DialogTitle>Detalhes do Ativo: {asset.name}</DialogTitle>
          <DialogDescription>
            Informações completas sobre o ativo selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
          <div>
            <h3 className="font-semibold mb-2 text-lg">Informações Gerais</h3>
            <div className="space-y-1.5 text-sm">
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
            <div className="space-y-1.5 text-sm">
              <p><strong>Valor de Compra:</strong> {formatCurrency(asset.purchaseValue)}</p>
              <p><strong>Valor Atual:</strong> {formatCurrency(asset.currentValue)}</p>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <h3 className="font-semibold mb-3 text-lg">Fotos do Ativo</h3>
          {asset.imageDateUris && asset.imageDateUris.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2 border rounded-md bg-muted/10">
              {asset.imageDateUris.map((uri, index) => (
                <div key={index} className="relative group aspect-square border rounded-md overflow-hidden">
                  <Image 
                    src={uri} 
                    alt={`Foto ${index + 1} de ${asset.name}`} 
                    layout="fill" 
                    objectFit="contain"
                    data-ai-hint="asset photo detail"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center space-x-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 border-gray-300 text-gray-300 hover:bg-white/20 hover:text-white"
                      onClick={() => handleDownloadImage(uri, index)} 
                      title="Baixar Foto"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => handleRemoveImage(index)} 
                      title="Excluir Foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma foto cadastrada para este ativo.</p>
          )}
        </div>

        <DialogFooter className="mt-6">
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
