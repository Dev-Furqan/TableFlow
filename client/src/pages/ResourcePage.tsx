import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Search,Plus,MoreHorizontal,Download,AlertTriangle,RefreshCcw} from 'lucide-react';
import {api,messageOf} from '../services/api';
import {Badge,Button,Card,Empty,Field,Modal} from '../components/ui';
import {useToast} from '../store/toast';

const configs:any={
  'menu-items':{subtitle:'Products, prices, stations and availability.',cols:['name','sku','price','kitchenStation','available'],fields:[['name','Name'],['category','Category'],['sku','SKU'],['price','Price','number'],['cost','Cost','number'],['kitchenStation','Kitchen station']]},
  inventory:{subtitle:'Track stock levels, low-stock alerts, and ingredient values.',cols:['name','sku','unit','currentStock','minimumStock','costPrice'],fields:[['name','Name'],['sku','SKU'],['unit','Unit'],['currentStock','Current stock','number'],['minimumStock','Minimum stock','number'],['costPrice','Cost price','number']]},
  recipes:{subtitle:'Ingredient usage, food cost and margin by dish.',cols:['menuItem','ingredients','costPerServing'],fields:[]},
  customers:{subtitle:'Guest profiles, loyalty and order history.',cols:['name','phone','email','loyaltyPoints','totalSpent'],fields:[['name','Name'],['phone','Phone'],['email','Email'],['address','Address']]},
  suppliers:{subtitle:'Vendor contacts, purchases and balances.',cols:['name','contact','email','outstandingBalance'],fields:[['name','Name'],['contact','Contact'],['email','Email'],['address','Address']]},
  purchases:{subtitle:'Purchase orders, receiving and payments.',cols:['number','supplier','total','paymentStatus','received'],fields:[['number','PO number'],['total','Total','number'],['paymentStatus','Payment status']]},
  expenses:{subtitle:'Operating costs by date and category.',cols:['category','date','amount','paymentMethod','note'],fields:[['category','Category'],['date','Date','date'],['amount','Amount','number'],['paymentMethod','Payment method'],['note','Note']]},
  staff:{subtitle:'Team members, roles, branches and performance.',cols:['name','email','phone','role','status'],fields:[['name','Name'],['email','Email'],['phone','Phone'],['role','Role'],['status','Status'],['password','Password','password']]}
};

const moneyKeys=['price','cost','amount','total','costPrice','totalSpent','outstandingBalance'];
const roleOptions=['owner','manager','cashier','waiter','kitchen','rider','accountant','viewer'];
const statusOptions=['active','inactive'];
const display=(v:any,key:string)=>{if(v==null)return '-';if(Array.isArray(v))return `${v.length} items`;if(typeof v==='object')return v.name||v.label||'-';if(key.toLowerCase().includes('date'))return new Date(v).toLocaleDateString();if(moneyKeys.includes(key))return `Rs ${Number(v).toLocaleString()}`;return String(v);};

export default function ResourcePage({endpoint,title}:{endpoint:string;title:string}) {
  if(endpoint==='reports/accounting')return <Accounting/>;
  const cfg=configs[endpoint]||{subtitle:'Manage your restaurant records.',cols:['name'],fields:[['name','Name']]};
  const [search,setSearch]=useState('');
  const [edit,setEdit]=useState<any>(null);
  const qc=useQueryClient(),toast=useToast();
  const {data,isLoading}=useQuery({queryKey:[endpoint,search],queryFn:()=>api.get(`/${endpoint}`,{params:{search,limit:100}}).then(r=>r.data)});
  const rows=data?.data||[];
  const save=async(e:any)=>{e.preventDefault();const body:any=Object.fromEntries(new FormData(e.currentTarget));cfg.fields.forEach((f:any)=>{if(f[2]==='number')body[f[0]]=Number(body[f[0]]);});if(body.password==='')delete body.password;try{if(edit?._id)await api.patch(`/${endpoint}/${edit._id}`,body);else await api.post(`/${endpoint}`,body);toast.push(`${title.replace(/s$/,'')} saved`);setEdit(null);qc.invalidateQueries({queryKey:[endpoint]});}catch(e){toast.push(messageOf(e),'error');}};

  const lowStock=endpoint==='inventory'?rows.filter((x:any)=>x.currentStock<=x.minimumStock).length:0;
  const stockValue=endpoint==='inventory'?rows.reduce((sum:number,x:any)=>sum+(Number(x.currentStock)||0)*(Number(x.costPrice)||0),0):0;

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
        <Button variant="secondary"><Download size={16}/>Export</Button>
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
      <div className="overflow-x-auto"><table><thead><tr>{cfg.cols.map((c:string)=><th key={c}>{c.replace(/([A-Z])/g,' $1')}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map((row:any)=><tr key={row._id}>{cfg.cols.map((c:string)=><td key={c}>{c==='status'||c==='paymentStatus'||typeof row[c]==='boolean'?<Badge>{display(row[c],c)}</Badge>:c==='currentStock'&&row.currentStock<=row.minimumStock?<span className="flex items-center gap-1 font-semibold text-rose-300"><AlertTriangle size={15}/>{display(row[c],c)}</span>:display(row[c],c)}</td>)}<td><button onClick={()=>setEdit(row)} className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table>{!isLoading&&!rows.length&&<Empty title={`No ${title.toLowerCase()} found`}/>}</div>
    </Card>

    <Modal open={!!edit} onClose={()=>setEdit(null)} title={`${edit?._id?'Edit':'Add'} ${title.replace(/s$/,'')}`}>
      <form onSubmit={save} className="space-y-4 p-5">{cfg.fields.map(([name,label,type='text']:any)=><ResourceField key={name} name={name} label={label} type={type} value={edit?.[name]} required={['name','category','amount'].includes(name)}/>)}<Button className="w-full">Save</Button></form>
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
  const {data}=useQuery({queryKey:['accounting'],queryFn:()=>api.get('/reports/accounting').then(r=>r.data.data)});
  return <div className="space-y-7">
    <div className="border-b border-zinc-800 pb-7"><h2 className="text-3xl font-extrabold text-white">Accounting</h2><p className="mt-2 text-zinc-400">A concise view of money in, money out and profit.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Object.entries(data||{}).map(([k,v]:any)=><Card className="p-5" key={k}><div className="text-sm capitalize text-zinc-500">{k.replace(/([A-Z])/g,' $1')}</div><div className={`mt-2 text-2xl font-black ${k==='netProfit'?'text-emerald-300':'text-white'}`}>Rs {Math.round(v).toLocaleString()}</div></Card>)}</div>
    <Card className="p-6"><h3 className="font-extrabold text-white">Cash session</h3><p className="mt-1 text-sm text-zinc-500">Open a shift to track cash movements and reconcile the drawer.</p><div className="mt-5 flex max-w-xl gap-3"><Field label="Opening cash" type="number" placeholder="0"/><Button className="mt-6">Open session</Button></div></Card>
  </div>;
}
