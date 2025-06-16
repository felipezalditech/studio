
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';

export interface ImportSettingsConfig {
  allocateFreight: boolean;
  freightDilutionScope: 'all_nfe_items' | 'imported_items_only';
  // Future: freightAllocationMethod: 'by_value' | 'by_quantity';
}

const defaultImportSettingsConfig: ImportSettingsConfig = {
  allocateFreight: false,
  freightDilutionScope: 'all_nfe_items', // Default to all items for original share calculation
};

interface ImportSettingsContextType {
  importSettings: ImportSettingsConfig;
  setImportSettings: Dispatch<SetStateAction<ImportSettingsConfig>>;
}

const ImportSettingsContext = createContext<ImportSettingsContextType | undefined>(undefined);

export const ImportSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [importSettings, setImportSettings] = useLocalStorage<ImportSettingsConfig>(
    'importSettingsConfig',
    defaultImportSettingsConfig
  );

  return (
    <ImportSettingsContext.Provider value={{ importSettings, setImportSettings }}>
      {children}
    </ImportSettingsContext.Provider>
  );
};

export const useImportSettings = (): ImportSettingsContextType => {
  const context = useContext(ImportSettingsContext);
  if (context === undefined) {
    throw new Error('useImportSettings must be used within an ImportSettingsProvider');
  }
  return context;
};
