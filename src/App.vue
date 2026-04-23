<template>
  <!-- ── Atmospheric Background ─────────────────────────────── -->
  <div class="scene-bg" aria-hidden="true">
    <div class="bg-grid"></div>
    <div class="bg-orb bg-orb--red"></div>
    <div class="bg-orb bg-orb--blue"></div>
    <div class="bg-orb bg-orb--cyan"></div>
    <div class="bg-scanlines"></div>
    <div class="bg-vignette"></div>
    <!-- Corner HUD brackets -->
    <div class="corner corner--tl"></div>
    <div class="corner corner--tr"></div>
    <div class="corner corner--bl"></div>
    <div class="corner corner--br"></div>
  </div>

  <!-- Room Menu Screen -->
  <div v-if="gameMode === 'menu'" class="menu-container">
    <div class="menu-bg-orb menu-bg-orb--red"></div>
    <div class="menu-bg-orb menu-bg-orb--blue"></div>

    <div class="menu-logo">
      <div class="menu-logo-icon">
        <span class="logo-x">X</span>
        <span class="logo-sep">|</span>
        <span class="logo-o">O</span>
      </div>
      <h1>Tic Tac Toe</h1>
      <p class="menu-subtitle">Two Players · One Winner</p>
    </div>

    <div class="menu-buttons">
      <button @click="showSinglePlayerModal = true" class="btn btn-primary">
        <span class="btn-icon">▸</span> Single Player
      </button>
      <div class="menu-divider"></div>
      <button @click="showCreateRoom" class="btn btn-outline">
        <span class="btn-icon">⊕</span> Create Room
      </button>
      <button @click="showJoinRoom" class="btn btn-outline">
        <span class="btn-icon">→</span> Join Room
      </button>
    </div>

    <!-- Create Room Modal -->
    <div v-if="showCreateModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Room Created</h2>
        </div>
        <p v-if="roomCode" class="room-code">
          <span class="room-code-label">Your Code</span>
          <strong @click="copyRoomCode" class="room-code-value" title="Click to copy">{{ roomCode }}</strong>
        </p>
        <p v-if="!roomCode" class="room-code">
          <span class="room-code-label">Generating...</span>
          <strong>—</strong>
        </p>
        <p v-if="copied" class="copy-success">Copied to clipboard!</p>
        <p class="waiting-text">Waiting for opponent to join...</p>
        <div class="modal-buttons">
          <button @click="cancelCreate" class="btn btn-ghost">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Single Player Difficulty Modal -->
    <div v-if="showSinglePlayerModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Single Player</h2>
          <p class="modal-subtext">Choose difficulty</p>
        </div>
        <div class="modal-buttons">
          <button @click="startSinglePlayer('easy')" class="btn btn-ghost">Easy</button>
          <button @click="startSinglePlayer('medium')" class="btn btn-primary">Medium</button>
          <button @click="startSinglePlayer('hard')" class="btn btn-outline">Hard</button>
        </div>
        <div class="modal-buttons">
          <button @click="showSinglePlayerModal = false" class="btn btn-ghost">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Join Room Modal -->
    <div v-if="showJoinModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Join a Room</h2>
          <p class="modal-subtext">Enter the 5-character code</p>
        </div>
        <input
          v-model="joinCode"
          type="text"
          placeholder="A B C D E"
          maxlength="5"
          class="room-input"
          @keyup.enter="joinExistingRoom"
        />
        <div v-if="joinError" class="error-message">{{ joinError }}</div>
        <div class="modal-buttons">
          <button @click="joinExistingRoom" class="btn btn-primary">Join Room</button>
          <button @click="cancelJoin" class="btn btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Game Screen -->
  <div v-else class="maincontainer">

    <div class="game-header">
      <div class="game-header-left">
        <span class="game-wordmark">TTT</span>
        <div v-if="isMultiplayer" class="room-pill">
          <span class="room-pill-dot"></span>
          <span class="room-pill-label">ROOM</span>
          <strong>{{ roomCode }}</strong>
        </div>
      </div>
      <div class="game-header-right">
        <button @click="resetScore" class="btn-reset" title="Reset Score">⟲ RESET</button>
        <button @click="exitGame" class="btn-exit">✕ EXIT</button>
      </div>
    </div>

    <div class="info">
      <div class="score-row">
        <div class="player-card red">
          <span class="player-card-label">RED · X</span>
          <div v-if="playerColor === 'red'" class="you-badge you-badge--red">YOU</div>
          <div v-if="isMultiplayer && playerColor === 'blue'" class="conn-badge">
            <span :class="redConnected ? 'conn-dot conn-dot--on' : 'conn-dot conn-dot--off'"></span>
            {{ redConnected ? 'Connected' : 'Waiting...' }}
          </div>
          <p class="scorex">{{ countx }}</p>
        </div>

        <div class="msg-wrap">
          <div class="msg">{{ msg || '···' }}</div>
        </div>

        <div class="player-card blue">
          <span class="player-card-label">BLUE · O</span>
          <div v-if="playerColor === 'blue'" class="you-badge you-badge--blue">YOU</div>
          <div v-if="isMultiplayer && playerColor === 'red'" class="conn-badge">
            <span :class="blueConnected ? 'conn-dot conn-dot--on' : 'conn-dot conn-dot--off'"></span>
            {{ blueConnected ? 'Connected' : 'Waiting...' }}
          </div>
          <p class="scoreo">{{ counto }}</p>
        </div>
      </div>
    </div>

    <div class="center">
      <div class="board-wrap">
        <div class="container">
          <div
            v-for="(box, index) in square"
            :key="index"
            class="box"
            :class="{ 'winning-box': winningBoxes.includes(index) }"
            @click="play(index)"
            v-html="box.cont"
            :style="{pointerEvents: clickable}"
          ></div>
        </div>
      </div>
    </div>

    <!-- Win Modal -->
    <div v-if="showWinModal" class="modal">
      <div class="modal-content modal-content--win">
        <div class="win-icon">{{ winner === 'Red' ? 'X' : winner === 'Blue' ? 'O' : '—' }}</div>
        <h2 class="win-title">{{ winner === 'Tie' ? "It's a Draw" : `${winner} Wins` }}</h2>
        <p class="win-message">Play another round?</p>
        <div class="modal-buttons win-buttons">
          <button @click="agreePlayAgain" class="btn btn-primary">Play Again</button>
          <button @click="declinePlayAgain" class="btn btn-ghost">Quit</button>
        </div>
        <div v-if="rematchPending" class="waiting-rematch">
          <span class="waiting-dot"></span> Waiting for opponent…
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const SERVER_URL = window.location.origin;
const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

