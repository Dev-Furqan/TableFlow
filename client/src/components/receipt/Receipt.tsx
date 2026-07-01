import type {Order} from '../../types';

const money=(n:number)=>`Rs ${Math.round(n||0).toLocaleString()}`;

export function printReceipt(order:Order) {
  const popup=window.open('','receipt-print','width=420,height=720');
  if(!popup)return;
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(order.orderNumber||'Receipt')}</title><style>
    @page{margin:3mm;size:80mm auto}
    *{box-sizing:border-box}
    body{margin:0;background:#fff;color:#000;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;font-size:11px;line-height:1.25}
    .receipt{width:80mm;padding:12px}
    .center{text-align:center}.brand{font-size:18px;font-weight:900;letter-spacing:.04em}.title{font-size:15px;font-weight:900;letter-spacing:.08em}.number{font-size:18px;font-weight:900}
    .divider{border-top:1px solid #000;margin:10px 0}
    .info,.row{display:flex;justify-content:space-between;gap:10px;margin:7px 0;font-weight:700}.info span:last-child,.row span:last-child{text-align:right;text-transform:capitalize}
    .head,.item{display:grid;grid-template-columns:36px 1fr 70px;gap:8px;font-weight:900}.item{font-weight:700;margin:9px 0}.right{text-align:right}.muted{display:block;font-weight:400}
    .total{display:flex;justify-content:space-between;border-top:1px solid #000;margin-top:8px;padding-top:8px;font-size:18px;font-weight:900}
  </style></head><body>${receiptHtml(order)}<script>window.onload=()=>{window.focus();window.print();setTimeout(()=>window.close(),400)}</script></body></html>`);
  popup.document.close();
}

function receiptHtml(order:Order) {
  const payment=order.payments?.[order.payments.length-1];
  const paidBy=payment?.method?String(payment.method).replaceAll('-',' '):'Cash';
  const taxBase=Math.max(1,(order.subtotal||0)-(order.discount||0));
  const taxRate=Math.round(((order.tax||0)/taxBase)*100);
  const customer=order.customerName||order.customer?.name||'Walk-in';
  const lines=(order.items||[]).map((i:any)=>`<div class="item"><span>${i.quantity}x</span><span>${escapeHtml(i.name||'Item')}${i.modifiers?.length?`<small class="muted">${escapeHtml(i.modifiers.map((m:any)=>m.label).join(', '))}</small>`:''}</span><span class="right">${money(i.lineTotal||i.unitPrice*i.quantity)}</span></div>`).join('');
  return `<div class="receipt">
    <div class="center"><div class="brand">RESTAURANTOS KITCHEN</div><div>12 Market Street - +92 300 555 0199</div><div>nexusblendstudio.online</div></div>
    <div class="divider"></div><div class="center"><div class="title">SALE RECEIPT</div><div class="number">${escapeHtml(order.orderNumber||'')}</div></div><div class="divider"></div>
    ${infoHtml('Date',new Date(order.createdAt).toLocaleString())}${infoHtml('Type',order.type?.replace('-',' '))}${infoHtml('Cashier',order.staff?.name||'Admin')}${infoHtml('Customer',customer)}
    ${order.table?infoHtml('Table',order.table?.name||String(order.table)):''}${order.deliveryAddress?infoHtml('Address',order.deliveryAddress):''}${order.rider?infoHtml('Rider',order.rider?.name||String(order.rider)):''}
    <div class="divider"></div><div class="head"><span>QTY</span><span>ITEM</span><span class="right">TOTAL</span></div><div class="divider"></div>${lines}
    <div class="divider"></div>${rowHtml('Subtotal',order.subtotal)}${rowHtml('Discount',order.discount)}${rowHtml(`Tax (${taxRate.toFixed(2)}%)`,order.tax)}
    <div class="total"><span>TOTAL</span><span>${money(order.total)}</span></div><div class="divider"></div>
    <div style="text-transform:capitalize">Paid By ${escapeHtml(paidBy)}</div>${infoHtml('Received',money(payment?.amount||order.total))}${infoHtml('Change',money(0))}
    <div class="center" style="margin-top:22px"><div>Thank you for dining with us!</div><div>Made by Nexus Blend Studio</div><div>nexusblendstudio.online</div></div>
  </div>`;
}

function escapeHtml(value:any) {
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));
}

function infoHtml(label:string,value:any) {
  return `<div class="info"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
}

function rowHtml(label:string,value:number) {
  return `<div class="row"><span>${escapeHtml(label)}</span><span>${money(value)}</span></div>`;
}

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
