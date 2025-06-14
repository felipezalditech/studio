
"use client";
import type { Dispatch, SetStateAction } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';

export interface LoginScreenBrandingConfig {
  logoUrl: string;
  backgroundImageUrl: string;
  loginButtonColor?: string;
  cardBackgroundColor?: string;
  inputBackgroundColor?: string;
  labelTextColor?: string;
  descriptionTextColor?: string;
}

const defaultLoginScreenBrandingConfig: LoginScreenBrandingConfig = {
  logoUrl: '',
  backgroundImageUrl: '',
  loginButtonColor: '#3F51B5', // Cor primária padrão
  cardBackgroundColor: '',
  inputBackgroundColor: '',
  labelTextColor: '',
  descriptionTextColor: '',
};

export function useLoginScreenBranding(): [LoginScreenBrandingConfig, Dispatch<SetStateAction<LoginScreenBrandingConfig>>] {
  const [config, setConfig] = useLocalStorage<LoginScreenBrandingConfig>(
    'loginScreenBrandingConfig',
    defaultLoginScreenBrandingConfig
  );
  return [config, setConfig];
}
