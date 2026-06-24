import {useEffect,useMemo,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {CheckCircle2,ChefHat,CheckCheck,Clock3,Flame,RefreshCcw,Utensils} from 'lucide-react';
import {api,messageOf} from '../services/api';
import {Button,Badge,Empty} from '../components/ui';
import {useSocket} from '../hooks/useSocket';
import {useToast} from '../store/toast';

type Filter='all'|'sent-to-kitchen'|'preparing'|'ready';
const statusTabs:[Filter,string][]=[['all','All'],['sent-to-kitchen','New'],['preparing','Preparing'],['ready','Ready']];

export default function KDS() {
  const [station,setStation]=useState('all'),[filter,setFilter]=useState<Filter>('all'),[,setTick]=useState(0);
  const qc=useQueryClient(),toast=useToast();
  const {data=[]}=useQuery({queryKey:['kds'],queryFn:()=>api.get('/orders?limit=100').then(r=>r.data.data.filter((o:any)=>['sent-to-kitchen','preparing','ready'].includes(o.status))),refetchInterval:30000});
  useSocket({'kot:sent':()=>qc.invalidateQueries({queryKey:['kds']}),'kot:preparing':()=>qc.invalidateQueries({queryKey:['kds']}),'kot:ready':()=>qc.invalidateQueries({queryKey:['kds']})});
  useEffect(()=>{const id=setInterval(()=>setTick(x=>x+1),30000);return()=>clearInterval(id);},[]);
  const stations=useMemo(()=>['all',...new Set<string>(data.flatMap((o:any)=>o.items.map((i:any)=>i.station).filter(Boolean)))],[data]);
  const visible=data.filter((o:any)=>(filter==='all'||o.status===filter)&&(station==='all'||o.items.some((i:any)=>i.station===station)));
  const counts={all:data.length,new:data.filter((o:any)=>o.status==='sent-to-kitchen').length,preparing:data.filter((o:any)=>o.status==='preparing').length,ready:data.filter((o:any)=>o.status==='ready').length,urgent:data.filter((o:any)=>age(o)>15).length};
  const update=async(o:any,status:string)=>{try{await api.post(`/orders/${o._id}/status`,{status});qc.invalidateQueries({queryKey:['kds']});toast.push(`Ticket ${status.replaceAll('-',' ')}`);}catch(e){toast.push(messageOf(e),'error');}};

  return <div className="-m-4 min-h-[calc(100vh-6rem)] bg-[#0b0b0d] p-4 md:-m-8 md:p-8">
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-zinc-800 pb-5 xl:flex-row xl:items-end">
      <div><div className="flex items-center gap-3"><ChefHat className="text-zinc-400"/><h2 className="text-3xl font-extrabold text-white">Kitchen Display</h2></div><p className="mt-2 text-zinc-400">{data.length} active tickets - Live kitchen board</p></div>
      <div className="flex flex-wrap gap-2">
        {statusTabs.map(([key,label])=><button key={key} onClick={()=>setFilter(key)} className={`category-pill ${filter===key?'active':''}`}>{label}<span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{key==='all'?counts.all:key==='sent-to-kitchen'?counts.new:counts[key]}</span></button>)}
        <Button variant="secondary" onClick={()=>qc.invalidateQueries({queryKey:['kds']})}><RefreshCcw size={16}/>Refresh</Button>
      </div>
    </div>

    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi label="New Orders" value={counts.new} icon={Clock3} tone="text-amber-300"/>
      <Kpi label="Preparing" value={counts.preparing} icon={Utensils} tone="text-sky-300"/>
      <Kpi label="Ready Pickup" value={counts.ready} icon={CheckCircle2} tone="text-emerald-300"/>
      <Kpi label="Urgent" value={counts.urgent} icon={Flame} tone="text-rose-300"/>
    </div>

    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
      {stations.map(s=><button onClick={()=>setStation(s)} key={s} className={`category-pill ${station===s?'active':''}`}>{s}</button>)}
    </div>

    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {visible.map((o:any)=><Ticket key={o._id} order={o} station={station} onUpdate={update}/>)}
    </div>
    {!visible.length&&<Empty title="Kitchen is all clear" text="New tickets will appear here automatically."/>}
  </div>;
}

function Ticket({order,station,onUpdate}:any) {
  const mins=age(order);
  const urgent=mins>15;
  const warning=mins>8;
  const statusLabel=order.status==='sent-to-kitchen'?'New':order.status;
  return <article className={`overflow-hidden rounded-xl border bg-[#171719] shadow-[0_18px_50px_rgba(0,0,0,.22)] ${urgent?'border-rose-500/70':warning?'border-amber-500/70':'border-zinc-800'}`}>
    <header className="border-b border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="truncate text-lg font-black text-white">{order.orderNumber}</div><div className="mt-1 flex flex-wrap gap-2"><Badge>{statusLabel}</Badge><Badge>{order.table?.name||order.type}</Badge></div></div>
        <div className={`flex items-center gap-1 rounded-xl border px-2 py-1 text-sm font-bold ${urgent?'border-rose-500/40 bg-rose-500/10 text-rose-300':warning?'border-amber-500/40 bg-amber-500/10 text-amber-300':'border-zinc-700 bg-zinc-900 text-zinc-200'}`}><Clock3 size={15}/>{mins}m</div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400"><span>Guest: {order.customerName||order.customer?.name||'Walk-in'}</span><span className={urgent?'font-black text-rose-300':'font-bold text-zinc-300'}>{urgent?'Urgent':'On Time'}</span></div>
      {order.deliveryAddress&&<div className="mt-2 truncate text-xs text-zinc-500">{order.deliveryAddress}</div>}
      {order.rider&&<div className="mt-1 text-xs font-semibold text-zinc-300">Rider: {order.rider.name}</div>}
    </header>
    <div className="divide-y divide-zinc-800 px-4">{order.items.filter((i:any)=>station==='all'||i.station===station).map((i:any)=><div className="py-4" key={i._id}><div className="flex justify-between gap-3"><span className="text-base font-black text-white"><span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-lg bg-zinc-800 text-sm">{i.quantity}</span>{i.name}</span><Badge>{i.station}</Badge></div>{i.modifiers?.length>0&&<div className="mt-1 pl-9 text-sm text-zinc-500">+ {i.modifiers.map((m:any)=>m.label).join(', ')}</div>}{i.notes&&<div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-sm font-semibold text-amber-300">{i.notes}</div>}</div>)}</div>
    <footer className="p-4">{order.status==='sent-to-kitchen'?<Button onClick={()=>onUpdate(order,'preparing')} className="w-full"><Flame size={18}/>Start Prep</Button>:order.status==='preparing'?<Button onClick={()=>onUpdate(order,'ready')} className="w-full"><CheckCheck size={18}/>Mark Ready</Button>:<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center font-bold text-emerald-300">Ready for pickup</div>}</footer>
  </article>;
}

function Kpi({label,value,icon:Icon,tone}:{label:string;value:number;icon:any;tone:string}) {
  return <div className="rounded-xl border border-zinc-800 bg-[#171719] p-5"><div className="flex items-center justify-between text-sm text-zinc-500"><span>{label}</span><Icon size={18} className={tone}/></div><div className="mt-3 text-3xl font-black text-white">{value}</div></div>;
}

function age(order:any) {
  return Math.max(0,Math.floor((Date.now()-new Date(order.createdAt).getTime())/60000));
}
