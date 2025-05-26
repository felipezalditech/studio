
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';

interface BrandingConfig {
  companyName: string;
  logoUrl: string;
}

interface BrandingContextType {
  brandingConfig: BrandingConfig;
  setBrandingConfig: Dispatch<SetStateAction<BrandingConfig>>;
}

const defaultBrandingConfig: BrandingConfig = {
  companyName: 'Zaldi Imo',
  logoUrl: '',
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  const [brandingConfig, setBrandingConfig] = useLocalStorage<BrandingConfig>('brandingConfig', defaultBrandingConfig);

  return (
    <BrandingContext.Provider value={{ brandingConfig, setBrandingConfig }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
