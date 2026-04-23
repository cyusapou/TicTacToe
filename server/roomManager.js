// Room Manager - Handles game rooms and player connections

const rooms = new Map();

// Generate a random 5-digit room code
function generateRoomCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Create a new room
function createRoom(playerId) {
  const roomCode = generateRoomCode();
  
  const room = {
    code: roomCode,
    players: {
      red: { id: playerId, ws: null },
      blue: null
    },
    gameState: {
      board: Array(9).fill(""),
      turn: 0,
      status: "waiting" // waiting, active, finished
    },
    createdAt: new Date()
  };
  
  rooms.set(roomCode, room);
  return room;
}

// Join an existing room
function joinRoom(roomCode, playerId, ws) {
  const room = rooms.get(roomCode);
  
  if (!room) {
    return { success: false, message: "Room not found" };
  }
  
  if (room.players.blue !== null) {
    return { success: false, message: "Room is full" };
  }
  
  room.players.blue = { id: playerId, ws };
  room.gameState.status = "active";
  
  return { success: true, room };
}

// Get room by code
function getRoom(roomCode) {
  return rooms.get(roomCode);
}

// Update game state in room
function updateGameState(roomCode, boardIndex, symbol) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  
  room.gameState.board[boardIndex] = symbol;
  room.gameState.turn++;
  
  return room;
}

// Close room
function closeRoom(roomCode) {
  rooms.delete(roomCode);
}

// Get all rooms (for debugging)
function getAllRooms() {
  return Array.from(rooms.values());
}

export {
  createRoom,
  joinRoom,
  getRoom,
  updateGameState,
  closeRoom,
  getAllRooms,
  generateRoomCode
};
