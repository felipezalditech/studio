
export interface Asset {
  id: string;
  purchaseDate: string;
  name: string;
  modelId?: string; 
  invoiceNumber: string;
  serialNumber?: string; 
  assetTag: string;
  supplier: string; 
  categoryId: string;
  locationId?: string; 
  purchaseValue: number;
  currentValue: number; 
  imageDateUris?: string[];
  previouslyDepreciatedValue?: number;
  additionalInfo?: string; 
  aplicarRegrasDepreciacao: boolean;
  arquivado: boolean;
  invoiceFileDataUri?: string; // Novo campo para Data URI do arquivo da nota fiscal
  invoiceFileName?: string; // Novo campo para nome do arquivo da nota fiscal
}

