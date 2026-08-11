import express from 'express';import cors from 'cors';import helmet from 'helmet';import cookieParser from 'cookie-parser';import morgan from 'morgan';import {api} from './routes/index.js';import {env} from './config/env.js';import {errorHandler,notFound} from './middleware/error.js';import {parseAllowedOrigins,isOriginAllowed} from './utils/origins.js';import {connectDb} from './config/db.js';

export const allowedOrigins=parseAllowedOrigins(env.CLIENT_URL);
const isClientUrlDefault = env.CLIENT_URL==='http://localhost:5173';

export const isAllowedOrigin=(origin?:string)=>{
	if(!origin){
		return true;
	}

	if(isClientUrlDefault&&env.NODE_ENV==='production'){
		// CLIENT_URL was not configured for production.
		// Allow any HTTPS origin as a fallback so deployed clients can connect.
		// Set CLIENT_URL explicitly to restrict origins.
		// eslint-disable-next-line no-console
		console.warn('CLIENT_URL is using the default localhost value in production; allowing any HTTPS origin. Set CLIENT_URL on the server deployment to restrict origins.');
		return /^https:\/\/[^/]+$/.test(origin);
	}

	return isOriginAllowed(origin,allowedOrigins,env.NODE_ENV);
};

export const corsOptions={
	origin:(origin:string|undefined,callback:(error:Error|null,allowed?:boolean)=>void)=>{
		const allowed = isAllowedOrigin(origin);
		if(!allowed){
			// Log the rejected origin for easier debugging in production logs
			// (do not expose this to clients)
			// eslint-disable-next-line no-console
			console.warn('CORS rejected origin', origin, 'allowedOrigins=', allowedOrigins);
		}
		// Return allowed as boolean instead of throwing an Error to avoid
		// turning preflight checks into internal server errors.
		// Support an escape-hatch for quick debugging: set DEBUG_ALLOW_ALL_CORS=1
		// in the server environment to allow all origins temporarily.
		if(process.env.DEBUG_ALLOW_ALL_CORS==='1'){
			// eslint-disable-next-line no-console
			console.warn('DEBUG_ALLOW_ALL_CORS=1 is enabled — allowing all origins');
			return callback(null, true);
		}

		callback(null, allowed);
	},
	credentials:true
};
export const app=express();app.set('trust proxy',1);app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));app.use(cors(corsOptions));app.use(express.json({limit:'2mb',verify:(req:any,_res,buffer)=>{req.rawBody=buffer.toString('utf8');}}));app.use(express.urlencoded({extended:true}));app.use(cookieParser());app.use(morgan(env.NODE_ENV==='production'?'combined':'dev'));app.get('/health',(_req,res)=>res.json({status:'ok',time:new Date()}));app.get('/debug/cors',(req,res)=>{
	const origin=req.get('Origin');
	return res.json({
		NODE_ENV:env.NODE_ENV,
		CLIENT_URL:env.CLIENT_URL,
		allowedOrigins,
		isClientUrlDefault,
		origin,
		allowed:isAllowedOrigin(origin||undefined)
	});
});app.use('/api',async(_req,_res,next)=>{try{await connectDb();next()}catch(error){next(error)}} ,api);app.use(notFound);app.use(errorHandler);
