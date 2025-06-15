
export interface Asset {
  id: string;
  purchaseDate: string;
  name: string;
  modelId?: string; 
  invoiceNumber: string;
  serialNumber?: string; // Já era opcional
  assetTag: string;
  supplier: string; 
  categoryId: string;
  locationId?: string; 
  purchaseValue: number;
  currentValue: number; // Este será recalculado com base na regra de depreciação
  imageDateUris?: string[];
  previouslyDepreciatedValue?: number;
  additionalInfo?: string; 
  aplicarRegrasDepreciacao: boolean;
  arquivado: boolean; // Novo campo
}
