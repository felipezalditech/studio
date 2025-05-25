
import type { Asset } from '@/components/assets/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToCSV = (assets: Asset[], filename: string = 'ativos.csv') => {
  if (assets.length === 0) {
    alert('Nenhum dado para exportar.');
    return;
  }

  const headers = Object.keys(assets[0]) as (keyof Asset)[];
  const csvRows = [
    headers.join(','),
    ...assets.map(row => 
      headers.map(fieldName => 
        JSON.stringify(row[fieldName], (_, value) => value === undefined ? '' : value)
      ).join(',')
    )
  ];
  
  const csvString = csvRows.join('\\r\\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToPDF = (assets: Asset[], filename: string = 'ativos.pdf') => {
  if (assets.length === 0) {
    alert('Nenhum dado para exportar.');
    return;
  }

  const doc = new jsPDF();
  // Mapeia os nomes das colunas para português para o cabeçalho do PDF
  const columnMapping: { [key in keyof Asset]?: string } = {
    id: 'ID',
    purchaseDate: 'Data da Compra',
    name: 'Nome',
    invoiceNumber: 'Nº Fatura',
    serialNumber: 'Nº Série',
    assetTag: 'Etiqueta do Ativo',
    supplier: 'Fornecedor',
    category: 'Categoria',
    purchaseValue: 'Valor de Compra',
    currentValue: 'Valor Atual',
  };

  const tableColumn = (Object.keys(assets[0]) as (keyof Asset)[]).map(key => ({
    header: columnMapping[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    dataKey: key
  }));
  
  const tableRows = assets.map(asset => {
    const row: { [key: string]: any } = {};
    tableColumn.forEach(col => {
      // Formata valores monetários para o PDF
      if (col.dataKey === 'purchaseValue' || col.dataKey === 'currentValue') {
         row[col.dataKey] = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((asset as any)[col.dataKey]);
      } else {
        row[col.dataKey] = (asset as any)[col.dataKey];
      }
    });
    return row;
  });

  doc.autoTable({
    head: [tableColumn.map(col => col.header)],
    body: tableRows.map(row => tableColumn.map(col => row[col.dataKey])),
    startY: 20,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] }, // #3F51B5 (Cor Primária)
    styles: { fontSize: 8 },
  });

  doc.text('Relatório de Ativos Imobilizados', 14, 15);
  doc.save(filename);
};
