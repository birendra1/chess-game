// Include the Stockfish.js library
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
document.head.appendChild(script);

const board = document.getElementById('chessboard');
const turnIndicator = document.getElementById('turn-indicator');
const resetButton = document.getElementById('reset-game');
const game = new Chess();

let selectedSquare = null;
let playerColor = 'w'; // Player is white by default
let stockfish;

// Initialize Stockfish
script.onload = () => {
    stockfish = new Worker(script.src);
    stockfish.onmessage = onStockfishMessage;
    stockfish.postMessage('uci');
    stockfish.postMessage('isready');
};

function onStockfishMessage(event) {
    const message = event.data;
    if (message.startsWith('bestmove')) {
        const move = message.split(' ')[1];
        setTimeout(() => {
            const fromSquare = move.slice(0, 2);
            const toSquare = move.slice(2, 4);
            
            // Highlight the move
            highlightMove(fromSquare, toSquare);
            
            game.move({
                from: fromSquare,
                to: toSquare,
                promotion: 'q' // Always promote to queen for simplicity
            });
            
            updateBoard();
            checkGameStatus();
        }, 1500); // 1.5 second delay
    }
}

function highlightMove(from, to) {
    const fromSquare = document.querySelector(`[data-square="${from}"]`);
    const toSquare = document.querySelector(`[data-square="${to}"]`);
    
    fromSquare.classList.add('highlight-from');
    toSquare.classList.add('highlight-to');
    
    setTimeout(() => {
        fromSquare.classList.remove('highlight-from');
        toSquare.classList.remove('highlight-to');
    }, 2000); // Remove highlight after 2 seconds
}

function makeBotMove() {
    const fen = game.fen();
    stockfish.postMessage(`position fen ${fen}`);
    stockfish.postMessage('go depth 15'); // Adjust depth for difficulty
}



function createBoard() {
    for (let i = 0; i < 64; i++) {
        const square = document.createElement('div');
        square.classList.add('square');
        square.classList.add((i + Math.floor(i / 8)) % 2 === 0 ? 'white' : 'black');
        square.setAttribute('data-square', 
            String.fromCharCode(97 + (i % 8)) + (8 - Math.floor(i / 8))
        );
        board.appendChild(square);
    }
}

function updateBoard() {
    const squares = board.querySelectorAll('.square');
    squares.forEach(square => {
        const piece = game.get(square.getAttribute('data-square'));
        square.innerHTML = '';
        if (piece) {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece');
            pieceElement.style.backgroundImage = `url('assets/${piece.color}${piece.type}.svg')`;
            square.appendChild(pieceElement);
        }
    });
    turnIndicator.textContent = `${game.turn() === 'w' ? 'White' : 'Black'}'s turn`;
    
    // Highlight king if in check
    if (game.in_check()) {
        const kingSquare = document.querySelector(`[data-square="${game.turn()}${game.turn() === 'w' ? 'e1' : 'e8'}"]`);
        kingSquare.classList.add('in-check');
    }
}

function showPossibleMoves(square) {
    const moves = game.moves({ square: square, verbose: true });
    moves.forEach(move => {
        const targetSquare = document.querySelector(`[data-square="${move.to}"]`);
        targetSquare.classList.add('possible-move');
    });
}

function clearHighlights() {
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('selected', 'possible-move', 'in-check');
    });
}

function handleMove(from, to) {
    const move = game.move({ from, to, promotion: 'q' });
    if (move) {
        updateBoard();
        clearHighlights();
        checkGameStatus();
        if (game.turn() !== playerColor) {
            setTimeout(makeBotMove, 500); // Bot moves after a short delay
        }
        return true;
    }
    return false;
}

function checkGameStatus() {
    if (game.in_checkmate()) {
        alert(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
    } else if (game.in_check()) {
        alert(`${game.turn() === 'w' ? 'White' : 'Black'} is in check!`);
    } else if (game.in_draw()) {
        alert("Game over! It's a draw!");
    } else if (game.in_stalemate()) {
        alert("Stalemate! The game is a draw.");
    }
}

function makeBotMove() {
    const moves = game.moves();
    if (moves.length > 0) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        game.move(move);
        updateBoard();
        checkGameStatus();
    }
}

board.addEventListener('click', (event) => {
    if (game.turn() !== playerColor) return; // Prevent moves when it's not player's turn
    
    const clickedSquare = event.target.closest('.square');
    if (!clickedSquare) return;

    const square = clickedSquare.getAttribute('data-square');
    
    if (selectedSquare) {
        if (handleMove(selectedSquare, square)) {
            selectedSquare = null;
        } else {
            alert('Invalid move!');
            clearHighlights();
            selectedSquare = null;
        }
    } else {
        const piece = game.get(square);
        if (piece && piece.color === playerColor) {
            selectedSquare = square;
            clearHighlights();
            clickedSquare.classList.add('selected');
            showPossibleMoves(square);
        }
    }
});

resetButton.addEventListener('click', () => {
    game.reset();
    updateBoard();
    clearHighlights();
    selectedSquare = null;
    if (playerColor === 'b') {
        setTimeout(makeBotMove, 500);
    }
});

createBoard();
updateBoard();

// If player is black, make the first move for the bot
if (playerColor === 'b') {
    setTimeout(makeBotMove, 500);
}