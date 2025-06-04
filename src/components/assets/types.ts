
export interface Asset {
  id: string;
  purchaseDate: string;
  name: string;
  modelId?: string; // Alterado de model para modelId
  invoiceNumber: string;
  serialNumber: string;
  assetTag: string;
  supplier: string; // Supplier ID
  categoryId: string;
  locationId?: string; // Novo: ID do local alocado
  purchaseValue: number;
  currentValue: number;
  imageDateUris?: string[];
  previouslyDepreciatedValue?: number;
  additionalInfo?: string; // Novo campo para informações adicionais
}
