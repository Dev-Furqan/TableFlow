import type {ButtonHTMLAttributes,ReactNode} from 'react';
import {X,LoaderCircle,Inbox} from 'lucide-react';
import {useToast} from '../../store/toast';

export function Button({className='',variant='primary',loading,children,...p}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'|'danger'|'ghost';loading?:boolean}) {
  const styles={
    primary:'bg-zinc-100 text-zinc-950 hover:bg-white',
    secondary:'border border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-900',
    danger:'bg-rose-600 text-white hover:bg-rose-500',
    ghost:'border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-900'
  };
  return <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} disabled={loading||p.disabled} {...p}>{loading&&<LoaderCircle size={16} className="animate-spin"/>}{children}</button>;
}

export function Card({children,className=''}:{children:ReactNode;className?:string}) {
  return <div className={`rounded-2xl border border-zinc-800 bg-[#171719] shadow-[0_18px_50px_rgba(0,0,0,.22)] ${className}`}>{children}</div>;
}

export function Badge({children,tone}:{children:ReactNode;tone?:string}) {
  const key=(tone||String(children)).toLowerCase();
  const label=typeof children==='string'||typeof children==='number'?String(children).replaceAll('-',' '):children;
  const c=key.includes('complete')||key.includes('ready')||key.includes('available')||key.includes('paid')||key==='true'
    ?'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    :key.includes('cancel')||key.includes('refund')||key.includes('low')||key==='false'
      ?'border-rose-500/30 bg-rose-500/10 text-rose-300'
      :key.includes('prepar')||key.includes('occup')||key.includes('partial')||key.includes('pending')
        ?'border-amber-500/30 bg-amber-500/10 text-amber-300'
        :'border-zinc-700 bg-zinc-900 text-zinc-200';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${c}`}>{label}</span>;
}

export function Modal({open,onClose,title,children,className='max-w-lg'}:{open:boolean;onClose:()=>void;title:string;children:ReactNode;className?:string}) {
  if(!open)return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={onClose}><div className={`max-h-[90vh] w-full overflow-auto rounded-2xl border border-zinc-800 bg-[#171719] text-zinc-100 shadow-2xl ${className}`} onMouseDown={e=>e.stopPropagation()}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-[#171719]/95 px-5 py-4 backdrop-blur"><h2 className="text-lg font-bold">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"><X size={20}/></button></div>{children}</div></div>;
}

export function Empty({title='Nothing here yet',text='New records will appear here.'}:{title?:string;text?:string}) {
  return <div className="grid min-h-52 place-items-center text-center text-zinc-400"><div><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-zinc-900 text-zinc-500"><Inbox size={22}/></div><h3 className="font-semibold text-zinc-100">{title}</h3><p className="mt-1 text-sm text-zinc-500">{text}</p></div></div>;
}

export function Toasts() {
  const {toasts,remove}=useToast();
  return <div className="fixed right-5 top-5 z-[100] space-y-2">{toasts.map(t=><button onClick={()=>remove(t.id)} key={t.id} className={`block min-w-64 rounded-xl border px-4 py-3 text-left text-sm font-medium text-white shadow-xl ${t.kind==='error'?'border-rose-500/30 bg-rose-600':t.kind==='info'?'border-zinc-700 bg-zinc-900':'border-emerald-500/30 bg-emerald-600'}`}>{t.message}</button>)}</div>;
}

export function Field({label,className='',...p}:any) {
  return <label className="block text-sm font-medium text-zinc-300">{label}<input {...p} className={`mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-2 focus:ring-white/10 ${className}`}/></label>;
}
