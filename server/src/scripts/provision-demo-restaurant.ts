import {connectDb} from '../config/db.js';
import {Restaurant} from '../models/Restaurant.js';
import {User} from '../models/User.js';
import {Category,Deal,MenuItem,PromoCode} from '../models/Catalog.js';
import {Branch,Customer,Setting,Table} from '../models/Operations.js';
import {Order} from '../models/Order.js';
import {Recipe} from '../models/Inventory.js';
import mongoose from 'mongoose';

const restaurantInfo={name:'Saffron Street Café',slug:'saffron-street-demo',contact:'0300 555 0147',email:'demo@saffronstreet.local'};
const localDate=(daysFromToday=0,hour=12)=>{const now=new Date(Date.now()+5*60*60*1000);now.setUTCDate(now.getUTCDate()+daysFromToday);const day=now.toISOString().slice(0,10);return new Date(`${day}T${String(hour).padStart(2,'0')}:00:00+05:00`);};

await connectDb();
const restaurant:any=await Restaurant.findOneAndUpdate({slug:restaurantInfo.slug},{$set:restaurantInfo},{upsert:true,new:true,setDefaultsOnInsert:true});
const scope={restaurant:restaurant._id};
await Promise.all([Order.deleteMany(scope),Recipe.deleteMany(scope),Deal.deleteMany(scope),PromoCode.deleteMany(scope),MenuItem.deleteMany(scope),Category.deleteMany(scope),Table.deleteMany(scope),Customer.deleteMany(scope),Branch.deleteMany(scope),Setting.deleteMany(scope)]);
const passwordHash=await (User as any).hashPassword('Demo@123');
const owner:any=await User.findOneAndUpdate({restaurant:restaurant._id,email:restaurantInfo.email},{$set:{restaurant:restaurant._id,name:'Demo Manager',phone:restaurantInfo.contact,passwordHash,role:'owner',status:'active'}},{upsert:true,new:true,setDefaultsOnInsert:true});
const branch:any=await Branch.create({...scope,name:'Canal Road',address:'21 Canal Road, Lahore',phone:restaurantInfo.contact});
const categories:any[]=await Category.create([{...scope,name:'Coffee',icon:'☕',displayOrder:1},{...scope,name:'Breakfast',icon:'🥐',displayOrder:2},{...scope,name:'Bakery',icon:'🍰',displayOrder:3}]);
const menu:any[]=await MenuItem.create([
  {...scope,name:'Saffron Latte',description:'Espresso with saffron milk and pistachio',sku:'SSC-001',price:520,cost:180,category:categories[0]._id,kitchenStation:'bar',preparationTime:4},
  {...scope,name:'Rose Cardamom Tea',description:'Fragrant house chai',sku:'SSC-002',price:280,cost:75,category:categories[0]._id,kitchenStation:'bar',preparationTime:3},
  {...scope,name:'Masala Egg Croissant',description:'Buttery croissant with masala eggs',sku:'SSC-003',price:690,cost:230,category:categories[1]._id,kitchenStation:'kitchen',preparationTime:9},
  {...scope,name:'Date Walnut Slice',description:'Fresh baked walnut and date cake',sku:'SSC-004',price:360,cost:110,category:categories[2]._id,kitchenStation:'bakery',preparationTime:2}
]);
const tables:any[]=await Table.create([{...scope,name:'Garden 1',area:'Garden',capacity:2,branch:branch._id},{...scope,name:'Window 2',area:'Indoor',capacity:4,branch:branch._id},{...scope,name:'Counter',area:'Counter',capacity:2,branch:branch._id}]);
const customers:any[]=await Customer.create([{...scope,name:'Ayesha Malik',phone:'0301 555 0181',loyaltyPoints:35,totalSpent:2480},{...scope,name:'Zain Qureshi',phone:'0302 555 0136',loyaltyPoints:10,totalSpent:970}]);
await Deal.create({...scope,name:'Morning Saffron Set',description:'Saffron Latte and Masala Egg Croissant',price:1050,items:[{menuItem:menu[0]._id,quantity:1},{menuItem:menu[2]._id,quantity:1}],active:true});
await PromoCode.create({...scope,code:'WELCOME10',label:'Welcome discount',discountType:'percentage',discount:10,active:true});
await Order.create([
  {...scope,orderNumber:'SSC-DEMO-001',type:'dine-in',status:'completed',table:tables[0]._id,customer:customers[0]._id,staff:owner._id,items:[{menuItem:menu[0]._id,name:menu[0].name,quantity:1,unitPrice:520,station:'bar'},{menuItem:menu[2]._id,name:menu[2].name,quantity:1,unitPrice:690,station:'kitchen'}],tax:121,payments:[{method:'card',amount:1331}],timeline:[{status:'completed',by:owner._id}],inventoryDeducted:true,createdAt:localDate(0,10),updatedAt:localDate(0,10)},
  {...scope,orderNumber:'SSC-DEMO-002',type:'takeaway',status:'sent-to-kitchen',customer:customers[1]._id,staff:owner._id,items:[{menuItem:menu[1]._id,name:menu[1].name,quantity:2,unitPrice:280,station:'bar'},{menuItem:menu[3]._id,name:menu[3].name,quantity:1,unitPrice:360,station:'bakery'}],tax:92,payments:[{method:'cash',amount:1012}],timeline:[{status:'pending',by:owner._id},{status:'sent-to-kitchen',by:owner._id}],createdAt:localDate(0,13),updatedAt:localDate(0,13)},
  {...scope,orderNumber:'SSC-DEMO-003',type:'delivery',status:'draft',customer:customers[0]._id,customerName:customers[0].name,customerPhone:customers[0].phone,deliveryAddress:'Gulberg, Lahore',staff:owner._id,items:[{menuItem:menu[0]._id,name:menu[0].name,quantity:1,unitPrice:520,station:'bar'}],tax:52,timeline:[{status:'draft',by:owner._id}],createdAt:localDate(0,16),updatedAt:localDate(0,16)},
  {...scope,orderNumber:'SSC-DEMO-004',type:'takeaway',status:'completed',customer:customers[1]._id,staff:owner._id,items:[{menuItem:menu[3]._id,name:menu[3].name,quantity:2,unitPrice:360,station:'bakery'}],tax:72,payments:[{method:'cash',amount:792}],timeline:[{status:'completed',by:owner._id}],inventoryDeducted:true,createdAt:localDate(-1,15),updatedAt:localDate(-1,15)}
]);
await Setting.create([{...scope,key:'restaurant',value:{name:restaurantInfo.name,currency:'PKR',timezone:'Asia/Karachi',phone:restaurantInfo.contact,address:'21 Canal Road, Lahore'}},{...scope,key:'charges',value:{salesTaxRate:10,serviceChargeRate:0,serviceChargeEnabled:false}}]);
console.log(`Demo ready. Login with ${restaurantInfo.email} / Demo@123`);
await mongoose.disconnect();
