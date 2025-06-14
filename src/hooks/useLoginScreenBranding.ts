
"use client";
import type { Dispatch, SetStateAction } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';

export interface LoginScreenBrandingConfig {
  logoUrl: string;
  // companyName?: string; // Poderia ser adicionado futuramente
}

const defaultLoginScreenBrandingConfig: LoginScreenBrandingConfig = {
  logoUrl: '',
  // companyName: 'Zaldi Imo',
};

export function useLoginScreenBranding(): [LoginScreenBrandingConfig, Dispatch<SetStateAction<LoginScreenBrandingConfig>>] {
  const [config, setConfig] = useLocalStorage<LoginScreenBrandingConfig>(
    'loginScreenBrandingConfig',
    defaultLoginScreenBrandingConfig
  );
  return [config, setConfig];
}
