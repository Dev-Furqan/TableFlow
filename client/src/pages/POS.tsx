import {useMemo,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {BadgePercent,Banknote,Bike,ChevronDown,ChevronRight,CreditCard,MapPin,Minus,PauseCircle,Plus,ReceiptText,Search,ShoppingBag,Split,Trash2,Truck,Users,Utensils,WalletCards,X} from 'lucide-react';
import {api,messageOf} from '../services/api';
import {useCart} from '../store/cart';
import {useToast} from '../store/toast';
import {Button,Empty,Modal} from '../components/ui';
import type {MenuItem,Order} from '../types';
import {Receipt,printReceipt} from '../components/receipt/Receipt';

type PaymentMethod='cash'|'card'|'transfer'|'credit';
const money=(n:number)=>`Rs ${Math.round(n||0).toLocaleString()}`;
const paymentRates:Record<PaymentMethod,number>={cash:16,card:5,transfer:16,credit:16};
const defaultCategoryNames=['Burgers','Pizza','Drinks','Shawarma','Biryani','Desserts','Sides'];
const closedStatuses=['completed','cancelled','refunded'];
const tableBillStatuses=['pending','sent-to-kitchen','preparing','ready','served'];
const lineTotal=(i:any)=>((i.unitPrice||0)+(i.modifiers||[]).reduce((a:number,m:any)=>a+(m.priceAdjustment||0),0))*(i.quantity||1);

export default function POS() {
  const cart=useCart(),toast=useToast();
  const qc=useQueryClient();
  const [category,setCategory]=useState('all');
  const [search,setSearch]=useState('');
  const [pick,setPick]=useState<MenuItem|null>(null);
  const [mods,setMods]=useState<any[]>([]);
  const [lineNote,setLineNote]=useState('');
  const [payOpen,setPayOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [receipt,setReceipt]=useState<Order|null>(null);
  const [paymentMethod,setPaymentMethod]=useState<PaymentMethod>('cash');
  const [customerType,setCustomerType]=useState('walk-in');
  const [customerName,setCustomerName]=useState('');
  const [customerPhone,setCustomerPhone]=useState('');
  const [deliveryAddress,setDeliveryAddress]=useState('');
  const [riderId,setRiderId]=useState('');
  const [guestCount,setGuestCount]=useState(1);
  const [cashReceived,setCashReceived]=useState('');
  const [paymentNote,setPaymentNote]=useState('');
  const [promo,setPromo]=useState('');

  const {data:products=[]}=useQuery({queryKey:['menu'],queryFn:()=>api.get('/menu-items?limit=100').then(r=>r.data.data)});
  const {data:categories=[]}=useQuery({queryKey:['categories'],queryFn:()=>api.get('/categories?limit=100').then(r=>r.data.data)});
  const {data:tables=[]}=useQuery({queryKey:['tables'],queryFn:()=>api.get('/tables?limit=100').then(r=>r.data.data)});
  const {data:staff=[]}=useQuery({queryKey:['staff-riders'],queryFn:()=>api.get('/staff?limit=100').then(r=>r.data.data)});
  const {data:openOrders=[]}=useQuery({queryKey:['open-dine-in-orders'],queryFn:()=>api.get('/orders',{params:{type:'dine-in',limit:100}}).then(r=>r.data.data.filter((o:Order)=>tableBillStatuses.includes(o.status)))});
  const {data:promos=[]}=useQuery({queryKey:['promos'],queryFn:()=>api.get('/promos?limit=100').then(r=>r.data.data).catch(()=>[])});
  const riders=staff.filter((u:any)=>u.role==='rider'&&u.status!=='inactive');
  const activeTableOrder=openOrders.find((o:Order)=>String(o.table?._id||o.table)===String(cart.table?._id));

  const categoryOptions=useMemo(()=> {
    const db=categories.map((c:any)=>({key:c._id,name:c.name,id:c._id}));
    const missing=defaultCategoryNames.filter(name=>!db.some((c:any)=>c.name.toLowerCase()===name.toLowerCase())).map(name=>({key:name.toLowerCase(),name}));
    return [...db,...missing];
  },[categories]);

  const selectedCategory=categoryOptions.find((c:any)=>c.key===category);
  const filtered=products.filter((p:any)=> {
    const productCategoryId=p.category?._id||p.category;
    const productCategoryName=(p.category?.name||'').toLowerCase();
    const matchesCategory=category==='all'||productCategoryId===category||productCategoryName===selectedCategory?.name.toLowerCase();
    return matchesCategory&&p.name.toLowerCase().includes(search.toLowerCase());
  });
  const lineCount=(id:string)=>cart.items.filter(i=>i.menuItem===id).reduce((s,i)=>s+i.quantity,0);
  const existingItems=activeTableOrder?.items||[];
  const existingSubtotal=existingItems.reduce((s:number,i:any)=>s+lineTotal(i),0);
  const newSubtotal=cart.items.reduce((s,i)=>s+lineTotal(i),0);
  const subtotal=existingSubtotal+newSubtotal;
  const discount=cart.discountType==='percentage'?subtotal*cart.discount/100:cart.discount;
  const taxable=Math.max(0,subtotal-discount);
  const taxRate=paymentRates[paymentMethod];
  const tax=taxable*taxRate/100;
  const service=0;
  const total=Math.max(0,taxable+tax+service);
  const change=Math.max(0,Number(cashReceived||0)-total);
  const needsAddress=cart.orderType==='delivery'||cart.orderType==='foodpanda';
  const needsRider=cart.orderType==='delivery';
  const showCustomerFields=cart.orderType!=='dine-in';
  const selectedRider=riders.find((r:any)=>r._id===riderId);

  const applyPromo=()=> {
    if(!promo.trim())return;
    const found=promos.find((p:any)=>p.active!==false&&p.code?.toLowerCase()===promo.trim().toLowerCase());
    if(!found){toast.push('Promo code not found','error');return;}
    cart.set({discountType:found.discountType,discount:Number(found.discount)});
    toast.push(`Promo applied: ${found.discountType==='percentage'?`${found.discount}%`:money(found.discount)} discount`);
  };

  const selectTable=(table:any)=> {
    if(cart.table?._id!==table._id&&cart.items.length)toast.push('New item cart cleared for selected table','info');
    cart.set({table,items:cart.table?._id===table._id?cart.items:[] as any,discount:cart.table?._id===table._id?cart.discount:0});
  };

  const add=(p:MenuItem)=> {
    if(cart.orderType==='dine-in'&&!cart.table){toast.push('Select a table before adding dine-in items','error');return;}
    if(p.modifierGroups?.length||p.addons?.length){setPick(p);setMods([]);setLineNote('');}
    else cart.add(p);
  };

  const resetOrderFields=()=> {
    setCashReceived('');
    setPaymentNote('');
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setRiderId('');
    setGuestCount(1);
    setPromo('');
  };

  const validateOrder=(requireCheckoutContext=false)=> {
    if(!cart.items.length&&!(requireCheckoutContext&&activeTableOrder)){toast.push('Add items before placing an order','error');return false;}
    if(cart.orderType==='dine-in'&&!cart.table){toast.push('Select a table before starting dine-in order','error');return false;}
    if((requireCheckoutContext||cart.orderType==='delivery')&&needsAddress&&!deliveryAddress.trim()){toast.push(`${cart.orderType==='foodpanda'?'Foodpanda':'Delivery'} address is required`,'error');return false;}
    if((requireCheckoutContext||cart.orderType==='delivery')&&needsRider&&!riderId){toast.push('Select a rider for this delivery order','error');return false;}
    return true;
  };

  const orderItems=(includeExisting=true)=>[...(includeExisting?existingItems.map((i:any)=>({menuItem:i.menuItem?._id||i.menuItem,name:i.name,quantity:i.quantity,unitPrice:i.unitPrice,modifiers:i.modifiers||[],notes:i.notes,station:i.station})):[]),...cart.items.map(i=>({menuItem:i.menuItem,name:i.name,quantity:i.quantity,unitPrice:i.unitPrice,modifiers:i.modifiers,notes:i.notes,station:i.station}))];

  const payload=(status:string,items=cart.items.map(i=>({menuItem:i.menuItem,name:i.name,quantity:i.quantity,unitPrice:i.unitPrice,modifiers:i.modifiers,notes:i.notes,station:i.station})))=>({type:cart.orderType,table:cart.table?._id,customer:cart.customer?._id,customerName:showCustomerFields&&customerName.trim()?customerName.trim():undefined,customerPhone:showCustomerFields&&customerPhone.trim()?customerPhone.trim():undefined,guests:guestCount,deliveryAddress:needsAddress?deliveryAddress.trim():undefined,rider:needsRider?riderId||undefined:undefined,items,discount:cart.discount,discountType:cart.discountType,tax,serviceCharge:service,notes:paymentNote,status});

  const clearAfterSend=()=> {
    const table=cart.table;
    cart.clear();
    if(cart.orderType==='dine-in'&&table)cart.set({orderType:'dine-in',table});
    else resetOrderFields();
  };

  const save=async(status:string,requireCheckoutContext=false,showReceipt=false)=> {
    if(!validateOrder(requireCheckoutContext))return;
    setSaving(true);
    try{
      const nextStatus=cart.orderType==='dine-in'&&activeTableOrder&&status==='draft'?activeTableOrder.status:status;
      const request=cart.orderType==='dine-in'&&activeTableOrder
        ?api.patch(`/orders/${activeTableOrder._id}`,payload(nextStatus,orderItems(true)))
        :api.post('/orders',payload(nextStatus));
      const {data}=await request;
      toast.push(nextStatus==='sent-to-kitchen'?'Order sent to kitchen':'Order saved');
      qc.invalidateQueries({queryKey:['open-dine-in-orders']});
      qc.invalidateQueries({queryKey:['orders']});
      if(showReceipt)setReceipt(data.data);
      if(nextStatus==='sent-to-kitchen')clearAfterSend();
      return data.data;
    }catch(e){toast.push(messageOf(e),'error');}
    finally{setSaving(false);}
  };

  const placeOrder=async()=> {
    await save('sent-to-kitchen',cart.orderType==='delivery',cart.orderType==='delivery');
  };

  const checkout=async()=> {
    if(!validateOrder(true))return;
    if(paymentMethod==='cash'&&cashReceived&&Number(cashReceived)<total){toast.push('Cash received is less than total','error');return;}
    setSaving(true);
    try{
      const order=activeTableOrder
        ?(await api.patch(`/orders/${activeTableOrder._id}`,payload(activeTableOrder.status||'pending',orderItems(true)))).data.data
        :await save('pending',true);
      if(!order)return;
      const {data}=await api.post(`/orders/${order._id}/pay`,{payments:[{method:paymentMethod,amount:total}]});
      setReceipt(data.data);
      setPayOpen(false);
      cart.clear();
      resetOrderFields();
      qc.invalidateQueries({queryKey:['open-dine-in-orders']});
      qc.invalidateQueries({queryKey:['orders']});
      qc.invalidateQueries({queryKey:['tables']});
      toast.push('Payment completed');
    }catch(e){toast.push(messageOf(e),'error');}
    finally{setSaving(false);}
  };

  return <div className="-m-4 grid min-h-[calc(100vh-6rem)] grid-cols-1 overflow-hidden bg-[#0b0b0d] md:-m-8 xl:grid-cols-[1fr_480px]">
    <section className="min-w-0 border-r border-zinc-800">
      <div className="border-b border-zinc-800 p-5">
        <div className="grid rounded-2xl bg-[#2b2b31] p-1 sm:grid-cols-4">
          {[['dine-in','Dine-In',Utensils],['takeaway','Takeaway',ShoppingBag],['delivery','Delivery',Truck],['foodpanda','Foodpanda',Bike]].map(([type,label,Icon]:any)=><button key={type} onClick={()=>{cart.set({orderType:type,table:type==='dine-in'?cart.table:null});if(type!=='delivery')setRiderId('');}} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${cart.orderType===type?'bg-zinc-100 text-zinc-950':'text-zinc-400 hover:text-white'}`}><Icon size={17}/>{label}</button>)}
        </div>
        <div className={`mt-4 grid gap-3 ${needsAddress?'lg:grid-cols-[.9fr_1.1fr]':'grid-cols-1'}`}>
          <label className="relative block">
            <Search className="absolute left-4 top-3.5 text-zinc-500" size={20}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search menu items..." className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3.5 pl-12 pr-4 text-zinc-100 outline-none transition focus:border-zinc-500"/>
          </label>
          {needsAddress&&<label className="relative block">
            <MapPin className="absolute left-4 top-3.5 text-zinc-500" size={20}/>
            <input value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)} placeholder={cart.orderType==='foodpanda'?'Foodpanda delivery address...':'Delivery address...'} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3.5 pl-12 pr-4 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-500"/>
          </label>}
        </div>
        {cart.orderType==='dine-in'&&<div className="mt-4">
          <div className="mb-2 text-xs font-black uppercase tracking-wide text-zinc-500">Select table first</div>
          <div className="flex gap-2 overflow-x-auto pb-1">{tables.map((t:any)=> {
            const tableOrder=openOrders.find((o:Order)=>String(o.table?._id||o.table)===String(t._id));
            return <button key={t._id} onClick={()=>selectTable(t)} className={`min-w-28 rounded-xl border px-3 py-2 text-left text-sm transition ${cart.table?._id===t._id?'border-zinc-100 bg-zinc-100 text-zinc-950':'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-500'}`}>
              <span className="block font-black">{t.name}</span>
              <span className="block truncate text-xs opacity-70">{tableOrder?'Open order':t.status}</span>
            </button>;
          })}</div>
        </div>}
        {cart.orderType==='delivery'&&<div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="block text-xs font-black uppercase tracking-wide text-zinc-500">Rider<select value={riderId} onChange={e=>setRiderId(e.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm normal-case tracking-normal text-zinc-100 outline-none focus:border-zinc-500"><option value="">Select rider</option>{riders.map((r:any)=><option key={r._id} value={r._id}>{r.name}</option>)}</select></label>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm"><div className="text-xs font-black uppercase tracking-wide text-zinc-500">Delivery receipt</div><div className="mt-1 truncate font-bold text-zinc-200">{selectedRider?`Assigned to ${selectedRider.name}`:'Pick rider before sending'}</div></div>
        </div>}
      </div>

      <div className="border-b border-zinc-800 p-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={()=>setCategory('all')} className={`category-pill ${category==='all'?'active':''}`}>All</button>
          {categoryOptions.map((c:any)=><button key={c.key} onClick={()=>setCategory(c.key)} className={`category-pill ${category===c.key?'active':''}`}>{c.name}</button>)}
        </div>
      </div>

      <div className="h-[calc(100vh-21rem)] overflow-y-auto p-5 xl:h-[calc(100vh-21rem)]">
        <button className="mb-7 flex w-full items-center justify-between text-left">
          <span className="flex items-center gap-3 text-lg font-black text-white"><ChevronRight size={18}/><BadgePercent size={20}/>Deals & Platters</span>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-800 text-sm font-black text-zinc-200">2</span>
        </button>
        <h2 className="mb-3 text-lg font-extrabold text-white">Menu Items</h2>
        <div className="grid auto-rows-max grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((p:any)=>{const count=lineCount(p._id);return <button key={p._id} onClick={()=>add(p)} className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#171719] p-3 text-left transition hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-[#202024]">
            {count>0&&<span className="absolute right-4 top-4 z-10 grid h-7 w-7 place-items-center rounded-full bg-zinc-100 text-xs font-black text-zinc-950">{count}</span>}
            <div className="grid aspect-[4/2.25] place-items-center rounded-xl bg-[#35353b] text-zinc-600"><Utensils size={36}/></div>
            <div className="mt-3 min-w-0">
              <div className="truncate font-extrabold text-white">{p.name}</div>
              <div className="mt-1 min-h-5 truncate text-xs text-zinc-500">{p.modifierGroups?.length||p.addons?.length?'Variants / addons available':p.description||'Ready to order'}</div>
              <div className="mt-3 flex items-center justify-between"><span className="font-black text-white">{money(p.price)}</span><Plus className="text-zinc-500 transition group-hover:text-white" size={18}/></div>
            </div>
          </button>;})}
          {!filtered.length&&<div className="col-span-full"><Empty title="No matching dishes" text="Try another category or search phrase."/></div>}
        </div>
      </div>
    </section>

    <CartPanel {...{cart,tables,selectTable,activeTableOrder,existingItems,newSubtotal,deliveryAddress,needsAddress,needsRider,selectedRider,subtotal,discount,tax,total,taxRate,paymentMethod,setPaymentMethod,setPayOpen,save,placeOrder,saving,promo,setPromo,applyPromo}}/>

    <div className="fixed inset-x-3 bottom-3 z-20 xl:hidden"><Button disabled={!cart.items.length&&!activeTableOrder} className="w-full shadow-xl" onClick={()=>setPayOpen(true)}><span className="flex w-full justify-between"><span>Checkout</span><span>{money(total)}</span></span></Button></div>

    <Modal open={!!pick} onClose={()=>setPick(null)} title="" className="max-w-2xl">
      {pick&&<ItemModal {...{pick,mods,setMods,lineNote,setLineNote,cart,setPick}}/>}
    </Modal>

    <Modal open={payOpen} onClose={()=>setPayOpen(false)} title="" className="max-w-2xl">
      <PaymentModal {...{orderType:cart.orderType,tables,tableId:cart.table?._id||'',onTableChange:(id:string)=>{const table=tables.find((t:any)=>t._id===id);if(table)selectTable(table);},riders,riderId,setRiderId,selectedRider,customerType,setCustomerType,customerName,setCustomerName,customerPhone,setCustomerPhone,deliveryAddress,setDeliveryAddress,needsAddress,showCustomerFields,paymentMethod,setPaymentMethod,guestCount,setGuestCount,cashReceived,setCashReceived,paymentNote,setPaymentNote,subtotal,discount,tax,total,taxRate,change,saving,checkout,onCancel:()=>setPayOpen(false)}}/>
    </Modal>

    <Modal open={!!receipt} onClose={()=>setReceipt(null)} title="" className="max-w-2xl">{receipt&&<div className="max-h-[86vh] overflow-auto p-6"><Receipt order={receipt}/><div className="no-print mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={()=>setReceipt(null)}>Close</Button><Button onClick={()=>printReceipt(receipt)}>Print Receipt</Button></div></div>}</Modal>
  </div>;
}

function ItemModal({pick,mods,setMods,lineNote,setLineNote,cart,setPick}:any) {
  const base=pick.price+mods.reduce((s:number,m:any)=>s+m.priceAdjustment,0);
  const toggle=(o:any,checked:boolean)=>setMods(checked?[...mods,o]:mods.filter((m:any)=>m.label!==o.label&&m._id!==o._id));
  const addons=[...(pick.addons||[]),...(pick.modifierGroups||[]).flatMap((g:any)=>g.options||[])];
  return <div className="p-8">
    <div className="flex items-start justify-between gap-5">
      <div><h2 className="text-2xl font-black text-white">{pick.name}</h2><p className="mt-3 max-w-xl text-lg leading-relaxed text-zinc-400">Select a variant, choose addons, and save any kitchen note before adding this item.</p></div>
      <button onClick={()=>setPick(null)} className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-800 text-zinc-300 hover:text-white"><X size={20}/></button>
    </div>
    <div className="mt-8">
      <h3 className="mb-3 font-black text-white">Addons</h3>
      <div className="space-y-3">{addons.map((o:any)=><label key={o._id||o.label} className="flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-700 bg-[#171719] px-4 py-3 text-lg font-semibold text-zinc-200"><span><input type="checkbox" className="mr-3 accent-zinc-100" onChange={e=>toggle(o,e.target.checked)}/>{o.label}</span><span>+ {money(o.priceAdjustment)}</span></label>)}</div>
    </div>
    <label className="mt-7 block text-sm font-black text-white">Kitchen Note<textarea value={lineNote} onChange={e=>setLineNote(e.target.value)} placeholder="Extra crispy, no onion, cut in half..." className="mt-3 h-36 w-full resize-none rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-lg text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-400"/></label>
    <div className="mt-8 flex justify-end gap-3"><Button variant="secondary" onClick={()=>setPick(null)}>Cancel</Button><Button onClick={()=>{cart.add(pick,mods,lineNote);setPick(null);}}>Add To Order</Button></div>
  </div>;
}

function CartPanel({cart,tables,selectTable,activeTableOrder,existingItems,newSubtotal,deliveryAddress,needsAddress,needsRider,selectedRider,subtotal,discount,tax,total,taxRate,paymentMethod,setPaymentMethod,setPayOpen,save,placeOrder,saving,promo,setPromo,applyPromo}:any) {
  const taxLabel=paymentMethod[0].toUpperCase()+paymentMethod.slice(1);
  const orderLabel=cart.orderType==='foodpanda'?'Foodpanda':cart.orderType.replace('-',' ');
  const orderContext=cart.orderType==='dine-in'?cart.table?.name||'Select table first':needsRider?`${deliveryAddress||'Address required'} - ${selectedRider?.name||'Rider required'}`:needsAddress?deliveryAddress||'Address required':'Counter order';
  const hasBill=cart.items.length||activeTableOrder;
  return <aside className="hidden min-h-0 flex-col bg-[#101012] xl:flex">
    <div className="flex items-center justify-between border-b border-zinc-800 p-5">
      <div className="flex items-center gap-3"><ReceiptText className="text-zinc-400"/><h2 className="text-xl font-black text-white">Current Order</h2></div>
      <div className="flex items-center gap-3"><button className="text-zinc-400 hover:text-white"><PauseCircle size={18}/></button><button onClick={cart.clear} className="text-zinc-400 hover:text-white"><X size={18}/></button></div>
    </div>
    <div className="border-b border-zinc-800 px-5 py-4">
      <div className="flex items-center justify-between gap-3 text-sm"><span className="shrink-0 font-black capitalize text-white">{orderLabel}</span><span className="truncate text-zinc-500">{orderContext}</span></div>
      {cart.orderType==='dine-in'&&<select value={cart.table?._id||''} onChange={e=>{const table=tables.find((t:any)=>t._id===e.target.value);if(table)selectTable(table);}} className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"><option value="">Select table first</option>{tables.map((t:any)=><option key={t._id} value={t._id}>{t.name} - {t.status}</option>)}</select>}
    </div>
    <div className="flex-1 overflow-y-auto p-4">
      {activeTableOrder&&<div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-center justify-between gap-3"><div><div className="text-sm font-black text-amber-200">Open table bill</div><div className="mt-1 text-xs text-amber-100/70">{activeTableOrder.orderNumber} - {activeTableOrder.status.replaceAll('-',' ')}</div></div><div className="font-black text-white">{money(existingItems.reduce((s:number,i:any)=>s+lineTotal(i),0))}</div></div>
        <div className="mt-3 space-y-2">{existingItems.map((i:any)=><div key={i._id||i.menuItem} className="flex justify-between gap-3 text-sm text-zinc-200"><span className="truncate">{i.quantity} x {i.name}</span><span className="shrink-0 font-bold">{money(lineTotal(i))}</span></div>)}</div>
      </div>}
      {cart.items.length?<div className="space-y-3">{activeTableOrder&&<div className="px-1 text-xs font-black uppercase tracking-wide text-zinc-500">New additions</div>}{cart.items.map((i:any)=><div key={i.id} className="rounded-2xl border border-zinc-800 bg-[#171719] p-4">
        <div className="flex items-start justify-between gap-4"><div><div className="font-black text-white">{i.name}</div><div className="mt-1 font-bold text-white">{money((i.unitPrice+i.modifiers.reduce((a:number,m:any)=>a+m.priceAdjustment,0))*i.quantity)}</div>{i.modifiers.length>0&&<div className="mt-1 text-xs text-zinc-500">{i.modifiers.map((m:any)=>m.label).join(', ')}</div>}{i.notes&&<div className="mt-1 text-xs text-amber-300">{i.notes}</div>}</div><div className="flex items-center gap-3"><button onClick={()=>cart.quantity(i.id,-1)} className="grid h-8 w-8 place-items-center rounded-full border border-zinc-700 text-zinc-300"><Minus size={14}/></button><span className="w-5 text-center font-black text-white">{i.quantity}</span><button onClick={()=>cart.quantity(i.id,1)} className="grid h-8 w-8 place-items-center rounded-full border border-zinc-700 text-zinc-300"><Plus size={14}/></button><button onClick={()=>cart.remove(i.id)} className="text-rose-400"><Trash2 size={16}/></button></div></div>
      </div>)}</div>:!activeTableOrder&&<Empty title={cart.orderType==='dine-in'?'Select a table and add items':'Add items to start'} text=""/>}
    </div>
    <div className="border-t border-zinc-800 p-4">
      <div className="mb-3 flex gap-2">
        <label className="relative w-40 shrink-0"><select value={cart.discount?`${cart.discountType}:${cart.discount}`:'none'} onChange={e=>{const [type,value]=e.target.value.split(':');cart.set(e.target.value==='none'?{discount:0}:{discountType:type,discount:Number(value)});}} className="w-full appearance-none rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-12 pr-8 font-semibold text-zinc-200 outline-none"><option value="none">No Discount</option><option value="percentage:10">Staff 10%</option><option value="percentage:15">Promo 15%</option><option value="fixed:100">Rs 100 Off</option></select><BadgePercent className="absolute left-4 top-3.5 text-zinc-400" size={17}/><ChevronDown className="absolute right-3 top-3.5 text-zinc-500" size={16}/></label>
        <label className="relative flex-1"><input value={promo} onChange={e=>setPromo(e.target.value)} placeholder="Promo code" className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-zinc-100 outline-none placeholder:text-zinc-500"/><button onClick={applyPromo} className="absolute right-2 top-2 rounded-xl bg-zinc-100 px-4 py-1.5 font-bold text-zinc-950">Apply</button></label>
      </div>
      <div className="space-y-3 border-t border-zinc-800 pt-4 text-sm">
        {activeTableOrder&&<div className="flex justify-between text-zinc-400"><span>Existing table bill</span><span className="font-bold text-white">{money(subtotal-newSubtotal)}</span></div>}
        {activeTableOrder&&newSubtotal>0&&<div className="flex justify-between text-zinc-400"><span>New additions</span><span className="font-bold text-white">{money(newSubtotal)}</span></div>}
        <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span className="font-bold text-white">{money(subtotal)}</span></div>
        {discount>0&&<div className="flex justify-between text-zinc-400"><span>Discount</span><span className="font-bold text-white">-{money(discount)}</span></div>}
        <div className="flex justify-between text-zinc-400"><span>Tax ({taxRate}% {taxLabel})</span><span className="font-bold text-white">{money(tax)}</span></div>
        <div className="flex justify-between border-t border-zinc-800 pt-4 text-xl font-black text-white"><span>Total</span><span>{money(total)}</span></div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="secondary" loading={saving} onClick={()=>save('draft')}>Hold</Button>
        <Button variant="secondary" loading={saving} onClick={placeOrder}>Place Order</Button>
        <Button disabled={!hasBill} onClick={()=>setPayOpen(true)} className="col-span-2"><ChevronRight size={18}/>Checkout - {money(total)}</Button>
      </div>
    </div>
  </aside>;
}

function PaymentModal(props:any) {
  const {orderType,tables,tableId,onTableChange,riders,riderId,setRiderId,selectedRider,customerType,setCustomerType,customerName,setCustomerName,customerPhone,setCustomerPhone,deliveryAddress,setDeliveryAddress,needsAddress,showCustomerFields,paymentMethod,setPaymentMethod,guestCount,setGuestCount,cashReceived,setCashReceived,paymentNote,setPaymentNote,subtotal,discount,tax,total,taxRate,change,saving,checkout,onCancel}=props;
  const methods:[PaymentMethod,string,any][]=[['cash','Cash',Banknote],['card','Card',CreditCard],['transfer','Transfer',WalletCards],['credit','Credit',Users]];
  const orderLabel=orderType==='foodpanda'?'Foodpanda':orderType.replace('-',' ');
  return <div className="max-h-[86vh] overflow-y-auto p-8">
    <div className="mb-8 flex items-start justify-between gap-5"><div><h2 className="text-2xl font-black text-white">Process Payment</h2><p className="mt-3 text-lg text-zinc-400">Review totals and confirm this {orderLabel} order.</p></div></div>
    <div className="space-y-6">
      {orderType==='dine-in'&&<label className="block text-sm font-black text-white">Table<select value={tableId} onChange={e=>onTableChange(e.target.value)} className="mt-3 w-full rounded-2xl border border-zinc-700 bg-[#171719] px-5 py-4 text-lg text-zinc-100 outline-none"><option value="">Select table</option>{tables.map((t:any)=><option key={t._id} value={t._id}>{t.name} - {t.status}</option>)}</select></label>}
      {showCustomerFields&&<>
        <label className="block text-sm font-black text-white">Customer<select value={customerType} onChange={e=>setCustomerType(e.target.value)} className="mt-3 w-full rounded-2xl border border-zinc-700 bg-[#171719] px-5 py-4 text-lg text-zinc-100 outline-none"><option value="walk-in">Walk-in customer</option><option value="new">New customer</option></select></label>
        <div className="grid gap-4 sm:grid-cols-2"><LabelInput label="Customer Name" value={customerName} onChange={setCustomerName} placeholder="Enter customer name"/><LabelInput label="Phone" value={customerPhone} onChange={setCustomerPhone} placeholder="03xx..."/></div>
      </>}
      {needsAddress&&<LabelInput label={orderType==='foodpanda'?'Foodpanda Address':'Delivery Address'} value={deliveryAddress} onChange={setDeliveryAddress} placeholder="House, street, area, city"/>}
      {orderType==='delivery'&&<label className="block text-sm font-black text-white">Rider<select value={riderId} onChange={e=>setRiderId(e.target.value)} className="mt-3 w-full rounded-2xl border border-zinc-700 bg-[#171719] px-5 py-4 text-lg text-zinc-100 outline-none"><option value="">Select rider</option>{riders.map((r:any)=><option key={r._id} value={r._id}>{r.name}</option>)}</select>{selectedRider&&<span className="mt-2 block text-sm text-zinc-500">Assigned to {selectedRider.name}</span>}</label>}
      <div><h3 className="mb-3 text-sm font-black text-white">Payment Method</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{methods.map(([key,label,Icon])=><button key={key} onClick={()=>setPaymentMethod(key)} className={`rounded-2xl border p-5 text-center transition ${paymentMethod===key?'border-zinc-100 bg-[#222227] text-white':'border-zinc-700 text-zinc-400 hover:text-white'}`}><Icon className="mx-auto mb-3" size={22}/><div className="text-lg font-bold">{label}</div><div className="mt-2 text-sm text-zinc-500">{paymentRates[key]}%</div></button>)}</div></div>
      <div><h3 className="mb-3 text-sm font-black text-white">Split Bill</h3><div className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-[#222227] p-4"><Split className="text-zinc-400"/><select value={guestCount} onChange={e=>setGuestCount(Number(e.target.value))} className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-lg font-bold text-white"><option value={1}>1 guest</option><option value={2}>2 guests</option><option value={3}>3 guests</option><option value={4}>4 guests</option></select><span className="text-lg text-zinc-400">Single bill</span></div></div>
      {paymentMethod==='cash'&&<LabelInput label="Cash Received" value={cashReceived} onChange={setCashReceived} placeholder="Enter amount" type="number"/>}
      <label className="block text-sm font-black text-white">Notes (optional)<textarea value={paymentNote} onChange={e=>setPaymentNote(e.target.value)} placeholder="Special instructions..." className="mt-3 h-36 w-full resize-none rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-lg text-zinc-100 outline-none placeholder:text-zinc-500"/></label>
      <div className="rounded-2xl border border-zinc-700 bg-[#222227] p-5 text-lg"><div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>{money(subtotal)}</span></div>{discount>0&&<div className="mt-2 flex justify-between text-zinc-400"><span>Discount</span><span>-{money(discount)}</span></div>}<div className="mt-2 flex justify-between text-zinc-400"><span>Tax ({taxRate}% {paymentMethod[0].toUpperCase()+paymentMethod.slice(1)})</span><span>{money(tax)}</span></div><div className="mt-3 flex justify-between border-t border-zinc-700 pt-3 text-xl font-black text-white"><span>Total</span><span>{money(total)}</span></div>{paymentMethod==='cash'&&cashReceived&&<div className="mt-2 flex justify-between text-zinc-400"><span>Change</span><span>{money(change)}</span></div>}</div>
      <div className="flex justify-end gap-3"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button loading={saving} onClick={checkout}>Confirm Payment</Button></div>
    </div>
  </div>;
}

function LabelInput({label,value,onChange,placeholder,type='text'}:any) {
  return <label className="block text-sm font-black text-white">{label}<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-5 py-4 text-lg text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-400"/></label>;
}
