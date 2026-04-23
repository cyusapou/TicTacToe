# Tic Tac Toe - Multiplayer Edition

A Vue 3 + Vite single-player or multiplayer Tic Tac Toe game with WebSocket support.

## Features

- **Single Player Mode**: Play against the board (turn-based)
- **Multiplayer Mode**: Play with a friend using room codes
  - Red player creates a room and gets a 5-digit code
  - Blue player joins using the code
  - Real-time synchronization via WebSocket

## Project Structure

```
.
├── src/                   # Frontend (Vue 3)
│   ├── App.vue           # Main game component
│   ├── main.js           # Vue entry point
│   ├── style.css         # Game styles
│   └── components/       # Vue components
├── server/               # Backend (Node.js + Express)
│   ├── server.js         # WebSocket server
│   ├── roomManager.js    # Room logic
│   └── package.json      # Server dependencies
├── package.json          # Frontend dependencies
└── vite.config.js        # Vite configuration
```

## Installation

### Prerequisites
- Node.js (v16+)

### Setup

1. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

## Running the Game

### Development (Single Player)
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser.

### Full Setup (Multiplayer)

**Terminal 1 - Start the Server:**
```bash
npm run server:dev
```
The WebSocket server will run on `ws://localhost:3000`

**Terminal 2 - Start the Frontend:**
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser.

## How to Play Multiplayer

1. **Create a Room** (Red Player):
   - Click "Create Room" on the menu
   - Share the 5-digit room code with your opponent
   - Wait for opponent to join

2. **Join a Room** (Blue Player):
   - Click "Join Room" on the menu
   - Enter the 5-digit room code
   - Wait for the game to start

3. **Play**:
   - Red always goes first
   - Click any empty square to place your mark
   - First to get 3 in a row wins!

## Game Rules

- Standard Tic Tac Toe rules apply
- Red plays as X, Blue plays as O
- Scores persist throughout your session
- Both players must be connected to play

## API Endpoints

### HTTP

- `POST /api/room/create` - Create a new room
- `GET /api/room/:code` - Get room info

### WebSocket Messages

**Join Room:**
```json
{ "type": "join_room", "roomCode": "12345", "playerId": "abc123" }
```

**Make Move:**
```json
{ "type": "move", "roomCode": "12345", "index": 0 }
```

**Reset Game:**
```json
{ "type": "reset_game", "roomCode": "12345" }
```

## Troubleshooting

- **Connection Error**: Ensure the server is running on port 3000
- **Room Not Found**: Check the room code is correct and hasn't expired
- **Server won't start**: Make sure port 3000 is available
  - Change `PORT` in `server/server.js` if needed

## Building for Production

```bash
npm run build
```
The build output will be in the `dist/` folder.

## Technologies Used

- **Frontend**: Vue 3, Vite
- **Backend**: Node.js, Express, WebSocket (ws library)
- **Communication**: REST API + WebSocket

Enjoy playing! 🎮
