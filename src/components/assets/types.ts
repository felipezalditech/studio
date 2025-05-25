
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
  currentValue: number;
  imageDateUris?: string[];
}
