import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import partyRoutes from './routes/partyRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL }
});

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/party', partyRoutes);
app.use('/api/tournament', tournamentRoutes);

const onlineUsers = new Map(); // userId -> Set of socket ids (handles multiple tabs per user)

io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  socket.on('register', (userId) => {
    socket.userId = userId;
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected:', socket.id);
    if (socket.userId && onlineUsers.has(socket.userId)) {
      onlineUsers.get(socket.userId).delete(socket.id);
      if (onlineUsers.get(socket.userId).size === 0) {
        onlineUsers.delete(socket.userId);
      }
    }
  });
});

app.get('/api/online-users', (req, res) => {
  res.json({ onlineUserIds: Array.from(onlineUsers.keys()) });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});