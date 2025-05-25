"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useBranding } from '@/contexts/BrandingContext';
import { ThemeToggleButton } from '@/components/theme/ThemeToggleButton';
import { BrandingModal } from '@/components/branding/BrandingModal';
import { Building2 } from 'lucide-react';

export function AppHeader() {
  const { brandingConfig } = useBranding();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {brandingConfig.logoUrl ? (
            <Image 
              src={brandingConfig.logoUrl} 
              alt={`${brandingConfig.companyName} Logo`} 
              width={32} 
              height={32} 
              className="rounded-sm object-contain"
              data-ai-hint="company logo"
              onError={(e) => (e.currentTarget.src = 'https://placehold.co/32x32.png')}
            />
          ) : (
            <Building2 className="h-6 w-6" />
          )}
          <span className="font-bold sm:inline-block">
            {brandingConfig.companyName || 'Zaldi Imo'}
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <BrandingModal />
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
