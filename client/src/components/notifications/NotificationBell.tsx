import {useState} from 'react';
import {Bell,CheckCheck,Inbox,Trash2} from 'lucide-react';
import {useNotifications} from '../../store/notifications';

const timeLabel=(value:string)=>new Date(value).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

export function NotificationBell() {
  const [open,setOpen]=useState(false);
  const notifications=useNotifications(s=>s.notifications);
  const markRead=useNotifications(s=>s.markRead);
  const markAllRead=useNotifications(s=>s.markAllRead);
  const clear=useNotifications(s=>s.clear);
  const unread=notifications.filter(item=>!item.read).length;

  return <div className="relative">
    <button aria-label="Open notifications" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(value=>!value)} className="relative rounded-2xl border border-zinc-800 p-3 text-zinc-300 hover:bg-zinc-900">
      <Bell size={18}/>
      {unread>0&&<i className="absolute right-2 top-2 grid h-5 min-w-5 place-items-center rounded-full bg-zinc-100 px-1 text-[10px] font-black not-italic text-zinc-950">{unread>99?'99+':unread}</i>}
    </button>
    {open&&<div role="dialog" aria-label="Notifications" className="absolute right-0 top-14 z-50 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-zinc-800 bg-[#171719] shadow-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div>
          <div className="font-black text-white">Notifications</div>
          <div className="text-xs text-zinc-500">{unread} unread</div>
        </div>
        <div className="flex gap-1">
          <button aria-label="Mark all read" onClick={markAllRead} disabled={!notifications.length} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white disabled:opacity-40"><CheckCheck size={17}/></button>
          <button aria-label="Clear notifications" onClick={clear} disabled={!notifications.length} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white disabled:opacity-40"><Trash2 size={16}/></button>
        </div>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length?notifications.map(item=><button key={item.id} onClick={()=>markRead(item.id)} className={`block w-full border-b border-zinc-800 px-4 py-3 text-left transition last:border-b-0 hover:bg-zinc-900 ${item.read?'opacity-70':'bg-zinc-950/30'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-white">{item.title}</div>
              <div className="mt-1 text-sm leading-5 text-zinc-400">{item.message}</div>
            </div>
            <div className="shrink-0 text-xs font-semibold text-zinc-500">{timeLabel(item.createdAt)}</div>
          </div>
        </button>):<div className="grid min-h-48 place-items-center px-4 text-center text-zinc-500">
          <div><Inbox className="mx-auto mb-3" size={26}/><div className="font-semibold text-zinc-300">No notifications yet</div><div className="mt-1 text-sm">Order updates will appear here.</div></div>
        </div>}
      </div>
    </div>}
  </div>;
}
