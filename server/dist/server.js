import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { app, corsOptions } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { registerSockets } from './sockets/index.js';
const http = createServer(app);
const io = new Server(http, { cors: corsOptions, pingInterval: 20000, pingTimeout: 10000 });
app.set('io', io);
registerSockets(io);
connectDb().then(() => http.listen(env.PORT, () => console.log(`TableFlow API listening on http://localhost:${env.PORT}`))).catch(err => { console.error('Failed to start API', err); process.exit(1); });
const shutdown = () => { io.close(); http.close(() => process.exit(0)); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
//# sourceMappingURL=server.js.map