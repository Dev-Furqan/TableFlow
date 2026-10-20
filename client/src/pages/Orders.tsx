import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Search,Printer,RotateCcw,ChevronRight,RefreshCcw,Trash2} from 'lucide-react';
import {api,messageOf} from '../services/api';
import {Badge,Button,Card,Modal,Empty} from '../components/ui';
import {useSocket} from '../hooks/useSocket';
import {useToast} from '../store/toast';
import {Receipt,printReceipt} from '../components/receipt/Receipt';
import type {Order} from '../types';
import {useSearchParams} from 'react-router-dom';

const money=(n:number)=>`Rs ${Math.round(n||0).toLocaleString()}`;
const paymentLabel=(value:string)=>value.replaceAll('-',' ').replace(/\b\w/g,letter=>letter.toUpperCase());
const escapeHtml=(value:any)=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));

function printDailySalesSlip(sales:any,restaurant:any,orders:Order[]) {
  const popup=window.open('','daily-sales-slip','width=420,height=720');
  if(!popup)return;
  const payments=(sales.payments||[]).map((payment:any)=>`<div class="row"><span>${escapeHtml(paymentLabel(payment.method))}</span><strong>${money(payment.amount)}</strong></div>`).join('')||'<div class="row"><span>No payments recorded</span><strong>Rs 0</strong></div>';
  const orderRows=orders.map((order,index)=>`<div class="order"><div><strong>${index+1}. ${escapeHtml(order.orderNumber)}</strong><small>${escapeHtml(order.type.replaceAll('-',' '))} - ${escapeHtml(new Date(order.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}</small></div><strong>${money(order.total)}</strong></div>`).join('')||'<div class="muted">No completed orders for this date.</div>';
  popup.document.write(`<!doctype html><html><head><title>Daily sales ${sales.date}</title><style>@page{margin:4mm;size:80mm auto}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#111;font-size:11px}.slip{width:72mm;margin:auto;padding:3mm}.center{text-align:center}.title{font-size:17px;font-weight:800}.muted{color:#555}.rule{border-top:1px dashed #111;margin:10px 0}.row,.order{display:flex;justify-content:space-between;gap:12px;margin:5px 0}.order{align-items:flex-start;padding:5px 0;border-bottom:1px dotted #999}.order small{display:block;margin-top:2px;color:#555;text-transform:capitalize}.section{font-size:12px;font-weight:800}.total{font-size:15px;font-weight:800}</style></head><body><main class="slip"><div class="center"><div class="title">${escapeHtml(restaurant?.name||'Sales Report')}</div><strong>DAILY SALES</strong><div class="muted">${escapeHtml(sales.date)}</div></div><div class="rule"></div><div class="section">COMPLETED ORDERS</div>${orderRows}<div class="rule"></div><div class="row"><span>Completed orders</span><strong>${sales.orders}</strong></div><div class="row"><span>Sub total</span><strong>${money(sales.subtotal)}</strong></div>${sales.discount?`<div class="row"><span>Discount</span><strong>- ${money(sales.discount)}</strong></div>`:''}<div class="row"><span>Tax</span><strong>${money(sales.tax)}</strong></div>${sales.serviceCharge?`<div class="row"><span>Service charge</span><strong>${money(sales.serviceCharge)}</strong></div>`:''}<div class="rule"></div><div class="row total"><span>NET SALES</span><span>${money(sales.sales)}</span></div><div class="rule"></div><div class="section">PAYMENT SUMMARY</div>${payments}<div class="rule"></div><div class="center muted">Generated ${escapeHtml(new Date().toLocaleString())}</div></main><script>window.onload=()=>{window.focus();window.print();setTimeout(()=>window.close(),400)}</script></body></html>`);
  popup.document.close();
}

