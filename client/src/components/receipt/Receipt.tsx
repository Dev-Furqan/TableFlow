import type {Order} from '../../types';

export function Receipt({order}:{order:Order}) {
  return <div className="receipt mx-auto w-[80mm] bg-white p-4 font-mono text-[11px] text-black">
    <div className="text-center">
      <div className="text-lg font-bold">RESTAURANTOS KITCHEN</div>
      <div>12 Market Street - +92 300 555 0199</div>
      <div className="my-3 border-y border-dashed py-2"><strong>{order.orderNumber}</strong><br/>{new Date(order.createdAt).toLocaleString()}</div>
    </div>
    <div className="space-y-2">{order.items.map((i:any)=><div key={i._id||i.menuItem} className="flex justify-between gap-2"><span>{i.quantity} x {i.name}{i.modifiers?.length?<small className="block">{i.modifiers.map((m:any)=>m.label).join(', ')}</small>:null}</span><span>{Math.round(i.lineTotal||i.unitPrice*i.quantity).toLocaleString()}</span></div>)}</div>
    <div className="my-3 border-y border-dashed py-2"><Row l="Subtotal" v={order.subtotal}/><Row l="Discount" v={-order.discount}/><Row l="Tax" v={order.tax}/><Row l="Service" v={order.serviceCharge}/><div className="mt-1 flex justify-between text-sm font-bold"><span>TOTAL</span><span>Rs {order.total.toLocaleString()}</span></div></div>
    <div className="text-center">Thank you for dining with us!<br/>Made by Nexus Blend Studio</div>
  </div>;
}

function Row({l,v}:{l:string;v:number}) {
  return <div className="flex justify-between"><span>{l}</span><span>Rs {Math.round(v||0).toLocaleString()}</span></div>;
}
