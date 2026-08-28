import {createServer} from 'node:http';import {Server} from 'socket.io';import {app,corsOptions} from './app.js';import {connectDb} from './config/db.js';import {env} from './config/env.js';import {registerSockets} from './sockets/index.js';import {startIntegrationWorker,stopIntegrationWorker} from './integration/integrationWorker.js';
const http=createServer(app);const io=new Server(http,{cors:corsOptions,pingInterval:20000,pingTimeout:10000});app.set('io',io);registerSockets(io);

// Keep the HTTP server available when MongoDB is temporarily unavailable. Railway
// otherwise reports a gateway 502 before Express can respond to health checks or
// CORS preflight requests. API routes still await connectDb() and return their
// normal error response until the database is reachable.
http.listen(env.PORT,'0.0.0.0',()=>{
	console.log(`TableFlow API listening on 0.0.0.0:${env.PORT}`);
	void connectDb()
		.then(()=>startIntegrationWorker())
		.catch(err=>console.error('Initial MongoDB connection failed; requests will retry the connection.',err));
});
const shutdown=()=>{stopIntegrationWorker();io.close();http.close(()=>process.exit(0))};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