// Game States
let square = ref([
  {cont : ""} , {cont : ""} , {cont : ""} ,
  {cont : ""} , {cont : ""} , {cont : ""} ,
  {cont : ""} , {cont : ""} , {cont : ""} 
]);

// UI States
const gameMode = ref('menu'); // menu, playing
const gameType = ref('single'); // single, multiplayer
const isMultiplayer = ref(false);
const playerColor = ref('red');
const roomCode = ref('');
const playerId = ref('');
const showCreateModal = ref(false);
const showJoinModal = ref(false);
const joinCode = ref('');
const joinError = ref('');
const redConnected = ref(true);
const blueConnected = ref(false);
const showWinModal = ref(false);
const winner = ref('');
const winningBoxes = ref([]);
const rematchPending = ref(false);
const playerAgreedToPlayAgain = ref(false);
const showSinglePlayerModal = ref(false);
const aiDifficulty = ref('medium'); // 'easy' | 'medium' | 'hard'
const copied = ref(false);

// Game Variables
let clickable = "";
let turn = 0;
const x = `<p class="xcomp">X</p>`;
const o = `<p class="ocomp">O</p>`;
const msg = ref("");
const countx = ref(0);
const counto = ref(0);

let ws = null;
let isMyTurn = true;

// WebSocket Connection
function connectWebSocket() {
  return new Promise((resolve, reject) => {
    try {
      ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        resolve();
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        msg.value = 'Connection error. Using local mode.';
        reject(error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
    } catch (error) {
      reject(error);
    }
  });
}

function handleWebSocketMessage(message) {
  switch (message.type) {
    case 'room_joined':
      playerColor.value = message.playerColor;
      redConnected.value = message.redConnected;
      blueConnected.value = message.blueConnected;
      if (message.playerColor === 'red') {
        isMyTurn = true;
      } else {
        isMyTurn = false;
      }
      msg.value = 'Waiting for opponent to join...';
      clickable = 'none';
      break;
      
    case 'player_joined':
      redConnected.value = message.redConnected;
      blueConnected.value = message.blueConnected;
      if (playerColor.value === 'red') {
        msg.value = "You go first!";
        isMyTurn = true;
      } else {
        msg.value = 'Waiting for Red...';
        isMyTurn = false;
      }
      clickable = '';
      showJoinModal.value = false;
      gameMode.value = 'playing';
      resetBoard();
      break;
      
    case 'move_made':
      square.value[message.index].cont = message.symbol === 'X' ? x : o;
      turn++;
      isMyTurn = (message.playerColor !== playerColor.value);
      clickable = isMyTurn ? '' : 'none';
      if (isMyTurn) {
        msg.value = 'Your turn!';
      } else {
        msg.value = message.playerColor === 'red' ? 'Red is playing...' : 'Blue is playing...';
      }
      checkWinCondition();
      break;
      
    case 'game_reset':
      resetBoard();
      break;

    case 'rematch_vote':
      rematchPending.value = true;
      if (message.bothAgreed) {
        rematchPending.value = false;
        showWinModal.value = false;
        resetBoard();
      }
      break;
      
    case 'player_disconnected':
      msg.value = message.message;
      clickable = 'none';
      break;
      
    case 'error':
      msg.value = message.message;
      break;
  }
}

function sendWebSocketMessage(type, data = {}) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...data }));
  }
}

