import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'csv'|'pdf';
export type ExportColumn = {key:string; label:string; value?:(row:any)=>unknown};

const cleanFileName=(value:string)=>value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||'export';
const printable=(value:unknown):string=>{
  if(value===null||value===undefined) return '';
  if(value instanceof Date) return value.toLocaleDateString();
  if(Array.isArray(value)) return value.map(printable).join(', ');
  if(typeof value==='object') {
    const record=value as Record<string,unknown>;
    return String(record.name??record.label??record._id??'');
  }
  return String(value);
};

const csvCell=(value:string)=>`"${value.replaceAll('"','""')}"`;

const downloadCsv=(headers:string[],values:string[][],fileName:string)=>{
  const csv=[headers,...values].map(row=>row.map(csvCell).join(',')).join('\r\n');
  const blob=new Blob([`\uFEFF${csv}`],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download=`${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export function downloadTable({title,columns,rows,format}:{title:string;columns:ExportColumn[];rows:any[];format:ExportFormat}) {
  const fileName=`${cleanFileName(title)}-${new Date().toISOString().slice(0,10)}`;
  const values=rows.map(row=>columns.map(column=>printable(column.value?column.value(row):row[column.key])));
  const headers=columns.map(column=>column.label);

  if(format==='csv') {
    downloadCsv(headers,values,fileName);
    return;
  }

  const document=new jsPDF({orientation:columns.length>5?'landscape':'portrait'});
  document.setFontSize(16);
  document.text(title,14,16);
  document.setFontSize(9);
  document.text(`Created ${new Date().toLocaleString()}`,14,22);
  autoTable(document,{head:[headers],body:values,startY:28,styles:{fontSize:8,cellPadding:2},headStyles:{fillColor:[39,39,42]}});
  document.save(`${fileName}.pdf`);
}
