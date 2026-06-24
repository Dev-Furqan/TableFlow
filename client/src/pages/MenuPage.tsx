import {useEffect,useMemo,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {BadgePercent,Boxes,Grid3X3,Layers3,MoreHorizontal,Plus,Search,Tag,Trash2,UtensilsCrossed} from 'lucide-react';
import {api,messageOf} from '../services/api';
import {Badge,Button,Card,Empty,Field,Modal} from '../components/ui';
import {useToast} from '../store/toast';
import type {AddOn,Category,Deal,MenuItem,PromoCode} from '../types';

type Tab='items'|'addons'|'deals'|'categories';
const money=(n:number)=>`Rs ${Math.round(Number(n)||0).toLocaleString()}`;
const idOf=(v:any)=>v?._id||v||'';
const nameOf=(v:any)=>v?.name||v?.label||'-';

export default function MenuPage() {
  const [tab,setTab]=useState<Tab>('items');
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('all');
  const qc=useQueryClient(),toast=useToast();
  const {data:items=[]}=useQuery<MenuItem[]>({queryKey:['menu-items'],queryFn:()=>api.get('/menu-items?limit=100').then(r=>r.data.data)});
  const {data:categories=[]}=useQuery<Category[]>({queryKey:['categories'],queryFn:()=>api.get('/categories?limit=100&sort=displayOrder').then(r=>r.data.data)});
  const {data:addons=[]}=useQuery<AddOn[]>({queryKey:['add-ons'],queryFn:()=>api.get('/add-ons?limit=100').then(r=>r.data.data)});
  const {data:deals=[]}=useQuery<Deal[]>({queryKey:['deals'],queryFn:()=>api.get('/deals?limit=100').then(r=>r.data.data)});
  const {data:promos=[]}=useQuery<PromoCode[]>({queryKey:['promos'],queryFn:()=>api.get('/promos?limit=100').then(r=>r.data.data)});
  const stats=[['Items',items.length,UtensilsCrossed],['Categories',categories.length,Grid3X3],['Deals',deals.length,Boxes]];
  const categoryCounts=useMemo(()=>categories.map(c=>({category:c,count:items.filter(i=>idOf(i.category)===c._id).length})),[categories,items]);
  const itemRows=items.filter(i=>{
    const matchesCategory=category==='all'||idOf(i.category)===category;
    const q=search.toLowerCase();
    return matchesCategory&&(i.name.toLowerCase().includes(q)||(i.sku||'').toLowerCase().includes(q));
  });
  const invalidate=()=>['menu-items','categories','add-ons','deals','promos'].forEach(k=>qc.invalidateQueries({queryKey:[k]}));
  const remove=async(endpoint:string,id:string,label:string)=>{try{await api.delete(`/${endpoint}/${id}`);toast.push(`${label} deleted`);invalidate();}catch(e){toast.push(messageOf(e),'error');}};

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-5 border-b border-zinc-800 pb-7 xl:flex-row xl:items-end">
      <div><h2 className="text-3xl font-extrabold text-white">Menu</h2><p className="mt-2 text-zinc-400">Manage items, categories, add-ons, deals, and promo codes.</p></div>
      <div className="grid grid-cols-3 gap-3">{stats.map(([label,value,Icon]:any)=><div key={label} className="min-w-28 rounded-xl border border-zinc-800 bg-[#171719] p-4"><div className="flex items-center justify-between text-xs font-bold text-zinc-500"><span>{label}</span><Icon size={15}/></div><div className="mt-2 text-xl font-black text-white">{value}</div></div>)}</div>
    </div>

    <div className="flex flex-col gap-3 xl:flex-row">
      <div className="grid rounded-xl bg-[#2b2b31] p-1 sm:grid-cols-4 xl:w-[520px]">
        {([['items','Menu Items'],['addons','Add-ons'],['deals','Deals & Promos'],['categories','Categories']] as [Tab,string][]).map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${tab===key?'bg-zinc-100 text-zinc-950':'text-zinc-400 hover:text-white'}`}>{label}</button>)}
      </div>
      <label className="relative flex-1">
        <Search className="absolute left-4 top-3.5 text-zinc-500" size={18}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-3 text-sm outline-none focus:border-zinc-500" placeholder="Search..."/>
      </label>
    </div>

    {tab==='items'&&<ItemsTab {...{items:itemRows,categories,categoryCounts,category,setCategory,addons,invalidate,remove}}/>}
    {tab==='addons'&&<AddonsTab {...{addons,categories,invalidate,remove}}/>}
    {tab==='deals'&&<DealsTab {...{deals,promos,items,invalidate,remove}}/>}
    {tab==='categories'&&<CategoriesTab {...{categories,categoryCounts,invalidate,remove}}/>}
  </div>;
}

function ItemsTab({items,categories,categoryCounts,category,setCategory,addons,invalidate,remove}:any) {
  const [edit,setEdit]=useState<any>(null);
  const [selectedAddons,setSelectedAddons]=useState<string[]>([]);
  useEffect(()=>{setSelectedAddons((edit?.addons||[]).map((a:any)=>addons.find((x:any)=>x.label===a.label)?._id).filter(Boolean));},[edit,addons]);
  const toast=useToast();
  const save=async(e:any)=>{e.preventDefault();const fd=new FormData(e.currentTarget);const body:any={name:fd.get('name'),description:fd.get('description'),sku:fd.get('sku'),category:fd.get('category'),price:Number(fd.get('price')),cost:Number(fd.get('cost')),kitchenStation:fd.get('kitchenStation'),preparationTime:Number(fd.get('preparationTime')||10),available:fd.get('available')==='on',addons:addons.filter((a:any)=>selectedAddons.includes(a._id)).map((a:any)=>({label:a.label,priceAdjustment:a.priceAdjustment}))};try{if(edit?._id)await api.patch(`/menu-items/${edit._id}`,body);else await api.post('/menu-items',body);toast.push('Menu item saved');setEdit(null);invalidate();}catch(err){toast.push(messageOf(err),'error');}};
  return <div className="grid gap-4 xl:grid-cols-[160px_1fr]">
    <aside className="space-y-2">
      <button onClick={()=>setCategory('all')} className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold ${category==='all'?'bg-zinc-100 text-zinc-950':'bg-[#171719] text-zinc-300 hover:bg-zinc-900'}`}>All Items ({items.length})</button>
      {categoryCounts.map(({category:cat,count}:any)=><button key={cat._id} onClick={()=>setCategory(cat._id)} className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold ${category===cat._id?'bg-zinc-100 text-zinc-950':'bg-[#171719] text-zinc-300 hover:bg-zinc-900'}`}>{cat.name} ({count})</button>)}
    </aside>
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 p-4"><h3 className="font-black text-white">Menu Items</h3><Button onClick={()=>setEdit({available:true,preparationTime:10})}><Plus size={16}/>Add Item</Button></div>
      <div className="overflow-x-auto"><table><thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Cost</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((item:any)=><tr key={item._id}><td><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-800 text-zinc-400"><UtensilsCrossed size={18}/></span><div><div className="font-black text-white">{item.name}</div><div className="text-xs text-zinc-500">{item.sku||item.description||'No SKU'}</div></div></div></td><td><Badge>{nameOf(item.category)}</Badge></td><td className="font-bold">{money(item.price)}</td><td>{money(item.cost)}</td><td><Badge>{item.available}</Badge></td><td><div className="flex gap-1"><button onClick={()=>setEdit(item)} className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800"><MoreHorizontal size={18}/></button><button onClick={()=>remove('menu-items',item._id,item.name)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{!items.length&&<Empty title="No menu items found"/>}</div>
    </Card>
    <Modal open={!!edit} onClose={()=>setEdit(null)} title={`${edit?._id?'Edit':'Add'} Menu Item`} className="max-w-2xl">
      <form onSubmit={save} className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2"><Field name="name" label="Name" defaultValue={edit?.name} required/><Field name="sku" label="SKU" defaultValue={edit?.sku}/><label className="block text-sm font-medium text-zinc-300">Category<select name="category" defaultValue={idOf(edit?.category)} required className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5"><option value="">Select category</option>{categories.map((c:any)=><option key={c._id} value={c._id}>{c.name}</option>)}</select></label><Field name="kitchenStation" label="Kitchen station" defaultValue={edit?.kitchenStation||'main'} required/><Field name="price" label="Price" type="number" defaultValue={edit?.price||0} required/><Field name="cost" label="Cost" type="number" defaultValue={edit?.cost||0}/><Field name="preparationTime" label="Prep time (min)" type="number" defaultValue={edit?.preparationTime||10}/><label className="mt-7 flex items-center gap-3 text-sm font-bold text-zinc-200"><input name="available" type="checkbox" defaultChecked={edit?.available!==false} className="accent-zinc-100"/>Available</label></div>
        <label className="block text-sm font-medium text-zinc-300">Description<textarea name="description" defaultValue={edit?.description} className="mt-1.5 h-24 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 outline-none"/></label>
        <div><div className="mb-2 text-sm font-medium text-zinc-300">Add-ons</div><div className="grid gap-2 sm:grid-cols-2">{addons.map((a:any)=><label key={a._id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"><span><input type="checkbox" checked={selectedAddons.includes(a._id)} onChange={e=>setSelectedAddons(e.target.checked?[...selectedAddons,a._id]:selectedAddons.filter(id=>id!==a._id))} className="mr-2 accent-zinc-100"/>{a.label}</span><span className="text-zinc-400">+ {money(a.priceAdjustment)}</span></label>)}</div></div>
        <Button className="w-full">Save Menu Item</Button>
      </form>
    </Modal>
  </div>;
}

function AddonsTab({addons,categories,invalidate,remove}:any) {
  const [edit,setEdit]=useState<any>(null),toast=useToast();
  const save=async(e:any)=>{e.preventDefault();const fd=new FormData(e.currentTarget);const body:any={label:fd.get('label'),priceAdjustment:Number(fd.get('priceAdjustment')),category:fd.get('category')||undefined,active:fd.get('active')==='on'};try{if(edit?._id)await api.patch(`/add-ons/${edit._id}`,body);else await api.post('/add-ons',body);toast.push('Add-on saved');setEdit(null);invalidate();}catch(err){toast.push(messageOf(err),'error');}};
  return <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-zinc-800 p-4"><h3 className="font-black text-white">Add-ons</h3><Button onClick={()=>setEdit({active:true})}><Plus size={16}/>Add-on</Button></div><div className="overflow-x-auto"><table><thead><tr><th>Add-on</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>{addons.map((a:any)=><tr key={a._id}><td className="font-black">{a.label}</td><td>{nameOf(a.category)}</td><td>{money(a.priceAdjustment)}</td><td><Badge>{a.active}</Badge></td><td><div className="flex gap-1"><button onClick={()=>setEdit(a)} className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800"><MoreHorizontal size={18}/></button><button onClick={()=>remove('add-ons',a._id,a.label)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{!addons.length&&<Empty title="No add-ons yet"/>}</div><Modal open={!!edit} onClose={()=>setEdit(null)} title={`${edit?._id?'Edit':'Add'} Add-on`}><form onSubmit={save} className="space-y-4 p-5"><Field name="label" label="Label" defaultValue={edit?.label} required/><Field name="priceAdjustment" label="Price adjustment" type="number" defaultValue={edit?.priceAdjustment||0}/><label className="block text-sm font-medium text-zinc-300">Category<select name="category" defaultValue={idOf(edit?.category)} className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5"><option value="">Any category</option>{categories.map((c:any)=><option key={c._id} value={c._id}>{c.name}</option>)}</select></label><label className="flex items-center gap-3 text-sm font-bold text-zinc-200"><input name="active" type="checkbox" defaultChecked={edit?.active!==false} className="accent-zinc-100"/>Active</label><Button className="w-full">Save Add-on</Button></form></Modal></Card>;
}

function DealsTab({deals,promos,items,invalidate,remove}:any) {
  const [deal,setDeal]=useState<any>(null),[promo,setPromo]=useState<any>(null),toast=useToast();
  const saveDeal=async(e:any)=>{e.preventDefault();const fd=new FormData(e.currentTarget);const body:any={name:fd.get('name'),description:fd.get('description'),price:Number(fd.get('price')),items:[{menuItem:fd.get('menuItem'),quantity:Number(fd.get('quantity')||1)}],active:fd.get('active')==='on'};try{if(deal?._id)await api.patch(`/deals/${deal._id}`,body);else await api.post('/deals',body);toast.push('Deal saved');setDeal(null);invalidate();}catch(err){toast.push(messageOf(err),'error');}};
  const savePromo=async(e:any)=>{e.preventDefault();const fd=new FormData(e.currentTarget);const body:any={code:String(fd.get('code')||'').toUpperCase(),label:fd.get('label'),discountType:fd.get('discountType'),discount:Number(fd.get('discount')),active:fd.get('active')==='on'};try{if(promo?._id)await api.patch(`/promos/${promo._id}`,body);else await api.post('/promos',body);toast.push('Promo saved');setPromo(null);invalidate();}catch(err){toast.push(messageOf(err),'error');}};
  return <div className="grid gap-4 xl:grid-cols-2">
    <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-zinc-800 p-4"><h3 className="flex items-center gap-2 font-black text-white"><Layers3 size={18}/>Deals</h3><Button onClick={()=>setDeal({active:true,quantity:1})}><Plus size={16}/>Deal</Button></div><div className="divide-y divide-zinc-800">{deals.map((d:any)=><div key={d._id} className="flex items-center justify-between gap-3 p-4"><div><div className="font-black text-white">{d.name}</div><div className="text-sm text-zinc-500">{d.items?.length||0} item set - {money(d.price)}</div></div><div className="flex items-center gap-2"><Badge>{d.active}</Badge><button onClick={()=>setDeal(d)} className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800"><MoreHorizontal size={18}/></button><button onClick={()=>remove('deals',d._id,d.name)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={16}/></button></div></div>)}{!deals.length&&<Empty title="No deals yet"/>}</div></Card>
    <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-zinc-800 p-4"><h3 className="flex items-center gap-2 font-black text-white"><BadgePercent size={18}/>Promo Codes</h3><Button onClick={()=>setPromo({active:true,discountType:'percentage'})}><Plus size={16}/>Promo</Button></div><div className="divide-y divide-zinc-800">{promos.map((p:any)=><div key={p._id} className="flex items-center justify-between gap-3 p-4"><div><div className="font-black text-white">{p.code}</div><div className="text-sm text-zinc-500">{p.label||'Promo'} - {p.discountType==='percentage'?`${p.discount}%`:money(p.discount)}</div></div><div className="flex items-center gap-2"><Badge>{p.active}</Badge><button onClick={()=>setPromo(p)} className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800"><MoreHorizontal size={18}/></button><button onClick={()=>remove('promos',p._id,p.code)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={16}/></button></div></div>)}{!promos.length&&<Empty title="No promos yet"/>}</div></Card>
    <Modal open={!!deal} onClose={()=>setDeal(null)} title={`${deal?._id?'Edit':'Add'} Deal`}><form onSubmit={saveDeal} className="space-y-4 p-5"><Field name="name" label="Name" defaultValue={deal?.name} required/><Field name="description" label="Description" defaultValue={deal?.description}/><Field name="price" label="Deal price" type="number" defaultValue={deal?.price||0} required/><label className="block text-sm font-medium text-zinc-300">Lead item<select name="menuItem" defaultValue={idOf(deal?.items?.[0]?.menuItem)} required className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5"><option value="">Select item</option>{items.map((i:any)=><option key={i._id} value={i._id}>{i.name}</option>)}</select></label><Field name="quantity" label="Quantity" type="number" defaultValue={deal?.items?.[0]?.quantity||1}/><label className="flex items-center gap-3 text-sm font-bold text-zinc-200"><input name="active" type="checkbox" defaultChecked={deal?.active!==false} className="accent-zinc-100"/>Active</label><Button className="w-full">Save Deal</Button></form></Modal>
    <Modal open={!!promo} onClose={()=>setPromo(null)} title={`${promo?._id?'Edit':'Add'} Promo`}><form onSubmit={savePromo} className="space-y-4 p-5"><Field name="code" label="Code" defaultValue={promo?.code} required/><Field name="label" label="Label" defaultValue={promo?.label}/><label className="block text-sm font-medium text-zinc-300">Discount type<select name="discountType" defaultValue={promo?.discountType||'percentage'} className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label><Field name="discount" label="Discount" type="number" defaultValue={promo?.discount||10} required/><label className="flex items-center gap-3 text-sm font-bold text-zinc-200"><input name="active" type="checkbox" defaultChecked={promo?.active!==false} className="accent-zinc-100"/>Active</label><Button className="w-full">Save Promo</Button></form></Modal>
  </div>;
}

function CategoriesTab({categories,categoryCounts,invalidate,remove}:any) {
  const [edit,setEdit]=useState<any>(null),toast=useToast();
  const save=async(e:any)=>{e.preventDefault();const fd=new FormData(e.currentTarget);const body:any={name:fd.get('name'),icon:fd.get('icon'),displayOrder:Number(fd.get('displayOrder')||0),active:fd.get('active')==='on'};try{if(edit?._id)await api.patch(`/categories/${edit._id}`,body);else await api.post('/categories',body);toast.push('Category saved');setEdit(null);invalidate();}catch(err){toast.push(messageOf(err),'error');}};
  return <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-zinc-800 p-4"><h3 className="flex items-center gap-2 font-black text-white"><Tag size={18}/>Categories</h3><Button onClick={()=>setEdit({active:true})}><Plus size={16}/>Category</Button></div><div className="overflow-x-auto"><table><thead><tr><th>Name</th><th>Items</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead><tbody>{categories.map((c:any)=><tr key={c._id}><td className="font-black">{c.icon?`${c.icon} `:''}{c.name}</td><td>{categoryCounts.find((x:any)=>x.category._id===c._id)?.count||0}</td><td>{c.displayOrder||0}</td><td><Badge>{c.active}</Badge></td><td><div className="flex gap-1"><button onClick={()=>setEdit(c)} className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800"><MoreHorizontal size={18}/></button><button onClick={()=>remove('categories',c._id,c.name)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{!categories.length&&<Empty title="No categories yet"/>}</div><Modal open={!!edit} onClose={()=>setEdit(null)} title={`${edit?._id?'Edit':'Add'} Category`}><form onSubmit={save} className="space-y-4 p-5"><Field name="name" label="Name" defaultValue={edit?.name} required/><Field name="icon" label="Icon" defaultValue={edit?.icon}/><Field name="displayOrder" label="Display order" type="number" defaultValue={edit?.displayOrder||0}/><label className="flex items-center gap-3 text-sm font-bold text-zinc-200"><input name="active" type="checkbox" defaultChecked={edit?.active!==false} className="accent-zinc-100"/>Active</label><Button className="w-full">Save Category</Button></form></Modal></Card>;
}
