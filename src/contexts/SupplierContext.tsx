
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';

export interface Supplier {
  id: string;
  type: 'fisica' | 'juridica';
  razaoSocial: string; // Para PJ é Razão Social, para PF é Nome Completo
  nomeFantasia: string; // Obrigatório para PJ, opcional para PF
  cnpj?: string;
  cpf?: string;
  contato: string;
  endereco: string;
}

interface SupplierContextType {
  suppliers: Supplier[];
  addSupplier: (supplierData: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (supplierData: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  getSupplierById: (supplierId: string) => Supplier | undefined;
  setSuppliers: Dispatch<SetStateAction<Supplier[]>>;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

const initialMockSuppliers: Supplier[] = [
  {
    id: 'sup-001',
    type: 'juridica',
    razaoSocial: 'Tech Solutions LTDA',
    nomeFantasia: 'Tech Solutions',
    cnpj: '12.345.678/0001-99',
    contato: '(11) 98765-4321',
    endereco: 'Rua Exemplo, 123, São Paulo, SP'
  },
  {
    id: 'sup-002',
    type: 'juridica',
    razaoSocial: 'Móveis Conforto & Cia',
    nomeFantasia: 'Móveis Conforto',
    cnpj: '98.765.432/0001-11',
    contato: 'contato@moveisconforto.com',
    endereco: 'Av. Principal, 456, Rio de Janeiro, RJ'
  },
  {
    id: 'sup-003',
    type: 'fisica',
    razaoSocial: 'João da Silva Programações', // Nome Completo
    nomeFantasia: 'JS Programador', // Opcional
    cpf: '123.456.789-00',
    contato: 'joao.silva@email.com',
    endereco: 'Rua dos Desenvolvedores, 789, Belo Horizonte, MG'
  },
];


export const SupplierProvider = ({ children }: { children: ReactNode }) => {
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', initialMockSuppliers);

  const addSupplier = (supplierData: Omit<Supplier, 'id'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now().toString()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setSuppliers(prevSuppliers => [...prevSuppliers, newSupplier]);
    return newSupplier;
  };

  const updateSupplier = (supplierData: Supplier) => {
    setSuppliers(prevSuppliers =>
      prevSuppliers.map(s => (s.id === supplierData.id ? supplierData : s))
    );
  };

  const deleteSupplier = (supplierId: string) => {
    setSuppliers(prevSuppliers => prevSuppliers.filter(s => s.id !== supplierId));
  };

  const getSupplierById = (supplierId: string): Supplier | undefined => {
    return suppliers.find(s => s.id === supplierId);
  };

  return (
    <SupplierContext.Provider value={{ suppliers, addSupplier, updateSupplier, deleteSupplier, getSupplierById, setSuppliers }}>
      {children}
    </SupplierContext.Provider>
  );
};

export const useSuppliers = (): SupplierContextType => {
  const context = useContext(SupplierContext);
  if (context === undefined) {
    throw new Error('useSuppliers must be used within a SupplierProvider');
  }
  return context;
};
