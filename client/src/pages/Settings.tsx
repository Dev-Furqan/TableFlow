import {useEffect,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Building2,GitBranch,Percent,ReceiptText,Printer,WalletCards,ShieldCheck,Palette,ChefHat} from 'lucide-react';
import {Button,Card,Field} from '../components/ui';
import {useToast} from '../store/toast';
import {api,messageOf} from '../services/api';

const sections=[['Restaurant profile',Building2],['Branches',GitBranch],['Taxes & charges',Percent],['Receipt',ReceiptText],['Printers',Printer],['Payment methods',WalletCards],['Roles & permissions',ShieldCheck],['Appearance',Palette],['Kitchen tickets',ChefHat]] as const;
const defaultProfile={name:'RestaurantOS Kitchen',phone:'+92 300 555 0199',email:'hello@restaurantos.local',timezone:'Asia/Karachi',address:'12 Market Street, Lahore'};
const defaultCharges={salesTaxRate:15,serviceChargeRate:10,serviceChargeEnabled:true};

export default function Settings() {
  const [section,setSection]=useState('Restaurant profile');
  const toast=useToast();
  const qc=useQueryClient();
  const [profile,setProfile]=useState(defaultProfile);
  const [charges,setCharges]=useState(defaultCharges);
  const [savingProfile,setSavingProfile]=useState(false);
  const [savingCharges,setSavingCharges]=useState(false);
  const {data:settings=[]}=useQuery({queryKey:['settings'],queryFn:()=>api.get('/settings?limit=100').then(r=>r.data.data)});
  const profileSetting=settings.find((setting:any)=>setting.key==='restaurant');
  const chargeSetting=settings.find((setting:any)=>setting.key==='charges');
  useEffect(()=>{if(profileSetting?.value){const value=profileSetting.value;setProfile({name:value.name??defaultProfile.name,phone:value.phone??defaultProfile.phone,email:value.email??defaultProfile.email,timezone:value.timezone??defaultProfile.timezone,address:value.address??defaultProfile.address});}},[profileSetting]);
  useEffect(()=>{if(chargeSetting?.value){const value=chargeSetting.value;setCharges({salesTaxRate:Number(value.salesTaxRate??value.taxRate??15),serviceChargeRate:Number(value.serviceChargeRate??10),serviceChargeEnabled:value.serviceChargeEnabled??true});}},[chargeSetting]);
  const saveSetting=async(_setting:any,key:string,value:unknown)=>api.put(`/settings/${encodeURIComponent(key)}`,{value});
  const saveProfile=async(e:React.FormEvent)=>{e.preventDefault();setSavingProfile(true);try{await saveSetting(profileSetting,'restaurant',profile);await qc.invalidateQueries({queryKey:['settings']});toast.push('Restaurant profile saved');}catch(error){toast.push(messageOf(error),'error');}finally{setSavingProfile(false);}};
  const saveCharges=async(e:React.FormEvent)=>{e.preventDefault();setSavingCharges(true);try{await saveSetting(chargeSetting,'charges',charges);await qc.invalidateQueries({queryKey:['settings']});toast.push('Tax and service charge settings saved');}catch(error){toast.push(messageOf(error),'error');}finally{setSavingCharges(false);}};
  return <div className="space-y-7">
    <div className="border-b border-zinc-800 pb-7"><h2 className="text-3xl font-extrabold text-white">Settings</h2><p className="mt-2 text-zinc-400">Configure how your restaurant works and prints.</p></div>
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <Card className="h-fit p-2">{sections.map(([name,Icon])=><button key={name} onClick={()=>setSection(name)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${section===name?'bg-zinc-100 text-zinc-950':'text-zinc-300 hover:bg-zinc-900 hover:text-white'}`}><Icon size={18}/>{name}</button>)}</Card>
      <Card className="p-5 md:p-7">
        <div className="border-b border-zinc-800 pb-5"><h3 className="text-lg font-extrabold text-white">{section}</h3><p className="mt-1 text-sm text-zinc-500">Changes apply to the Downtown branch unless noted otherwise.</p></div>
        {section==='Restaurant profile'?<form className="mt-6 grid max-w-2xl gap-5 sm:grid-cols-2" onSubmit={saveProfile}>
          <Field label="Restaurant name" value={profile.name} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setProfile(current=>({...current,name:e.target.value}))}/>
          <Field label="Phone" type="tel" value={profile.phone} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setProfile(current=>({...current,phone:e.target.value}))}/>
          <Field label="Email" type="email" value={profile.email} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setProfile(current=>({...current,email:e.target.value}))}/>
          <Field label="Time zone" value={profile.timezone} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setProfile(current=>({...current,timezone:e.target.value}))}/>
          <div className="sm:col-span-2"><Field label="Address" value={profile.address} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setProfile(current=>({...current,address:e.target.value}))}/></div>
          <Button loading={savingProfile} className="sm:col-span-2 sm:w-fit">Save changes</Button>
        </form>:section==='Taxes & charges'?<form className="mt-6 grid max-w-2xl gap-5 sm:grid-cols-2" onSubmit={saveCharges}><Field label="Sales tax (%)" type="number" min="0" step="0.01" value={charges.salesTaxRate} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setCharges(current=>({...current,salesTaxRate:Math.max(0,Number(e.target.value)||0)}))}/><Field label="Service charge (%)" type="number" min="0" step="0.01" value={charges.serviceChargeRate} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setCharges(current=>({...current,serviceChargeRate:Math.max(0,Number(e.target.value)||0)}))}/><label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300 sm:col-span-2"><input type="checkbox" checked={charges.serviceChargeEnabled} onChange={e=>setCharges(current=>({...current,serviceChargeEnabled:e.target.checked}))}/>Apply service charge by default</label><Button loading={savingCharges} className="sm:col-span-2 sm:w-fit">Save charges</Button></form>:<div className="mt-6 max-w-2xl"><div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-8 text-center"><h4 className="font-semibold text-white">{section} configuration</h4><p className="mt-1 text-sm text-zinc-500">Manage branch-specific {section.toLowerCase()} options here.</p><Button className="mt-5" onClick={()=>toast.push(`${section} settings saved`)}>Save settings</Button></div></div>}
      </Card>
    </div>
  </div>;
}
