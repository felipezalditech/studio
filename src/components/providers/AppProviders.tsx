"use client";

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrandingProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </BrandingProvider>
    </ThemeProvider>
  );
}
