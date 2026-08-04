import type {Order} from '../../types';

type ReceiptKind='customer'|'kitchen';
const money=(n:number)=>`Rs ${Math.round(n||0).toLocaleString()}`;
const discountAmount=(order:Order)=>order.discountType==='percentage'?(order.subtotal||0)*(order.discount||0)/100:(order.discount||0);

export function printReceipt(order:Order,kind:ReceiptKind='customer') {
  printReceipts(order,[kind]);
}

export function printReceipts(order:Order,kinds:ReceiptKind[]=['customer','kitchen']) {
  const popup=window.open('','receipt-print','width=420,height=720');
  if(!popup)return;
  const pages=kinds.map((kind,index)=>`<section class="print-page ${index?'page-break':''}">${receiptHtml(order,kind)}</section>`).join('');
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(order.orderNumber||'Receipt')}</title><style>
    @page{margin:3mm;size:80mm auto} *{box-sizing:border-box} body{margin:0;background:#fff;color:#000;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;font-size:11px;line-height:1.25}.receipt{width:80mm;padding:12px}.center{text-align:center}.brand{font-size:18px;font-weight:900;letter-spacing:.04em}.title{font-size:15px;font-weight:900;letter-spacing:.08em}.number{font-size:18px;font-weight:900}.divider{border-top:1px solid #000;margin:10px 0}.info,.row{display:flex;justify-content:space-between;gap:10px;margin:7px 0;font-weight:700}.info span:last-child,.row span:last-child{text-align:right;text-transform:capitalize}.head,.item{display:grid;grid-template-columns:36px 1fr 70px;gap:8px;font-weight:900}.item{font-weight:700;margin:9px 0}.right{text-align:right}.muted{display:block;font-weight:400}.total{display:flex;justify-content:space-between;border-top:1px solid #000;margin-top:8px;padding-top:8px;font-size:18px;font-weight:900}@media print{.page-break{break-before:page;page-break-before:always}}
  </style></head><body>${pages}<script>window.onload=()=>{window.focus();window.print();setTimeout(()=>window.close(),400)}</script></body></html>`);
  popup.document.close();
}

function receiptHtml(order:Order,kind:ReceiptKind) {
  const isKitchen=kind==='kitchen';
  const payment=order.payments?.[order.payments.length-1];
  const paidBy=payment?.method?String(payment.method).replaceAll('-',' '):'Cash';
  const effectiveDiscount=discountAmount(order);
  const taxBase=Math.max(1,(order.subtotal||0)-effectiveDiscount);
  const taxRate=Math.round(((order.tax||0)/taxBase)*100);
  const customer=order.customerName||order.customer?.name||'Walk-in';
  const riderName=order.rider?.name||'';
  const riderPhone=order.rider?.phone||'';
  const lines=(order.items||[]).map((i:any)=>`<div class="item"><span>${i.quantity}x</span><span>${escapeHtml(i.name||'Item')}${i.modifiers?.length?`<small class="muted">${escapeHtml(i.modifiers.map((m:any)=>m.label).join(', '))}</small>`:''}${isKitchen&&i.notes?`<small class="muted">Note: ${escapeHtml(i.notes)}</small>`:''}</span>${isKitchen?'':`<span class="right">${money(i.lineTotal||i.unitPrice*i.quantity)}</span>`}</div>`).join('');
  return `<div class="receipt"><div class="center"><div class="brand">RESTAURANTOS KITCHEN</div><div>12 Market Street - +92 300 555 0199</div></div><div class="divider"></div><div class="center"><div class="title">${isKitchen?'KITCHEN ORDER TICKET':'SALE RECEIPT'}</div><div class="number">${escapeHtml(order.orderNumber||'')}</div></div><div class="divider"></div>${infoHtml('Date',new Date(order.createdAt).toLocaleString())}${infoHtml('Type',order.type?.replace('-',' '))}${isKitchen?'':`${infoHtml('Cashier',order.staff?.name||'Admin')}${infoHtml('Customer',customer)}`}${order.table?infoHtml('Table',order.table?.name||String(order.table)):''}${order.deliveryAddress?infoHtml('Address',order.deliveryAddress):''}${order.type==='delivery'&&riderName?infoHtml('Rider',`${riderName}${riderPhone?` - ${riderPhone}`:''}`):''}${order.notes&&isKitchen?infoHtml('Order note',order.notes):''}<div class="divider"></div><div class="head"><span>QTY</span><span>ITEM</span>${isKitchen?'': '<span class="right">TOTAL</span>'}</div><div class="divider"></div>${lines}${isKitchen?'':`<div class="divider"></div>${rowHtml('Subtotal',order.subtotal)}${effectiveDiscount>0?rowHtml(`Discount${order.discountType==='percentage'?` (${order.discount}%)`:''}`,-effectiveDiscount):''}${rowHtml(`Tax (${taxRate.toFixed(2)}%)`,order.tax)}<div class="total"><span>TOTAL</span><span>${money(order.total)}</span></div><div class="divider"></div><div style="text-transform:capitalize">Paid By ${escapeHtml(paidBy)}</div>${infoHtml('Received',money(payment?.amount||order.total))}${infoHtml('Change',money(0))}<div class="center" style="margin-top:22px">Thank you for dining with us!</div>`}</div>`;
}

function escapeHtml(value:any) { return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!)); }
function infoHtml(label:string,value:any) { return `<div class="info"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`; }
function rowHtml(label:string,value:number) { return `<div class="row"><span>${escapeHtml(label)}</span><span>${value<0?'-':''}${money(Math.abs(value))}</span></div>`; }

export function Receipt({order,kind='customer'}:{order:Order;kind?:ReceiptKind}) {
  const isKitchen=kind==='kitchen'; const effectiveDiscount=discountAmount(order); const customer=order.customerName||order.customer?.name||'Walk-in';
  return <div className="receipt mx-auto w-[80mm] bg-white p-4 font-mono text-[11px] leading-tight text-black"><div className="text-center"><div className="text-lg font-black tracking-wide">RESTAURANTOS KITCHEN</div><div>12 Market Street - +92 300 555 0199</div></div><Divider/><div className="text-center"><div className="text-base font-black tracking-wider">{isKitchen?'KITCHEN ORDER TICKET':'SALE RECEIPT'}</div><div className="mt-1 text-lg font-black">{order.orderNumber}</div></div><Divider/><Info label="Date" value={new Date(order.createdAt).toLocaleString()}/><Info label="Type" value={order.type?.replace('-',' ')}/>{!isKitchen&&<><Info label="Cashier" value={order.staff?.name||'Admin'}/><Info label="Customer" value={customer}/></>}{order.table&&<Info label="Table" value={order.table?.name||String(order.table)}/>} {order.deliveryAddress&&<Info label="Address" value={order.deliveryAddress}/>} {order.type==='delivery'&&order.rider&&<Info label="Rider" value={`${order.rider?.name||''}${order.rider?.phone?` - ${order.rider.phone}`:''}`}/>}<Divider/><div className={`grid ${isKitchen?'grid-cols-[36px_1fr]':'grid-cols-[36px_1fr_70px]'} gap-2 font-black`}><span>QTY</span><span>ITEM</span>{!isKitchen&&<span className="text-right">TOTAL</span>}</div><Divider/><div className="space-y-3">{order.items.map((i:any)=><div key={i._id||i.menuItem} className={`grid ${isKitchen?'grid-cols-[36px_1fr]':'grid-cols-[36px_1fr_70px]'} gap-2 font-bold`}><span>{i.quantity}x</span><span>{i.name}{i.modifiers?.length?<small className="block font-normal">{i.modifiers.map((m:any)=>m.label).join(', ')}</small>:null}{isKitchen&&i.notes?<small className="block font-normal">Note: {i.notes}</small>:null}</span>{!isKitchen&&<span className="text-right">{money(i.lineTotal||i.unitPrice*i.quantity)}</span>}</div>)}</div>{!isKitchen&&<><Divider/><Row l="Subtotal" v={order.subtotal}/>{effectiveDiscount>0&&<Row l={`Discount${order.discountType==='percentage'?` (${order.discount}%)`:''}`} v={-effectiveDiscount}/>}<Row l="Tax" v={order.tax}/><div className="mt-2 flex justify-between border-t border-black pt-2 text-lg font-black"><span>TOTAL</span><span>{money(order.total)}</span></div></>}</div>;
}
function Divider(){return <div className="my-3 border-t border-black"/>} function Info({label,value}:{label:string;value:any}){return <div className="mb-2 flex justify-between gap-3"><span className="font-bold">{label}</span><span className="text-right font-bold capitalize">{value}</span></div>} function Row({l,v}:{l:string;v:number}){return <div className="mb-2 flex justify-between"><span className="font-bold">{l}</span><span className="font-bold">{v<0?'-':''}{money(Math.abs(v))}</span></div>}
