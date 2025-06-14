
"use client";
import type { Dispatch, SetStateAction } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';

export interface LoginScreenBrandingConfig {
  logoUrl: string;
  backgroundImageUrl: string; 
  loginButtonColor?: string; // Cor de fundo do botão de login
}

const defaultLoginScreenBrandingConfig: LoginScreenBrandingConfig = {
  logoUrl: '',
  backgroundImageUrl: '', 
  loginButtonColor: '#3F51B5', // Cor primária padrão (indigo-500 / hsl(231 48% 48%))
};

export function useLoginScreenBranding(): [LoginScreenBrandingConfig, Dispatch<SetStateAction<LoginScreenBrandingConfig>>] {
  const [config, setConfig] = useLocalStorage<LoginScreenBrandingConfig>(
    'loginScreenBrandingConfig',
    defaultLoginScreenBrandingConfig
  );
  return [config, setConfig];
}