// Menu Functions
function startSinglePlayer(difficulty = 'medium') {
  aiDifficulty.value = difficulty;
  showSinglePlayerModal.value = false;
  gameType.value = 'single';
  isMultiplayer.value = false;
  playerColor.value = 'red';
  gameMode.value = 'playing';
  resetBoard();
  msg.value = "Your turn!";
}

async function showCreateRoom() {
  try {
    await connectWebSocket();
    
    const response = await fetch(`${SERVER_URL}/api/room/create`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      roomCode.value = data.roomCode;
      playerId.value = data.playerId;
      playerColor.value = data.playerColor;
      gameType.value = 'multiplayer';
      isMultiplayer.value = true;
      showCreateModal.value = true;
      
      sendWebSocketMessage('join_room', {
        roomCode: data.roomCode,
        playerId: data.playerId
      });
    }
  } catch (error) {
    console.error('Error creating room:', error);
    msg.value = 'Failed to create room. Please ensure server is running.';
  }
}

function showJoinRoom() {
  showJoinModal.value = true;
  joinError.value = '';
}

async function joinExistingRoom() {
  if (!joinCode.value || joinCode.value.length !== 5) {
    joinError.value = 'Please enter a valid 5-digit code';
    return;
  }

  try {
    await connectWebSocket();
    
    roomCode.value = joinCode.value;
    playerId.value = Math.random().toString(36).substr(2, 9);
    playerColor.value = 'blue';
    gameType.value = 'multiplayer';
    isMultiplayer.value = true;
    showJoinModal.value = false;
    gameMode.value = 'playing';
    
    sendWebSocketMessage('join_room', {
      roomCode: joinCode.value,
      playerId: playerId.value
    });
    
    resetBoard();
  } catch (error) {
    console.error('Error joining room:', error);
    joinError.value = 'Failed to join. Please ensure server is running and code is correct.';
  }
}

function cancelCreate() {
  showCreateModal.value = false;
  if (ws) ws.close();
  gameMode.value = 'menu';
  roomCode.value = '';
  copied.value = false;
}

