import {useState} from 'react';
import {Download,TrendingUp,ShoppingBag,Receipt,Wallet} from 'lucide-react';
import {useQuery} from '@tanstack/react-query';
import {api} from '../services/api';
import {Button,Card,Field} from '../components/ui';
import {BarChart,Bar,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';

export default function Reports() {
  const [from,setFrom]=useState(new Date(Date.now()-30*864e5).toISOString().slice(0,10)),[to,setTo]=useState(new Date().toISOString().slice(0,10));
  const {data={}}=useQuery({queryKey:['reports',from,to],queryFn:()=>api.get('/reports/accounting',{params:{from,to}}).then(r=>r.data.data)});
  const chart=[{name:'Sales',value:data.sales||0},{name:'Purchases',value:data.purchases||0},{name:'Expenses',value:data.expenses||0},{name:'Net profit',value:data.netProfit||0}];

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 border-b border-zinc-800 pb-7 sm:flex-row sm:items-end">
      <div><h2 className="text-3xl font-extrabold text-white">Sales Reports</h2><p className="mt-2 text-zinc-400">Turn service activity into useful decisions.</p></div>
      <div className="flex gap-2"><select className="dark-input min-w-44"><option>Today</option><option>This week</option><option>This month</option></select><Button variant="secondary" onClick={()=>location.assign('/api/reports/export/orders')}><Download size={17}/>Export CSV</Button></div>
    </div>

    <Card className="flex flex-wrap items-end gap-3 p-4">
      <Field label="From" type="date" value={from} onChange={(e:any)=>setFrom(e.target.value)}/>
      <Field label="To" type="date" value={to} onChange={(e:any)=>setTo(e.target.value)}/>
      <label className="block text-sm font-medium text-zinc-300">Branch<select className="dark-input mt-1.5 block"><option>All branches</option><option>Downtown</option></select></label>
    </Card>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[['Sales',data.sales,TrendingUp],['Purchases',data.purchases,ShoppingBag],['Expenses',data.expenses,Receipt],['Net profit',data.netProfit,Wallet]].map(([label,value,Icon]:any)=><Card key={label} className="p-6"><div className="flex items-start justify-between"><div><div className="text-sm text-zinc-400">{label}</div><div className="mt-3 text-3xl font-black text-white">Rs {Math.round(value||0).toLocaleString()}</div></div><Icon className="text-zinc-400"/></div></Card>)}
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <Card className="p-6">
        <h3 className="font-extrabold text-white">Financial overview</h3>
        <div className="mt-5 h-80"><ResponsiveContainer><BarChart data={chart}><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#27272a"/><XAxis dataKey="name" tick={{fill:'#a1a1aa'}}/><YAxis tick={{fill:'#a1a1aa'}} tickFormatter={v=>`${v/1000}k`}/><Tooltip contentStyle={{background:'#171719',border:'1px solid #3f3f46',borderRadius:12,color:'#fff'}} formatter={(v:any)=>`Rs ${v.toLocaleString()}`}/><Bar dataKey="value" fill="#f5f5f7" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div>
      </Card>
      <Card className="p-6">
        <h3 className="font-extrabold text-white">Report library</h3>
        <div className="mt-4 divide-y divide-zinc-800">{['Sales by item','Sales by category','Sales by staff','Inventory status','Profit & loss','Table utilisation'].map(x=><button key={x} className="flex w-full items-center justify-between py-3 text-sm font-semibold text-zinc-300 hover:text-white"><span>{x}</span><Download size={15}/></button>)}</div>
      </Card>
    </div>
  </div>;
}
