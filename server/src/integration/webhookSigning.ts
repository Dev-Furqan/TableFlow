import {createHmac,timingSafeEqual} from 'node:crypto';

export const signPayload=(timestamp:string,payload:string,secret:string)=>createHmac('sha256',secret).update(`${timestamp}.${payload}`).digest('hex');

export const verifySignature=(timestamp:string,payload:string,signature:string,secret:string)=>{
  const expected=signPayload(timestamp,payload,secret);
  const supplied=Buffer.from(signature,'hex');
  const computed=Buffer.from(expected,'hex');
  return supplied.length===computed.length&&timingSafeEqual(supplied,computed);
};

export const isFreshTimestamp=(timestamp:string,windowSeconds:number,now=Date.now())=>{
  const time=Date.parse(timestamp);
  return Number.isFinite(time)&&Math.abs(now-time)<=windowSeconds*1000;
};
