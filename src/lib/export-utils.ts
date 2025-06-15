
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
  columns?: PdfColumn[],
  logoDataUri?: string
) => {
  if (assets.length === 0) {
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape' });
  const pageMargin = 10;
  let logoFinalWidth = 0;
  let logoFinalHeight = 0;

  if (logoDataUri) {
    try {
      const imgProps = doc.getImageProperties(logoDataUri);
      const aspectRatio = imgProps.width / imgProps.height;
      let logoWidth = 30; 
      let logoHeight = logoWidth / aspectRatio;
      const maxLogoHeight = 15; 
      if (logoHeight > maxLogoHeight) {
        logoHeight = maxLogoHeight;
        logoWidth = logoHeight * aspectRatio;
      }
      logoFinalWidth = logoWidth;
      logoFinalHeight = logoHeight;
      doc.addImage(logoDataUri, imgProps.format.toUpperCase(), pageMargin, pageMargin, logoFinalWidth, logoFinalHeight);
    } catch (e) {
      console.error("Erro ao adicionar logo ao PDF:", e);
    }
  }
  
  const defaultColumns: PdfColumn[] = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Data Compra', dataKey: 'purchaseDate' },
    { header: 'Nome', dataKey: 'name' },
    { header: 'Modelo', dataKey: 'modelName'}, 
    { header: 'Patrimônio', dataKey: 'assetTag' },
    { header: 'Deprec.?', dataKey: 'aplicarRegrasDepreciacao'}, // Nova coluna
    { header: 'Nota Fiscal', dataKey: 'invoiceNumber' },
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
      let value: any;
      if (col.dataKey === 'modelName') {
        value = asset.modelName;
      } else if (col.dataKey === 'categoryName') {
        value = asset.categoryName;
      } else if (col.dataKey === 'supplierName') {
        value = asset.supplierName;
      } else if (col.dataKey === 'locationName') {
        value = asset.locationName;
      } else {
         value = asset[col.dataKey as keyof AssetWithCalculatedValues];
      }

      if (col.dataKey === 'aplicarRegrasDepreciacao') {
        row[col.dataKey] = value ? 'Sim' : 'Não';
      } else if (col.dataKey === 'purchaseValue' || col.dataKey === 'depreciatedValue' || col.dataKey === 'calculatedCurrentValue' || col.dataKey === 'previouslyDepreciatedValue') {
        row[col.dataKey] = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number);
      } else if (col.dataKey === 'purchaseDate' && typeof value === 'string') {
         try {
            const date = parseISO(value);
            row[col.dataKey] = formatDateFn(date, 'dd/MM/yyyy', { locale: ptBR });
          } catch (e) {
            row[col.dataKey] = value;
          }
      } else {
        row[col.dataKey] = value === undefined || value === null ? 'N/A' : String(value);
      }
    });
    return row;
  });

  const tableStartY = pageMargin + (logoDataUri && logoFinalHeight > 0 ? logoFinalHeight + 5 : 0);


  doc.autoTable({
    head: [tableColumnsToUse.map(col => col.header)],
    body: tableRows.map(row => tableColumnsToUse.map(col => row[col.dataKey])),
    startY: tableStartY,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] },
    styles: { fontSize: 5, cellPadding: 1, overflow: 'linebreak' },
    columnStyles: {
      id: { cellWidth: 7 },
      purchaseDate: { cellWidth: 11 },
      name: { cellWidth: 18 },
      modelName: { cellWidth: 13 }, 
      assetTag: {cellWidth: 11},
      aplicarRegrasDepreciacao: { cellWidth: 9, halign: 'center' }, // Nova coluna
      invoiceNumber: {cellWidth: 11},
      serialNumber: {cellWidth: 11},
      categoryName: {cellWidth: 13},
      supplierName: {cellWidth: 13},
      locationName: {cellWidth: 13},
      purchaseValue: {cellWidth: 13, halign: 'right'},
      previouslyDepreciatedValue: {cellWidth: 13, halign: 'right'},
      depreciatedValue: {cellWidth: 13, halign: 'right'},
      calculatedCurrentValue: {cellWidth: 13, halign: 'right'},
      additionalInfo: { cellWidth: 18}
    },
    didDrawPage: (dataHook) => {
        doc.setFontSize(16);
        doc.setTextColor(40);
        const titleX = pageMargin + (logoDataUri && logoFinalWidth > 0 ? logoFinalWidth + 5 : 0);
        const titleY = pageMargin + (logoDataUri && logoFinalHeight > 0 ? logoFinalHeight / 2 : 0); 
        
        doc.text('Relatório de Ativos Imobilizados', titleX, titleY, { baseline: 'middle' });


        const pageCount = doc.getNumberOfPages ? doc.getNumberOfPages() : (doc.internal as any).getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Página ${dataHook.pageNumber} de ${pageCount}`, dataHook.settings.margin.left, doc.internal.pageSize.height - 10);
    }
  });

  doc.save(filename);
};
