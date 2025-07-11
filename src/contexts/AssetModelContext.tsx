
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';
import type { AssetModel } from '@/types/assetModel';

interface AssetModelContextType {
  assetModels: AssetModel[];
  addAssetModel: (modelData: Omit<AssetModel, 'id'>) => AssetModel;
  updateAssetModel: (modelData: AssetModel) => void;
  deleteAssetModel: (modelId: string) => void;
  getAssetModelById: (modelId: string) => AssetModel | undefined;
  getAssetModelNameById: (modelId?: string) => string | undefined; // Added
  setAssetModels: Dispatch<SetStateAction<AssetModel[]>>;
}

const AssetModelContext = createContext<AssetModelContextType | undefined>(undefined);

const initialMockAssetModels: AssetModel[] = [
  { id: 'assetmodel-001', name: 'Notebook Dell XPS 15', description: 'Modelo de alta performance.', brand: 'Dell', color: 'Prata', width: 35.7, height: 1.7, weight: 1.83 },
  { id: 'assetmodel-002', name: 'Monitor LG UltraWide 34"', description: 'Monitor curvo para produtividade.', brand: 'LG', color: 'Preto' },
  { id: 'assetmodel-003', name: 'Cadeira Ergonômica FlexForm', description: 'Cadeira com múltiplos ajustes.', brand: 'FlexForm', color: 'Preto/Cinza', weight: 15 },
];

export const AssetModelProvider = ({ children }: { children: ReactNode }) => {
  const [assetModels, setAssetModels] = useLocalStorage<AssetModel[]>('assetModels', initialMockAssetModels);

  const addAssetModel = (modelData: Omit<AssetModel, 'id'>): AssetModel => {
    const newModel: AssetModel = {
      ...modelData,
      id: `assetmodel-${Date.now().toString()}-${Math.random().toString(36).substring(2, 7)}`,
      description: modelData.description || undefined,
      color: modelData.color || undefined,
      width: modelData.width || undefined,
      height: modelData.height || undefined,
      weight: modelData.weight || undefined,
      brand: modelData.brand || undefined,
    };
    setAssetModels(prevModels => [...prevModels, newModel]);
    return newModel;
  };

  const updateAssetModel = (modelData: AssetModel) => {
    setAssetModels(prevModels =>
      prevModels.map(m => (m.id === modelData.id ? {
        ...m,
        ...modelData,
        description: modelData.description || undefined,
        color: modelData.color || undefined,
        width: modelData.width || undefined,
        height: modelData.height || undefined,
        weight: modelData.weight || undefined,
        brand: modelData.brand || undefined,
      } : m))
    );
  };

  const deleteAssetModel = (modelId: string) => {
    setAssetModels(prevModels => prevModels.filter(m => m.id !== modelId));
  };

  const getAssetModelById = (modelId: string): AssetModel | undefined => {
    return assetModels.find(m => m.id === modelId);
  };

  const getAssetModelNameById = (modelId?: string): string | undefined => { // Added
    if (!modelId) return undefined;
    const model = assetModels.find(m => m.id === modelId);
    return model?.name;
  };

  return (
    <AssetModelContext.Provider value={{ assetModels, addAssetModel, updateAssetModel, deleteAssetModel, getAssetModelById, getAssetModelNameById, setAssetModels }}>
      {children}
    </AssetModelContext.Provider>
  );
};

export const useAssetModels = (): AssetModelContextType => {
  const context = useContext(AssetModelContext);
  if (context === undefined) {
    throw new Error('useAssetModels must be used within an AssetModelProvider');
  }
  return context;
};
