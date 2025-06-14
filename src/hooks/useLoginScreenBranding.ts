
"use client";
import type { Dispatch, SetStateAction } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';

export interface LoginScreenBrandingConfig {
  logoUrl: string;
  backgroundImageUrl: string; 
}

const defaultLoginScreenBrandingConfig: LoginScreenBrandingConfig = {
  logoUrl: '',
  backgroundImageUrl: '', 
};

export function useLoginScreenBranding(): [LoginScreenBrandingConfig, Dispatch<SetStateAction<LoginScreenBrandingConfig>>] {
  const [config, setConfig] = useLocalStorage<LoginScreenBrandingConfig>(
    'loginScreenBrandingConfig',
    defaultLoginScreenBrandingConfig
  );
  return [config, setConfig];
}