export default function Orders() {
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('');
  const [selected,setSelected]=useState<Order|null>(null);
  const [salesSlipOpen,setSalesSlipOpen]=useState(false);
  const [searchParams,setSearchParams]=useSearchParams();
  const selectedDate=searchParams.get('date')||new Date().toISOString().slice(0,10);
  const qc=useQueryClient(),toast=useToast();
  const {data,isLoading}=useQuery({queryKey:['orders',search,status,selectedDate],queryFn:()=>api.get('/orders',{params:{search,status,date:selectedDate,limit:100}}).then(r=>r.data)});
  const {data:staff=[]}=useQuery({queryKey:['staff-riders'],queryFn:()=>api.get('/staff?limit=100').then(r=>r.data.data)});
  const {data:settings=[]}=useQuery({queryKey:['settings'],queryFn:()=>api.get('/settings?limit=100').then(r=>r.data.data).catch(()=>[])});
  const {data:dailySales,isLoading:loadingDailySales}=useQuery({queryKey:['daily-sales',selectedDate],queryFn:()=>api.get('/reports/daily-sales',{params:{date:selectedDate}}).then(r=>r.data.data),enabled:salesSlipOpen});
  useSocket({'order:created':()=>qc.invalidateQueries({queryKey:['orders']}),'order:updated':()=>qc.invalidateQueries({queryKey:['orders']}),'order:completed':()=>qc.invalidateQueries({queryKey:['orders']}),'order:deleted':()=>qc.invalidateQueries({queryKey:['orders']})});
  const rows=data?.data||[];
  const validDailyOrders=rows.filter((order:Order)=>order.status==='completed');
  const ordersFallback={date:selectedDate,orders:validDailyOrders.length,sales:validDailyOrders.reduce((sum:number,order:Order)=>sum+(order.total||0),0),subtotal:validDailyOrders.reduce((sum:number,order:Order)=>sum+(order.subtotal||0),0),discount:validDailyOrders.reduce((sum:number,order:Order)=>sum+(order.discount||0),0),tax:validDailyOrders.reduce((sum:number,order:Order)=>sum+(order.tax||0),0),serviceCharge:validDailyOrders.reduce((sum:number,order:Order)=>sum+(order.serviceCharge||0),0),payments:[] as any[]};
  const salesSlip={...ordersFallback,payments:dailySales?.payments||[]};
  const busyRiderIds=new Set(rows.filter((o:Order)=>o.type==='delivery'&&!['completed','cancelled','refunded'].includes(o.status)&&String(o._id)!==String(selected?._id)).map((o:Order)=>String(o.rider?._id||o.rider)).filter(Boolean));
  const availableRiders=staff.filter((u:any)=>u.role==='rider'&&u.status==='active'&&!busyRiderIds.has(String(u._id)));
  const open=rows.filter((o:Order)=>!['completed','cancelled','refunded'].includes(o.status)).length;
  const total=rows.reduce((sum:number,o:Order)=>sum+(o.total||0),0);
  const restaurantProfile=settings.find((setting:any)=>setting.key==='restaurant')?.value;
  const transition=async(next:string)=>{if(!selected)return;try{const {data}=await api.post(`/orders/${selected._id}/status`,{status:next});setSelected(data.data);qc.invalidateQueries({queryKey:['orders']});toast.push(`Order marked ${next}`);}catch(e){toast.push(messageOf(e),'error');}};
  const assignRider=async(riderId:string)=>{if(!selected||!riderId)return;try{const {data}=await api.patch(`/orders/${selected._id}`,{rider:riderId});setSelected(data.data);qc.invalidateQueries({queryKey:['orders']});toast.push('Rider assigned to delivery');}catch(e){toast.push(messageOf(e),'error');}};
  const removeOrder=async()=>{if(!selected||!window.confirm(`Delete ${selected.orderNumber}? This cannot be undone.`))return;try{await api.delete(`/orders/${selected._id}`);setSelected(null);qc.invalidateQueries({queryKey:['orders']});qc.invalidateQueries({queryKey:['tables']});toast.push('Order deleted');}catch(e){toast.push(messageOf(e),'error');}};
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
      <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={()=>setSalesSlipOpen(true)}><Printer size={16}/>Daily sales receipt</Button><Button onClick={()=>location.assign('/pos')}>New order</Button></div>
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
          {selected.type==='delivery'&&<label className="mt-6 block text-sm font-bold text-white">Assign available rider<select value={selected.rider?._id||selected.rider||''} onChange={e=>assignRider(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-zinc-100"><option value="">Select rider</option>{selected.rider&&<option value={selected.rider?._id||selected.rider}>{selected.rider?.name||'Current rider'} (currently assigned)</option>}{availableRiders.filter((r:any)=>String(r._id)!==String(selected.rider?._id||selected.rider)).map((r:any)=><option key={r._id} value={r._id}>{r.name}{r.phone?` - ${r.phone}`:''}</option>)}</select></label>}
          <h3 className="mb-3 mt-6 font-bold text-white">Timeline</h3>
          <div className="flex overflow-x-auto pb-2">{selected.timeline.map((x:any,i:number)=><div key={i} className="flex min-w-32 items-center"><span className="h-3 w-3 rounded-full bg-zinc-100"/><span className="h-px flex-1 bg-zinc-800"/><div className="ml-2 text-xs capitalize text-zinc-400">{x.status.replaceAll('-',' ')}</div></div>)}</div>
          <div className="mt-6 flex flex-wrap gap-2"><Button variant="secondary" onClick={()=>printReceipt(selected,'customer',restaurantProfile)}><Printer size={16}/>Receipt</Button>{next[selected.status]&&<Button onClick={()=>transition(next[selected.status])}>Mark {next[selected.status].replaceAll('-',' ')}</Button>}{selected.status==='completed'&&<Button variant="danger" onClick={async()=>{try{const {data}=await api.post(`/orders/${selected._id}/refund`);setSelected(data.data);toast.push('Refund recorded');}catch(e){toast.push(messageOf(e),'error');}}}><RotateCcw size={16}/>Refund</Button>}<Button variant="danger" onClick={removeOrder}><Trash2 size={16}/>Delete order</Button></div>
        </div>
        <div className="hidden print:block"><Receipt order={selected} profile={restaurantProfile}/></div>
      </div>}
    </Modal>
    <Modal open={salesSlipOpen} onClose={()=>setSalesSlipOpen(false)} title="Daily sales receipt" className="max-w-md">
      <div className="space-y-5 p-5"><label className="block text-sm font-bold text-zinc-200">Sales date<input type="date" value={selectedDate} onChange={event=>{const next=new URLSearchParams(searchParams);next.set('date',event.target.value);setSearchParams(next);}} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-zinc-100 [color-scheme:dark]"/></label><div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><div className="text-sm text-zinc-500">Completed orders: <span className="font-bold text-zinc-200">{salesSlip.orders}</span></div><div className="mt-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Completed sales</div><div className="mt-1 text-3xl font-black text-white">{money(salesSlip.sales)}</div><p className="mt-3 text-xs text-zinc-500">The printed receipt will list every completed order for this date.</p>{salesSlip.payments?.length>0&&<div className="mt-4 border-t border-zinc-800 pt-3 text-sm text-zinc-400">{salesSlip.payments.map((payment:any)=><div key={payment.method} className="flex justify-between py-1"><span className="capitalize">{paymentLabel(payment.method)}</span><span>{money(payment.amount)}</span></div>)}</div>}</div><div className="flex justify-end gap-2"><Button variant="secondary" onClick={()=>setSalesSlipOpen(false)}>Close</Button><Button disabled={loadingDailySales} onClick={()=>printDailySalesSlip(salesSlip,restaurantProfile,validDailyOrders)}><Printer size={16}/>Print receipt</Button></div></div>
    </Modal>
  </div>;
}
