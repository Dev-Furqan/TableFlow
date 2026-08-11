import {env} from '../config/env.js';import {signPayload} from './webhookSigning.js';

export const deliverToOrangeWebsite=async(event:any)=>{
  if(!env.ORANGE_WEBSITE_API_URL||!env.ORANGE_WEBSITE_SYNC_SECRET)throw new Error('Orange Website integration is not configured');
  const body=JSON.stringify(event.payload);
  const timestamp=new Date().toISOString();
  const response=await fetch(`${env.ORANGE_WEBSITE_API_URL.replace(/\/$/,'')}/api/integration/events`,{method:'POST',headers:{'content-type':'application/json','x-integration-timestamp':timestamp,'x-integration-signature':signPayload(timestamp,body,env.ORANGE_WEBSITE_SYNC_SECRET),'x-integration-event-id':event.eventId,'x-integration-event-type':event.type},body,signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error(`Orange Website responded ${response.status}`);
  return response.status;
};
