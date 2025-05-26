
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskCPF(value: string): string {
  if (!value) return ""
  value = value.replace(/\D/g, '') // Remove todos os não dígitos
  value = value.substring(0, 11) // Limita a 11 dígitos

  if (value.length <= 3) return value
  if (value.length <= 6) return `${value.slice(0, 3)}.${value.slice(3)}`
  if (value.length <= 9) return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`
  return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`
}

export function maskCNPJ(value: string): string {
  if (!value) return ""
  value = value.replace(/\D/g, '') // Remove todos os não dígitos
  value = value.substring(0, 14) // Limita a 14 dígitos

  if (value.length <= 2) return value
  if (value.length <= 5) return `${value.slice(0, 2)}.${value.slice(2)}`
  if (value.length <= 8) return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5)}`
  if (value.length <= 12) return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8)}`
  return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`
}
