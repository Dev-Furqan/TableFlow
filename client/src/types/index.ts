export type Role='owner'|'manager'|'cashier'|'waiter'|'kitchen'|'accountant'|'viewer';
export interface User{id:string;name:string;email:string;role:Role;permissions:string[]}
export interface MenuItem{_id:string;name:string;description?:string;price:number;cost:number;category:{_id:string;name:string}|string;kitchenStation:string;preparationTime:number;available:boolean;modifierGroups?:{name:string;required?:boolean;multiple?:boolean;options:{_id:string;label:string;priceAdjustment:number}[]}[];addons?:{_id:string;label:string;priceAdjustment:number}[]}
export interface CartLine{id:string;menuItem:string;name:string;quantity:number;unitPrice:number;station:string;modifiers:{label:string;priceAdjustment:number}[];notes?:string}
export interface Order{_id:string;orderNumber:string;type:'dine-in'|'takeaway'|'delivery';status:string;table?:any;customer?:any;items:any[];subtotal:number;discount:number;tax:number;serviceCharge:number;total:number;payments:any[];timeline:any[];createdAt:string;staff?:any;notes?:string}
export interface Paged<T>{data:T[];meta:{page:number;limit:number;total:number;pages:number}}
