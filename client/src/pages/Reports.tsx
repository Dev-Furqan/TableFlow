import {useState} from 'react';
import {Download,TrendingUp,ShoppingBag,Receipt,Wallet,Printer} from 'lucide-react';
import {useQuery} from '@tanstack/react-query';
import {api} from '../services/api';
import {Button,Card,Field} from '../components/ui';
import {BarChart,Bar,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {downloadTable,type ExportFormat} from '../utils/export';

const money=(value:number)=>`Rs ${Math.round(value||0).toLocaleString()}`;
const label=(value:string)=>value.replaceAll('-',' ').replace(/\b\w/g,letter=>letter.toUpperCase());

function printDailySales(sales:any,restaurant:any) {
  const popup=window.open('','daily-sales-slip','width=420,height=720');
  if(!popup)return;
  const business=restaurant?.name||'Sales Report';
  const payments=(sales.payments||[]).map((payment:any)=>`<div class="row"><span>${label(payment.method)}</span><strong>${money(payment.amount)}</strong></div>`).join('')||'<div class="row"><span>No payments recorded</span><strong>Rs 0</strong></div>';
  popup.document.write(`<!doctype html><html><head><title>Daily sales ${sales.date}</title><style>@page{margin:4mm;size:80mm auto}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#111;font-size:11px}.slip{width:72mm;margin:auto;padding:3mm}.center{text-align:center}.title{font-size:17px;font-weight:800}.muted{color:#555}.rule{border-top:1px dashed #111;margin:10px 0}.row{display:flex;justify-content:space-between;gap:12px;margin:5px 0}.total{font-size:15px;font-weight:800}</style></head><body><main class="slip"><div class="center"><div class="title">${business}</div><strong>DAILY SALES</strong><div class="muted">${sales.date}</div></div><div class="rule"></div><div class="row"><span>Completed orders</span><strong>${sales.orders}</strong></div><div class="row"><span>Sub total</span><strong>${money(sales.subtotal)}</strong></div>${sales.discount?`<div class="row"><span>Discount</span><strong>- ${money(sales.discount)}</strong></div>`:''}<div class="row"><span>Tax</span><strong>${money(sales.tax)}</strong></div>${sales.serviceCharge?`<div class="row"><span>Service charge</span><strong>${money(sales.serviceCharge)}</strong></div>`:''}<div class="rule"></div><div class="row total"><span>NET SALES</span><span>${money(sales.sales)}</span></div><div class="rule"></div><strong>PAYMENT SUMMARY</strong>${payments}<div class="rule"></div><div class="center muted">Generated ${new Date().toLocaleString()}</div></main><script>window.onload=()=>{window.focus();window.print();setTimeout(()=>window.close(),400)}</script></body></html>`);
  popup.document.close();
}

export default function Reports() {
  const [from,setFrom]=useState(new Date(Date.now()-30*864e5).toISOString().slice(0,10)),[to,setTo]=useState(new Date().toISOString().slice(0,10));
  const [salesDate,setSalesDate]=useState(new Date().toISOString().slice(0,10));
  const [exportFormat,setExportFormat]=useState<ExportFormat>('csv');
  const {data={}}=useQuery({queryKey:['reports',from,to],queryFn:()=>api.get('/reports/accounting',{params:{from,to}}).then(r=>r.data.data)});
  const {data:dailySales,isLoading:loadingDailySales}=useQuery({queryKey:['daily-sales',salesDate],queryFn:()=>api.get('/reports/daily-sales',{params:{date:salesDate}}).then(r=>r.data.data)});
  const {data:settings=[]}=useQuery({queryKey:['settings'],queryFn:()=>api.get('/settings?limit=100').then(r=>r.data.data).catch(()=>[])});
  const chart=[{name:'Sales',value:data.sales||0},{name:'Purchases',value:data.purchases||0},{name:'Expenses',value:data.expenses||0},{name:'Net profit',value:data.netProfit||0}];
  const exportReport=(title='Sales report')=>downloadTable({title,format:exportFormat,rows:chart,columns:[{key:'name',label:'Metric'},{key:'value',label:'Amount (Rs)'}]});

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 border-b border-zinc-800 pb-7 sm:flex-row sm:items-end">
      <div><h2 className="text-3xl font-extrabold text-white">Sales Reports</h2><p className="mt-2 text-zinc-400">Turn service activity into useful decisions.</p></div>
      <div className="flex gap-2"><select className="dark-input min-w-44"><option>Today</option><option>This week</option><option>This month</option></select><select value={exportFormat} onChange={event=>setExportFormat(event.target.value as ExportFormat)} aria-label="Export format" className="dark-input"><option value="csv">CSV</option><option value="pdf">PDF</option></select><Button variant="secondary" onClick={()=>exportReport()}><Download size={17}/>Export</Button></div>
    </div>

    <Card className="flex flex-wrap items-end gap-3 p-4">
      <Field label="From" type="date" value={from} onChange={(e:any)=>setFrom(e.target.value)}/>
      <Field label="To" type="date" value={to} onChange={(e:any)=>setTo(e.target.value)}/>
      <label className="block text-sm font-medium text-zinc-300">Branch<select className="dark-input mt-1.5 block"><option>All branches</option><option>Downtown</option></select></label>
    </Card>

    <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-end">
      <div><h3 className="font-extrabold text-white">Daily sales slip</h3><p className="mt-1 text-sm text-zinc-500">Generate and print all completed sales for one day.</p></div>
      <div className="flex flex-wrap items-end gap-3"><Field label="Sales date" type="date" value={salesDate} onChange={(event:any)=>setSalesDate(event.target.value)}/><div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5"><div className="text-xs text-zinc-500">Net sales</div><div className="font-black text-white">{money(dailySales?.sales||0)}</div></div><Button loading={loadingDailySales} onClick={()=>printDailySales(dailySales,settings.find((setting:any)=>setting.key==='restaurant')?.value)}><Printer size={17}/>Print slip</Button></div>
    </Card>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[['Sales',data.sales,TrendingUp],['Purchases',data.purchases,ShoppingBag],['Expenses',data.expenses,Receipt],['Net profit',data.netProfit,Wallet]].map(([label,value,Icon]:any)=><Card key={label} className="p-6"><div className="flex items-start justify-between"><div><div className="text-sm text-zinc-400">{label}</div><div className="mt-3 text-3xl font-black text-white">Rs {Math.round(value||0).toLocaleString()}</div></div><Icon className="text-zinc-400"/></div></Card>)}
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <Card className="p-6">
        <h3 className="font-extrabold text-white">Financial overview</h3>
        <div className="mt-5 h-80"><ResponsiveContainer><BarChart data={chart}><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#27272a"/><XAxis dataKey="name" tick={{fill:'#a1a1aa'}}/><YAxis tick={{fill:'#a1a1aa'}} tickFormatter={v=>`${v/1000}k`}/><Tooltip contentStyle={{background:'#171719',border:'1px solid #3f3f46',borderRadius:12,color:'#fff'}} formatter={(v:any)=>`Rs ${v.toLocaleString()}`}/><Bar dataKey="value" fill="#f5f5f7" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div>
      </Card>
      <Card className="p-6">
        <h3 className="font-extrabold text-white">Report library</h3>
        <div className="mt-4 divide-y divide-zinc-800">{['Sales by item','Sales by category','Sales by staff','Inventory status','Profit & loss','Table utilisation'].map(x=><button key={x} onClick={()=>exportReport(x)} className="flex w-full items-center justify-between py-3 text-sm font-semibold text-zinc-300 hover:text-white"><span>{x}</span><Download size={15}/></button>)}</div>
      </Card>
    </div>
  </div>;
}
