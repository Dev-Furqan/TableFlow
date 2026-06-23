import {useEffect,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Clock3,ChefHat,CheckCheck,Flame} from 'lucide-react';
import {api,messageOf} from '../services/api';
import {Button,Badge,Empty} from '../components/ui';
import {useSocket} from '../hooks/useSocket';
import {useToast} from '../store/toast';

export default function KDS() {
  const [station,setStation]=useState('all'),[,setTick]=useState(0);
  const qc=useQueryClient(),toast=useToast();
  const {data=[]}=useQuery({queryKey:['kds'],queryFn:()=>api.get('/orders?limit=100').then(r=>r.data.data.filter((o:any)=>['sent-to-kitchen','preparing','ready'].includes(o.status))),refetchInterval:30000});
  useSocket({'kot:sent':()=>qc.invalidateQueries({queryKey:['kds']}),'kot:preparing':()=>qc.invalidateQueries({queryKey:['kds']}),'kot:ready':()=>qc.invalidateQueries({queryKey:['kds']})});
  useEffect(()=>{const id=setInterval(()=>setTick(x=>x+1),30000);return()=>clearInterval(id);},[]);
  const stations=['all',...new Set<string>(data.flatMap((o:any)=>o.items.map((i:any)=>i.station)))];
  const update=async(o:any,status:string)=>{try{await api.post(`/orders/${o._id}/status`,{status});qc.invalidateQueries({queryKey:['kds']});toast.push(`Ticket ${status}`);}catch(e){toast.push(messageOf(e),'error');}};

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 border-b border-zinc-800 pb-7 sm:flex-row sm:items-end">
      <div><div className="flex items-center gap-2"><ChefHat className="text-zinc-400"/><h2 className="text-3xl font-extrabold text-white">Kitchen display</h2></div><p className="mt-2 text-zinc-400">{data.length} active tickets - Live</p></div>
      <div className="flex gap-2 overflow-x-auto">{stations.map(s=><button onClick={()=>setStation(s)} key={s} className={`category-pill ${station===s?'active':''}`}>{s}</button>)}</div>
    </div>

    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {data.filter((o:any)=>station==='all'||o.items.some((i:any)=>i.station===station)).map((o:any)=>{const mins=Math.max(0,Math.floor((Date.now()-new Date(o.createdAt).getTime())/60000));return <article key={o._id} className={`overflow-hidden rounded-2xl border bg-[#171719] shadow-[0_18px_50px_rgba(0,0,0,.22)] ${mins>20?'border-rose-500/60':mins>10?'border-amber-500/60':'border-zinc-800'}`}>
        <header className="border-b border-zinc-800 bg-zinc-950 p-4"><div className="flex items-start justify-between"><div><div className="text-lg font-black text-white">{o.orderNumber}</div><div className="text-xs font-semibold capitalize text-zinc-500">{o.table?.name||o.type}</div></div><div className={`flex items-center gap-1 rounded-xl border px-2 py-1 text-sm font-bold ${mins>20?'border-rose-500/40 bg-rose-500/10 text-rose-300':'border-zinc-700 bg-zinc-900 text-zinc-200'}`}><Clock3 size={15}/>{mins}m</div></div></header>
        <div className="divide-y divide-zinc-800 px-4">{o.items.filter((i:any)=>station==='all'||i.station===station).map((i:any)=><div className="py-4" key={i._id}><div className="flex justify-between gap-3"><span className="text-lg font-bold text-white">{i.quantity} x {i.name}</span><Badge>{i.station}</Badge></div>{i.modifiers?.length>0&&<div className="mt-1 text-sm text-zinc-500">+ {i.modifiers.map((m:any)=>m.label).join(', ')}</div>}{i.notes&&<div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-sm font-semibold text-amber-300">{i.notes}</div>}</div>)}</div>
        <footer className="p-4">{o.status==='sent-to-kitchen'?<Button onClick={()=>update(o,'preparing')} className="w-full"><Flame size={18}/>Start preparing</Button>:o.status==='preparing'?<Button onClick={()=>update(o,'ready')} className="w-full"><CheckCheck size={18}/>Mark ready</Button>:<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center font-bold text-emerald-300">Ready for service</div>}</footer>
      </article>;})}
    </div>
    {!data.length&&<Empty title="Kitchen is all clear" text="New tickets will appear here automatically."/>}
  </div>;
}
