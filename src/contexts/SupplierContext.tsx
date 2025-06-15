
"use client";
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext } from 'react';
import useLocalStorage from '@/lib/hooks/use-local-storage';

export interface Endereco {
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento?: string;
}

export type SituacaoICMS = 'contribuinte' | 'nao_contribuinte' | 'isento';

export interface Supplier {
  id: string;
  type: 'fisica' | 'juridica';
  razaoSocial: string; // Para PJ é Razão Social, para PF é Nome Completo
  nomeFantasia: string; // Obrigatório para PJ, opcional para PF (ou pode ser o mesmo que razaoSocial para PF)
  cnpj?: string;
  cpf?: string;
  situacaoIcms: SituacaoICMS;
  inscricaoEstadual?: string;
  responsavelNome: string; // Nome do responsável pela empresa
  emailFaturamento: string;
  endereco: Endereco;
  // O campo 'contato' (telefone/email geral) e 'endereco' (string simples) foram substituídos/refinados.
}

interface SupplierContextType {
  suppliers: Supplier[];
  addSupplier: (supplierData: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (supplierData: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  getSupplierById: (supplierId: string) => Supplier | undefined;
  getSupplierByDocument: (document: string) => Supplier | undefined; // Nova função
  setSuppliers: Dispatch<SetStateAction<Supplier[]>>;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

const initialMockSuppliers: Supplier[] = [
  {
    id: 'sup-001',
    type: 'juridica',
    razaoSocial: 'Tech Solutions LTDA ME',
    nomeFantasia: 'Tech Solutions',
    cnpj: '12.345.678/0001-99',
    situacaoIcms: 'contribuinte',
    inscricaoEstadual: '123.456.789.112',
    responsavelNome: 'Carlos Admin',
    emailFaturamento: 'faturamento@techsolutions.com',
    endereco: {
      cep: '01000-000',
      estado: 'SP',
      cidade: 'São Paulo',
      bairro: 'Centro',
      rua: 'Rua Exemplo Soluções',
      numero: '123',
      complemento: 'Sala 101'
    }
  },
  {
    id: 'sup-002',
    type: 'juridica',
    razaoSocial: 'Móveis Conforto & Cia LTDA',
    nomeFantasia: 'Móveis Conforto',
    cnpj: '98.765.432/0001-11',
    situacaoIcms: 'isento',
    responsavelNome: 'Ana Gestora',
    emailFaturamento: 'financeiro@moveisconforto.com',
    endereco: {
      cep: '20000-000',
      estado: 'RJ',
      cidade: 'Rio de Janeiro',
      bairro: 'Copacabana',
      rua: 'Av. Principal Mobiliário',
      numero: '456',
    }
  },
  {
    id: 'sup-003',
    type: 'fisica',
    razaoSocial: 'João da Silva Programações Autônomas', // Nome Completo
    nomeFantasia: 'JS Programador', // Opcional para PF, mas útil
    cpf: '123.456.789-00',
    situacaoIcms: 'nao_contribuinte',
    responsavelNome: 'João da Silva',
    emailFaturamento: 'joao.silva.fatura@email.com',
    endereco: {
      cep: '30000-000',
      estado: 'MG',
      cidade: 'Belo Horizonte',
      bairro: 'Savassi',
      rua: 'Rua dos Desenvolvedores de Software',
      numero: '789',
      complemento: 'Apto 302'
    }
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

  const getSupplierByDocument = (document: string): Supplier | undefined => {
    const cleanedDocument = document.replace(/\D/g, ''); // Remove non-digits
    return suppliers.find(s => 
      (s.cnpj && s.cnpj.replace(/\D/g, '') === cleanedDocument) ||
      (s.cpf && s.cpf.replace(/\D/g, '') === cleanedDocument)
    );
  };

  return (
    <SupplierContext.Provider value={{ suppliers, addSupplier, updateSupplier, deleteSupplier, getSupplierById, getSupplierByDocument, setSuppliers }}>
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
