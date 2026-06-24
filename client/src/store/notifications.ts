import {create} from 'zustand';

export type AppNotification={
  id:string;
  title:string;
  message:string;
  kind:'success'|'error'|'info';
  read:boolean;
  createdAt:string;
  orderId?:string;
  orderNumber?:string;
  action?:string;
};

type State={
  notifications:AppNotification[];
  add:(notification:Partial<AppNotification>&{message:string})=>void;
  markRead:(id:string)=>void;
  markAllRead:()=>void;
  clear:()=>void;
};

let fallbackId=0;

export const useNotifications=create<State>((set)=>({
  notifications:[],
  add:(notification)=>set((state)=> {
    const id=notification.id||`local-${++fallbackId}`;
    const next:AppNotification={
      id,
      title:notification.title||'Notification',
      message:notification.message,
      kind:notification.kind||'info',
      read:false,
      createdAt:notification.createdAt||new Date().toISOString(),
      orderId:notification.orderId,
      orderNumber:notification.orderNumber,
      action:notification.action
    };
    return {notifications:[next,...state.notifications.filter(item=>item.id!==id)].slice(0,50)};
  }),
  markRead:(id)=>set((state)=>({notifications:state.notifications.map(item=>item.id===id?{...item,read:true}:item)})),
  markAllRead:()=>set((state)=>({notifications:state.notifications.map(item=>({...item,read:true}))})),
  clear:()=>set({notifications:[]})
}));
