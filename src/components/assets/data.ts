
import type { Asset } from './types';

// Certifique-se que os IDs correspondem aos mocks em outros contextos
export const mockAssets: Asset[] = [
  {
    id: '1',
    purchaseDate: '2023-01-15',
    name: 'Laptop Pro 15"',
    invoiceNumber: 'INV-001',
    serialNumber: 'SN-LP001',
    assetTag: 'AT-001',
    supplier: 'sup-001',
    categoryId: 'cat-001', // Eletrônicos
    locationId: 'loc-001', // Escritório Principal
    purchaseValue: 1200.00,
    previouslyDepreciatedValue: 0,
    currentValue: 1200.00,
    imageDateUris: [],
    additionalInfo: 'Garantia estendida até Jan/2025',
  },
  {
    id: '2',
    purchaseDate: '2023-02-20',
    name: 'Mesa de Escritório Grande',
    invoiceNumber: 'INV-002',
    serialNumber: 'N/A',
    assetTag: 'AT-002',
    supplier: 'sup-002',
    categoryId: 'cat-002', // Móveis
    locationId: 'loc-002', // Cliente Escola Crescer
    purchaseValue: 350.00,
    previouslyDepreciatedValue: 50.00,
    currentValue: 300.00,
    imageDateUris: [],
    additionalInfo: 'Montagem inclusa, verificar arranhão na lateral.',
  },
  {
    id: '3',
    purchaseDate: '2022-11-05',
    name: 'Monitor Alta Resolução 27"',
    invoiceNumber: 'INV-003',
    serialNumber: 'SN-M001',
    assetTag: 'AT-003',
    supplier: 'sup-003',
    categoryId: 'cat-001', // Eletrônicos
    locationId: 'loc-001',
    purchaseValue: 450.00,
    previouslyDepreciatedValue: 0,
    currentValue: 450.00,
    imageDateUris: [],
    additionalInfo: 'Cabo HDMI extra incluído.'
  },
  {
    id: '4',
    purchaseDate: '2023-03-10',
    name: 'Cadeira Ergonômica',
    invoiceNumber: 'INV-004',
    serialNumber: 'N/A',
    assetTag: 'AT-004',
    supplier: 'sup-002',
    categoryId: 'cat-002', // Móveis
    locationId: 'loc-003', // Filial Leste
    purchaseValue: 220.00,
    previouslyDepreciatedValue: 0,
    currentValue: 220.00,
    imageDateUris: [],
  },
  {
    id: '5',
    purchaseDate: '2023-01-25',
    name: 'Switch de Rede 24 Portas',
    invoiceNumber: 'INV-005',
    serialNumber: 'SN-NS001',
    assetTag: 'AT-005',
    supplier: 'sup-001',
    categoryId: 'cat-004', // Redes
    locationId: 'loc-004', // Depósito Central
    purchaseValue: 280.00,
    previouslyDepreciatedValue: 20.00,
    currentValue: 260.00,
    imageDateUris: [],
    additionalInfo: 'Firmware atualizado para v2.3.1.'
  },
  {
    id: '6',
    purchaseDate: '2022-09-01',
    name: 'Projetor HD',
    invoiceNumber: 'INV-006',
    serialNumber: 'SN-PJ001',
    assetTag: 'AT-006',
    supplier: 'sup-003',
    categoryId: 'cat-001', // Eletrônicos
    locationId: 'loc-001',
    purchaseValue: 600.00,
    previouslyDepreciatedValue: 100.00,
    currentValue: 500.00,
    imageDateUris: [],
  },
  {
    id: '7',
    purchaseDate: '2023-04-02',
    name: 'Armário de Aço',
    invoiceNumber: 'INV-007',
    serialNumber: 'N/A',
    assetTag: 'AT-007',
    supplier: 'sup-002',
    categoryId: 'cat-002', // Móveis
    // locationId: undefined, // Sem local definido
    purchaseValue: 150.00,
    previouslyDepreciatedValue: 0,
    currentValue: 150.00,
    imageDateUris: [],
    additionalInfo: 'Possui 2 chaves.'
  }
];
