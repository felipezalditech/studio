
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useMemo, useEffect } from 'react'; // Adicionado useEffect
import useLocalStorage from '@/lib/hooks/use-local-storage';
import type { Asset } from '@/components/assets/types';
import { mockAssets as initialMockAssets } from '@/components/assets/data';

interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  setAssets: Dispatch<SetStateAction<Asset[]>>;
  categories: string[];
  // suppliers: string[]; // Removido - agora virá de SupplierContext
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useLocalStorage<Asset[]>('assets', []);

  // Carregar dados mock apenas se o localStorage estiver vazio
  useEffect(() => {
    const storedAssets = window.localStorage.getItem('assets');
    if (!storedAssets || JSON.parse(storedAssets).length === 0) {
      setAssets(initialMockAssets);
    }
  }, [setAssets]);


  const addAsset = (assetData: Omit<Asset, 'id'>) => {
    const newAsset: Asset = {
      ...assetData,
      id: `asset-${Date.now().toString()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setAssets(prevAssets => [...prevAssets, newAsset]);
  };

  const categories = useMemo(() => Array.from(new Set(assets.map(asset => asset.category))).sort(), [assets]);
  // A lista de fornecedores (suppliers) foi removida daqui, pois será gerenciada pelo SupplierContext

  return (
    <AssetContext.Provider value={{ assets, addAsset, setAssets, categories }}>
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
