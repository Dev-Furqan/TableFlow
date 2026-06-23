import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Search,Plus,Minus,Trash2,Pause,ChefHat,WalletCards,Armchair,ShoppingBag,Utensils,Truck,StickyNote,ReceiptText} from 'lucide-react';
import {api,messageOf} from '../services/api';
import {useCart} from '../store/cart';
import {useToast} from '../store/toast';
import {Button,Modal,Empty,Field,Badge} from '../components/ui';
import type {MenuItem,Order} from '../types';
import {Receipt} from '../components/receipt/Receipt';

const money=(n:number)=>`Rs ${Math.round(n).toLocaleString()}`;

export default function POS() {
  const cart=useCart(),toast=useToast();
  const [category,setCategory]=useState('all');
  const [search,setSearch]=useState('');
  const [pick,setPick]=useState<MenuItem|null>(null);
  const [mods,setMods]=useState<any[]>([]);
  const [lineNote,setLineNote]=useState('');
  const [tableOpen,setTableOpen]=useState(false);
  const [payOpen,setPayOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [receipt,setReceipt]=useState<Order|null>(null);
  const [split,setSplit]=useState({cash:0,card:0,wallet:0});

  const {data:products=[]}=useQuery({queryKey:['menu'],queryFn:()=>api.get('/menu-items?limit=100').then(r=>r.data.data)});
  const {data:categories=[]}=useQuery({queryKey:['categories'],queryFn:()=>api.get('/categories?limit=100').then(r=>r.data.data)});
  const {data:tables=[]}=useQuery({queryKey:['tables'],queryFn:()=>api.get('/tables?limit=100').then(r=>r.data.data)});

  const filtered=products.filter((p:any)=>(category==='all'||(p.category?._id||p.category)===category)&&p.name.toLowerCase().includes(search.toLowerCase()));
  const subtotal=cart.items.reduce((s,i)=>s+(i.unitPrice+i.modifiers.reduce((a,m)=>a+m.priceAdjustment,0))*i.quantity,0);
  const discount=cart.discountType==='percentage'?subtotal*cart.discount/100:cart.discount;
  const tax=cart.taxEnabled?(subtotal-discount)*.15:0;
  const service=cart.serviceEnabled?subtotal*.1:0;
  const total=Math.max(0,subtotal-discount+tax+service);

  const add=(p:MenuItem)=> {
    if(p.modifierGroups?.length||p.addons?.length){setPick(p);setMods([]);setLineNote('');}
    else cart.add(p);
  };

  const payload=(status:string)=>({type:cart.orderType,table:cart.table?._id,customer:cart.customer?._id,items:cart.items.map(i=>({menuItem:i.menuItem,name:i.name,quantity:i.quantity,unitPrice:i.unitPrice,modifiers:i.modifiers,notes:i.notes,station:i.station})),discount:cart.discount,discountType:cart.discountType,tax,serviceCharge:service,notes:cart.notes,status});

  const save=async(status:string)=> {
    if(!cart.items.length)return;
    if(cart.orderType==='dine-in'&&!cart.table){setTableOpen(true);return;}
    setSaving(true);
    try{
      const {data}=await api.post('/orders',payload(status));
      toast.push(status==='sent-to-kitchen'?'Ticket sent to the kitchen':'Order held as draft');
      if(status==='sent-to-kitchen')cart.clear();
      return data.data;
    }catch(e){toast.push(messageOf(e),'error');}
    finally{setSaving(false);}
  };

  const checkout=async()=> {
    setSaving(true);
    try{
      const order=await save('pending');
      if(!order)return;
      const payments=Object.entries(split).filter(([,v])=>v>0).map(([method,amount])=>({method,amount}));
      if(!payments.length)payments.push({method:'cash',amount:total});
      const {data}=await api.post(`/orders/${order._id}/pay`,{payments});
      setReceipt(data.data);
      setPayOpen(false);
      cart.clear();
      toast.push('Payment completed');
    }catch(e){toast.push(messageOf(e),'error');}
    finally{setSaving(false);}
  };

  return <div className="-m-4 grid min-h-[calc(100vh-6rem)] grid-cols-1 overflow-hidden bg-[#0b0b0d] md:-m-8 xl:grid-cols-[1fr_450px]">
    <section className="min-w-0 border-r border-zinc-800">
      <div className="border-b border-zinc-800 p-5">
        <div className="grid rounded-2xl bg-zinc-800 p-1 sm:grid-cols-3">
          {[['dine-in',Utensils],['takeaway',ShoppingBag],['delivery',Truck]].map(([type,Icon]:any)=><button key={type} onClick={()=>cart.set({orderType:type,table:type==='dine-in'?cart.table:null})} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold capitalize transition ${cart.orderType===type?'bg-zinc-100 text-zinc-950':'text-zinc-400 hover:text-white'}`}><Icon size={17}/>{type.replace('-',' ')}</button>)}
        </div>
        <label className="relative mt-4 block">
          <Search className="absolute left-4 top-3.5 text-zinc-500" size={20}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search menu items..." className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3.5 pl-12 pr-4 text-zinc-100 outline-none transition focus:border-zinc-500"/>
        </label>
      </div>

      <div className="border-b border-zinc-800 p-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={()=>setCategory('all')} className={`category-pill ${category==='all'?'active':''}`}>All</button>
          {categories.map((c:any)=><button key={c._id} onClick={()=>setCategory(c._id)} className={`category-pill ${category===c._id?'active':''}`}>{c.name}</button>)}
        </div>
      </div>

      <div className="h-[calc(100vh-20rem)] overflow-y-auto p-5 xl:h-[calc(100vh-20rem)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white">Menu Items</h2>
            <p className="text-sm text-zinc-500">{filtered.length} visible items</p>
          </div>
          <Badge>{category==='all'?'All categories':'Filtered'}</Badge>
        </div>
        <div className="grid auto-rows-max grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((p:any)=><button key={p._id} onClick={()=>add(p)} className="group overflow-hidden rounded-2xl border border-zinc-800 bg-[#171719] p-3 text-left transition hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-[#202024]">
            <div className="grid aspect-[4/2.25] place-items-center rounded-xl bg-[#333338] text-zinc-600"><Utensils size={36}/></div>
            <div className="mt-3 min-w-0">
              <div className="truncate font-extrabold text-white">{p.name}</div>
              <div className="mt-1 min-h-5 truncate text-xs text-zinc-500">{p.modifierGroups?.length||p.addons?.length?'Variants / addons available':p.description||'Ready to order'}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-black text-white">{money(p.price)}</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-100 text-zinc-950 opacity-0 transition group-hover:opacity-100"><Plus size={16}/></span>
              </div>
            </div>
          </button>)}
          {!filtered.length&&<div className="col-span-full"><Empty title="No matching dishes" text="Try another category or search phrase."/></div>}
        </div>
      </div>
    </section>

    <aside className="hidden min-h-0 flex-col bg-[#101012] xl:flex">
      <CartPanel {...{cart,subtotal,discount,tax,service,total,setTableOpen,setPayOpen,save,saving}}/>
    </aside>

    <div className="fixed inset-x-3 bottom-3 z-20 xl:hidden"><Button className="w-full shadow-xl" onClick={()=>setPayOpen(true)}><ShoppingSummary count={cart.items.length} total={total}/></Button></div>

    <Modal open={!!pick} onClose={()=>setPick(null)} title={pick?.name||'Customise item'}>
      {pick&&<div className="space-y-5 p-5">
        {pick.modifierGroups?.map(g=><div key={g.name}><h3 className="mb-2 font-semibold text-white">{g.name}</h3><div className="space-y-2">{g.options.map(o=><label key={o._id} className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-200"><span><input type={g.multiple?'checkbox':'radio'} name={g.name} className="mr-3" onChange={e=>setMods(e.target.checked?[...mods.filter(m=>g.multiple||!g.options.some(x=>x._id===m._id)),o]:mods.filter(m=>m._id!==o._id))}/>{o.label}</span><span className="text-sm text-zinc-500">+{money(o.priceAdjustment)}</span></label>)}</div></div>)}
        {pick.addons?.map(o=><label key={o._id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-200"><span><input type="checkbox" className="mr-3" onChange={e=>setMods(e.target.checked?[...mods,o]:mods.filter(m=>m._id!==o._id))}/>{o.label}</span><span>+{money(o.priceAdjustment)}</span></label>)}
        <Field label="Special instructions" placeholder="No onions, sauce on the side..." value={lineNote} onChange={(e:any)=>setLineNote(e.target.value)}/>
        <Button className="w-full" onClick={()=>{cart.add(pick,mods,lineNote);setPick(null);}}>Add to order - {money(pick.price+mods.reduce((s,m)=>s+m.priceAdjustment,0))}</Button>
      </div>}
    </Modal>

    <Modal open={tableOpen} onClose={()=>setTableOpen(false)} title="Choose a table" className="max-w-2xl">
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">{tables.map((t:any)=><button disabled={t.status!=='available'&&cart.table?._id!==t._id} key={t._id} onClick={()=>{cart.set({table:t});setTableOpen(false);}} className={`rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-left text-zinc-200 disabled:opacity-40 ${cart.table?._id===t._id?'border-zinc-100 bg-zinc-900':''}`}><Armchair className="mb-3 text-zinc-300"/><div className="font-semibold text-white">{t.name}</div><div className="text-xs text-zinc-500">{t.area} - {t.capacity} seats</div></button>)}</div>
    </Modal>

    <Modal open={payOpen} onClose={()=>setPayOpen(false)} title="Checkout" className="max-w-xl">
      <div className="space-y-5 p-5"><div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-white"><div className="text-sm text-zinc-500">Amount due</div><div className="mt-1 text-3xl font-black">{money(total)}</div></div><div className="grid grid-cols-3 gap-3">{(['cash','card','wallet'] as const).map(m=><Field key={m} label={m[0].toUpperCase()+m.slice(1)} type="number" min="0" value={(split as any)[m]||''} placeholder="0" onChange={(e:any)=>setSplit({...split,[m]:Number(e.target.value)})}/>)}</div><div className="flex justify-between text-sm text-zinc-400"><span>Assigned</span><strong className="text-white">{money(split.cash+split.card+split.wallet)} / {money(total)}</strong></div><Button onClick={checkout} loading={saving} disabled={split.cash+split.card+split.wallet!==0&&Math.abs(split.cash+split.card+split.wallet-total)>.01} className="w-full">Complete payment and print</Button></div>
    </Modal>

    <Modal open={!!receipt} onClose={()=>setReceipt(null)} title="Receipt preview" className="max-w-md">{receipt&&<><Receipt order={receipt}/><div className="no-print border-t border-zinc-800 p-4"><Button className="w-full" onClick={()=>window.print()}>Print receipt</Button></div></>}</Modal>
  </div>;
}

function CartPanel({cart,subtotal,discount,tax,service,total,setTableOpen,setPayOpen,save,saving}:any) {
  return <>
    <div className="border-b border-zinc-800 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ReceiptText className="text-zinc-400"/>
          <h2 className="text-lg font-extrabold text-white">Current Order</h2>
        </div>
        <button onClick={cart.clear} className="text-xs font-semibold text-zinc-400 hover:text-white">Clear</button>
      </div>
      {cart.orderType==='dine-in'&&<button onClick={()=>setTableOpen(true)} className="mt-4 flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-400 hover:text-white"><Armchair size={18}/>{cart.table?.name||'Assign table'}</button>}
    </div>

    <div className="flex-1 space-y-3 overflow-y-auto p-5">
      {cart.items.map((i:any)=><div key={i.id} className="rounded-2xl border border-zinc-800 bg-[#171719] p-4">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">{i.name}</div>
            {i.modifiers.length>0&&<div className="mt-1 text-xs text-zinc-500">{i.modifiers.map((m:any)=>m.label).join(', ')}</div>}
            {i.notes&&<div className="mt-2 flex gap-1 text-xs text-amber-300"><StickyNote size={14}/> {i.notes}</div>}
          </div>
          <strong className="shrink-0 text-sm text-white">{money((i.unitPrice+i.modifiers.reduce((a:number,m:any)=>a+m.priceAdjustment,0))*i.quantity)}</strong>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={()=>cart.remove(i.id)} className="text-zinc-500 hover:text-rose-300"><Trash2 size={16}/></button>
          <div className="flex items-center gap-2 rounded-xl bg-zinc-950 p-1">
            <button onClick={()=>cart.quantity(i.id,-1)} className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-800 text-zinc-200"><Minus size={14}/></button>
            <span className="w-6 text-center text-sm font-black text-white">{i.quantity}</span>
            <button onClick={()=>cart.quantity(i.id,1)} className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-800 text-zinc-200"><Plus size={14}/></button>
          </div>
        </div>
      </div>)}
      {!cart.items.length&&<Empty title="Add items to start" text="Selected menu items will appear here."/>}
    </div>

    <div className="border-t border-zinc-800 p-5">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="flex justify-between text-zinc-400"><span>Discount</span><span>-{money(discount)}</span></div>
        <div className="flex justify-between text-zinc-400"><span>Tax (15%)</span><span>{money(tax)}</span></div>
        <div className="flex justify-between text-zinc-400"><span>Service (10%)</span><span>{money(service)}</span></div>
        <div className="flex justify-between border-t border-zinc-800 pt-4 text-xl font-black text-white"><span>Total</span><span>{money(total)}</span></div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="secondary" loading={saving} onClick={()=>save('draft')}><Pause size={17}/>Hold</Button>
        <Button variant="secondary" loading={saving} onClick={()=>save('sent-to-kitchen')}><ChefHat size={17}/>Send KOT</Button>
        <Button disabled={!cart.items.length} onClick={()=>setPayOpen(true)} className="col-span-2"><WalletCards size={17}/>Checkout - {money(total)}</Button>
      </div>
    </div>
  </>;
}

function ShoppingSummary({count,total}:{count:number;total:number}) {
  return <span className="flex w-full justify-between"><span>View order - {count} items</span><span>{money(total)}</span></span>;
}
