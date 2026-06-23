import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Armchair,Users,Clock3,Plus} from 'lucide-react';
import {api} from '../services/api';
import {Badge,Button,Card,Modal,Field} from '../components/ui';
import {useSocket} from '../hooks/useSocket';

export default function Tables() {
  const [area,setArea]=useState('All'),[edit,setEdit]=useState<any>(null);
  const qc=useQueryClient();
  const {data:tables=[]}=useQuery({queryKey:['tables'],queryFn:()=>api.get('/tables?limit=100').then(r=>r.data.data)});
  useSocket({'table:statusChanged':()=>qc.invalidateQueries({queryKey:['tables']})});
  const areas=['All',...new Set<string>(tables.map((t:any)=>t.area))];
  const save=async(e:any)=>{e.preventDefault();const body=Object.fromEntries(new FormData(e.currentTarget));body.capacity=Number(body.capacity) as any;if(edit?._id)await api.patch(`/tables/${edit._id}`,body);else await api.post('/tables',body);setEdit(null);qc.invalidateQueries({queryKey:['tables']});};

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 border-b border-zinc-800 pb-7 sm:flex-row sm:items-end">
      <div><h2 className="text-3xl font-extrabold text-white">Floor & tables</h2><p className="mt-2 text-zinc-400">A live view of covers and service time.</p></div>
      <Button onClick={()=>setEdit({})}><Plus size={17}/>Add table</Button>
    </div>
    <div className="flex gap-2 overflow-auto">{areas.map(a=><button key={a} onClick={()=>setArea(a)} className={`category-pill ${area===a?'active':''}`}>{a}</button>)}</div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tables.filter((t:any)=>area==='All'||t.area===area).map((t:any)=><Card key={t._id} className={`cursor-pointer overflow-hidden p-5 ${t.status==='available'?'border-emerald-500/40':t.status==='occupied'?'border-amber-500/40':'border-zinc-700'}`}>
        <div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-800 text-zinc-300"><Armchair/></span><Badge>{t.status}</Badge></div>
        <div className="mt-5 flex items-end justify-between"><div><h3 className="text-lg font-black text-white">{t.name}</h3><p className="text-sm text-zinc-500">{t.area}</p></div><button onClick={()=>setEdit(t)} className="text-xs font-semibold text-zinc-300 hover:text-white">Edit</button></div>
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-zinc-800 pt-4 text-xs text-zinc-500"><span className="flex items-center gap-1"><Users size={14}/>{t.guests||0} / {t.capacity}</span><span className="flex items-center gap-1"><Clock3 size={14}/>{t.seatedAt?`${Math.round((Date.now()-new Date(t.seatedAt).getTime())/60000)} min`:'-'}</span></div>
      </Card>)}
    </div>
    <Modal open={!!edit} onClose={()=>setEdit(null)} title={edit?._id?'Edit table':'Add table'}>
      <form onSubmit={save} className="space-y-4 p-5"><Field name="name" label="Table name" defaultValue={edit?.name} required/><Field name="area" label="Area" defaultValue={edit?.area||'Indoor'} required/><Field name="capacity" label="Capacity" type="number" min="1" defaultValue={edit?.capacity||4}/><label className="block text-sm font-medium text-zinc-300">Status<select name="status" defaultValue={edit?.status||'available'} className="dark-input mt-1.5 w-full">{['available','occupied','reserved','cleaning','blocked'].map(x=><option key={x}>{x}</option>)}</select></label><Button className="w-full">Save table</Button></form>
    </Modal>
  </div>;
}
