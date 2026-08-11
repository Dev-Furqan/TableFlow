import {env} from '../config/env.js';import {IntegrationEvent} from '../models/IntegrationEvent.js';import {deliverToOrangeWebsite} from './orangeWebsiteClient.js';

const backoff=(attempt:number)=>Math.min(60*60*1000,1000*2**Math.min(attempt,12));
export const processIntegrationEvents=async()=>{
  if(!env.INTEGRATION_ENABLED)return;
  await IntegrationEvent.updateMany({status:'processing',claimedAt:{$lt:new Date(Date.now()-5*60*1000)}},{$set:{status:'pending',nextAttemptAt:new Date()}});
  for(;;){
    const event:any=await IntegrationEvent.findOneAndUpdate({status:'pending',nextAttemptAt:{$lte:new Date()}},{$set:{status:'processing',claimedAt:new Date()}},{new:true,sort:{createdAt:1}});
    if(!event)break;
    try{const httpStatus=await deliverToOrangeWebsite(event);await IntegrationEvent.updateOne({_id:event._id,status:'processing'},{$set:{status:'completed',processedAt:new Date(),lastError:undefined},$inc:{attempts:1}});console.info('Integration delivery completed',{eventId:event.eventId,type:event.type,target:'orange-website',httpStatus});}
    catch(error){const attempts=event.attempts+1;const message=error instanceof Error?error.message:'Unknown delivery error';const terminal=attempts>=env.INTEGRATION_MAX_ATTEMPTS;await IntegrationEvent.updateOne({_id:event._id,status:'processing'},{$set:{status:terminal?'failed':'pending',lastError:message,nextAttemptAt:new Date(Date.now()+backoff(attempts))},$inc:{attempts:1}});console.warn('Integration delivery failed',{eventId:event.eventId,type:event.type,target:'orange-website',attempts,error:message});}
  }
};
let timer:NodeJS.Timeout|undefined;
export const startIntegrationWorker=()=>{if(timer)return;timer=setInterval(()=>void processIntegrationEvents().catch(error=>console.error('Integration worker error',error)),env.INTEGRATION_WORKER_INTERVAL_MS);void processIntegrationEvents();};
export const stopIntegrationWorker=()=>{if(timer){clearInterval(timer);timer=undefined;}};