function copyRoomCode() {
  navigator.clipboard.writeText(roomCode.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

function cancelJoin() {
  showJoinModal.value = false;
  joinCode.value = '';
  joinError.value = '';
}

function resetScore() {
  countx.value = 0;
  counto.value = 0;
  msg.value = 'Score reset!';
  setTimeout(() => {
    msg.value = '';
  }, 2000);
}

function exitGame() {
  if (ws) ws.close();
  gameMode.value = 'menu';
  roomCode.value = '';
  playerId.value = '';
  resetBoard();
}

// Game Logic
function play(index) {
  if (!isMultiplayer.value) {
    playSinglePlayer(index);
  } else {
    playMultiplayer(index);
  }
}

function playSinglePlayer(index) {
  if (square.value[index].cont !== "") return;
  if (clickable === 'none') return;

  // Human is always X (Red)
  square.value[index].cont = x;
  turn++;
  checkWinCondition();

  // If game ended, don't let AI move
  if (winner.value || turn === 9) return;

  // Let AI make a move after a short delay
  clickable = 'none';
  msg.value = 'Computer is thinking...';
  setTimeout(() => {
    const move = computeAIMove(aiDifficulty.value);
    if (move != null) {
      square.value[move].cont = o;
      turn++;
      checkWinCondition();
    }
    if (!winner.value) {
      msg.value = 'Your turn!';
      clickable = '';
    }
  }, 350);
}

// AI helpers
function boardArrayFromSquare(sq) {
  // returns array of 'X', 'O', or ''
  return sq.map(cell => {
    if (cell.cont === x) return 'X';
    if (cell.cont === o) return 'O';
    return '';
  });
}

function availableMovesFromBoard(board) {
  const moves = [];
  board.forEach((v, i) => { if (!v) moves.push(i); });
  return moves;
}

function computeAIMove(difficulty) {
  const board = boardArrayFromSquare(square.value);
  const moves = availableMovesFromBoard(board);
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    // random move
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // medium: win if possible, block if necessary, else prefer center/corners/random
  if (difficulty === 'medium') {
    // try to win
    for (const m of moves) {
      const copy = board.slice(); copy[m] = 'O';
      if (checkBoardWinner(copy) === 'O') return m;
    }
    // try to block
    for (const m of moves) {
      const copy = board.slice(); copy[m] = 'X';
      if (checkBoardWinner(copy) === 'X') return m;
    }
    // prefer center
    if (moves.includes(4)) return 4;
    // prefer corners
    const corners = [0,2,6,8].filter(i => moves.includes(i));
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    // fallback random
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // hard: minimax
  const best = minimax(board, true, 0);
  return best.move;
}

function checkBoardWinner(bd) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c]) return bd[a];
  }
  if (bd.every(Boolean)) return 'Tie';
  return null;
}

function minimax(bd, isAiTurn, depth) {
  const winnerMark = checkBoardWinner(bd);
  if (winnerMark === 'O') return { score: 10 - depth };
  if (winnerMark === 'X') return { score: depth - 10 };
  if (winnerMark === 'Tie') return { score: 0 };

  const moves = availableMovesFromBoard(bd);
  let bestMove = null;

  if (isAiTurn) {
    let bestScore = -Infinity;
    for (const m of moves) {
      const copy = bd.slice(); copy[m] = 'O';
      const result = minimax(copy, false, depth+1);
      if (result.score > bestScore) { bestScore = result.score; bestMove = m; }
    }
    return { score: bestScore, move: bestMove };
  } else {
    let bestScore = Infinity;
    for (const m of moves) {
      const copy = bd.slice(); copy[m] = 'X';
      const result = minimax(copy, true, depth+1);
      if (result.score < bestScore) { bestScore = result.score; bestMove = m; }
    }
    return { score: bestScore, move: bestMove };
  }
}

function playMultiplayer(index) {
  if (!isMyTurn) {
    msg.value = "It's not your turn!";
    return;
  }

  if (square.value[index].cont !== "") return;

  clickable = 'none';

  const symbol = playerColor.value === 'red' ? 'X' : 'O';
  square.value[index].cont = playerColor.value === 'red' ? x : o;

  sendWebSocketMessage('move', {
    roomCode: roomCode.value,
    index: index
  });
}

