
import type { Asset } from './types';

const categoryIds = ['cat-001', 'cat-002', 'cat-003', 'cat-004'];
const supplierIds = ['sup-001', 'sup-002', 'sup-003'];
const locationIds = ['loc-001', 'loc-002', 'loc-003', 'loc-004', undefined]; // Permite locais indefinidos

const assetBaseNames = [
  "Laptop Corporativo Avançado", "Mesa de Escritório Ergonômica", "Monitor LED Curvo 32\"", "Cadeira de Escritório Presidente",
  "Switch Gerenciável 48 Portas", "Projetor Multimídia Full HD", "Armário de Documentos com Chave", "Servidor de Rack Dell PowerEdge",
  "Impressora Laser Colorida", "Tablet Industrial Robusto", "Sistema de Videoconferência Polycom", "Teclado Mecânico Silencioso",
  "Mouse Óptico Vertical", "Nobreak Senoidal 3kVA", "Roteador Wi-Fi 6 Mesh", "Scanner Duplex de Alta Velocidade",
  "Ar Condicionado Central VRF", "Purificador de Água Refrigerado", "Forno de Micro-ondas Industrial", "Smart TV Corporativa 65\"",
  "Desktop Workstation Gráfica", "Apple iMac 27\" 5K", "Microsoft Surface Pro 9", "Câmera de Segurança IP PoE", "Drone de Mapeamento Topográfico",
  "Mesa de Reunião Executiva", "Longarina para Recepção 4 Lugares", "Arquivo Deslizante Compacto", "Estante Industrial Pesada",
  "PABX Híbrido Digital/IP", "Antena Externa Direcional Wi-Fi", "Firewall UTM de Próxima Geração", "Storage NAS 8 Baias",
  "Plotter de Recorte Profissional", "Impressora 3D Resina", "Bancada Eletrônica Antiestática", "Osciloscópio Digital Tektronix",
  "Gerador de Energia a Diesel", "Empilhadeira Elétrica Retrátil", "Paleteira Manual Hidráulica", "Carrinho de Ferramentas Completo"
];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getRandomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startDate = new Date(2020, 0, 1); // Jan 1, 2020
const endDate = new Date(); // Today

export const mockAssets: Asset[] = [];

for (let i = 1; i <= 150; i++) {
  const purchaseValue = Math.floor(Math.random() * (7500 - 80 + 1)) + 80;
  let previouslyDepreciatedValue = 0;
  if (Math.random() < 0.25) { // 25% chance of having a previously depreciated value
    previouslyDepreciatedValue = Math.floor(Math.random() * (purchaseValue * 0.4)); // Up to 40% of purchase value
  }
  const initialCurrentValue = purchaseValue - previouslyDepreciatedValue;
  const serialNumber = Math.random() < 0.2 ? undefined : `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`; // 20% chance of no serial number
  const assetName = `${getRandomElement(assetBaseNames)} Modelo ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}-${i}`;
  const randomYear = 2020 + Math.floor(Math.random() * 5); // Years between 2020 and 2024


  mockAssets.push({
    id: `asset-mock-${i.toString().padStart(4, '0')}`,
    purchaseDate: getRandomDate(startDate, endDate),
    name: assetName,
    invoiceNumber: `NF-${randomYear}-${Math.floor(Math.random() * 90000 + 10000)}`,
    serialNumber: serialNumber,
    assetTag: `PAT-${randomYear}-${i.toString().padStart(4, '0')}`,
    supplier: getRandomElement(supplierIds),
    categoryId: getRandomElement(categoryIds),
    locationId: getRandomElement(locationIds),
    purchaseValue: parseFloat(purchaseValue.toFixed(2)),
    previouslyDepreciatedValue: parseFloat(previouslyDepreciatedValue.toFixed(2)),
    currentValue: parseFloat(initialCurrentValue.toFixed(2)), // This initial value will be further processed by depreciation logic
    imageDateUris: [], // Start with no images
    additionalInfo: Math.random() < 0.35 ? `Observações pertinentes ao ativo ${i}. Necessita verificação periódica.` : undefined,
  });
}
