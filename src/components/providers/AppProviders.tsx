
"use client";

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { AssetProvider } from '@/contexts/AssetContext';
import { SupplierProvider } from '@/contexts/SupplierContext';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { AssetModelProvider } from '@/contexts/AssetModelContext'; // Importado
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrandingProvider>
        <SupplierProvider>
          <CategoryProvider>
            <LocationProvider>
              <AssetModelProvider> {/* Adicionado */}
                <AssetProvider>
                  <TooltipProvider>
                    {children}
                  </TooltipProvider>
                </AssetProvider>
              </AssetModelProvider>
            </LocationProvider>
          </CategoryProvider>
        </SupplierProvider>
      </BrandingProvider>
    </ThemeProvider>
  );
}
