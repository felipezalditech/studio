
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';
import type { Asset } from '@/components/assets/types';
import { mockAssets as initialMockAssets } from '@/components/assets/data'; // Renomeado para evitar conflito

interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  setAssets: Dispatch<SetStateAction<Asset[]>>; // Para futuras edições/deleções
  categories: string[];
  suppliers: string[];
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useLocalStorage<Asset[]>('assets', initialMockAssets);

  const addAsset = (assetData: Omit<Asset, 'id'>) => {
    const newAsset: Asset = {
      ...assetData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7), // Simple unique ID
    };
    setAssets(prevAssets => [...prevAssets, newAsset]);
  };

  const categories = useMemo(() => Array.from(new Set(assets.map(asset => asset.category))).sort(), [assets]);
  const suppliers = useMemo(() => Array.from(new Set(assets.map(asset => asset.supplier))).sort(), [assets]);

  return (
    <AssetContext.Provider value={{ assets, addAsset, setAssets, categories, suppliers }}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAssets = (): AssetContextType => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
};
