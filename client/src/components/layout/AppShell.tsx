import {NavLink,Outlet,useLocation} from 'react-router-dom';
import {LayoutDashboard,ShoppingCart,ClipboardList,Armchair,ChefHat,UtensilsCrossed,Boxes,BookOpen,Users,Truck,PackageCheck,Receipt,Landmark,BarChart3,UserCog,Settings,LogOut,Menu,X,Bell,Search,CalendarDays,Moon,PanelLeft,Zap} from 'lucide-react';
import {useMemo,useState} from 'react';
import {useAuth} from '../../store/auth';

const items=[['Dashboard','/dashboard',LayoutDashboard],['Point of Sale','/pos',ShoppingCart],['Orders','/orders',ClipboardList],['Tables','/tables',Armchair],['Kitchen Display','/kds',ChefHat],['Menu','/menu',UtensilsCrossed],['Inventory','/inventory',Boxes],['Recipes','/recipes',BookOpen],['Customers','/customers',Users],['Suppliers','/suppliers',Truck],['Purchases','/purchases',PackageCheck],['Expenses','/expenses',Receipt],['Accounting','/accounting',Landmark],['Reports','/reports',BarChart3],['Staff','/staff',UserCog],['Settings','/settings',Settings]] as const;
const restricted:any={kitchen:['/kds'],cashier:['/dashboard','/pos','/orders','/tables','/customers'],waiter:['/dashboard','/pos','/orders','/tables','/customers'],accountant:['/dashboard','/purchases','/expenses','/accounting','/reports'],viewer:['/dashboard','/orders','/reports']};

export function AppShell() {
  const [open,setOpen]=useState(false);
  const {user,logout}=useAuth();
  const location=useLocation();
  const allowed=restricted[user?.role||'']||items.map(i=>i[1]);
  const current=items.find(i=>i[1]===location.pathname);
  const title=current?.[0]||location.pathname.slice(1).replaceAll('-',' ')||'Dashboard';
  const CurrentIcon=current?.[2]||LayoutDashboard;
  const today=useMemo(()=>new Date().toLocaleDateString(undefined,{weekday:'short',day:'2-digit',month:'short'}),[]);
  const initials=user?.name?.split(' ').map(x=>x[0]).slice(0,2).join('')||'A';

  return <div className="min-h-screen bg-[#0b0b0d] text-zinc-100">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-zinc-800 bg-[#171719] text-zinc-400 transition-transform lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}>
      <div className="flex h-24 items-center justify-between border-b border-zinc-800 px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-950"><Zap size={22}/></span>
          <div>
            <div className="text-lg font-extrabold text-white">RestaurantOS</div>
            <div className="text-sm text-zinc-400">SparkPair product</div>
          </div>
        </div>
        <button className="rounded-xl p-2 hover:bg-zinc-900 lg:hidden" onClick={()=>setOpen(false)}><X/></button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-5 py-7">
        {items.filter(i=>allowed.includes(i[1])).map(([label,path,Icon])=><NavLink key={path} to={path} onClick={()=>setOpen(false)} className={({isActive})=>`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition ${isActive?'bg-zinc-100 text-zinc-950':'hover:bg-zinc-900 hover:text-white'}`}><Icon size={19}/>{label}</NavLink>)}
      </nav>

      <div className="p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-zinc-900/80 p-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-800 font-bold text-white">{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-white">{user?.name||'Ahmed Khan'}</div>
            <div className="text-xs capitalize text-zinc-400">{user?.role||'Admin'}</div>
          </div>
          <button onClick={logout} className="rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"><LogOut size={16} className="sm:hidden"/><span className="hidden sm:inline">Sign out</span></button>
        </div>
      </div>
    </aside>

    {open&&<button aria-label="Close menu" onClick={()=>setOpen(false)} className="fixed inset-0 z-30 bg-black/60 lg:hidden"/>}

    <div className="lg:pl-80">
      <header className="sticky top-0 z-20 flex h-24 items-center justify-between border-b border-zinc-800 bg-[#0b0b0d]/95 px-4 backdrop-blur md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <button className="rounded-xl border border-zinc-800 p-2 text-zinc-300 hover:bg-zinc-900 lg:hidden" onClick={()=>setOpen(true)}><Menu/></button>
          <button className="hidden rounded-xl border border-zinc-800 p-2 text-zinc-300 hover:bg-zinc-900 lg:block"><PanelLeft size={21}/></button>
          <div className="hidden h-10 w-px bg-zinc-800 md:block"/>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-zinc-800 text-zinc-200"><CurrentIcon size={22}/></div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold capitalize text-white">{title}</h1>
            <p className="hidden truncate text-sm text-zinc-400 sm:block">RestaurantOS by SparkPair - sparkpair.dev</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden items-center gap-2 rounded-2xl border border-zinc-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-900 md:inline-flex"><Search size={17}/>Search<span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">Ctrl</span><span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">K</span></button>
          <button className="hidden items-center gap-2 rounded-2xl border border-zinc-800 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900 sm:inline-flex"><CalendarDays size={17}/>{today}</button>
          <button className="relative rounded-2xl border border-zinc-800 p-3 text-zinc-300 hover:bg-zinc-900"><Bell size={18}/><i className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-zinc-100 text-[10px] font-black text-zinc-950">5</i></button>
          <button className="rounded-2xl border border-zinc-800 p-3 text-zinc-300 hover:bg-zinc-900"><Moon size={18}/></button>
        </div>
      </header>
      <main className="min-h-[calc(100vh-6rem)] p-4 md:p-8"><Outlet/></main>
    </div>
  </div>;
}
