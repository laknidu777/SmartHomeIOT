import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import houseRoutes from './routes/houseRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import hubRoutes from './routes/hubRoutes.js';
import inviteRoutes from './routes/inviteRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Example root route
app.get('/', (req, res) => {
  res.send('Smart Home API is running 🚀');
});
app.use('/api/auth', authRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/hubs', hubRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/users', userRoutes);



// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
});
