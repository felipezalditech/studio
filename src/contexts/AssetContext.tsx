
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';
import type { Asset } from '@/components/assets/types';
import { mockAssets as initialMockAssets } from '@/components/assets/data'; // Ensure this points to the 150 assets
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
  // The key is that 'initialMockAssets' here should be the array of 150 assets.
  const [assets, setAssets] = useLocalStorage<Asset[]>('assets', initialMockAssets);
  const { getCategoryById } = useCategories();
  const { getLocationById } = useLocations();

  const addAsset = (assetData: Omit<Asset, 'id'>) => {
    const newAsset: Asset = {
      ...assetData,
      id: `asset-${Date.now().toString()}-${Math.random().toString(36).substring(2, 7)}`,
      serialNumber: assetData.serialNumber || undefined,
      imageDateUris: assetData.imageDateUris || [],
      locationId: assetData.locationId || undefined,
      additionalInfo: assetData.additionalInfo || undefined,
      previouslyDepreciatedValue: assetData.previouslyDepreciatedValue || 0, // Ensure it's 0 if undefined
      currentValue: assetData.purchaseValue - (assetData.previouslyDepreciatedValue || 0),
    };
    setAssets(prevAssets => [...prevAssets, newAsset]);
  };

  const updateAsset = (updatedAsset: Asset) => {
    setAssets(prevAssets =>
      prevAssets.map(asset => (asset.id === updatedAsset.id ? { 
        ...asset, 
        ...updatedAsset,
        serialNumber: updatedAsset.serialNumber || undefined, // Ensure serialNumber can be empty string or undefined
        previouslyDepreciatedValue: updatedAsset.previouslyDepreciatedValue || 0,
       } : asset))
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
