import {connectDb} from '../config/db.js';
import {Restaurant} from '../models/Restaurant.js';
import {User} from '../models/User.js';
import mongoose from 'mongoose';

const password=process.env.RESTAURANT_OWNER_PASSWORD;
if(!password||password.length<8)throw new Error('Set RESTAURANT_OWNER_PASSWORD to at least 8 characters before provisioning.');

const restaurantInfo={
  name:process.env.RESTAURANT_NAME||'Burger Inn',
  slug:(process.env.RESTAURANT_SLUG||'burger-inn').toLowerCase(),
  contact:process.env.RESTAURANT_CONTACT||'03059990907',
  email:(process.env.RESTAURANT_OWNER_EMAIL||'burgerinn91@gmail.com').toLowerCase()
};
await connectDb();
const restaurant=await Restaurant.findOneAndUpdate({slug:restaurantInfo.slug},{$set:restaurantInfo},{upsert:true,new:true,setDefaultsOnInsert:true});
const passwordHash=await (User as any).hashPassword(password);
await User.findOneAndUpdate(
  {restaurant:restaurant._id,email:restaurantInfo.email},
  {$set:{name:'Burger Inn',phone:restaurantInfo.contact,passwordHash,role:'owner',status:'active',restaurant:restaurant._id}},
  {upsert:true,new:true,setDefaultsOnInsert:true}
);
console.log(`Provisioned ${restaurant.name}. Owner login: ${restaurantInfo.email}`);
await mongoose.disconnect();
