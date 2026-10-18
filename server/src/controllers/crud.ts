import type {Model} from 'mongoose';
import {AppError,asyncHandler} from '../utils/errors.js';
import {restaurantData,restaurantFilter} from '../utils/tenant.js';

/** Generic CRUD which is deliberately restaurant-scoped for every operation. */
export const crud=(model:Model<any>,populate='')=>({
  list:asyncHandler(async(req:any,res:any)=>{const page=Math.max(1,Number(req.query.page)||1),limit=Math.min(100,Math.max(1,Number(req.query.limit)||25));const filter:any=restaurantFilter(req);if(req.query.search){const fields=['name','orderNumber','phone','sku','category'];filter.$or=fields.map(k=>({[k]:{$regex:String(req.query.search),$options:'i'}}));}if(req.query.status)filter.status=req.query.status;if(req.query.type)filter.type=req.query.type;if(req.query.date&&/^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date))){const start=new Date(`${req.query.date}T00:00:00.000`),end=new Date(start);end.setDate(end.getDate()+1);filter.createdAt={$gte:start,$lt:end};}let q=model.find(filter).sort(String(req.query.sort||'-createdAt')).skip((page-1)*limit).limit(limit);if(populate)q=q.populate(populate);const [data,total]=await Promise.all([q.lean(),model.countDocuments(filter)]);res.json({data,meta:{page,limit,total,pages:Math.ceil(total/limit)}})}),
  get:asyncHandler(async(req:any,res:any)=>{let q=model.findOne(restaurantFilter(req,{_id:req.params.id}));if(populate)q=q.populate(populate);const data=await q;if(!data)throw new AppError(404,'Record not found');res.json({data})}),
  create:asyncHandler(async(req:any,res:any)=>{const data=await model.create(restaurantData(req,req.body));res.status(201).json({data})}),
  update:asyncHandler(async(req:any,res:any)=>{const data=await model.findOneAndUpdate(restaurantFilter(req,{_id:req.params.id}),req.body,{new:true,runValidators:true});if(!data)throw new AppError(404,'Record not found');res.json({data})}),
  remove:asyncHandler(async(req:any,res:any)=>{const data=await model.findOneAndDelete(restaurantFilter(req,{_id:req.params.id}));if(!data)throw new AppError(404,'Record not found');res.status(204).end()})
});
