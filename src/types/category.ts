
export type DepreciationMethod = 'linear' | 'reducing_balance'; // Exemplo, pode expandir

export interface AssetCategory {
  id: string;
  name: string;
  depreciationMethod: DepreciationMethod;
  usefulLifeInYears: number; // Vida útil em anos
  residualValuePercentage: number; // Percentual do valor residual (ex: 10 para 10%)
}
