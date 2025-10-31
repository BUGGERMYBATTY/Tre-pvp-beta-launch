import React, { useState, useEffect, useRef, useCallback } from 'react';

// Game constants
const ARENA_WIDTH = 350;
const ARENA_HEIGHT = 450;
const SHIP_SIZE = 20;
const SHIP_SPEED = 5;
const WINNING_ROUNDS = 3;

// Types
type Ship = { x: number; y: number; alive: boolean };
type Projectile = { id: number; x: number; y: number; vx: number; vy: number; size: number; type: 'asteroid' | 'laser', rotation: number; rotationSpeed: number; };
type Particle = { id: number; x: number; y: number; vx: number; vy: number; size: number; life: number; };
type Star = { x: number; y: number; z: number };

type GameState = {
    player: Ship;
    ai: Ship;
    projectiles: Projectile[];
}

const getInitialShip = (): Ship => ({
    x: ARENA_WIDTH / 2 - SHIP_SIZE / 2,
    y: ARENA_HEIGHT - SHIP_SIZE * 2,
    alive: true,
});

const getInitialGameState = (): GameState => ({
    player: getInitialShip(),
    ai: getInitialShip(),
    projectiles: [],
});

interface ViperPitGameScreenProps {
  onGameOver: (winnerId: number | null) => void;
  betAmount: number;
  onForfeit: () => void;
  nickname: string;
  opponentNickname: string;
}

