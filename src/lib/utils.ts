
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskCPF(value: string): string {
  if (!value) return ""
  value = value.replace(/\D/g, '') // Remove todos os não dígitos
  value = value.substring(0, 11) // Limita a 11 dígitos

  value = value.replace(/(\d{3})(\d)/, '$1.$2')
  value = value.replace(/(\d{3})(\d)/, '$1.$2')
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  return value
}

export function maskCNPJ(value: string): string {
  if (!value) return ""
  value = value.replace(/\D/g, '') // Remove todos os não dígitos
  value = value.substring(0, 14) // Limita a 14 dígitos

  value = value.replace(/^(\d{2})(\d)/, '$1.$2')
  value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  value = value.replace(/\.(\d{3})(\d)/, '.$1/$2')
  value = value.replace(/(\d{4})(\d)/, '$1-$2')
  return value
}

export function maskCEP(value: string): string {
  if (!value) return ""
  value = value.replace(/\D/g, '') // Remove todos os não dígitos
  value = value.substring(0, 8)   // Limita a 8 dígitos

  value = value.replace(/(\d{5})(\d)/, '$1-$2')
  return value
}
