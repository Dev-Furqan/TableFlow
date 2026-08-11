import {connectDb} from '../config/db.js';import {startIntegrationWorker,stopIntegrationWorker} from './integrationWorker.js';

await connectDb();startIntegrationWorker();console.log('Orange Website integration worker started');
const shutdown=()=>{stopIntegrationWorker();process.exit(0)};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
