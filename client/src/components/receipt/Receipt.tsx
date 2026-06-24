import type {Order} from '../../types';

const money=(n:number)=>`Rs ${Math.round(n||0).toLocaleString()}`;

export function Receipt({order}:{order:Order}) {
  const payment=order.payments?.[order.payments.length-1];
  const paidBy=payment?.method?String(payment.method).replaceAll('-',' '):'Cash';
  const taxBase=Math.max(1,(order.subtotal||0)-(order.discount||0));
  const taxRate=Math.round(((order.tax||0)/taxBase)*100);
  const customer=order.customerName||order.customer?.name||'Walk-in';
  return <div className="receipt mx-auto w-[80mm] bg-white p-4 font-mono text-[11px] leading-tight text-black">
    <div className="text-center">
      <div className="text-lg font-black tracking-wide">RESTAURANTOS KITCHEN</div>
      <div>12 Market Street - +92 300 555 0199</div>
      <div>nexusblendstudio.online</div>
    </div>
    <Divider/>
    <div className="text-center">
      <div className="text-base font-black tracking-wider">SALE RECEIPT</div>
      <div className="mt-1 text-lg font-black">{order.orderNumber}</div>
    </div>
    <Divider/>
    <Info label="Date" value={new Date(order.createdAt).toLocaleString()}/>
    <Info label="Type" value={order.type?.replace('-',' ')}/>
    <Info label="Cashier" value={order.staff?.name||'Admin'}/>
    <Info label="Customer" value={customer}/>
    {order.table&&<Info label="Table" value={order.table?.name||String(order.table)}/>}
    {order.deliveryAddress&&<Info label="Address" value={order.deliveryAddress}/>}
    {order.rider&&<Info label="Rider" value={order.rider?.name||String(order.rider)}/>}
    <Divider/>
    <div className="grid grid-cols-[36px_1fr_70px] gap-2 font-black">
      <span>QTY</span><span>ITEM</span><span className="text-right">TOTAL</span>
    </div>
    <Divider/>
    <div className="space-y-3">{order.items.map((i:any)=><div key={i._id||i.menuItem} className="grid grid-cols-[36px_1fr_70px] gap-2 font-bold">
      <span>{i.quantity}x</span>
      <span>{i.name}{i.modifiers?.length?<small className="block font-normal">{i.modifiers.map((m:any)=>m.label).join(', ')}</small>:null}</span>
      <span className="text-right">{money(i.lineTotal||i.unitPrice*i.quantity)}</span>
    </div>)}</div>
    <Divider/>
    <Row l="Subtotal" v={order.subtotal}/>
    <Row l="Discount" v={order.discount}/>
    <Row l={`Tax (${taxRate.toFixed(2)}%)`} v={order.tax}/>
    <div className="mt-2 flex justify-between border-t border-black pt-2 text-lg font-black"><span>TOTAL</span><span>{money(order.total)}</span></div>
    <Divider/>
    <div className="capitalize">Paid By {paidBy}</div>
    <Info label="Received" value={money(payment?.amount||order.total)}/>
    <Info label="Change" value={money(0)}/>
    <div className="mt-6 text-center">
      <div>Thank you for dining with us!</div>
      <div>Made by Nexus Blend Studio</div>
      <div>nexusblendstudio.online</div>
    </div>
  </div>;
}

function Divider() {
  return <div className="my-3 border-t border-black"/>;
}

function Info({label,value}:{label:string;value:any}) {
  return <div className="mb-2 flex justify-between gap-3"><span className="font-bold">{label}</span><span className="text-right font-bold capitalize">{value}</span></div>;
}

function Row({l,v}:{l:string;v:number}) {
  return <div className="mb-2 flex justify-between"><span className="font-bold">{l}</span><span className="font-bold">{money(v)}</span></div>;
}
