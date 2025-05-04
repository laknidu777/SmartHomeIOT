import express from 'express';
import http from 'http';
import socketIo from 'socket.io'; // ✅ works for CommonJS in ES Modules
import dotenv from 'dotenv';
import cors from 'cors';

import userRoutes from './routes/userRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import hubRoutes from './routes/hubRoutes.js';
import userAssignmentRoutes from './routes/UserAssign.js';
import { registerDeviceSocketHandlers } from './sockets/deviceSocket.js';
// ✅ Apply CORS to REST APIs
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
app.use(cors({
  origin: 'http://localhost:3000', // frontend URL
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json());
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/homes', homeRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/hubs', hubRoutes);  
app.use('/api/user-assign', userAssignmentRoutes);

// Socket.IO
registerDeviceSocketHandlers(io);
app.get('/', (req, res) => {
  res.send('Smart Home Backend + WebSocket Ready! 🧠⚡');
});
const PORT = 5000;
const HOST = "192.168.8.141"; // ← bind to LAN IP
server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
});
