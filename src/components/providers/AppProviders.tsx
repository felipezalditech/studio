
"use client";

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { AssetProvider } from '@/contexts/AssetContext';
import { SupplierProvider } from '@/contexts/SupplierContext'; // Importado
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrandingProvider>
        <SupplierProvider> {/* Adicionado */}
          <AssetProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </AssetProvider>
        </SupplierProvider>
      </BrandingProvider>
    </ThemeProvider>
  );
}
