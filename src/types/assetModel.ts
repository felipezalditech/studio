
export interface AssetModel {
  id: string;
  name: string;
  description?: string;
  color?: string;
  width?: number; // em cm
  height?: number; // em cm
  weight?: number; // em kg
  brand?: string;
}
