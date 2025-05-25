
export type DepreciationMethod = 'linear' | 'reducing_balance'; // Exemplo, pode expandir

export interface AssetCategory {
  id: string;
  name: string;
  depreciationMethod: DepreciationMethod;
  usefulLifeInYears?: number; // Vida útil em anos - Torna opcional
  residualValuePercentage: number; // Percentual do valor residual (ex: 10 para 10%)
  depreciationRateType?: 'annual' | 'monthly'; // Novo: Tipo de taxa de depreciação
  depreciationRateValue?: number; // Novo: Valor percentual da taxa de depreciação
}

