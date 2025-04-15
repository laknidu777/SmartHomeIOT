import express from 'express';
import http from 'http';
import socketIo from 'socket.io'; // ✅ works for CommonJS in ES Modules
import dotenv from 'dotenv';

import userRoutes from './routes/userRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import { registerDeviceSocketHandlers } from './sockets/deviceSocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ FIXED here:
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/homes', homeRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/devices', deviceRoutes);

// Socket.IO
registerDeviceSocketHandlers(io);

app.get('/', (req, res) => {
  res.send('Smart Home Backend + WebSocket Ready! 🧠⚡');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
