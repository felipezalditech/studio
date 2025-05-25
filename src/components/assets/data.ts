
import type { Asset } from './types';

// Estes são os dados iniciais que serão carregados no localStorage se nenhum dado existir.
// A lista de ativos em tempo real será gerenciada pelo AssetContext.
export const mockAssets: Asset[] = [
  {
    id: '1',
    purchaseDate: '2023-01-15',
    name: 'Laptop Pro 15"',
    invoiceNumber: 'INV-001',
    serialNumber: 'SN-LP001',
    assetTag: 'AT-001',
    supplier: 'Tech Solutions Ltd.',
    category: 'Eletrônicos',
    purchaseValue: 1200.00,
    currentValue: 950.00,
  },
  {
    id: '2',
    purchaseDate: '2023-02-20',
    name: 'Office Desk Large',
    invoiceNumber: 'INV-002',
    serialNumber: 'N/A',
    assetTag: 'AT-002',
    supplier: 'Furniture World',
    category: 'Móveis',
    purchaseValue: 350.00,
    currentValue: 300.00,
  },
  {
    id: '3',
    purchaseDate: '2022-11-05',
    name: 'High-Res Monitor 27"',
    invoiceNumber: 'INV-003',
    serialNumber: 'SN-M001',
    assetTag: 'AT-003',
    supplier: 'DisplayTech Inc.',
    category: 'Eletrônicos',
    purchaseValue: 450.00,
    currentValue: 380.00,
  },
  // ... (manter os outros ativos mockados se desejar como dados iniciais)
  {
    id: '4',
    purchaseDate: '2023-03-10',
    name: 'Ergonomic Chair',
    invoiceNumber: 'INV-004',
    serialNumber: 'N/A',
    assetTag: 'AT-004',
    supplier: 'Comfort Seating Co.',
    category: 'Móveis',
    purchaseValue: 220.00,
    currentValue: 190.00,
  },
  {
    id: '5',
    purchaseDate: '2023-01-25',
    name: 'Network Switch 24-Port',
    invoiceNumber: 'INV-005',
    serialNumber: 'SN-NS001',
    assetTag: 'AT-005',
    supplier: 'ConnectSys',
    category: 'Redes',
    purchaseValue: 280.00,
    currentValue: 250.00,
  },
  {
    id: '6',
    purchaseDate: '2022-09-01',
    name: 'Projector HD',
    invoiceNumber: 'INV-006',
    serialNumber: 'SN-PJ001',
    assetTag: 'AT-006',
    supplier: 'VisualPro',
    category: 'Eletrônicos',
    purchaseValue: 600.00,
    currentValue: 450.00,
  },
  {
    id: '7',
    purchaseDate: '2023-04-02',
    name: 'Filing Cabinet Steel',
    invoiceNumber: 'INV-007',
    serialNumber: 'N/A',
    assetTag: 'AT-007',
    supplier: 'Office Storage Inc.',
    category: 'Móveis',
    purchaseValue: 150.00,
    currentValue: 130.00,
  }
];

// As categorias e fornecedores agora são derivados dinamicamente no AssetContext e passados para AssetFilters.
// Estas exportações não são mais necessárias aqui para a lógica principal.
// export const categories = Array.from(new Set(mockAssets.map(asset => asset.category)));
// export const suppliers = Array.from(new Set(mockAssets.map(asset => asset.supplier)));
