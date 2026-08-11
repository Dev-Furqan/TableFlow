import {connectDb} from '../config/db.js';import {Category,MenuItem} from '../models/Catalog.js';import mongoose from 'mongoose';import {randomUUID} from 'node:crypto';

await connectDb();
const backfill=async(model:any)=>{const records=await model.find({$or:[{externalId:{$exists:false}},{externalId:null},{externalId:''}]}).select('_id').lean();for(const record of records)await model.updateOne({_id:record._id},{$set:{externalId:randomUUID()}});return records.length;};
const [categories,menuItems]=await Promise.all([backfill(Category),backfill(MenuItem)]);
console.log(`Backfilled external IDs: ${categories} categories, ${menuItems} menu items`);
await mongoose.disconnect();
