import {useState} from 'react';
import {Navigate} from 'react-router-dom';
import {Eye,EyeOff,Zap,ShoppingCart,ChefHat,BarChart3} from 'lucide-react';
import {useAuth} from '../store/auth';
import {Button,Field} from '../components/ui';
import {messageOf} from '../services/api';

export default function Login() {
  const {user,login}=useAuth();
  const [email,setEmail]=useState('admin@tableflow.local'),[password,setPassword]=useState('Demo@123'),[show,setShow]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
  if(user)return <Navigate to="/dashboard" replace/>;
  const submit=async(e:any)=>{e.preventDefault();setLoading(true);setError('');try{await login(email,password);}catch(e){setError(messageOf(e));}finally{setLoading(false);}};

  return <div className="grid min-h-screen bg-[#0b0b0d] text-zinc-100 lg:grid-cols-[1.05fr_.95fr]">
    <section className="hidden border-r border-zinc-800 bg-[#171719] p-10 lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-950"><Zap size={22}/></span><div><div className="text-xl font-extrabold text-white">RestaurantOS</div><div className="text-sm text-zinc-400">Nexus Blend Studio</div></div></div>
      <div className="max-w-xl">
        <h1 className="text-5xl font-black leading-tight text-white">Run service from one calm, fast workspace.</h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-400">Point of sale, orders, kitchen tickets, inventory, and reports share one dark operating surface.</p>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[['POS',ShoppingCart],['Kitchen',ChefHat],['Reports',BarChart3]].map(([label,Icon]:any)=><div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"><Icon className="text-zinc-400"/><div className="mt-4 font-bold text-white">{label}</div></div>)}
        </div>
      </div>
      <p className="text-sm text-zinc-600">2026 RestaurantOS</p>
    </section>

    <section className="flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#171719] p-7 shadow-2xl shadow-black/30 md:p-10">
        <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-950"><Zap size={20}/></span><span className="text-xl font-black text-white">RestaurantOS</span></div>
        <h2 className="text-3xl font-black text-white">Welcome back</h2>
        <p className="mt-2 text-zinc-400">Sign in to start your shift.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <Field label="Email address" type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)} required/>
          <label className="block text-sm font-medium text-zinc-300">Password<div className="relative mt-1.5"><input className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 pr-11 text-zinc-100 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-white/10" type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-2.5 text-zinc-400 hover:text-white">{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label>
          {error&&<p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
          <Button loading={loading} className="w-full">Sign in</Button>
        </form>
        <div className="mt-7 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-5 text-zinc-500"><strong className="text-zinc-300">Demo account</strong><br/>admin@tableflow.local - Demo@123</div>
      </div>
    </section>
  </div>;
}
