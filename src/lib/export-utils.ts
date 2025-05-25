import type { Asset } from '@/components/assets/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToCSV = (assets: Asset[], filename: string = 'assets.csv') => {
  if (assets.length === 0) {
    alert('No data to export.');
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

export const exportToPDF = (assets: Asset[], filename: string = 'assets.pdf') => {
  if (assets.length === 0) {
    alert('No data to export.');
    return;
  }

  const doc = new jsPDF();
  const tableColumn = Object.keys(assets[0]).map(key => ({
    header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), // Add space before capitals and capitalize first letter
    dataKey: key
  }));
  const tableRows = assets.map(asset => {
    const row: { [key: string]: any } = {};
    tableColumn.forEach(col => {
      row[col.dataKey] = (asset as any)[col.dataKey];
    });
    return row;
  });

  doc.autoTable({
    head: [tableColumn.map(col => col.header)],
    body: tableRows.map(row => tableColumn.map(col => row[col.dataKey])),
    startY: 20,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] }, // #3F51B5
    styles: { fontSize: 8 },
  });

  doc.text('Fixed Assets Report', 14, 15);
  doc.save(filename);
};
