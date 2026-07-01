import {useMemo,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Bike,Clock3,Phone,RefreshCcw,Search,UserCheck,UserX} from 'lucide-react';
import {api,messageOf} from '../services/api';
import {Badge,Button,Card,Empty} from '../components/ui';
import {useToast} from '../store/toast';
import type {Order} from '../types';

const closed=['completed','cancelled','refunded'];
const money=(n:number)=>`Rs ${Math.round(n||0).toLocaleString()}`;

export default function Riders() {
  const [search,setSearch]=useState('');
  const [updating,setUpdating]=useState('');
  const qc=useQueryClient();
  const toast=useToast();
  const {data:staff=[]}=useQuery({queryKey:['riders-staff'],queryFn:()=>api.get('/staff?limit=100').then(r=>r.data.data)});
  const {data:orders=[]}=useQuery({queryKey:['rider-open-orders'],queryFn:()=>api.get('/orders',{params:{type:'delivery',limit:100}}).then(r=>r.data.data.filter((o:Order)=>!closed.includes(o.status)))});
  const riders=useMemo(()=>staff.filter((u:any)=>u.role==='rider'&&`${u.name} ${u.phone||''} ${u.email||''}`.toLowerCase().includes(search.toLowerCase())),[staff,search]);
  const assigned=(id:string)=>orders.filter((o:Order)=>String(o.rider?._id||o.rider)===String(id));
  const available=riders.filter((r:any)=>r.status!=='inactive'&&!assigned(r._id).length).length;
  const busy=riders.filter((r:any)=>assigned(r._id).length).length;
  const setRiderStatus=async(rider:any,status:'active'|'inactive')=> {
    setUpdating(rider._id);
    const previous=qc.getQueryData<any[]>(['riders-staff']);
    qc.setQueryData<any[]>(['riders-staff'],(rows=[])=>(rows as any[]).map((r:any)=>r._id===rider._id?{...r,status}:r));
    try{
      const {data}=await api.patch(`/staff/${rider._id}/status`,{status});
      qc.setQueryData<any[]>(['riders-staff'],(rows=[])=>(rows as any[]).map((r:any)=>r._id===rider._id?data.data:r));
      toast.push(`${rider.name} marked ${status==='active'?'available':'unavailable'}`);
    }catch(e){
      qc.setQueryData(['riders-staff'],previous);
      toast.push(messageOf(e),'error');
    }finally{setUpdating('');}
  };

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-5 border-b border-zinc-800 pb-7 xl:flex-row xl:items-end">
      <div>
        <h2 className="text-3xl font-extrabold text-white">Rider Management</h2>
        <p className="mt-2 text-zinc-400">Availability, assigned delivery orders, and rider contact details.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Metric label="Riders" value={riders.length}/>
          <Metric label="Available" value={available} tone="text-emerald-300"/>
          <Metric label="On delivery" value={busy} tone="text-amber-300"/>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={()=>{qc.invalidateQueries({queryKey:['riders-staff']});qc.invalidateQueries({queryKey:['rider-open-orders']});}}><RefreshCcw size={16}/>Refresh</Button>
        <Button onClick={()=>location.assign('/staff')}>Manage staff</Button>
      </div>
    </div>

    <label className="relative block max-w-xl">
      <Search className="absolute left-4 top-3.5 text-zinc-500" size={18}/>
      <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-3 text-sm outline-none focus:border-zinc-500" placeholder="Search riders..."/>
    </label>

    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {riders.map((r:any)=> {
        const jobs=assigned(r._id);
        const isInactive=r.status==='inactive';
        const isAvailable=!isInactive&&!jobs.length;
        const statusLabel=isInactive?'Unavailable':jobs.length?'On delivery':'Available';
        return <Card key={r._id} className={`overflow-hidden p-5 ${isAvailable?'border-emerald-500/30':jobs.length?'border-amber-500/30':'border-rose-500/30'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-zinc-800 text-zinc-300"><Bike size={22}/></span>
              <div className="min-w-0"><h3 className="truncate text-lg font-black text-white">{r.name}</h3><p className="truncate text-sm text-zinc-500">{r.email}</p></div>
            </div>
            <Badge tone={isAvailable?'available':jobs.length&&!isInactive?'pending':'inactive'}>{statusLabel}</Badge>
          </div>
          <div className="mt-5 grid gap-3 border-t border-zinc-800 pt-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2"><Phone size={15}/>{r.phone||'No phone'}</div>
            <div className="flex items-center gap-2">{r.status==='inactive'?<UserX size={15}/>:<UserCheck size={15}/>}Staff status: <span className="font-semibold capitalize text-zinc-200">{r.status||'active'}</span></div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant={isInactive?'secondary':'primary'} loading={updating===r._id} disabled={updating===r._id||!isInactive} onClick={()=>setRiderStatus(r,'active')}><UserCheck size={16}/>Available</Button>
            <Button variant={isInactive?'primary':'secondary'} loading={updating===r._id} disabled={updating===r._id||isInactive} onClick={()=>setRiderStatus(r,'inactive')}><UserX size={16}/>Unavailable</Button>
          </div>
          <div className="mt-5">
            <div className="mb-2 text-xs font-black uppercase tracking-wide text-zinc-500">Current orders</div>
            {jobs.length?<div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">{jobs.map((o:Order)=><div key={o._id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0"><div className="font-bold text-white">{o.orderNumber}</div><div className="truncate text-zinc-500">{o.deliveryAddress||o.customerName||'Delivery order'}</div></div>
              <div className="shrink-0 text-right"><div className="font-black text-white">{money(o.total)}</div><div className="flex items-center gap-1 text-xs capitalize text-zinc-500"><Clock3 size={12}/>{o.status.replaceAll('-',' ')}</div></div>
            </div>)}</div>:<Empty title="No active delivery" text=""/>}
          </div>
        </Card>;
      })}
      {!riders.length&&<div className="lg:col-span-2 2xl:col-span-3"><Empty title="No riders found" text="Add rider staff accounts from Staff."/></div>}
    </div>
  </div>;
}

function Metric({label,value,tone='text-white'}:{label:string;value:any;tone?:string}) {
  return <div className="rounded-2xl border border-zinc-800 bg-[#171719] px-5 py-4"><div className="text-xs font-semibold text-zinc-500">{label}</div><div className={`mt-1 text-xl font-black ${tone}`}>{value}</div></div>;
}
