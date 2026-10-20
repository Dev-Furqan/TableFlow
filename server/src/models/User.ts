import mongoose,{Schema} from 'mongoose';
import bcrypt from 'bcryptjs';
export const roles=['owner','manager','cashier','waiter','kitchen','rider','accountant','viewer'] as const;
const schema=new Schema({restaurant:{type:Schema.Types.ObjectId,ref:'Restaurant',required:true,index:true},name:{type:String,required:true,trim:true},email:{type:String,required:true,lowercase:true,index:true},phone:String,salary:{type:Number,min:0,default:0},passwordHash:{type:String,required:true,select:false},role:{type:String,enum:roles,default:'viewer'},permissions:[String],branch:{type:Schema.Types.ObjectId,ref:'Branch'},status:{type:String,enum:['active','inactive'],default:'active'},refreshTokenHash:{type:String,select:false}},{timestamps:true});
schema.index({restaurant:1,email:1},{unique:true});
schema.methods.verifyPassword=function(value:string){return bcrypt.compare(value,this.passwordHash)};
schema.statics.hashPassword=(value:string)=>bcrypt.hash(value,12);
export const User=mongoose.model('User',schema);
