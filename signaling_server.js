// const WebSocket = require('ws');
// const wss = new WebSocket.Server({ port: 6060 });
// const rooms = new Map();

// wss.on('connection', (ws) => {
//   let currentRoom = null;
//   let currentUser = null;

//   ws.on('message', (message) => {
//     try {
//       const data = JSON.parse(message);
      
//       switch (data.type) {
//         case 'join':
//           currentRoom = data.roomId;
//           currentUser = data.userId;
//           handleJoin(ws, currentRoom, currentUser);
//           break;
//         case 'offer':
//         case 'answer':
//         case 'candidate':
//           forwardMessage(data);
//           break;
//         default:
//           ws.send(JSON.stringify({
//             type: 'error',
//             message: 'Invalid message type'
//           }));
//       }
//     } catch (e) {
//       ws.send(JSON.stringify({
//         type: 'error',
//         message: 'Invalid JSON format'
//       }));
//     }
//   });

//   ws.on('close', () => {
//     if (currentRoom && currentUser) {
//       cleanupConnection(currentRoom, currentUser);
//     }
//   });
// });

// function handleJoin(ws, roomId, userId) {
//   if (!rooms.has(roomId)) {
//     rooms.set(roomId, new Map());
//   }

//   const room = rooms.get(roomId);
  
//   // Check if user already exists
//   if (room.has(userId)) {
//     ws.send(JSON.stringify({
//       type: 'error',
//       message: 'User already in room'
//     }));
//     return;
//   }

//   room.set(userId, ws);

//   // Notify room participants
//   room.forEach((client, id) => {
//     client.send(JSON.stringify({
//       type: 'room-status',
//       users: Array.from(room.keys())
//     }));
//   });
// }

// function forwardMessage(data) {
//   const room = rooms.get(data.roomId);
//   if (!room) return;

//   const targetUser = room.get(data.targetUserId);
//   if (targetUser) {
//     targetUser.send(JSON.stringify(data));
//   }
// }

// function cleanupConnection(roomId, userId) {
//   const room = rooms.get(roomId);
//   if (!room) return;

//   room.delete(userId);
  
//   // Notify remaining participants
//   room.forEach(client => {
//     client.send(JSON.stringify({
//       type: 'user-disconnected',
//       userId
//     }));
//   });

//   if (room.size === 0) {
//     rooms.delete(roomId);
//   }
// }

const WebSocket = require('ws');
const PORT = 6060;

const wss = new WebSocket.Server({
  port: PORT,
  host: '192.168.1.6',
  perMessageDeflate: false
});

console.log(`🚀 Signaling server started on port ${PORT}`);
console.log(`🔌 Connect using: ws://YOUR_IP:${PORT}`);

const rooms = new Map();

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`✅ Client connected from: ${clientIp}`);
  
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
      console.error('❌ Error parsing message:', e);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON format'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`❌ Client disconnected: ${clientIp}`);
    if (currentRoom && currentUser) {
      cleanupConnection(currentRoom, currentUser);
    }
  });

  ws.on('error', (error) => {
    console.error(`🔥 WebSocket error from ${clientIp}:`, error);
  });
});

function handleJoin(ws, roomId, userId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
    console.log(`Created new room: ${roomId}`);
  }

  const room = rooms.get(roomId);
  
  if (room.size >= 2) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Room is full'
    }));
    console.log(`❌ Room ${roomId} is full, rejecting ${userId}`);
    return;
  }

  room.set(userId, ws);
  console.log(`👤 ${userId} joined room ${roomId}`);

  // Notify all users in the room
  const usersInRoom = Array.from(room.keys());
  room.forEach((client, id) => {
    client.send(JSON.stringify({
      type: 'room-status',
      users: usersInRoom
    }));
  });
}

function forwardMessage(data) {
  const room = rooms.get(data.roomId);
  if (!room) {
    console.log(`❌ Room ${data.roomId} not found`);
    return;
  }

  const targetUser = room.get(data.targetUserId);
  if (targetUser) {
    console.log(`↪️ Forwarding ${data.type} to ${data.targetUserId}`);
    targetUser.send(JSON.stringify(data));
  } else {
    console.log(`❌ Target user ${data.targetUserId} not found`);
  }
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

  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`🗑 Room ${roomId} deleted (empty)`);
  }
}

wss.on('error', (error) => {
  console.error('🔥 Server error:', error);
});