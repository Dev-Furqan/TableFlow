import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri('tableflow_pos');
console.log('Ephemeral MongoDB started for local verification');
await import('./seed/index.js');
await import('./server.js');

process.on('exit', () => void mongo.stop());
