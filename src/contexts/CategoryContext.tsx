
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext } from 'react'; // Removed useEffect
import useLocalStorage from '@/lib/hooks/use-local-storage';
import type { AssetCategory } from '@/types/category';

interface CategoryContextType {
  categories: AssetCategory[];
  addCategory: (categoryData: Omit<AssetCategory, 'id'>) => void;
  updateCategory: (categoryData: AssetCategory) => void;
  deleteCategory: (categoryId: string) => void;
  getCategoryById: (categoryId: string) => AssetCategory | undefined;
  setCategories: Dispatch<SetStateAction<AssetCategory[]>>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

const initialMockCategories: AssetCategory[] = [
  { id: 'cat-001', name: 'Eletrônicos', depreciationMethod: 'linear', usefulLifeInYears: 5, residualValuePercentage: 10, depreciationRateType: 'annual', depreciationRateValue: 20 },
  { id: 'cat-002', name: 'Móveis', depreciationMethod: 'linear', usefulLifeInYears: 10, residualValuePercentage: 5 },
  { id: 'cat-003', name: 'Veículos', depreciationMethod: 'linear', usefulLifeInYears: 5, residualValuePercentage: 20, depreciationRateType: 'annual', depreciationRateValue: 20 },
  { id: 'cat-004', name: 'Redes', depreciationMethod: 'linear', usefulLifeInYears: 7, residualValuePercentage: 0, depreciationRateType: 'monthly', depreciationRateValue: 1.19 },
];

export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useLocalStorage<AssetCategory[]>('assetCategories', initialMockCategories);

  // The useEffect to set initialMockCategories if localStorage is empty is no longer needed.
  // useLocalStorage handles this with initialMockCategories as the default.

  const addCategory = (categoryData: Omit<AssetCategory, 'id'>) => {
    const newCategory: AssetCategory = {
      ...categoryData,
      id: `cat-${Date.now().toString()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setCategories(prevCategories => [...prevCategories, newCategory]);
  };

  const updateCategory = (categoryData: AssetCategory) => {
    setCategories(prevCategories =>
      prevCategories.map(c => (c.id === categoryData.id ? categoryData : c))
    );
  };

  const deleteCategory = (categoryId: string) => {
    setCategories(prevCategories => prevCategories.filter(c => c.id !== categoryId));
  };

  const getCategoryById = (categoryId: string): AssetCategory | undefined => {
    return categories.find(c => c.id === categoryId);
  };

  return (
    <CategoryContext.Provider value={{ categories, addCategory, updateCategory, deleteCategory, getCategoryById, setCategories }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = (): CategoryContextType => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
