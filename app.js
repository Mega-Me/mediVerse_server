const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

// CORS Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health check endpoint
app.get('/ping', (req, res) => res.sendStatus(200));

// Create HTTP server for API
const apiServer = http.createServer(app);
const API_PORT = process.env.API_PORT || 5000;

// Create separate HTTP server for WebSocket
const wsServer = http.createServer();
const WS_PORT = process.env.WS_PORT || 5001;

// WebSocket Server
const wss = new WebSocket.Server({ server: wsServer });
const rooms = new Map();

console.log('🚀 WebSocket server initialized');

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`✅ WebSocket client connected: ${clientIp}`);
  
  let currentRoom = null;
  let currentUser = null;

  ws.on('message', (message) => {
    console.log(`📩 Received from ${clientIp}: ${message}`);
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join':
          currentRoom = data.roomId;
          currentUser = data.userId;
          handleJoin(ws, currentRoom, currentUser);
          break;
          
        case 'offer':
        case 'answer':
        case 'candidate':
          forwardMessage(data);
          break;
          
        case 'keepalive':
          ws.send(JSON.stringify({ type: 'keepalive-ack' }));
          break;
          
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message type'
          }));
      }
    } catch (e) {
      console.error('Error parsing message:', e);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON format'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`❌ WebSocket client disconnected: ${clientIp}`);
    if (currentRoom && currentUser) {
      cleanupConnection(currentRoom, currentUser);
    }
  });
  

  ws.on('error', (error) => {
    console.error(`🔥 WebSocket error from ${clientIp}:`, error);
  });
});

// WebSocket Room Management Functions (same as before)
function handleJoin(ws, roomId, userId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
    console.log(`🆕 Created room: ${roomId}`);
  }

  const room = rooms.get(roomId);
  
  // Check if user already exists (reconnection)
  if (room.has(userId)) {
    console.log(`🔄 User ${userId} reconnecting to room ${roomId}`);
    room.delete(userId); // Remove old connection
  }
  
  // Check room capacity
  if (room.size >= 2) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Room is full'
    }));
    console.log(`❌ Room ${roomId} is full, rejecting ${userId}`);
    return;
  }

  // Add user to room
  room.set(userId, ws);
  console.log(`👤 ${userId} joined room ${roomId} (${room.size}/${2} users)`);

  // Notify all users in room about current status
  const usersInRoom = Array.from(room.keys());
  console.log(`📊 Room ${roomId} users: ${usersInRoom.join(', ')}`);
  
  // Send room status to ALL users in the room
  room.forEach((client, id) => {
    client.send(JSON.stringify({
      type: 'room-status',
      users: usersInRoom,
      roomId: roomId
    }));
  });
  
  // If room now has 2 users, initiate the call setup
  if (room.size === 2) {
    console.log(`🚀 Room ${roomId} is ready for call - 2 users connected`);
    room.forEach((client, id) => {
      client.send(JSON.stringify({
        type: 'room-ready',
        users: usersInRoom,
        roomId: roomId
      }));
    });
  }
}

function forwardMessage(data) {
  const room = rooms.get(data.roomId);
  if (!room) {
    console.log(`❌ Room ${data.roomId} not found for ${data.type}`);
    return;
  }
  
  // If no specific target, forward to all other users in room
  if (!data.targetUserId) {
    const senderId = data.userId;
    room.forEach((client, id) => {
      if (id !== senderId) {
        console.log(`↪️ Broadcasting ${data.type} from ${senderId} to ${id}`);
        client.send(JSON.stringify({
          ...data,
          userId: senderId
        }));
      }
    });
    return;
  }
  
  // Forward to specific target
  const target = room.get(data.targetUserId);
  if (!target) {
    console.log(`❌ Target ${data.targetUserId} not found in room ${data.roomId}`);
    return;
  }

  const payload = {
    ...data,
    userId: data.userId || 'unknown'
  };
  console.log(`↪️ Forwarding ${data.type} from ${data.userId} to ${data.targetUserId}`);
  target.send(JSON.stringify(payload));
}





function cleanupConnection(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.delete(userId);
  console.log(`👤 ${userId} left room ${roomId}`);
  
  // Notify remaining users
  room.forEach(client => {
    client.send(JSON.stringify({
      type: 'user-disconnected',
      userId
    }));
  });

  // Cleanup empty rooms
  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`🗑 Room ${roomId} deleted (empty)`);
  }
}



// Connect to MongoDB and start servers
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    
    // Start API server
    apiServer.listen(API_PORT, '0.0.0.0', () => {
      console.log(`🚀 API server running on port ${API_PORT}`);
      console.log(`🌐 HTTP URL: http://localhost:${API_PORT}`);
    });

    // Start WebSocket server
    wsServer.listen(WS_PORT, '0.0.0.0', () => {
      console.log(`🔌 WebSocket server running on port ${WS_PORT}`);
      console.log(`🛜 WebSocket URL: ws://localhost:${WS_PORT}`);
    });
  })
  .catch(err => {
    console.error('DB connection error:', err);
    process.exit(1);
  });

// Handle server errors
apiServer.on('error', (error) => {
  console.error('🔥 API server error:', error);
});

wsServer.on('error', (error) => {
  console.error('🔥 WebSocket server error:', error);
});