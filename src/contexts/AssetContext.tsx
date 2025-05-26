
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useMemo } from 'react'; // Removed useEffect
import useLocalStorage from '@/lib/hooks/use-local-storage';
import type { Asset } from '@/components/assets/types';
import { mockAssets as initialMockAssets } from '@/components/assets/data';
import { useCategories } from './CategoryContext';
import { useLocations } from './LocationContext';

interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (updatedAsset: Asset) => void;
  deleteAsset: (assetId: string) => void;
  getAssetById: (assetId: string) => Asset | undefined;
  setAssets: Dispatch<SetStateAction<Asset[]>>;
  getCategoryNameById: (categoryId: string) => string | undefined;
  getLocationNameById: (locationId?: string) => string | undefined;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider = ({ children }: { children: ReactNode }) => {
  // Pass initialMockAssets as the initialValue to useLocalStorage.
  // This ensures server and client initial render are consistent.
  // useLocalStorage will then attempt to load from 'assets' from localStorage,
  // and if it's not there, initialMockAssets will be used and persisted.
  const [assets, setAssets] = useLocalStorage<Asset[]>('assets', initialMockAssets);
  const { getCategoryById } = useCategories();
  const { getLocationById } = useLocations();

  // The useEffect to set initialMockAssets if localStorage is empty is no longer needed here,
  // as useLocalStorage now handles the initial value and persistence if the key is not found.

  const addAsset = (assetData: Omit<Asset, 'id'>) => {
    const newAsset: Asset = {
      ...assetData,
      id: `asset-${Date.now().toString()}-${Math.random().toString(36).substring(2, 7)}`,
      imageDateUris: assetData.imageDateUris || [],
      locationId: assetData.locationId || undefined,
      additionalInfo: assetData.additionalInfo || undefined,
      previouslyDepreciatedValue: assetData.previouslyDepreciatedValue,
      // currentValue is initialized based on purchaseValue and previouslyDepreciatedValue
      currentValue: assetData.purchaseValue - (assetData.previouslyDepreciatedValue || 0),
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

  const getAssetById = (assetId: string): Asset | undefined => {
    return assets.find(asset => asset.id === assetId);
  };

  const getCategoryNameById = (categoryId: string): string | undefined => {
    const category = getCategoryById(categoryId);
    return category?.name;
  };

  const getLocationNameById = (locationId?: string): string | undefined => {
    if (!locationId) return undefined;
    const location = getLocationById(locationId);
    return location?.name;
  };


  return (
    <AssetContext.Provider value={{ assets, addAsset, updateAsset, deleteAsset, getAssetById, setAssets, getCategoryNameById, getLocationNameById }}>
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
