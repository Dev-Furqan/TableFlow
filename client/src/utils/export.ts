import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'xlsx'|'pdf';
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

export function downloadTable({title,columns,rows,format}:{title:string;columns:ExportColumn[];rows:any[];format:ExportFormat}) {
  const fileName=`${cleanFileName(title)}-${new Date().toISOString().slice(0,10)}`;
  const values=rows.map(row=>columns.map(column=>printable(column.value?column.value(row):row[column.key])));
  const headers=columns.map(column=>column.label);

  if(format==='xlsx') {
    const worksheet=XLSX.utils.aoa_to_sheet([headers,...values]);
    worksheet['!cols']=headers.map((header,index)=>({wch:Math.min(40,Math.max(header.length+2,...values.map(row=>(row[index]?.length||0)+2)))}));
    const workbook=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook,worksheet,title.slice(0,31));
    XLSX.writeFile(workbook,`${fileName}.xlsx`);
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