function checkWinCondition() {
  const ifx1 = (square.value[0].cont === x && square.value[1].cont === x && square.value[2].cont === x);
  const ifx2 = (square.value[3].cont === x && square.value[4].cont === x && square.value[5].cont === x);
  const ifx3 = (square.value[6].cont === x && square.value[7].cont === x && square.value[8].cont === x);
  const ifx4 = (square.value[0].cont === x && square.value[3].cont === x && square.value[6].cont === x);
  const ifx5 = (square.value[1].cont === x && square.value[4].cont === x && square.value[7].cont === x);
  const ifx6 = (square.value[2].cont === x && square.value[5].cont === x && square.value[8].cont === x);
  const ifx7 = (square.value[0].cont === x && square.value[4].cont === x && square.value[8].cont === x);
  const ifx8 = (square.value[2].cont === x && square.value[4].cont === x && square.value[6].cont === x);

  const ifo1 = (square.value[0].cont === o && square.value[1].cont === o && square.value[2].cont === o);
  const ifo2 = (square.value[3].cont === o && square.value[4].cont === o && square.value[5].cont === o);
  const ifo3 = (square.value[6].cont === o && square.value[7].cont === o && square.value[8].cont === o);
  const ifo4 = (square.value[0].cont === o && square.value[3].cont === o && square.value[6].cont === o);
  const ifo5 = (square.value[1].cont === o && square.value[4].cont === o && square.value[7].cont === o);
  const ifo6 = (square.value[2].cont === o && square.value[5].cont === o && square.value[8].cont === o);
  const ifo7 = (square.value[0].cont === o && square.value[4].cont === o && square.value[8].cont === o);
  const ifo8 = (square.value[2].cont === o && square.value[4].cont === o && square.value[6].cont === o);

  if (ifx1) { countx.value++; winningBoxes.value = [0, 1, 2]; handleWin('Red'); return; }
  if (ifx2) { countx.value++; winningBoxes.value = [3, 4, 5]; handleWin('Red'); return; }
  if (ifx3) { countx.value++; winningBoxes.value = [6, 7, 8]; handleWin('Red'); return; }
  if (ifx4) { countx.value++; winningBoxes.value = [0, 3, 6]; handleWin('Red'); return; }
  if (ifx5) { countx.value++; winningBoxes.value = [1, 4, 7]; handleWin('Red'); return; }
  if (ifx6) { countx.value++; winningBoxes.value = [2, 5, 8]; handleWin('Red'); return; }
  if (ifx7) { countx.value++; winningBoxes.value = [0, 4, 8]; handleWin('Red'); return; }
  if (ifx8) { countx.value++; winningBoxes.value = [2, 4, 6]; handleWin('Red'); return; }

  if (ifo1) { counto.value++; winningBoxes.value = [0, 1, 2]; handleWin('Blue'); return; }
  if (ifo2) { counto.value++; winningBoxes.value = [3, 4, 5]; handleWin('Blue'); return; }
  if (ifo3) { counto.value++; winningBoxes.value = [6, 7, 8]; handleWin('Blue'); return; }
  if (ifo4) { counto.value++; winningBoxes.value = [0, 3, 6]; handleWin('Blue'); return; }
  if (ifo5) { counto.value++; winningBoxes.value = [1, 4, 7]; handleWin('Blue'); return; }
  if (ifo6) { counto.value++; winningBoxes.value = [2, 5, 8]; handleWin('Blue'); return; }
  if (ifo7) { counto.value++; winningBoxes.value = [0, 4, 8]; handleWin('Blue'); return; }
  if (ifo8) { counto.value++; winningBoxes.value = [2, 4, 6]; handleWin('Blue'); return; }

  if (turn === 9) {
    msg.value = "It's a Draw!";
    clickable = "none";
    if (isMultiplayer.value) {
      showWinModal.value = true;
      winner.value = "Tie";
    } else {
      setTimeout(() => {
        msg.value = '';
        resetBoard();
      }, 3000);
    }
  }
}

function handleWin(winnerName) {
  msg.value = `${winnerName} Won!`;
  clickable = "none";
  winner.value = winnerName;
  
  if (isMultiplayer.value) {
    showWinModal.value = true;
    playerAgreedToPlayAgain.value = false;
    rematchPending.value = false;
  } else {
    setTimeout(() => {
      msg.value = '';
      resetBoard();
    }, 3000);
  }
}

function agreePlayAgain() {
  playerAgreedToPlayAgain.value = true;
  rematchPending.value = true;
  sendWebSocketMessage('vote_rematch', {
    roomCode: roomCode.value,
    agreed: true
  });
}

function declinePlayAgain() {
  playerAgreedToPlayAgain.value = false;
  sendWebSocketMessage('vote_rematch', {
    roomCode: roomCode.value,
    agreed: false
  });
  exitGame();
}

function resetBoard() {
  square.value.forEach((box, i) => {
    square.value[i].cont = '';
  });
  turn = 0;
  msg.value = '';
  clickable = '';
  winningBoxes.value = [];
  showWinModal.value = false;
  winner.value = '';
  playerAgreedToPlayAgain.value = false;
  rematchPending.value = false;
  
  if (isMultiplayer.value) {
    if (playerColor.value === 'red') {
      isMyTurn = true;
      msg.value = "You go first!";
    } else {
      isMyTurn = false;
      msg.value = 'Waiting for Red...';
    }
    clickable = isMyTurn ? '' : 'none';
  }
}

onUnmounted(() => {
  if (ws) {
    ws.close();
  }
});
</script>