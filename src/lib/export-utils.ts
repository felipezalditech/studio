
import type { Asset } from '@/components/assets/types';
import type { AssetWithCalculatedValues } from '@/app/assets/page';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { parseISO, format as formatDateFn } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const doc = new jsPDF({ orientation: 'landscape' });

  const defaultColumns: PdfColumn[] = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Data Compra', dataKey: 'purchaseDate' },
    { header: 'Nome', dataKey: 'name' },
    { header: 'Patrimônio', dataKey: 'assetTag' },
    { header: 'Nº Fiscal', dataKey: 'invoiceNumber' },
    { header: 'Nº Série', dataKey: 'serialNumber' },
    { header: 'Categoria', dataKey: 'categoryName' },
    { header: 'Fornecedor', dataKey: 'supplierName' },
    { header: 'Local Alocado', dataKey: 'locationName' },
    { header: 'Vlr. Compra', dataKey: 'purchaseValue' },
    { header: 'Vlr. Já Deprec.', dataKey: 'previouslyDepreciatedValue' },
    { header: 'Deprec. Total', dataKey: 'depreciatedValue' },
    { header: 'Vlr. Atual', dataKey: 'calculatedCurrentValue' },
    { header: 'Info Adicional', dataKey: 'additionalInfo'},
  ];

  const tableColumnsToUse = columns || defaultColumns;

  const tableRows = assets.map(asset => {
    const row: { [key: string]: any } = {};
    tableColumnsToUse.forEach(col => {
      const dataKey = col.dataKey as keyof AssetWithCalculatedValues;
      let value = asset[dataKey as keyof AssetWithCalculatedValues];

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
        row[dataKey] = value === undefined || value === null ? 'N/A' : String(value);
      }
    });
    return row;
  });

  doc.autoTable({
    head: [tableColumnsToUse.map(col => col.header)],
    body: tableRows.map(row => tableColumnsToUse.map(col => row[col.dataKey])),
    startY: 20,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] }, // Azul Indigo
    styles: { fontSize: 5, cellPadding: 1, overflow: 'linebreak' },
    columnStyles: {
      id: { cellWidth: 8 },
      purchaseDate: { cellWidth: 12 },
      name: { cellWidth: 25 },
      assetTag: {cellWidth: 12},
      invoiceNumber: {cellWidth: 12},
      serialNumber: {cellWidth: 12},
      categoryName: {cellWidth: 15},
      supplierName: {cellWidth: 18},
      locationName: {cellWidth: 18},
      purchaseValue: {cellWidth: 15, halign: 'right'},
      previouslyDepreciatedValue: {cellWidth: 15, halign: 'right'},
      depreciatedValue: {cellWidth: 15, halign: 'right'},
      calculatedCurrentValue: {cellWidth: 15, halign: 'right'},
      additionalInfo: { cellWidth: 25}
    },
    didDrawPage: (data) => {
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text('Relatório de Ativos Imobilizados', data.settings.margin.left, 15);

        const pageCount = doc.getNumberOfPages ? doc.getNumberOfPages() : (doc.internal as any).getNumberOfPages();
        doc.setFontSize(8);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Página ${i} de ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    }
  });

  doc.save(filename);
};
