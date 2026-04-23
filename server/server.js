import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import { createRoom, joinRoom, getRoom, updateGameState, closeRoom } from './roomManager.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes (specific routes must come before static files and fallback)
app.post('/api/room/create', (req, res) => {
  try {
    const playerId = Math.random().toString(36).substr(2, 9);
    const room = createRoom(playerId);
    
    res.json({
      success: true,
      roomCode: room.code,
      playerId: playerId,
      playerColor: 'red'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/room/:code', (req, res) => {
  try {
    const room = getRoom(req.params.code);
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    res.json({
      success: true,
      room: {
        code: room.code,
        isFull: room.players.blue !== null,
        gameState: room.gameState
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Serve frontend static files (built by Vite)
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback — serve index.html for any non-API, non-static route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// WebSocket Connections

const clientRooms = new Map(); // Maps ws to {roomCode, playerId, color}

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(ws, message);
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    const clientInfo = clientRooms.get(ws);
    if (clientInfo) {
      const room = getRoom(clientInfo.roomCode);
      if (room) {
        // Notify other player
        notifyRoomPlayers(clientInfo.roomCode, {
          type: 'player_disconnected',
          message: `${clientInfo.color} player disconnected`
        }, ws);
        
        // Close room if both players disconnected
        closeRoom(clientInfo.roomCode);
      }
      clientRooms.delete(ws);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleMessage(ws, message) {
  const clientInfo = clientRooms.get(ws);

  switch (message.type) {
    case 'join_room':
      handleJoinRoom(ws, message);
      break;
    
    case 'move':
      handleMove(ws, message);
      break;
    
    case 'reset_game':
      handleResetGame(ws, message);
      break;

    case 'vote_rematch':
      handleRematchVote(ws, message);
      break;
    
    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

function handleJoinRoom(ws, message) {
  const { roomCode, playerId } = message;
  const room = getRoom(roomCode);

  if (!room) {
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Room not found' 
    }));
    return;
  }

  if (room.players.blue !== null) {
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Room is full' 
    }));
    return;
  }

  if (room.players.red.id === playerId) {
    // Red player reconnecting
    room.players.red.ws = ws;
    clientRooms.set(ws, { roomCode, playerId, color: 'red' });
  } else {
    // Blue player joining
    room.players.blue = { id: playerId, ws };
    clientRooms.set(ws, { roomCode, playerId, color: 'blue' });
  }

  // Send join confirmation
  ws.send(JSON.stringify({
    type: 'room_joined',
    roomCode,
    playerColor: clientRooms.get(ws).color,
    gameState: room.gameState,
    redConnected: room.players.red.ws !== null,
    blueConnected: room.players.blue && room.players.blue.ws !== null
  }));

  // Notify both players
  notifyRoomPlayers(roomCode, {
    type: 'player_joined',
    redConnected: room.players.red.ws !== null,
    blueConnected: room.players.blue && room.players.blue.ws !== null
  });
}

function handleMove(ws, message) {
  const clientInfo = clientRooms.get(ws);
  if (!clientInfo) return;

  const { roomCode, index } = message;
  const room = getRoom(roomCode);

  if (!room) return;

  // Update game state
  updateGameState(roomCode, index, clientInfo.color === 'red' ? 'X' : 'O');

  // Notify all players in room
  notifyRoomPlayers(roomCode, {
    type: 'move_made',
    index,
    symbol: clientInfo.color === 'red' ? 'X' : 'O',
    playerColor: clientInfo.color,
    gameState: room.gameState
  });
}

function handleResetGame(ws, message) {
  const clientInfo = clientRooms.get(ws);
  if (!clientInfo) return;

  const { roomCode } = message;
  const room = getRoom(roomCode);

  if (!room) return;

  // Reset game state
  room.gameState = {
    board: Array(9).fill(""),
    turn: 0,
    status: "active",
    rematchVotes: {}
  };

  // Notify all players
  notifyRoomPlayers(roomCode, {
    type: 'game_reset',
    gameState: room.gameState
  });
}

function handleRematchVote(ws, message) {
  const clientInfo = clientRooms.get(ws);
  if (!clientInfo) return;

  const { roomCode, agreed } = message;
  const room = getRoom(roomCode);

  if (!room) return;

  // Initialize rematchVotes if needed
  if (!room.gameState.rematchVotes) {
    room.gameState.rematchVotes = {};
  }

  // Record vote
  room.gameState.rematchVotes[clientInfo.color] = agreed;

  // Check if both players have voted
  const redVoted = room.gameState.rematchVotes.hasOwnProperty('red');
  const blueVoted = room.gameState.rematchVotes.hasOwnProperty('blue');

  if (redVoted && blueVoted) {
    const redAgreed = room.gameState.rematchVotes.red === true;
    const blueAgreed = room.gameState.rematchVotes.blue === true;

    if (redAgreed && blueAgreed) {
      // Both agreed - start new game
      room.gameState = {
        board: Array(9).fill(""),
        turn: 0,
        status: "active",
        rematchVotes: {}
      };
      notifyRoomPlayers(roomCode, {
        type: 'rematch_vote',
        bothAgreed: true
      });
    } else {
      // At least one declined - close room
      notifyRoomPlayers(roomCode, {
        type: 'rematch_vote',
        bothAgreed: false,
        message: 'One player declined the rematch'
      });
      setTimeout(() => {
        closeRoom(roomCode);
      }, 2000);
    }
  } else {
    // Still waiting for other player
    notifyRoomPlayers(roomCode, {
      type: 'rematch_vote',
      bothAgreed: false,
      waiting: true
    });
  }
}

function notifyRoomPlayers(roomCode, message, excludeWs = null) {
  const room = getRoom(roomCode);
  if (!room) return;

  // Send to red player
  if (room.players.red.ws && room.players.red.ws !== excludeWs && room.players.red.ws.readyState === 1) {
    room.players.red.ws.send(JSON.stringify(message));
  }

  // Send to blue player
  if (room.players.blue && room.players.blue.ws && room.players.blue.ws !== excludeWs && room.players.blue.ws.readyState === 1) {
    room.players.blue.ws.send(JSON.stringify(message));
  }
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
});
