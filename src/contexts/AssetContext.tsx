
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useMemo, useEffect } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';
import type { Asset } from '@/components/assets/types';
import { mockAssets as initialMockAssets } from '@/components/assets/data';
import { useCategories } from './CategoryContext'; // Import useCategories

interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (updatedAsset: Asset) => void; 
  deleteAsset: (assetId: string) => void;
  setAssets: Dispatch<SetStateAction<Asset[]>>;
  // categories: string[]; // This will be replaced by category data from CategoryContext
  getCategoryNameById: (categoryId: string) => string | undefined;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useLocalStorage<Asset[]>('assets', []);
  const { getCategoryById } = useCategories(); // Get category functions

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
      imageDateUris: assetData.imageDateUris || [],
      currentValue: assetData.purchaseValue, // Initialize currentValue with purchaseValue
    };
    setAssets(prevAssets => [...prevAssets, newAsset]);
  };

  const updateAsset = (updatedAsset: Asset) => {
    setAssets(prevAssets =>
      prevAssets.map(asset => (asset.id === updatedAsset.id ? { ...asset, ...updatedAsset } : asset))
    );
  };

  const deleteAsset = (assetId: string) => {
    setAssets(prevAssets => prevAssets.filter(asset => asset.id !== assetId));
  };

  const getCategoryNameById = (categoryId: string): string | undefined => {
    const category = getCategoryById(categoryId);
    return category?.name;
  };
  
  // const categories = useMemo(() => Array.from(new Set(assets.map(asset => asset.category))).sort(), [assets]);

  return (
    <AssetContext.Provider value={{ assets, addAsset, updateAsset, deleteAsset, setAssets, getCategoryNameById }}>
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
