
export interface Asset {
  id: string;
  purchaseDate: string; 
  name: string;
  invoiceNumber: string;
  serialNumber: string;
  assetTag: string;
  supplier: string;
  category: string;
  purchaseValue: number;
  currentValue: number;
  imageDateUris?: string[]; // Alterado de imageDataUri para imageDateUris (array)
}

