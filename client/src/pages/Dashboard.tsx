import {useQuery} from '@tanstack/react-query';
import {api} from '../services/api';
import {Card,Badge,Button} from '../components/ui';
import {Banknote,ClipboardList,Armchair,ChefHat,ArrowUpRight,Boxes} from 'lucide-react';
import {AreaChart,Area,ResponsiveContainer,XAxis,YAxis,Tooltip,CartesianGrid} from 'recharts';
import {Link} from 'react-router-dom';

const money=(n:number)=>`Rs ${Math.round(n||0).toLocaleString()}`;

export default function Dashboard() {
  const {data,isLoading}=useQuery({queryKey:['dashboard'],queryFn:()=>api.get('/dashboard').then(r=>r.data.data),refetchInterval:30000});
  const stats=[['Today sales',money(data?.todaySales),Banknote],['Total orders',data?.totalOrders||0,ClipboardList],['Active tables',data?.activeTables||0,Armchair],['Kitchen queue',data?.pendingKitchen||0,ChefHat]];
  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 border-b border-zinc-800 pb-7 sm:flex-row sm:items-end">
      <div>
        <h2 className="text-3xl font-extrabold text-white">Dashboard</h2>
        <p className="mt-2 text-zinc-400">Live sales, tables, kitchen load, and inventory attention points.</p>
      </div>
      <div className="flex gap-2">
        <Link to="/menu"><Button variant="secondary">Add menu item</Button></Link>
        <Link to="/pos"><Button>Open POS</Button></Link>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(([label,value,Icon]:any)=><Card key={label} className="p-6">
        <div className="flex items-start justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-800 text-zinc-300"><Icon size={22}/></span>
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-300">8.4% <ArrowUpRight size={14}/></span>
        </div>
        <div className="mt-7 text-3xl font-black text-white">{isLoading?'-':value}</div>
        <div className="mt-2 text-sm text-zinc-400">{label}</div>
      </Card>)}
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-white">Revenue trend</h3>
            <p className="text-sm text-zinc-500">Last 14 days</p>
          </div>
          <select className="dark-input"><option>Daily</option><option>Weekly</option></select>
        </div>
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={data?.revenueChart||[]}>
              <defs><linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f5f5f7" stopOpacity={.22}/><stop offset="95%" stopColor="#f5f5f7" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a"/>
              <XAxis dataKey="_id" tick={{fontSize:11,fill:'#a1a1aa'}} axisLine={false}/>
              <YAxis tick={{fontSize:11,fill:'#a1a1aa'}} axisLine={false} tickFormatter={v=>`${v/1000}k`}/>
              <Tooltip contentStyle={{background:'#171719',border:'1px solid #3f3f46',borderRadius:12,color:'#fff'}} formatter={(v:any)=>money(v)}/>
              <Area type="monotone" dataKey="revenue" stroke="#f5f5f7" strokeWidth={3} fill="url(#revenue)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 p-5">
          <div><h3 className="font-extrabold text-white">Low stock</h3><p className="text-sm text-zinc-500">Needs your attention</p></div>
          <Boxes size={20} className="text-zinc-400"/>
        </div>
        <div className="divide-y divide-zinc-800">{data?.lowStock?.map((x:any)=><div key={x._id} className="flex items-center justify-between p-4"><div><div className="text-sm font-semibold text-white">{x.name}</div><div className="text-xs text-zinc-500">Minimum {x.minimumStock} {x.unit}</div></div><Badge tone="low">{x.currentStock} {x.unit}</Badge></div>)}{!data?.lowStock?.length&&<p className="p-6 text-sm text-zinc-500">All stock levels look healthy.</p>}</div>
      </Card>
    </div>

    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 p-5">
        <h3 className="font-extrabold text-white">Recent orders</h3>
        <Link className="text-sm font-semibold text-zinc-300 hover:text-white" to="/orders">View all</Link>
      </div>
      <div className="overflow-x-auto"><table><thead><tr><th>Order</th><th>Guest / table</th><th>Type</th><th>Status</th><th>Total</th></tr></thead><tbody>{data?.recentOrders?.map((o:any)=><tr key={o._id}><td className="font-semibold">{o.orderNumber}</td><td>{o.table?.name||o.customer?.name||'Walk-in'}</td><td className="capitalize">{o.type}</td><td><Badge>{o.status}</Badge></td><td className="font-semibold">{money(o.total)}</td></tr>)}</tbody></table></div>
    </Card>
  </div>;
}
