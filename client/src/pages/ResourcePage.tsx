import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Search,Plus,MoreHorizontal,Download,AlertTriangle,RefreshCcw,Trash2} from 'lucide-react';
import {api,messageOf} from '../services/api';
import {Badge,Button,Card,Empty,Field,Modal} from '../components/ui';
import {useToast} from '../store/toast';
import {downloadTable,type ExportFormat} from '../utils/export';

const configs:any={
  'menu-items':{subtitle:'Products, prices, stations and availability.',cols:['name','sku','price','kitchenStation','available'],fields:[['name','Name'],['category','Category'],['sku','SKU'],['price','Price','number'],['cost','Cost','number'],['kitchenStation','Kitchen station']]},
  inventory:{subtitle:'Add custom stock items with your own name, unit, quantity, and cost.',cols:['name','sku','unit','currentStock','minimumStock','costPrice'],fields:[['name','Item name'],['sku','SKU'],['unit','Unit'],['currentStock','Current stock','number'],['minimumStock','Minimum stock','number'],['costPrice','Unit cost','number']]},
  recipes:{subtitle:'Ingredient usage, food cost and margin by dish.',cols:['menuItem','ingredients','costPerServing'],fields:[]},
  customers:{subtitle:'Guest profiles, loyalty and order history.',cols:['name','phone','email','loyaltyPoints','totalSpent'],fields:[['name','Name'],['phone','Phone'],['email','Email'],['address','Address']]},
  suppliers:{subtitle:'Vendor contacts, purchases and balances.',cols:['name','contact','email','outstandingBalance'],fields:[['name','Name'],['contact','Contact'],['email','Email'],['address','Address']]},
  purchases:{subtitle:'Purchase orders, receiving and payments.',cols:['number','supplier','total','paymentStatus','received'],fields:[['number','PO number'],['total','Total','number'],['paymentStatus','Payment status']]},
  expenses:{subtitle:'Record custom operating expenses and their costs.',cols:['name','date','amount','paymentMethod','note'],fields:[['name','Expense name'],['date','Date','date'],['amount','Cost','number'],['paymentMethod','Payment method'],['note','Note']]},
  investments:{subtitle:'Record startup and later investment costs. ROI is calculated from actual sales, purchases and expenses.',cols:['name','date','amount','note'],fields:[['name','Investment item'],['date','Date','date'],['amount','Amount','number'],['note','Note']]},
  staff:{subtitle:'Team members, roles, salary and performance.',cols:['name','email','phone','role','salary','status'],fields:[['name','Name'],['email','Email'],['phone','Phone'],['role','Role'],['salary','Monthly salary','number'],['status','Status'],['password','Password','password']]}
};

const moneyKeys=['price','cost','amount','total','costPrice','totalSpent','outstandingBalance','salary'];
const roleOptions=['owner','manager','cashier','waiter','kitchen','rider','accountant','viewer'];
const statusOptions=['active','inactive'];
const display=(v:any,key:string)=>{if(v==null)return '-';if(Array.isArray(v))return `${v.length} items`;if(typeof v==='object')return v.name||v.label||'-';if(key.toLowerCase().includes('date'))return new Date(v).toLocaleDateString();if(moneyKeys.includes(key))return `Rs ${Number(v).toLocaleString()}`;return String(v);};

