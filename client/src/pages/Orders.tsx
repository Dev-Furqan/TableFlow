import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Search,Printer,RotateCcw,ChevronRight,RefreshCcw} from 'lucide-react';
import {api,messageOf} from '../services/api';
import {Badge,Button,Card,Modal,Empty} from '../components/ui';
import {useSocket} from '../hooks/useSocket';
import {useToast} from '../store/toast';
import {Receipt} from '../components/receipt/Receipt';
import type {Order} from '../types';

const money=(n:number)=>`Rs ${Math.round(n||0).toLocaleString()}`;

export default function Orders() {
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('');
  const [selected,setSelected]=useState<Order|null>(null);
  const qc=useQueryClient(),toast=useToast();
  const {data,isLoading}=useQuery({queryKey:['orders',search,status],queryFn:()=>api.get('/orders',{params:{search,status,limit:100}}).then(r=>r.data)});
  useSocket({'order:created':()=>qc.invalidateQueries({queryKey:['orders']}),'order:updated':()=>qc.invalidateQueries({queryKey:['orders']}),'order:completed':()=>qc.invalidateQueries({queryKey:['orders']})});
  const rows=data?.data||[];
  const open=rows.filter((o:Order)=>!['completed','cancelled','refunded'].includes(o.status)).length;
  const total=rows.reduce((sum:number,o:Order)=>sum+(o.total||0),0);
  const transition=async(next:string)=>{if(!selected)return;try{const {data}=await api.post(`/orders/${selected._id}/status`,{status:next});setSelected(data.data);qc.invalidateQueries({queryKey:['orders']});toast.push(`Order marked ${next}`);}catch(e){toast.push(messageOf(e),'error');}};
  const next:any={'sent-to-kitchen':'preparing',preparing:'ready',ready:'served',served:'completed',draft:'pending',pending:'sent-to-kitchen'};

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-5 border-b border-zinc-800 pb-7 xl:flex-row xl:items-end">
      <div>
        <h2 className="text-3xl font-extrabold text-white">Orders</h2>
        <p className="mt-2 text-zinc-400">Track bills, status changes, refunds, and receipt reprints.</p>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:flex">
        {[['Visible',rows.length],['Open',open],['Total',money(total)]].map(([label,value])=><div key={label} className="rounded-2xl border border-zinc-800 bg-[#171719] px-5 py-4"><div className="text-xs font-semibold text-zinc-500">{label}</div><div className="mt-1 text-xl font-black text-white">{value}</div></div>)}
      </div>
    </div>

    <div className="flex flex-col justify-between gap-3 sm:flex-row">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <label className="relative max-w-xl flex-1">
          <Search className="absolute left-4 top-3.5 text-zinc-500" size={18}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-3 text-sm outline-none focus:border-zinc-500" placeholder="Search orders..."/>
        </label>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="dark-input min-w-48">
          <option value="">All Status</option>
          {['draft','sent-to-kitchen','preparing','ready','served','completed','cancelled','refunded'].map(x=><option key={x}>{x}</option>)}
        </select>
        <Button variant="secondary" onClick={()=>qc.invalidateQueries({queryKey:['orders']})}><RefreshCcw size={16}/>Refresh</Button>
      </div>
      <Button onClick={()=>location.assign('/pos')}>New order</Button>
    </div>

    <Card className="overflow-hidden">
      <div className="overflow-x-auto"><table><thead><tr><th>Order #</th><th>Type</th><th>Table</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th><th></th></tr></thead><tbody>{rows.map((o:Order)=><tr key={o._id} onClick={()=>setSelected(o)} className="cursor-pointer"><td className="font-bold">{o.orderNumber}</td><td className="capitalize"><Badge>{o.type}</Badge></td><td>{o.table?.name||'-'}</td><td>{o.items?.length||0} items</td><td className="font-black">{money(o.total)}</td><td><Badge>{o.status}</Badge></td><td className="text-zinc-400">{new Date(o.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</td><td><ChevronRight size={17}/></td></tr>)}</tbody></table>{!isLoading&&!rows.length&&<Empty title="No orders found"/>}</div>
    </Card>

    <Modal open={!!selected} onClose={()=>setSelected(null)} title={selected?.orderNumber||'Order details'} className="max-w-2xl">
      {selected&&<div>
        <div className="border-b border-zinc-800 bg-zinc-950 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><Badge>{selected.status}</Badge><p className="mt-2 text-sm text-zinc-500">{selected.table?.name||selected.customer?.name||'Walk-in'} - {selected.type}</p></div>
            <div className="text-right"><div className="text-2xl font-black text-white">{money(selected.total)}</div><div className="text-xs text-zinc-500">{new Date(selected.createdAt).toLocaleString()}</div></div>
          </div>
        </div>
        <div className="p-5">
          <h3 className="mb-3 font-bold text-white">Items</h3>
          <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">{selected.items.map((i:any)=><div className="flex justify-between p-3" key={i._id}><div><span className="font-semibold text-white">{i.quantity} x {i.name}</span>{i.modifiers?.length>0&&<small className="block text-zinc-500">{i.modifiers.map((m:any)=>m.label).join(', ')}</small>}{i.notes&&<small className="block text-amber-300">{i.notes}</small>}</div><span>{money(i.lineTotal)}</span></div>)}</div>
          <h3 className="mb-3 mt-6 font-bold text-white">Timeline</h3>
          <div className="flex overflow-x-auto pb-2">{selected.timeline.map((x:any,i:number)=><div key={i} className="flex min-w-32 items-center"><span className="h-3 w-3 rounded-full bg-zinc-100"/><span className="h-px flex-1 bg-zinc-800"/><div className="ml-2 text-xs capitalize text-zinc-400">{x.status.replaceAll('-',' ')}</div></div>)}</div>
          <div className="mt-6 flex flex-wrap gap-2"><Button variant="secondary" onClick={()=>window.print()}><Printer size={16}/>Receipt</Button>{next[selected.status]&&<Button onClick={()=>transition(next[selected.status])}>Mark {next[selected.status].replaceAll('-',' ')}</Button>}{selected.status==='completed'&&<Button variant="danger" onClick={async()=>{try{const {data}=await api.post(`/orders/${selected._id}/refund`);setSelected(data.data);toast.push('Refund recorded');}catch(e){toast.push(messageOf(e),'error');}}}><RotateCcw size={16}/>Refund</Button>}</div>
        </div>
        <div className="hidden print:block"><Receipt order={selected}/></div>
      </div>}
    </Modal>
  </div>;
}
