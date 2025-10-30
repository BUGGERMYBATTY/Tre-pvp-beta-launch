import React, { useState, useEffect, useRef, useCallback } from 'react';

// Game constants
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 12;
const BALL_SIZE = 12;
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const WINNING_SCORE = 3; // Points to win a round
const WINNING_ROUNDS = 2; // Rounds to win the match

interface PongGameScreenProps {
  onGameOver: (winnerId: number | null) => void;
  betAmount: number;
  onForfeit: () => void;
}

const PongGameScreen: React.FC<PongGameScreenProps> = ({ onGameOver, betAmount, onForfeit }) => {
  const [player1Y, setPlayer1Y] = useState(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [player2Y, setPlayer2Y] = useState(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [ball, setBall] = useState({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    vx: 3,
    vy: 3,
  });
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [roundsWon, setRoundsWon] = useState({ player1: 0, player2: 0 });
  const [message, setMessage] = useState('First to 2 rounds wins!');
  const [paddleSpeed, setPaddleSpeed] = useState(6);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const gameLoopRef = useRef<number | undefined>(undefined);
  const isGameActive = useRef(true);
  const speedIncreaseCount = useRef(0);

  const resetBall = useCallback((direction: number) => {
    setBall({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      vx: 3 * direction,
      vy: Math.random() > 0.5 ? 3 : -3,
    });
    speedIncreaseCount.current = 0;
    setPaddleSpeed(6);
  }, []);

  const gameLoop = useCallback(() => {
    if (isGameActive.current) {
        // --- Paddle Logic ---
        let nextPlayer1Y = player1Y;
        if (keysPressed.current['w']) {
            nextPlayer1Y -= paddleSpeed;
        }
        if (keysPressed.current['s']) {
            nextPlayer1Y += paddleSpeed;
        }
        nextPlayer1Y = Math.max(0, Math.min(nextPlayer1Y, GAME_HEIGHT - PADDLE_HEIGHT));

        let nextPlayer2Y = player2Y;
        const paddleCenter = nextPlayer2Y + PADDLE_HEIGHT / 2;
        if (ball.vx > 0) { // AI moves only when ball is coming towards it
            if (paddleCenter < ball.y - 20) {
                nextPlayer2Y = Math.min(nextPlayer2Y + paddleSpeed * 0.7, GAME_HEIGHT - PADDLE_HEIGHT);
            } else if (paddleCenter > ball.y + 20) {
                nextPlayer2Y = Math.max(nextPlayer2Y - paddleSpeed * 0.7, 0);
            }
        }
        
        // --- Ball Logic ---
        let nextBall = { ...ball };
        nextBall.x += nextBall.vx;
        nextBall.y += nextBall.vy;
        
        let ballSpeedIncreased = false;

        // Top/bottom wall collision
        if (nextBall.y <= 0 || nextBall.y >= GAME_HEIGHT - BALL_SIZE) {
            nextBall.vy *= -1;
            if (nextBall.y <= 0) nextBall.y = 0;
            if (nextBall.y >= GAME_HEIGHT - BALL_SIZE) nextBall.y = GAME_HEIGHT - BALL_SIZE;
        }

        let collidedWithPaddle = false;
        // Player 1 (left) paddle collision
        if (
            nextBall.vx < 0 &&
            ball.x >= PADDLE_WIDTH &&
            nextBall.x <= PADDLE_WIDTH &&
            nextBall.y + BALL_SIZE >= nextPlayer1Y &&
            nextBall.y <= nextPlayer1Y + PADDLE_HEIGHT
        ) {
            nextBall.vx *= -1.15;
            nextBall.x = PADDLE_WIDTH; // Snap to paddle edge to prevent tunneling
            collidedWithPaddle = true;
            ballSpeedIncreased = true;
        }
        
        // Player 2 (right) paddle collision
        if (
            !collidedWithPaddle &&
            nextBall.vx > 0 &&
            ball.x + BALL_SIZE <= GAME_WIDTH - PADDLE_WIDTH &&
            nextBall.x + BALL_SIZE >= GAME_WIDTH - PADDLE_WIDTH &&
            nextBall.y + BALL_SIZE >= nextPlayer2Y &&
            nextBall.y <= nextPlayer2Y + PADDLE_HEIGHT
        ) {
            nextBall.vx *= -1.15;
            nextBall.x = GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE; // Snap to paddle edge
            collidedWithPaddle = true;
            ballSpeedIncreased = true;
        }

        if (ballSpeedIncreased) {
            speedIncreaseCount.current += 1;
            if (speedIncreaseCount.current > 0 && speedIncreaseCount.current % 2 === 0) {
                setPaddleSpeed(p => p + 1);
            }
        }

        // --- State Updates ---
        // Check for score only if no paddle collision occurred
        const player2Scored = !collidedWithPaddle && nextBall.x < 0;
        const player1Scored = !collidedWithPaddle && nextBall.x > GAME_WIDTH;

        if (player1Scored) {
            setScore(s => ({ ...s, player1: s.player1 + 1 }));
            resetBall(-1);
        } else if (player2Scored) {
            setScore(s => ({ ...s, player2: s.player2 + 1 }));
            resetBall(1);
        } else {
            // No score, update all entity positions
            setPlayer1Y(nextPlayer1Y);
            setPlayer2Y(nextPlayer2Y);
            setBall(nextBall);
        }
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [player1Y, player2Y, ball, resetBall, paddleSpeed]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  // This effect handles round and game end logic
  useEffect(() => {
    if (!isGameActive.current) return;

    let roundWinnerId: number | null = null;
    if (score.player1 >= WINNING_SCORE) {
        roundWinnerId = 1;
    } else if (score.player2 >= WINNING_SCORE) {
        roundWinnerId = 2;
    }

    if (roundWinnerId) {
        isGameActive.current = false;
        const newRoundsWon = { ...roundsWon };
        
        if (roundWinnerId === 1) {
            newRoundsWon.player1++;
            setMessage('You win the round!');
        } else {
            newRoundsWon.player2++;
            setMessage('Opponent wins the round!');
        }

        setRoundsWon(newRoundsWon);

        if (newRoundsWon.player1 >= WINNING_ROUNDS) {
            setTimeout(() => onGameOver(1), 2000);
            return;
        }
        if (newRoundsWon.player2 >= WINNING_ROUNDS) {
            setTimeout(() => onGameOver(2), 2000);
            return;
        }
        
        // Start next round
        setTimeout(() => {
            setScore({ player1: 0, player2: 0 });
            resetBall(roundWinnerId === 1 ? -1 : 1); // Loser serves
            const currentRoundNumber = newRoundsWon.player1 + newRoundsWon.player2 + 1;
            setMessage(`Round ${currentRoundNumber}`);
            isGameActive.current = true;
        }, 3000);
    }
  }, [score, roundsWon, onGameOver, resetBall]);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-4 animate-fadeIn">
      {/* Score and Pot Display */}
       <div className="w-full flex justify-between items-center mb-4 px-4" style={{width: GAME_WIDTH}}>
        <div className="text-left">
            <h3 className="text-2xl font-bold font-display">You</h3>
            <p className="text-xl text-blue">Score: {score.player1} <span className="text-gray-300 text-base">| Rounds: {roundsWon.player1}</span></p>
        </div>
        <div className="text-center">
          <h4 className="text-lg font-display text-gray-300">Total Pot</h4>
          <p className="text-2xl font-bold text-blue-light">{(betAmount * 2).toFixed(2)} SOL</p>
        </div>
        <div className="text-right">
            <h3 className="text-2xl font-bold font-display">Opponent</h3>
            <p className="text-xl text-pink">Score: {score.player2} <span className="text-gray-300 text-base">| Rounds: {roundsWon.player2}</span></p>
        </div>
      </div>
      {/* Game Area */}
      <div 
        className="relative bg-brand-dark border-2 border-blue/50" 
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-full border-l-2 border-dashed border-blue/20"></div>
        {/* Paddles and Ball */}
        <div
          className="absolute bg-blue shadow-[0_0_10px] shadow-blue"
          style={{
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
            left: 0,
            top: player1Y,
          }}
        />
        <div
          className="absolute bg-pink shadow-[0_0_10px] shadow-pink"
          style={{
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
            right: 0,
            top: player2Y,
          }}
        />
        <div
          className="absolute bg-white rounded-full shadow-[0_0_15px] shadow-white"
          style={{
            width: BALL_SIZE,
            height: BALL_SIZE,
            left: ball.x,
            top: ball.y,
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-display text-gray-300 opacity-70">
            {message}
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={onForfeit}
          className="text-pink-light hover:text-white bg-pink/20 hover:bg-pink/30 transition-colors p-2 px-4 rounded-lg"
          aria-label="Forfeit Match"
        >
          Forfeit Match
        </button>
      </div>
    </div>
  );
};

export default PongGameScreen;