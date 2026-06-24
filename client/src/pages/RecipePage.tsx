import {useMemo,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Boxes,BookOpen,Edit3,Plus,Search,Trash2,UtensilsCrossed} from 'lucide-react';
import {api,messageOf} from '../services/api';
import {Badge,Button,Card,Empty,Field,Modal} from '../components/ui';
import {useToast} from '../store/toast';
import type {InventoryItem,MenuItem,Recipe} from '../types';

const money=(n:number)=>`Rs ${Math.round(Number(n)||0).toLocaleString()}`;
const idOf=(v:any)=>v?._id||v||'';

export default function RecipePage() {
  const [search,setSearch]=useState('');
  const [edit,setEdit]=useState<any>(null);
  const [stockOpen,setStockOpen]=useState(false);
  const qc=useQueryClient(),toast=useToast();
  const {data:items=[]}=useQuery<MenuItem[]>({queryKey:['menu-items'],queryFn:()=>api.get('/menu-items?limit=100').then(r=>r.data.data)});
  const {data:inventory=[]}=useQuery<InventoryItem[]>({queryKey:['inventory'],queryFn:()=>api.get('/inventory?limit=100').then(r=>r.data.data)});
  const {data:recipes=[]}=useQuery<Recipe[]>({queryKey:['recipes'],queryFn:()=>api.get('/recipes?limit=100').then(r=>r.data.data)});
  const recipeByItem=useMemo(()=>new Map(recipes.map((r:any)=>[idOf(r.menuItem),r])),[recipes]);
  const rows=items.filter(i=>i.name.toLowerCase().includes(search.toLowerCase()));
  const linked=recipes.reduce((sum:any,r:any)=>sum+(r.ingredients?.length||0),0);
  const lowStock=inventory.filter(i=>Number(i.currentStock)<=Number(i.minimumStock)).length;
  const openRecipe=(item:any)=>setEdit({item,recipe:recipeByItem.get(item._id),ingredients:(recipeByItem.get(item._id)?.ingredients||[]).map((ing:any)=>({item:idOf(ing.item),quantity:ing.quantity}))});
  const invalidate=()=>['recipes','inventory'].forEach(k=>qc.invalidateQueries({queryKey:[k]}));
  const saveRecipe=async(e:any)=>{e.preventDefault();const ingredients=(edit.ingredients||[]).filter((ing:any)=>ing.item&&Number(ing.quantity)>0);const costPerServing=ingredients.reduce((sum:number,ing:any)=>{const stock=inventory.find(x=>x._id===ing.item);return sum+(Number(stock?.costPrice)||0)*Number(ing.quantity);},0);const body={menuItem:edit.item._id,ingredients,costPerServing};try{if(edit.recipe?._id)await api.patch(`/recipes/${edit.recipe._id}`,body);else await api.post('/recipes',body);toast.push('Recipe saved');setEdit(null);invalidate();}catch(err){toast.push(messageOf(err),'error');}};
  const saveInventory=async(e:any)=>{e.preventDefault();const fd=new FormData(e.currentTarget);const body:any={name:fd.get('name'),sku:fd.get('sku'),unit:fd.get('unit'),currentStock:Number(fd.get('currentStock')||0),openingStock:Number(fd.get('currentStock')||0),minimumStock:Number(fd.get('minimumStock')||0),costPrice:Number(fd.get('costPrice')||0)};try{await api.post('/inventory',body);toast.push('Inventory item added');setStockOpen(false);qc.invalidateQueries({queryKey:['inventory']});}catch(err){toast.push(messageOf(err),'error');}};

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-5 border-b border-zinc-800 pb-7 xl:flex-row xl:items-end">
      <div><div className="flex items-center gap-3"><BookOpen className="text-zinc-400"/><h2 className="text-3xl font-extrabold text-white">Recipes</h2></div><p className="mt-2 text-zinc-400">Link menu items with inventory ingredients and serving costs.</p></div>
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Menu items" value={items.length}/>
        <Metric label="Linked ingredients" value={linked}/>
        <Metric label="Low stock" value={lowStock} alert/>
      </div>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="relative flex-1">
        <Search className="absolute left-4 top-3.5 text-zinc-500" size={18}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-3 text-sm outline-none focus:border-zinc-500" placeholder="Search menu items..."/>
      </label>
      <Button variant="secondary" onClick={()=>setStockOpen(true)}><Boxes size={16}/>Add inventory</Button>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      {rows.map(item=>{const recipe:any=recipeByItem.get(item._id);const ingredients=recipe?.ingredients||[];return <Card key={item._id} className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-800 text-zinc-400"><UtensilsCrossed size={18}/></span><div><h3 className="font-black text-white">{item.name}</h3><p className="text-sm text-zinc-500">{money(item.price)} sale price - {money(recipe?.costPerServing||item.cost||0)} recipe cost</p></div></div></div>
          <div className="flex items-center gap-2"><Badge>{ingredients.length} ingredients</Badge><button onClick={()=>openRecipe(item)} className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800"><Edit3 size={17}/></button></div>
        </div>
        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
          {ingredients.length?<div className="space-y-2">{ingredients.map((ing:any)=><div key={idOf(ing.item)} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-zinc-300">{ing.item?.name||'Inventory item'}</span><span className="shrink-0 font-bold text-white">{ing.quantity} {ing.item?.unit||''}</span></div>)}</div>:<div className="text-sm text-zinc-500">No ingredients linked yet.</div>}
        </div>
      </Card>;})}
      {!rows.length&&<div className="lg:col-span-2"><Empty title="No recipes found"/></div>}
    </div>

    <Modal open={!!edit} onClose={()=>setEdit(null)} title={edit?.item?`Recipe: ${edit.item.name}`:'Recipe'} className="max-w-3xl">
      {edit&&<form onSubmit={saveRecipe} className="space-y-5 p-5">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><div className="text-sm text-zinc-400">Estimated serving cost</div><div className="mt-1 text-2xl font-black text-white">{money((edit.ingredients||[]).reduce((sum:number,ing:any)=>{const stock=inventory.find(x=>x._id===ing.item);return sum+(Number(stock?.costPrice)||0)*Number(ing.quantity||0);},0))}</div></div>
        <div className="space-y-3">{(edit.ingredients||[]).map((ing:any,index:number)=><div key={index} className="grid gap-3 rounded-xl border border-zinc-800 bg-[#111113] p-3 sm:grid-cols-[1fr_140px_42px]">
          <select value={ing.item} onChange={e=>setEdit((s:any)=>({...s,ingredients:s.ingredients.map((x:any,i:number)=>i===index?{...x,item:e.target.value}:x)}))} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 outline-none"><option value="">Select inventory item</option>{inventory.map(i=><option key={i._id} value={i._id}>{i.name} ({i.unit})</option>)}</select>
          <input type="number" value={ing.quantity} min="0" step="0.01" onChange={e=>setEdit((s:any)=>({...s,ingredients:s.ingredients.map((x:any,i:number)=>i===index?{...x,quantity:Number(e.target.value)}:x)}))} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 outline-none"/>
          <button type="button" onClick={()=>setEdit((s:any)=>({...s,ingredients:s.ingredients.filter((_:any,i:number)=>i!==index)}))} className="grid h-11 w-11 place-items-center rounded-xl text-rose-300 hover:bg-rose-500/10"><Trash2 size={17}/></button>
        </div>)}</div>
        <div className="flex justify-between gap-3"><Button type="button" variant="secondary" onClick={()=>setEdit((s:any)=>({...s,ingredients:[...s.ingredients,{item:'',quantity:1}]}))}><Plus size={16}/>Ingredient</Button><Button>Save Recipe</Button></div>
      </form>}
    </Modal>

    <Modal open={stockOpen} onClose={()=>setStockOpen(false)} title="Add Inventory Item">
      <form onSubmit={saveInventory} className="space-y-4 p-5"><Field name="name" label="Name" required/><Field name="sku" label="SKU"/><Field name="unit" label="Unit" placeholder="piece, kg, liter" required/><Field name="currentStock" label="Current stock" type="number" defaultValue={0}/><Field name="minimumStock" label="Minimum stock" type="number" defaultValue={0}/><Field name="costPrice" label="Cost price" type="number" defaultValue={0}/><Button className="w-full">Save Inventory Item</Button></form>
    </Modal>
  </div>;
}

function Metric({label,value,alert}:{label:string;value:any;alert?:boolean}) {
  return <div className="min-w-28 rounded-xl border border-zinc-800 bg-[#171719] p-4"><div className="text-xs font-bold text-zinc-500">{label}</div><div className={`mt-2 text-xl font-black ${alert?'text-rose-300':'text-white'}`}>{value}</div></div>;
}
