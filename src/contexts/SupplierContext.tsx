
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';

export interface Supplier {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  contato: string; // Pode ser telefone, email, etc.
  endereco: string;
}

interface SupplierContextType {
  suppliers: Supplier[];
  addSupplier: (supplierData: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplierData: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  getSupplierById: (supplierId: string) => Supplier | undefined;
  setSuppliers: Dispatch<SetStateAction<Supplier[]>>; // Para consistência com AssetContext
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

// Dados mock iniciais para fornecedores
const initialMockSuppliers: Supplier[] = [
  { id: 'sup-001', razaoSocial: 'Tech Solutions LTDA', nomeFantasia: 'Tech Solutions', cnpj: '12.345.678/0001-99', contato: '(11) 98765-4321', endereco: 'Rua Exemplo, 123, São Paulo, SP' },
  { id: 'sup-002', razaoSocial: 'Móveis Conforto & Cia', nomeFantasia: 'Móveis Conforto', cnpj: '98.765.432/0001-11', contato: 'contato@moveisconforto.com', endereco: 'Av. Principal, 456, Rio de Janeiro, RJ' },
  { id: 'sup-003', razaoSocial: 'DisplayTech Importações SA', nomeFantasia: 'DisplayTech', cnpj: '11.222.333/0001-44', contato: 'SAC (21) 2345-6789', endereco: 'Centro Empresarial, Bloco A, Sala 101, Curitiba, PR' },
];


export const SupplierProvider = ({ children }: { children: ReactNode }) => {
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);

   // Carregar dados mock apenas se o localStorage estiver vazio
   useEffect(() => {
    const storedSuppliers = window.localStorage.getItem('suppliers');
    if (!storedSuppliers || JSON.parse(storedSuppliers).length === 0) {
      setSuppliers(initialMockSuppliers);
    }
  }, [setSuppliers]);


  const addSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now().toString()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setSuppliers(prevSuppliers => [...prevSuppliers, newSupplier]);
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
