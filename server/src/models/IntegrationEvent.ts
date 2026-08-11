import {randomUUID} from 'node:crypto';import mongoose,{Schema} from 'mongoose';

const integrationEventSchema=new Schema({eventId:{type:String,required:true,unique:true,index:true,default:randomUUID},type:{type:String,required:true,index:true},payload:{type:Schema.Types.Mixed,required:true},status:{type:String,enum:['pending','processing','completed','failed'],default:'pending',index:true},attempts:{type:Number,default:0},nextAttemptAt:{type:Date,default:Date.now,index:true},lastError:String,processedAt:Date,claimedAt:Date},{timestamps:true});
export const IntegrationEvent=mongoose.model('IntegrationEvent',integrationEventSchema);

const inboundEventSchema=new Schema({eventId:{type:String,required:true,unique:true,index:true},source:{type:String,required:true},receivedAt:{type:Date,default:Date.now}},{timestamps:true});
export const IntegrationInboundEvent=mongoose.model('IntegrationInboundEvent',inboundEventSchema);
