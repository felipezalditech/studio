
import type { Asset } from './types';

// Atualize os IDs de fornecedor para corresponder aos IDs dos mockSuppliers
// Os IDs devem ser 'sup-001', 'sup-002', 'sup-003' etc.
export const mockAssets: Asset[] = [
  {
    id: '1',
    purchaseDate: '2023-01-15',
    name: 'Laptop Pro 15"',
    invoiceNumber: 'INV-001',
    serialNumber: 'SN-LP001',
    assetTag: 'AT-001',
    supplier: 'sup-001', // ID do fornecedor Tech Solutions Ltd.
    category: 'Eletrônicos',
    purchaseValue: 1200.00,
    currentValue: 950.00,
  },
  {
    id: '2',
    purchaseDate: '2023-02-20',
    name: 'Mesa de Escritório Grande',
    invoiceNumber: 'INV-002',
    serialNumber: 'N/A',
    assetTag: 'AT-002',
    supplier: 'sup-002', // ID do fornecedor Móveis Conforto
    category: 'Móveis',
    purchaseValue: 350.00,
    currentValue: 300.00,
  },
  {
    id: '3',
    purchaseDate: '2022-11-05',
    name: 'Monitor Alta Resolução 27"',
    invoiceNumber: 'INV-003',
    serialNumber: 'SN-M001',
    assetTag: 'AT-003',
    supplier: 'sup-003', // ID do fornecedor DisplayTech Inc.
    category: 'Eletrônicos',
    purchaseValue: 450.00,
    currentValue: 380.00,
  },
  {
    id: '4',
    purchaseDate: '2023-03-10',
    name: 'Cadeira Ergonômica',
    invoiceNumber: 'INV-004',
    serialNumber: 'N/A',
    assetTag: 'AT-004',
    supplier: 'sup-002', // ID do fornecedor Móveis Conforto (Comfort Seating Co. nos mocks antigos)
    category: 'Móveis',
    purchaseValue: 220.00,
    currentValue: 190.00,
  },
  {
    id: '5',
    purchaseDate: '2023-01-25',
    name: 'Switch de Rede 24 Portas',
    invoiceNumber: 'INV-005',
    serialNumber: 'SN-NS001',
    assetTag: 'AT-005',
    supplier: 'sup-001', // Supondo que ConnectSys seja Tech Solutions
    category: 'Redes',
    purchaseValue: 280.00,
    currentValue: 250.00,
  },
  {
    id: '6',
    purchaseDate: '2022-09-01',
    name: 'Projetor HD',
    invoiceNumber: 'INV-006',
    serialNumber: 'SN-PJ001',
    assetTag: 'AT-006',
    supplier: 'sup-003', // Supondo que VisualPro seja DisplayTech
    category: 'Eletrônicos',
    purchaseValue: 600.00,
    currentValue: 450.00,
  },
  {
    id: '7',
    purchaseDate: '2023-04-02',
    name: 'Armário de Aço',
    invoiceNumber: 'INV-007',
    serialNumber: 'N/A',
    assetTag: 'AT-007',
    supplier: 'sup-002', // Supondo Office Storage Inc. seja Móveis Conforto
    category: 'Móveis',
    purchaseValue: 150.00,
    currentValue: 130.00,
  }
];
