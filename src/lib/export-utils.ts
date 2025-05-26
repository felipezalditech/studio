
import type { Asset } from '@/components/assets/types'; 
import type { AssetWithCalculatedValues } from '@/app/assets/page'; 
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { parseISO, format as formatDateFn } from 'date-fns'; // Import directly
import { ptBR } from 'date-fns/locale'; // Import directly

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type CsvExportData = Record<string, any>;


export const exportToCSV = (data: CsvExportData[], filename: string = 'ativos.csv') => {
  if (data.length === 0) {
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), 
    ...data.map(row =>
      headers.map(fieldName =>
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

interface PdfColumn {
  header: string;
  dataKey: keyof AssetWithCalculatedValues | string; 
}

export const exportToPDF = (
  assets: AssetWithCalculatedValues[],
  filename: string = 'ativos.pdf',
  columns?: PdfColumn[] 
) => {
  if (assets.length === 0) {
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape' }); // Landscape for more columns

  const defaultColumns: PdfColumn[] = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Data Compra', dataKey: 'purchaseDate' },
    { header: 'Nome', dataKey: 'name' },
    { header: 'Patrimônio', dataKey: 'assetTag' },
    { header: 'Nº Fiscal', dataKey: 'invoiceNumber' },
    { header: 'Nº Série', dataKey: 'serialNumber' },
    { header: 'Categoria', dataKey: 'categoryName' },
    { header: 'Fornecedor', dataKey: 'supplierName' },
    { header: 'Vlr. Compra', dataKey: 'purchaseValue' },
    { header: 'Vlr. Já Deprec.', dataKey: 'previouslyDepreciatedValue' },
    { header: 'Deprec. Total', dataKey: 'depreciatedValue' },
    { header: 'Vlr. Atual', dataKey: 'calculatedCurrentValue' },
  ];

  const tableColumnsToUse = columns || defaultColumns;

  const tableRows = assets.map(asset => {
    const row: { [key: string]: any } = {};
    tableColumnsToUse.forEach(col => {
      const dataKey = col.dataKey as keyof AssetWithCalculatedValues;
      const value = asset[dataKey];

      if (dataKey === 'purchaseValue' || dataKey === 'depreciatedValue' || dataKey === 'calculatedCurrentValue' || dataKey === 'previouslyDepreciatedValue') {
        row[dataKey] = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number);
      } else if (dataKey === 'purchaseDate' && typeof value === 'string') {
         try {
            const date = parseISO(value);
            row[dataKey] = formatDateFn(date, 'dd/MM/yyyy', { locale: ptBR });
          } catch (e) {
            row[dataKey] = value; 
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
    headStyles: { fillColor: [63, 81, 181] }, 
    styles: { fontSize: 6, cellPadding: 1 }, 
    columnStyles: { 
      id: { cellWidth: 12 },
      purchaseDate: { cellWidth: 18 },
      name: { cellWidth: 35 }, 
      assetTag: {cellWidth: 18},
      invoiceNumber: {cellWidth: 18},
      serialNumber: {cellWidth: 18},
      categoryName: {cellWidth: 20},
      supplierName: {cellWidth: 25},
      purchaseValue: {cellWidth: 20, halign: 'right'},
      previouslyDepreciatedValue: {cellWidth: 20, halign: 'right'},
      depreciatedValue: {cellWidth: 20, halign: 'right'},
      calculatedCurrentValue: {cellWidth: 20, halign: 'right'},
    },
    didDrawPage: (data) => {
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text('Relatório de Ativos Imobilizados', data.settings.margin.left, 15);

        const pageCount = doc.getNumberOfPages(); 
        doc.setFontSize(8);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Página ${i} de ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    }
  });

  doc.save(filename);
};
