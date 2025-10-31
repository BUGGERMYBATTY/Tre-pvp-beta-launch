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
  nickname: string;
  opponentNickname: string;
}

type Particle = { id: number; x: number; y: number; vx: number; vy: number; size: number; life: number; color: string; };
type BallTrail = { x: number; y: number; };

const PongGameScreen: React.FC<PongGameScreenProps> = ({ onGameOver, betAmount, onForfeit, nickname, opponentNickname }) => {
  const [player1Y, setPlayer1Y] = useState(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [player2Y, setPlayer2Y] = useState(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [ball, setBall] = useState({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, vx: 4, vy: 4 });
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [roundsWon, setRoundsWon] = useState({ player1: 0, player2: 0 });
  const [message, setMessage] = useState('First to 2 rounds wins!');
  const [paddleSpeed, setPaddleSpeed] = useState(6);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ballTrail, setBallTrail] = useState<BallTrail[]>([]);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const gameLoopRef = useRef<number | undefined>(undefined);
  const isGameActive = useRef(true);
  const speedIncreaseCount = useRef(0);
  const nextParticleId = useRef(0);

  const createCollisionParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = Array.from({ length: 15 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        return {
            id: nextParticleId.current++,
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 2 + 1,
            life: 30, // frames
            color
        };
    });
    setParticles(p => [...p, ...newParticles]);
  }, []);

  const resetBall = useCallback((direction: number) => {
    setBall({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      vx: 4 * direction,
      vy: Math.random() > 0.5 ? 4 : -4,
    });
    speedIncreaseCount.current = 0;
    setPaddleSpeed(6);
    setBallTrail([]);
  }, []);

  const gameLoop = useCallback(() => {
    if (isGameActive.current) {
        // --- Paddle Logic ---
        let nextPlayer1Y = player1Y;
        if (keysPressed.current['w']) nextPlayer1Y -= paddleSpeed;
        if (keysPressed.current['s']) nextPlayer1Y += paddleSpeed;
        nextPlayer1Y = Math.max(0, Math.min(nextPlayer1Y, GAME_HEIGHT - PADDLE_HEIGHT));

        let nextPlayer2Y = player2Y;
        const paddleCenter = nextPlayer2Y + PADDLE_HEIGHT / 2;
        if (ball.vx > 0) { // AI moves only when ball is coming towards it
            if (paddleCenter < ball.y - 15) nextPlayer2Y = Math.min(nextPlayer2Y + paddleSpeed * 0.8, GAME_HEIGHT - PADDLE_HEIGHT);
            else if (paddleCenter > ball.y + 15) nextPlayer2Y = Math.max(nextPlayer2Y - paddleSpeed * 0.8, 0);
        }
        
        // --- Ball Logic ---
        let nextBall = { ...ball };
        nextBall.x += nextBall.vx;
        nextBall.y += nextBall.vy;
        
        // Update Ball Trail
        setBallTrail(trail => [{ x: ball.x, y: ball.y }, ...trail.slice(0, 5)]);

        // Top/bottom wall collision
        if (nextBall.y <= 0 || nextBall.y >= GAME_HEIGHT - BALL_SIZE) {
            nextBall.vy *= -1;
            if (nextBall.y <= 0) nextBall.y = 0;
            if (nextBall.y >= GAME_HEIGHT - BALL_SIZE) nextBall.y = GAME_HEIGHT - BALL_SIZE;
        }

        // Paddle collision
        if (nextBall.x <= PADDLE_WIDTH && nextBall.x > 0 && nextBall.y + BALL_SIZE >= nextPlayer1Y && nextBall.y <= nextPlayer1Y + PADDLE_HEIGHT) {
            nextBall.vx *= -1.05;
            nextBall.x = PADDLE_WIDTH;
            speedIncreaseCount.current++;
            createCollisionParticles(nextBall.x, nextBall.y, '#00BFFF');
        } else if (nextBall.x + BALL_SIZE >= GAME_WIDTH - PADDLE_WIDTH && nextBall.x < GAME_WIDTH - BALL_SIZE && nextBall.y + BALL_SIZE >= nextPlayer2Y && nextBall.y <= nextPlayer2Y + PADDLE_HEIGHT) {
            nextBall.vx *= -1.05;
            nextBall.x = GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE;
            speedIncreaseCount.current++;
            createCollisionParticles(nextBall.x, nextBall.y, '#FF1493');
        }
        
        if (speedIncreaseCount.current > 0 && speedIncreaseCount.current % 3 === 0) {
            setPaddleSpeed(p => Math.min(p + 0.5, 12));
            speedIncreaseCount.current = 0; // Reset to prevent rapid increases
        }

        // --- Score Check ---
        if (nextBall.x < 0) {
            setScore(s => ({ ...s, player2: s.player2 + 1 }));
            resetBall(1);
        } else if (nextBall.x > GAME_WIDTH) {
            setScore(s => ({ ...s, player1: s.player1 + 1 }));
            resetBall(-1);
        } else {
            setPlayer1Y(nextPlayer1Y);
            setPlayer2Y(nextPlayer2Y);
            setBall(nextBall);
        }
    }

    // --- Particle Logic ---
    setParticles(particles =>
        particles.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1 })).filter(p => p.life > 0)
    );

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [player1Y, player2Y, ball, resetBall, paddleSpeed, createCollisionParticles]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameLoop]);

  // Round/game end logic
  useEffect(() => {
    if (!isGameActive.current) return;
    if (score.player1 >= WINNING_SCORE || score.player2 >= WINNING_SCORE) {
        isGameActive.current = false;
        const p1WonRound = score.player1 >= WINNING_SCORE;
        const newRoundsWon = { player1: roundsWon.player1 + (p1WonRound ? 1 : 0), player2: roundsWon.player2 + (p1WonRound ? 0 : 1) };
        setRoundsWon(newRoundsWon);
        setMessage(p1WonRound ? 'You win the round!' : 'Opponent wins the round!');

        if (newRoundsWon.player1 >= WINNING_ROUNDS) setTimeout(() => onGameOver(1), 2000);
        else if (newRoundsWon.player2 >= WINNING_ROUNDS) setTimeout(() => onGameOver(2), 2000);
        else {
            setTimeout(() => {
                setScore({ player1: 0, player2: 0 });
                resetBall(p1WonRound ? -1 : 1);
                setMessage(`Round ${newRoundsWon.player1 + newRoundsWon.player2 + 1}`);
                isGameActive.current = true;
            }, 3000);
        }
    }
  }, [score, roundsWon, onGameOver, resetBall]);

  // Handle disconnection as a forfeit
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      onForfeit();
      event.returnValue = 'Are you sure you want to leave? Leaving will forfeit the match.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [onForfeit]);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-4 animate-fadeIn">
       <div className="w-full flex justify-between items-center mb-4 px-4" style={{width: GAME_WIDTH}}>
        <div className="text-left">
            <h3 className="text-2xl font-bold font-display text-blue-light truncate">{nickname}</h3>
            <p className="text-xl">Score: {score.player1} <span className="text-gray-300 text-base">| Rounds: {roundsWon.player1}</span></p>
        </div>
        <div className="text-center">
          <h4 className="text-lg font-display text-gray-300">Total Pot</h4>
          <p className="text-2xl font-bold text-blue-light">{(betAmount * 2).toFixed(2)} SOL</p>
        </div>
        <div className="text-right">
            <h3 className="text-2xl font-bold font-display text-pink-light truncate">{opponentNickname}</h3>
            <p className="text-xl">Score: {score.player2} <span className="text-gray-300 text-base">| Rounds: {roundsWon.player2}</span></p>
        </div>
      </div>
      <div className="relative bg-brand-dark border-2 border-blue/50" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, boxShadow: '0 0 20px rgba(0, 191, 255, 0.4)' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-full border-l-2 border-dashed border-blue/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-display text-gray-300/80">{message}</div>
        {/* Trail */}
        {ballTrail.map((t, i) => (
            <div key={i} className="absolute bg-white rounded-full" style={{ width: BALL_SIZE, height: BALL_SIZE, left: t.x, top: t.y, opacity: 1 - (i / ballTrail.length) * 0.9, filter: `blur(${i*0.5}px)` }}/>
        ))}
        {/* Paddles and Ball */}
        <div className="absolute bg-blue" style={{ width: PADDLE_WIDTH, height: PADDLE_HEIGHT, left: 0, top: player1Y, boxShadow: '0 0 10px #00BFFF' }} />
        <div className="absolute bg-pink" style={{ width: PADDLE_WIDTH, height: PADDLE_HEIGHT, right: 0, top: player2Y, boxShadow: '0 0 10px #FF1493' }} />
        <div className="absolute bg-white rounded-full" style={{ width: BALL_SIZE, height: BALL_SIZE, left: ball.x, top: ball.y, boxShadow: '0 0 15px white' }} />
        {/* Particles */}
        {particles.map(p => (
            <div key={p.id} className="absolute rounded-full" style={{ width: p.size, height: p.size, left: p.x, top: p.y, background: p.color, opacity: p.life / 30 }} />
        ))}
      </div>
      <div className="mt-4">
        <button onClick={onForfeit} className="text-pink-light hover:text-white bg-pink/20 hover:bg-pink/30 transition-colors p-2 px-4 rounded-lg">Forfeit Match</button>
      </div>
    </div>
  );
};

export default PongGameScreen;