export default function ResourcePage({endpoint,title}:{endpoint:string;title:string}) {
  if(endpoint==='reports/accounting')return <Accounting/>;
  if(endpoint==='investments')return <Investment/>;
  const cfg=configs[endpoint]||{subtitle:'Manage your restaurant records.',cols:['name'],fields:[['name','Name']]};
  const [search,setSearch]=useState('');
  const [exportFormat,setExportFormat]=useState<ExportFormat>('xlsx');
  const [edit,setEdit]=useState<any>(null);
  const qc=useQueryClient(),toast=useToast();
  const {data,isLoading}=useQuery({queryKey:[endpoint,search],queryFn:()=>api.get(`/${endpoint}`,{params:{search,limit:100}}).then(r=>r.data)});
  const rows=data?.data||[];
  const save=async(e:any)=>{e.preventDefault();const body:any=Object.fromEntries(new FormData(e.currentTarget));cfg.fields.forEach((f:any)=>{if(f[2]==='number')body[f[0]]=Number(body[f[0]]);});if(body.password==='')delete body.password;try{if(edit?._id)await api.patch(`/${endpoint}/${edit._id}`,body);else await api.post(`/${endpoint}`,body);toast.push(`${title.replace(/s$/,'')} saved`);setEdit(null);qc.invalidateQueries({queryKey:[endpoint]});}catch(e){toast.push(messageOf(e),'error');}};
  const remove=async(row:any)=>{if(!window.confirm(`Remove ${row.name}?`))return;try{await api.delete(`/${endpoint}/${row._id}`);toast.push(`${row.name} removed`);qc.invalidateQueries({queryKey:[endpoint]});}catch(e){toast.push(messageOf(e),'error');}};

  const lowStock=endpoint==='inventory'?rows.filter((x:any)=>x.currentStock<=x.minimumStock).length:0;
  const stockValue=endpoint==='inventory'?rows.reduce((sum:number,x:any)=>sum+(Number(x.currentStock)||0)*(Number(x.costPrice)||0),0):0;
  const exportRows=()=>downloadTable({title,format:exportFormat,rows,columns:cfg.cols.map((key:string)=>({key,label:key.replace(/([A-Z])/g,' $1').replace(/^./,letter=>letter.toUpperCase()),value:(row:any)=>display(row[key],key)}))});

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-5 border-b border-zinc-800 pb-7 xl:flex-row xl:items-end">
      <div>
        <h2 className="text-3xl font-extrabold text-white">{title}</h2>
        <p className="mt-2 text-zinc-400">{cfg.subtitle}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Metric label="Total items" value={rows.length}/>
          {endpoint==='inventory'&&<><Metric label="Low Stock Alerts" value={lowStock} alert/><Metric label="Stock Value" value={`Rs ${stockValue.toLocaleString()}`}/></>}
        </div>
      </div>
      <div className="flex gap-2">
        <select value={exportFormat} onChange={event=>setExportFormat(event.target.value as ExportFormat)} aria-label="Export format" className="dark-input">
          <option value="xlsx">Excel (.xlsx)</option><option value="pdf">PDF (.pdf)</option>
        </select>
        <Button variant="secondary" onClick={exportRows} disabled={!rows.length}><Download size={16}/>Export</Button>
        {cfg.fields.length>0&&<Button onClick={()=>setEdit({})}><Plus size={17}/>Add {title.replace(/s$/,'').toLowerCase()}</Button>}
      </div>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="relative max-w-xl flex-1">
        <Search className="absolute left-4 top-3.5 text-zinc-500" size={18}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-3 text-sm outline-none focus:border-zinc-500" placeholder={`Search ${title.toLowerCase()}...`}/>
      </label>
      {endpoint==='inventory'&&<><button className="category-pill active">All</button><button className="category-pill"><AlertTriangle size={15}/> Low Stock</button><button className="category-pill">Ok</button></>}
      <Button variant="secondary" onClick={()=>qc.invalidateQueries({queryKey:[endpoint]})}><RefreshCcw size={16}/>Refresh</Button>
    </div>

    <Card className="overflow-hidden">
      <div className="overflow-x-auto"><table><thead><tr>{cfg.cols.map((c:string)=><th key={c}>{c.replace(/([A-Z])/g,' $1')}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map((row:any)=><tr key={row._id}>{cfg.cols.map((c:string)=><td key={c}>{c==='status'||c==='paymentStatus'||typeof row[c]==='boolean'?<Badge>{display(row[c],c)}</Badge>:c==='currentStock'&&row.currentStock<=row.minimumStock?<span className="flex items-center gap-1 font-semibold text-rose-300"><AlertTriangle size={15}/>{display(row[c],c)}</span>:display(row[c],c)}</td>)}<td><div className="flex"><button onClick={()=>setEdit(row)} className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"><MoreHorizontal size={18}/></button>{endpoint==='staff'&&<button aria-label={`Remove ${row.name}`} onClick={()=>remove(row)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={17}/></button>}</div></td></tr>)}</tbody></table>{!isLoading&&!rows.length&&<Empty title={`No ${title.toLowerCase()} found`}/>}</div>
    </Card>

    <Modal open={!!edit} onClose={()=>setEdit(null)} title={`${edit?._id?'Edit':'Add'} ${title.replace(/s$/,'')}`}>
      <form onSubmit={save} className="space-y-4 p-5">{cfg.fields.map(([name,label,type='text']:any)=><ResourceField key={name} name={name} label={label} type={type} value={edit?.[name]} required={['name','amount'].includes(name)}/>)}<Button className="w-full">Save</Button></form>
    </Modal>
  </div>;
}

function Metric({label,value,alert}:{label:string;value:any;alert?:boolean}) {
  return <div className="rounded-2xl border border-zinc-800 bg-[#171719] px-5 py-4"><div className="text-xs font-semibold text-zinc-500">{label}</div><div className={`mt-1 text-xl font-black ${alert?'text-rose-300':'text-white'}`}>{value}</div></div>;
}

function ResourceField({name,label,type,value,required}:any) {
  const {data:categories=[]}=useQuery({queryKey:['categories'],queryFn:()=>api.get('/categories').then(r=>r.data.data||[])});
  
  if(name==='role'||name==='status') {
    const options=name==='role'?roleOptions:statusOptions;
    return <label className="block text-sm font-medium text-zinc-300">{label}<select name={name} defaultValue={value||options[0]} required={required} className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-zinc-100 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-white/10">{options.map(option=><option key={option} value={option}>{option.replace('-',' ')}</option>)}</select></label>;
  }
  
  if(name==='category') {
    return <label className="block text-sm font-medium text-zinc-300">{label}<select name={name} defaultValue={value?._id||value||''} required={required} className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-zinc-100 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-white/10"><option value="">Select a category</option>{categories.map((cat:any)=><option key={cat._id} value={cat._id}>{cat.name}</option>)}</select></label>;
  }
  
  return <Field name={name} label={label} type={type} defaultValue={value} required={required}/>;
}

function Accounting() {
  const qc=useQueryClient(),toast=useToast();
  const {data}=useQuery({queryKey:['accounting'],queryFn:()=>api.get('/reports/accounting').then(r=>r.data.data)});
  const {data:session,isLoading}=useQuery({queryKey:['cash-session'],queryFn:()=>api.get('/cash-sessions/current').then(r=>r.data.data)});
  const [openingCash,setOpeningCash]=useState('');const [closingCash,setClosingCash]=useState('');const [saving,setSaving]=useState(false);
  const open=async()=>{try{setSaving(true);await api.post('/cash-sessions',{openingCash:Number(openingCash||0)});setOpeningCash('');toast.push('Cash session opened');qc.invalidateQueries({queryKey:['cash-session']});}catch(e){toast.push(messageOf(e),'error');}finally{setSaving(false)}};
  const close=async()=>{try{setSaving(true);const {data}=await api.post(`/cash-sessions/${session._id}/close`,{closingCash:Number(closingCash||0)});toast.push(`Session closed. Difference: Rs ${Math.round(data.data.difference||0).toLocaleString()}`);setClosingCash('');qc.invalidateQueries({queryKey:['cash-session']});}catch(e){toast.push(messageOf(e),'error');}finally{setSaving(false)}};
  return <div className="space-y-7">
    <div className="border-b border-zinc-800 pb-7"><h2 className="text-3xl font-extrabold text-white">Accounting</h2><p className="mt-2 text-zinc-400">A concise view of money in, money out and profit.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Object.entries(data||{}).map(([k,v]:any)=><Card className="p-5" key={k}><div className="text-sm capitalize text-zinc-500">{k.replace(/([A-Z])/g,' $1')}</div><div className={`mt-2 text-2xl font-black ${k==='netProfit'?'text-emerald-300':'text-white'}`}>Rs {Math.round(v).toLocaleString()}</div></Card>)}</div>
    <Card className="p-6"><h3 className="font-extrabold text-white">Cash session</h3><p className="mt-1 text-sm text-zinc-500">Tracks cash payments from POS and cash expenses from the moment the shift opens.</p>{!isLoading&&!session?<div className="mt-5 flex max-w-xl gap-3"><label className="flex-1 text-sm font-medium text-zinc-300">Opening cash<input value={openingCash} onChange={e=>setOpeningCash(e.target.value)} type="number" min="0" placeholder="0" className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-zinc-100"/></label><Button loading={saving} className="mt-6" onClick={open}>Open session</Button></div>:null}{session&&<div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Opening cash" value={`Rs ${Number(session.openingCash||0).toLocaleString()}`}/><Metric label="Cash sales" value={`Rs ${Number(session.cashSales||0).toLocaleString()}`}/><Metric label="Cash expenses" value={`Rs ${Number(session.cashExpenses||0).toLocaleString()}`}/><Metric label="Expected drawer" value={`Rs ${Number(session.expectedCash||0).toLocaleString()}`}/><div className="xl:col-span-4 flex flex-wrap items-end gap-3 border-t border-zinc-800 pt-4"><label className="w-full max-w-xs text-sm font-medium text-zinc-300">Counted closing cash<input value={closingCash} onChange={e=>setClosingCash(e.target.value)} type="number" min="0" placeholder="0" className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-zinc-100"/></label><Button loading={saving} onClick={close}>Close & reconcile</Button></div></div>}</Card>
  </div>;
}

function Investment(){
  const qc=useQueryClient(),toast=useToast();
  const [edit,setEdit]=useState<any>(null);
  const {data:summary={}}=useQuery({queryKey:['investment-summary'],queryFn:()=>api.get('/reports/investment').then(r=>r.data.data)});
  const {data:rows=[]}=useQuery({queryKey:['investments'],queryFn:()=>api.get('/investments',{params:{limit:100}}).then(r=>r.data.data)});
  const save=async(e:any)=>{e.preventDefault();const body:any=Object.fromEntries(new FormData(e.currentTarget));body.amount=Number(body.amount);try{if(edit?._id)await api.patch(`/investments/${edit._id}`,body);else await api.post('/investments',body);setEdit(null);qc.invalidateQueries({queryKey:['investments']});qc.invalidateQueries({queryKey:['investment-summary']});toast.push('Investment saved');}catch(error){toast.push(messageOf(error),'error')}};
  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-7"><div><h2 className="text-3xl font-extrabold text-white">Investment & ROI</h2><p className="mt-2 text-zinc-400">Measure recovery of your startup capital from live business results.</p></div><Button onClick={()=>setEdit({})}><Plus size={17}/>Add investment</Button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total investment" value={`Rs ${Math.round(summary.totalInvestment||0).toLocaleString()}`}/><Metric label="Net profit" value={`Rs ${Math.round(summary.netProfit||0).toLocaleString()}`}/><Metric label="ROI" value={`${Number(summary.roi||0).toFixed(1)}%`}/><Metric label="Still to recover" value={`Rs ${Math.round(summary.remainingToRecover||0).toLocaleString()}`}/></div>
    <Card className="overflow-hidden"><div className="overflow-x-auto"><table><thead><tr><th>Item</th><th>Date</th><th>Amount</th><th>Note</th></tr></thead><tbody>{rows.map((row:any)=><tr key={row._id}><td className="font-semibold">{row.name}</td><td>{display(row.date,'date')}</td><td>{display(row.amount,'amount')}</td><td>{row.note||'-'}</td></tr>)}</tbody></table>{!rows.length&&<Empty title="No investments recorded" text="Add your startup costs to start measuring ROI."/>}</div></Card>
    <Modal open={!!edit} onClose={()=>setEdit(null)} title="Add investment"><form onSubmit={save} className="space-y-4 p-5"><Field name="name" label="Investment item" defaultValue={edit?.name} required/><Field name="date" label="Date" type="date" defaultValue={edit?.date?.slice?.(0,10)}/><Field name="amount" label="Amount" type="number" defaultValue={edit?.amount} required/><Field name="note" label="Note" defaultValue={edit?.note}/><Button className="w-full">Save investment</Button></form></Modal>
  </div>;
}
