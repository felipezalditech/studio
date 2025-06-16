
"use client";

import React, { useState } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import type { AssetWithCalculatedValues } from "@/app/assets/page";
import { useAssets } from "@/contexts/AssetContext";
import { formatDate, formatCurrency } from "@/components/assets/columns";
import { Trash2, Download, Eye, FileText, Paperclip, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useAssetModels } from '@/contexts/AssetModelContext'; 

interface AssetDetailsDialogProps {
  asset: AssetWithCalculatedValues | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetDetailsDialog({ asset, open, onOpenChange }: AssetDetailsDialogProps) {
  const { updateAsset } = useAssets();
  const { getAssetModelNameById } = useAssetModels(); 
  const { toast } = useToast();

  const [imageIndexToDelete, setImageIndexToDelete] = useState<number | null>(null);
  const [isConfirmDeleteImageDialogOpen, setIsConfirmDeleteImageDialogOpen] = useState(false);
  const [isConfirmDeleteInvoiceDialogOpen, setIsConfirmDeleteInvoiceDialogOpen] = useState(false);

  if (!asset) return null;

  const modelName = asset.modelId ? getAssetModelNameById(asset.modelId) : "N/A";

  const handleRemoveImageRequest = (indexToRemove: number) => {
    setImageIndexToDelete(indexToRemove);
    setIsConfirmDeleteImageDialogOpen(true);
  };

  const confirmRemoveImage = () => {
    if (!asset || !asset.imageDateUris || imageIndexToDelete === null) return;

    const updatedImageUris = asset.imageDateUris.filter((_, index) => index !== imageIndexToDelete);
    const { depreciatedValue, calculatedCurrentValue, categoryName, supplierName, locationName, modelName: _modelName, ...baseAsset } = asset;
    updateAsset({ ...baseAsset, imageDateUris: updatedImageUris });

    toast({
      title: "Foto removida",
      description: "A foto selecionada foi removida com sucesso.",
    });
    setImageIndexToDelete(null);
  };

  const handleDownloadFile = (dataUri: string | undefined, fileName: string | undefined) => {
    if (!dataUri || !fileName) return;
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewFile = (dataUri: string | undefined, fileName: string | undefined) => {
    if (!dataUri || !fileName) return;
    const newWindow = window.open();
    if (newWindow) {
      if (dataUri.startsWith('data:application/pdf')) {
        newWindow.document.write(
          `<iframe src="${dataUri}" width="100%" height="100%" title="Visualizar ${fileName}"></iframe>`
        );
      } else if (dataUri.startsWith('data:image/')) {
        newWindow.document.write(
          `<img src="${dataUri}" alt="Visualizar ${fileName}" style="max-width:100%; max-height:100vh; margin:auto; display:block;" />`
        );
      } else {
         newWindow.document.write(`<p>Não é possível visualizar este tipo de arquivo diretamente. Faça o download.</p><p><a href="${dataUri}" download="${fileName}">Baixar ${fileName}</a></p>`);
      }
      newWindow.document.title = `Visualizar: ${fileName}`;
    } else {
      toast({
        title: "Bloqueio de Pop-up",
        description: "Por favor, desabilite o bloqueador de pop-ups para visualizar o arquivo.",
        variant: "destructive"
      });
    }
  };
  
  const handleRemoveInvoiceRequest = () => {
    setIsConfirmDeleteInvoiceDialogOpen(true);
  };

  const confirmRemoveInvoice = () => {
    if (!asset) return;
    const { depreciatedValue, calculatedCurrentValue, categoryName, supplierName, locationName, modelName: _modelName, ...baseAsset } = asset;
    updateAsset({ ...baseAsset, invoiceFileDataUri: undefined, invoiceFileName: undefined });
    toast({
      title: "Anexo da nota fiscal removido",
      description: "O arquivo da nota fiscal foi removido com sucesso.",
    });
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do ativo: {asset.name}</DialogTitle>
          <DialogDescription>
            Informações completas sobre o ativo selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
          <div>
            <h3 className="font-semibold mb-2 text-lg">Informações gerais</h3>
            <div className="space-y-1.5 text-sm">
              <p><strong>Nome:</strong> {asset.name}</p>
              <p><strong>Modelo:</strong> {modelName}</p> 
              <p><strong>Patrimônio:</strong> {asset.assetTag}</p>
              <p><strong>Categoria:</strong> {asset.categoryName || asset.categoryId}</p>
              <p><strong>Fornecedor:</strong> {asset.supplierName || asset.supplier}</p>
              <p><strong>Local alocado:</strong> {asset.locationName || 'N/A'}</p>
              <p><strong>Data da compra:</strong> {formatDate(asset.purchaseDate)}</p>
              <p><strong>Nº Nota Fiscal:</strong> {asset.invoiceNumber}</p>
              <p><strong>Nº Série:</strong> {asset.serialNumber || "N/A"}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-lg">Valores</h3>
            <div className="space-y-1.5 text-sm">
              <p><strong>Valor de compra:</strong> {formatCurrency(asset.purchaseValue)}</p>
              {asset.previouslyDepreciatedValue !== undefined && asset.previouslyDepreciatedValue > 0 && (
                <p><strong>Valor já depreciado (inicial):</strong> {formatCurrency(asset.previouslyDepreciatedValue)}</p>
              )}
              <p><strong>Valor depreciado total:</strong> <span className="text-orange-600 dark:text-orange-500">{formatCurrency(asset.depreciatedValue)}</span></p>
              <p><strong>Valor atual:</strong> <span className="text-green-600 dark:text-green-500">{formatCurrency(asset.calculatedCurrentValue)}</span></p>
            </div>
          </div>
        </div>

        {asset.additionalInfo && (
          <div className="mt-2">
            <h3 className="font-semibold mb-2 text-lg">Informações adicionais</h3>
            <Textarea
                value={asset.additionalInfo}
                readOnly
                className="text-sm resize-none bg-muted/30"
                rows={3}
            />
          </div>
        )}

        <div className="mt-2">
          <h3 className="font-semibold mb-3 text-lg flex items-center">
            <Paperclip className="mr-2 h-5 w-5" /> Anexo da Nota Fiscal
          </h3>
          {asset.invoiceFileName && asset.invoiceFileDataUri ? (
             <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/10">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-foreground truncate flex-1" title={asset.invoiceFileName}>
                {asset.invoiceFileName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewFile(asset.invoiceFileDataUri, asset.invoiceFileName)}
                title="Visualizar anexo"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDownloadFile(asset.invoiceFileDataUri, asset.invoiceFileName)}
                title="Baixar anexo"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveInvoiceRequest}
                title="Remover anexo"
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum arquivo de nota fiscal anexado.</p>
          )}
        </div>


        <div className="mt-2">
          <h3 className="font-semibold mb-3 text-lg">Fotos do ativo</h3>
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
                      onClick={() => handleDownloadFile(uri, `foto_ativo_${asset.assetTag || asset.id}_${index + 1}.${uri.split(';')[0].split('/')[1] || 'png'}`)}
                      title="Baixar foto"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRemoveImageRequest(index)}
                      title="Excluir foto"
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

      {asset.id && imageIndexToDelete !== null && (
        <ConfirmationDialog
          open={isConfirmDeleteImageDialogOpen}
          onOpenChange={setIsConfirmDeleteImageDialogOpen}
          onConfirm={confirmRemoveImage}
          title="Confirmar exclusão de foto"
          description={`Tem certeza que deseja remover esta foto do ativo ${asset.name}?`}
        />
      )}
       {asset.id && (
        <ConfirmationDialog
          open={isConfirmDeleteInvoiceDialogOpen}
          onOpenChange={setIsConfirmDeleteInvoiceDialogOpen}
          onConfirm={confirmRemoveInvoice}
          title="Confirmar exclusão do anexo da nota fiscal"
          description={`Tem certeza que deseja remover o arquivo da nota fiscal do ativo ${asset.name}?`}
        />
      )}
    </Dialog>
  );
}

