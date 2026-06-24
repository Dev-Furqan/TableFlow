import {useCallback} from 'react';
import {useSocket} from '../../hooks/useSocket';
import {useNotifications} from '../../store/notifications';
import {useToast} from '../../store/toast';

type OrderNotification={
  id?:string;
  title?:string;
  message?:string;
  orderId?:string;
  orderNumber?:string;
  createdAt?:string;
  status?:string;
  action?:string;
};

export function OrderNotifications() {
  const toast=useToast();
  const addNotification=useNotifications(s=>s.add);
  const notify=useCallback((payload:OrderNotification)=> {
    const message=payload.message||`${payload.orderNumber||'Order'} ${payload.action||payload.status||'updated'}`;
    const title=payload.title||'Order update';
    addNotification({id:payload.id,title,message,kind:'info',orderId:payload.orderId,orderNumber:payload.orderNumber,action:payload.action,createdAt:payload.createdAt});
    toast.push(`${title}: ${message}`,'info');
  },[addNotification,toast]);

  useSocket({'notification:order':notify});
  return null;
}
