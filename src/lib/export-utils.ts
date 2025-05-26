
import type { Asset } from '@/components/assets/types'; // Base Asset type
import type { AssetWithCalculatedValues } from '@/app/assets/page'; // For PDF/CSV with calculated values
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Type for data passed to exportToCSV - can be simpler if specific fields are chosen
type CsvExportData = Record<string, any>;


export const exportToCSV = (data: CsvExportData[], filename: string = 'ativos.csv') => {
  if (data.length === 0) {
    // alert('Nenhum dado para exportar.'); // Handled by toast in AssetsPage
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(fieldName =>
        // Escape commas and quotes in values
        JSON.stringify(row[fieldName], (_, value) => (value === undefined || value === null) ? '' : value)
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

// Type for PDF column definition
interface PdfColumn {
  header: string;
  dataKey: keyof AssetWithCalculatedValues | string; // Allow string for flexibility if needed
}

export const exportToPDF = (
  assets: AssetWithCalculatedValues[],
  filename: string = 'ativos.pdf',
  columns?: PdfColumn[] // Optional custom columns
) => {
  if (assets.length === 0) {
    // alert('Nenhum dado para exportar.'); // Handled by toast in AssetsPage
    return;
  }

  const doc = new jsPDF();

  // Default columns if not provided
  const defaultColumns: PdfColumn[] = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Data Compra', dataKey: 'purchaseDate' },
    { header: 'Nome', dataKey: 'name' },
    { header: 'Patrimônio', dataKey: 'assetTag' },
    { header: 'Nota Fiscal', dataKey: 'invoiceNumber' },
    { header: 'Nº Série', dataKey: 'serialNumber' },
    { header: 'Categoria', dataKey: 'categoryName' },
    { header: 'Fornecedor', dataKey: 'supplierName' },
    { header: 'Valor Compra', dataKey: 'purchaseValue' },
    { header: 'Valor Depreciado', dataKey: 'depreciatedValue' },
    { header: 'Valor Atual', dataKey: 'calculatedCurrentValue' },
  ];

  const tableColumnsToUse = columns || defaultColumns;

  const tableRows = assets.map(asset => {
    const row: { [key: string]: any } = {};
    tableColumnsToUse.forEach(col => {
      const dataKey = col.dataKey as keyof AssetWithCalculatedValues;
      const value = asset[dataKey];

      if (dataKey === 'purchaseValue' || dataKey === 'depreciatedValue' || dataKey === 'calculatedCurrentValue') {
        row[dataKey] = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number);
      } else if (dataKey === 'purchaseDate' && typeof value === 'string') {
         try {
            const date = parseISO(value);
            row[dataKey] = formatDateFn(date, 'dd/MM/yyyy', { locale: ptBR });
          } catch (e) {
            row[dataKey] = value; // fallback to original string if parsing fails
          }
      } else {
        row[dataKey] = value === undefined || value === null ? 'N/A' : value;
      }
    });
    return row;
  });

  doc.autoTable({
    head: [tableColumnsToUse.map(col => col.header)],
    body: tableRows.map(row => tableColumnsToUse.map(col => row[col.dataKey])),
    startY: 20,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] }, // #3F51B5 (Cor Primária)
    styles: { fontSize: 7, cellPadding: 1.5 }, // Reduced font size and padding
    columnStyles: { // Example to set specific column widths
      id: { cellWidth: 15 },
      purchaseDate: { cellWidth: 20 },
      name: { cellWidth: 'auto' }, // auto will try to fit content
      assetTag: {cellWidth: 20},
      // Add other columns as needed
    },
    didDrawPage: (data) => {
        // Header
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text('Relatório de Ativos Imobilizados', data.settings.margin.left, 15);

        // Footer
        const pageCount = doc.getNumberOfPages(); // jsPDF extension
        doc.setFontSize(10);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Página ${i} de ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    }
  });

  doc.save(filename);
};

// Helper functions from date-fns that might be used in exportToPDF if not already available
const { parseISO, format: formatDateFn } = require('date-fns');
const { ptBR } = require('date-fns/locale');

    