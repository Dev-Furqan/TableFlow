import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const registerSockets = (io) => { io.use((socket, next) => { try {
    const token = socket.handshake.auth?.token || socket.handshake.headers.cookie?.match(/accessToken=([^;]+)/)?.[1];
    if (token)
        (socket.data.user = jwt.verify(token, env.JWT_ACCESS_SECRET));
    next();
}
catch {
    next(new Error('Authentication failed'));
} }); io.on('connection', socket => { socket.emit('socket:ready', { connectedAt: new Date() }); socket.on('heartbeat', (ack) => ack?.({ at: Date.now() })); socket.on('join:station', (station) => socket.join(`station:${station}`)); }); };
//# sourceMappingURL=index.js.map