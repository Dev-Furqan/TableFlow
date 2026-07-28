import express from 'express';import cors from 'cors';import helmet from 'helmet';import cookieParser from 'cookie-parser';import morgan from 'morgan';import {api} from './routes/index.js';import {env} from './config/env.js';import {errorHandler,notFound} from './middleware/error.js';import {parseAllowedOrigins,isOriginAllowed} from './utils/origins.js';

export const allowedOrigins=parseAllowedOrigins(env.CLIENT_URL);

export const isAllowedOrigin=(origin?:string)=>!origin||isOriginAllowed(origin,allowedOrigins,env.NODE_ENV);

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
		callback(null, allowed);
	},
	credentials:true
};
export const app=express();app.set('trust proxy',1);app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));app.use(cors(corsOptions));app.use(express.json({limit:'2mb'}));app.use(express.urlencoded({extended:true}));app.use(cookieParser());app.use(morgan(env.NODE_ENV==='production'?'combined':'dev'));app.get('/health',(_req,res)=>res.json({status:'ok',time:new Date()}));app.use('/api',api);app.use(notFound);app.use(errorHandler);
