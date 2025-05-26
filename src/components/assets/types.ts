
export interface Asset {
  id: string;
  purchaseDate: string; 
  name: string;
  invoiceNumber: string;
  serialNumber: string;
  assetTag: string;
  supplier: string; // Supplier ID
  categoryId: string; // Changed from category: string to categoryId: string
  purchaseValue: number;
  currentValue: number; // Initial current value, will be further depreciated
  imageDateUris?: string[];
  previouslyDepreciatedValue?: number; // Valor que o ativo já tinha depreciado antes da aquisição atual
}