const ViperPitGameScreen: React.FC<ViperPitGameScreenProps> = ({ onGameOver, betAmount, onForfeit, nickname, opponentNickname }) => {
    const [gameState, setGameState] = useState<GameState>(getInitialGameState());
    const [roundsWon, setRoundsWon] = useState({ player: 0, ai: 0 });
    const [message, setMessage] = useState('Round 1');
    const [countdown, setCountdown] = useState<number | string | null>(null);
    const [explosions, setExplosions] = useState<Particle[]>([]);

    const gameStateRef = useRef<GameState>(gameState);
    const keysPressed = useRef<{ [key: string]: boolean }>({});
    const isGameActive = useRef(false);
    const waveTimeoutRef = useRef<number | undefined>(undefined);
    const nextProjectileId = useRef(0);
    const nextParticleId = useRef(0);
    const waveCountRef = useRef(0);
    const gameLoopRef = useRef<number | undefined>(undefined);
    const starfieldCanvasRef = useRef<HTMLCanvasElement>(null);
    const starsRef = useRef<Star[]>([]);
    
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    const createExplosion = (x: number, y: number) => {
        const newParticles: Particle[] = Array.from({ length: 40 }, () => {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1;
            return {
                id: nextParticleId.current++,
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1,
                life: 60, // frames
            };
        });
        setExplosions(p => [...p, ...newParticles]);
    };

    const checkCollision = (ship: Ship, projectile: Projectile) => {
        const p_height = projectile.type === 'laser' ? 5 : projectile.size;
        return ship.x < projectile.x + projectile.size && ship.x + SHIP_SIZE > projectile.x && ship.y < projectile.y + p_height && ship.y + SHIP_SIZE > projectile.y;
    };
    
    const generateNewWave = useCallback(() => {
        waveCountRef.current++;
        const wave = waveCountRef.current;
        let newProjectilesRaw: Omit<Projectile, 'id'>[] = [];

        if (wave <= 2) { // Vertical asteroids
            newProjectilesRaw = Array.from({ length: 4 + wave }, () => ({ x: Math.random() * ARENA_WIDTH, y: -20, vx: 0, vy: 2.5 + Math.random(), size: 10 + Math.random() * 10, type: 'asteroid', rotation: 0, rotationSpeed: (Math.random() - 0.5) * 4 }));
        } else if (wave <= 4) { // Asteroids with drift
            newProjectilesRaw = Array.from({ length: 5 + wave }, () => ({ x: Math.random() * ARENA_WIDTH, y: -20, vx: (Math.random() - 0.5) * 2, vy: 3 + Math.random(), size: 10 + Math.random() * 12, type: 'asteroid', rotation: 0, rotationSpeed: (Math.random() - 0.5) * 4 }));
        } else if (wave === 5) { // Introduce laser
            newProjectilesRaw.push({ x: -200, y: Math.random() * (ARENA_HEIGHT - 200) + 100, vx: 6, vy: 0, size: ARENA_WIDTH + 200, type: 'laser', rotation: 0, rotationSpeed: 0 });
        } else if (wave <= 7) { // Lasers and asteroids
            newProjectilesRaw = Array.from({ length: 4 }, () => ({ x: Math.random() * ARENA_WIDTH, y: -20, vx: (Math.random() - 0.5) * 2.5, vy: 3.5, size: 15 + Math.random() * 5, type: 'asteroid', rotation: 0, rotationSpeed: (Math.random() - 0.5) * 4 }));
            newProjectilesRaw.push({ x: Math.random() > 0.5 ? -200 : ARENA_WIDTH + 200, y: Math.random() * (ARENA_HEIGHT - 200) + 100, vx: (6) * (Math.random() > 0.5 ? 1 : -1), vy: 0, size: ARENA_WIDTH + 200, type: 'laser', rotation: 0, rotationSpeed: 0 });
        } else { // Harder waves
            newProjectilesRaw = Array.from({ length: 4 }, () => {
                const fromLeft = Math.random() > 0.5;
                return { x: fromLeft ? -30 : ARENA_WIDTH + 30, y: Math.random() * ARENA_HEIGHT, vx: (fromLeft ? 1 : -1) * (2 + Math.random()), vy: (Math.random() - 0.5) * 2, size: 15 + Math.random() * 5, type: 'asteroid', rotation: 0, rotationSpeed: (Math.random() - 0.5) * 3 };
            });
            if (wave % 2 === 0) newProjectilesRaw.push({ x: Math.random() * (ARENA_WIDTH - 100) + 50, y: -ARENA_HEIGHT, vx: 0, vy: 7, size: ARENA_HEIGHT + 200, type: 'laser', rotation: 90, rotationSpeed: 0 });
        }
    
        const newProjectiles = newProjectilesRaw.map(p => ({...p, id: nextProjectileId.current++}));
        gameStateRef.current = { ...gameStateRef.current, projectiles: [...gameStateRef.current.projectiles, ...newProjectiles] };
        
        const spawnRate = Math.max(300, 1000 - wave * 50);
        waveTimeoutRef.current = window.setTimeout(generateNewWave, spawnRate);
    }, []);

    const resetRound = useCallback((roundWinner: 'player' | 'ai' | 'draw') => {
        isGameActive.current = false;
        clearTimeout(waveTimeoutRef.current);
        waveCountRef.current = 0;

        const newRoundsWon = { ...roundsWon };
        if (roundWinner === 'player') { newRoundsWon.player++; setMessage('You win the round!'); }
        else if (roundWinner === 'ai') { newRoundsWon.ai++; setMessage('Opponent wins the round!'); }
        else { setMessage('Round Draw!'); }
        setRoundsWon(newRoundsWon);

        if (newRoundsWon.player >= WINNING_ROUNDS || newRoundsWon.ai >= WINNING_ROUNDS) {
            setTimeout(() => onGameOver(newRoundsWon.player > newRoundsWon.ai ? 1 : 2), 2000);
        } else {
            setTimeout(() => {
                setGameState(getInitialGameState());
                nextProjectileId.current = 0;
                setExplosions([]);
                setMessage(`Round ${newRoundsWon.player + newRoundsWon.ai + 1}`);
                setCountdown(3);
            }, 2500);
        }
    }, [onGameOver, roundsWon]);

    const gameLoop = useCallback(() => {
        const current = gameStateRef.current;
        if (isGameActive.current) {
            // Player movement
            if (keysPressed.current['w']) current.player.y -= SHIP_SPEED;
            if (keysPressed.current['s']) current.player.y += SHIP_SPEED;
            if (keysPressed.current['a']) current.player.x -= SHIP_SPEED;
            if (keysPressed.current['d']) current.player.x += SHIP_SPEED;
            current.player.x = Math.max(0, Math.min(current.player.x, ARENA_WIDTH - SHIP_SIZE));
            current.player.y = Math.max(0, Math.min(current.player.y, ARENA_HEIGHT - SHIP_SIZE));

            // AI movement
            const closest = current.projectiles.reduce((prev, curr) => {
                const dist = Math.hypot(current.ai.x - curr.x, current.ai.y - curr.y);
                return dist < prev.dist ? { dist, proj: curr } : prev;
            }, { dist: Infinity, proj: null as Projectile | null });

            if (closest.proj && closest.dist < 150) {
                const danger = closest.proj;
                if (danger.x < current.ai.x) current.ai.x += SHIP_SPEED * 0.85; else current.ai.x -= SHIP_SPEED * 0.85;
                if (danger.y < current.ai.y) current.ai.y += SHIP_SPEED * 0.85; else current.ai.y -= SHIP_SPEED * 0.85;
            }
            current.ai.x = Math.max(0, Math.min(current.ai.x, ARENA_WIDTH - SHIP_SIZE));
            current.ai.y = Math.max(0, Math.min(current.ai.y, ARENA_HEIGHT - SHIP_SIZE));
            
            // Projectile movement and cleanup
            current.projectiles = current.projectiles
                .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, rotation: p.rotation + p.rotationSpeed }))
                .filter(p => p.x < ARENA_WIDTH + 200 && p.x > -200 && p.y < ARENA_HEIGHT + 50 && p.y > -ARENA_HEIGHT);

            // Collision detection
            if (current.player.alive && current.projectiles.some(p => checkCollision(current.player, p))) {
                current.player.alive = false;
                createExplosion(current.player.x + SHIP_SIZE / 2, current.player.y + SHIP_SIZE / 2);
            }
            if (current.ai.alive && current.projectiles.some(p => checkCollision(current.ai, p))) {
                current.ai.alive = false;
                createExplosion(current.ai.x + SHIP_SIZE / 2, current.ai.y + SHIP_SIZE / 2);
            }
            
            if (!current.player.alive || !current.ai.alive) {
                isGameActive.current = false;
                setTimeout(() => {
                    if (!current.player.alive && !current.ai.alive) resetRound('draw');
                    else if (!current.player.alive) resetRound('ai');
                    else resetRound('player');
                }, 1000);
            }
        }
        
        setExplosions(explosions => explosions.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1 })).filter(p => p.life > 0));
        setGameState({ ...current });

        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [resetRound]);

    useEffect(() => {
        if (typeof countdown === 'number' && countdown > 0) setTimeout(() => setCountdown(countdown - 1), 1000);
        else if (countdown === 0) setTimeout(() => setCountdown("GO!"), 1000);
        else if (countdown === 'GO!') {
            isGameActive.current = true;
            generateNewWave();
            setTimeout(() => setCountdown(null), 500);
        }
    }, [countdown, generateNewWave]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        const canvas = starfieldCanvasRef.current, ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            starsRef.current = Array.from({ length: 200 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, z: Math.random() * canvas.width }));
            const drawStars = () => {
                if(!ctx) return;
                ctx.fillStyle = "black"; ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "white";
                starsRef.current.forEach(star => {
                    star.z -= 0.5;
                    if (star.z <= 0) { star.z = canvas.width; star.x = Math.random() * canvas.width; star.y = Math.random() * canvas.height; }
                    const x = (star.x - canvas.width / 2) * (canvas.width / star.z) + canvas.width / 2;
                    const y = (star.y - canvas.height / 2) * (canvas.width / star.z) + canvas.height / 2;
                    const r = Math.max(0.1, (canvas.width / star.z) * 1.5);
                    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
                });
                requestAnimationFrame(drawStars);
            };
            drawStars();
        }

        setCountdown(3);
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return () => {
            isGameActive.current = false;
            if(gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            if(waveTimeoutRef.current) clearTimeout(waveTimeoutRef.current);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameLoop]);

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

    const Arena = ({ ship, shipColor, isPlayer, allProjectiles, allExplosions }: {ship: Ship, shipColor: 'blue' | 'pink', isPlayer: boolean, allProjectiles: Projectile[], allExplosions: Particle[]}) => (
        <div className={`relative bg-transparent border-2 ${isPlayer ? 'border-blue/50' : 'border-pink/50'} overflow-hidden`} style={{ width: ARENA_WIDTH, height: ARENA_HEIGHT, boxShadow: `0 0 20px ${isPlayer ? 'rgba(0,191,255,0.4)' : 'rgba(255,20,147,0.4)'}`}}>
            {ship.alive && (
                <div className="absolute" style={{ width: SHIP_SIZE, height: SHIP_SIZE, left: ship.x, top: ship.y }}>
                    <div className={`w-full h-full ${shipColor === 'blue' ? 'bg-blue' : 'bg-pink'}`} style={{ clipPath: 'polygon(50% 0%, 10% 85%, 90% 85%)'}}/>
                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-4 ${shipColor === 'blue' ? 'bg-blue' : 'bg-pink'} rounded-full blur-sm`} />
                </div>
            )}
            {allExplosions.map(p => <div key={p.id} className="absolute bg-yellow-light rounded-full" style={{ width: p.size, height: p.size, left: p.x, top: p.y, opacity: p.life / 60 }} />)}
            {allProjectiles.map(p => (
                <div key={p.id} className="absolute" style={{ width: p.size, height: p.type === 'laser' ? 5 : p.size, left: p.x, top: p.y, transform: `rotate(${p.rotation}deg)`}}>
                    {p.type === 'asteroid' ? <div className="w-full h-full bg-yellow rounded-[40%_60%_70%_30%_/_30%_50%_70%_50%] shadow-[inset_0_0_5px_rgba(0,0,0,0.4)]" /> : <div className="w-full h-full bg-yellow-light rounded-full shadow-[0_0_15px] shadow-yellow-light" />}
                </div>
            ))}
        </div>
    );
    
    return (
        <div className="w-full h-full flex flex-col justify-center items-center p-4 animate-fadeIn">
            <div className="w-full flex justify-between items-center mb-4 max-w-[724px]">
                <div className="text-left"><h3 className="text-2xl font-bold font-display text-blue-light truncate">{nickname}</h3><p className="text-xl">Rounds: {roundsWon.player}</p></div>
                <div className="text-center"><h4 className="text-lg font-display text-gray-300">Total Pot</h4><p className="text-2xl font-bold text-pink-light">{(betAmount * 2).toFixed(2)} SOL</p></div>
                <div className="text-right"><h3 className="text-2xl font-bold font-display text-pink-light truncate">{opponentNickname}</h3><p className="text-xl">Rounds: {roundsWon.ai}</p></div>
            </div>
            <div className="relative">
                <canvas ref={starfieldCanvasRef} width={ARENA_WIDTH * 2 + 24} height={ARENA_HEIGHT} className="absolute top-0 left-0 -z-10 rounded-lg" />
                <div className="flex gap-6 relative">
                    <Arena ship={gameState.player} shipColor="blue" isPlayer={true} allProjectiles={gameState.projectiles} allExplosions={explosions} />
                    <Arena ship={gameState.ai} shipColor="pink" isPlayer={false} allProjectiles={gameState.projectiles} allExplosions={explosions} />
                    {message && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-display text-white bg-black/50 px-4 py-2 rounded-lg pointer-events-none z-10">{message}</div>}
                    {countdown !== null && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                             <span className="text-9xl font-display text-white font-black animate-fadeIn" style={{ animationName: 'scaleAndFade', animationDuration: '1s', textShadow: '0 0 20px rgba(255, 255, 255, 0.7)' }}>{countdown}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4">
                <button onClick={onForfeit} className="text-pink-light hover:text-white bg-pink/20 hover:bg-pink/30 transition-colors p-2 px-4 rounded-lg">Forfeit Match</button>
            </div>
            <style>{`@keyframes scaleAndFade { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }`}</style>
        </div>
    );
};

export default ViperPitGameScreen;