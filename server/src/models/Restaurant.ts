import mongoose,{Schema} from 'mongoose';

/** A customer restaurant/company. Operational data belongs to exactly one. */
const schema=new Schema({name:{type:String,required:true,trim:true,unique:true,index:true},slug:{type:String,required:true,trim:true,lowercase:true,unique:true,index:true},contact:{type:String,trim:true},email:{type:String,trim:true,lowercase:true},active:{type:Boolean,default:true}},{timestamps:true});
export const Restaurant=mongoose.model('Restaurant',schema);
