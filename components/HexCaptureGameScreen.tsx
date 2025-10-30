import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameType } from '../types.ts';
import { playRoundOnChain, getGameState } from '../program-client.ts';

const { PublicKey } = (window as any).solanaWeb3;

interface HexCaptureGameScreenProps {
  onGameOver: (winnerId: number | null) => void;
  betAmount: number;
  gamePubkey: any;
  provider: any;
  connection: any;
  isGuest: boolean;
  onForfeit: () => void;
}

// --- Hex Grid Constants & Logic ---
const HEX_COUNT = 19;
// Adjacency list for the 19 hexes
const ADJACENCY_MAP: { [key: number]: number[] } = {
    0: [1, 2, 3, 4, 5, 6], 1: [0, 2, 7], 2: [0, 1, 3, 8], 3: [0, 2, 4, 9],
    4: [0, 3, 5, 10], 5: [0, 4, 6, 11], 6: [0, 5, 12], 7: [1, 2, 8, 13],
    8: [2, 3, 7, 9, 14], 9: [3, 4, 8, 10, 15], 10: [4, 5, 9, 11, 16],
    11: [5, 6, 10, 12, 17], 12: [6, 11, 18], 13: [7, 14], 14: [7, 8, 13, 15],
    15: [8, 9, 14, 16], 16: [9, 10, 15, 17], 17: [10, 11, 16, 18], 18: [12, 17]
};

const HexCaptureGameScreen: React.FC<HexCaptureGameScreenProps> = ({ onGameOver, betAmount, gamePubkey, provider, connection, isGuest, onForfeit }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [message, setMessage] = useState('Loading game...');
  const [isProcessing, setIsProcessing] = useState(false);

  const playerPk = provider.publicKey.toBase58();
  const isPlayerOne = gameState?.players[0] === playerPk;
  const currentTurn = gameState ? gameState.playerOneChoices.filter(c => c !== 255).length + gameState.playerTwoChoices.filter(c => c !== 255).length : 0;
  const isMyTurn = gameState && !gameState.isOver && (
    (isPlayerOne && currentTurn % 2 === 0) || 
    (!isPlayerOne && currentTurn % 2 !== 0)
  );

  const refreshGameState = useCallback(async () => {
    if (isGuest || !connection || !gamePubkey) return;
    try {
      const state = await getGameState(connection, gamePubkey);
      setGameState(state);
    } catch (error) {
      console.error("Could not fetch game state:", error);
    }
  }, [connection, gamePubkey, isGuest]);
  
  // Setup game state and subscriptions
  useEffect(() => {
    if (isGuest) {
      setGameState({
        gameType: GameType.HexCapture,
        players: [playerPk, 'AI_OPPONENT'],
        wagerAmount: betAmount,
        playerOneChoices: Array(5).fill(255),
        playerTwoChoices: Array(5).fill(255),
        roundNumbers: [], isOver: false, winner: ''
      });
    } else {
      refreshGameState();
      const subId = connection.onAccountChange(gamePubkey, refreshGameState, 'confirmed');
      return () => { connection.removeAccountChangeListener(subId); };
    }
  }, [isGuest, connection, gamePubkey, refreshGameState, playerPk, betAmount]);
  
  // Game logic and messaging effect
  useEffect(() => {
    if (!gameState) return;
    
    if (gameState.isOver) {
      const winner = gameState.winner === playerPk ? 1 : 2;
      onGameOver(winner);
      return;
    }

    if (currentTurn >= 10 && !isProcessing) {
      setIsProcessing(true);
      const p1Score = gameState.playerOneChoices.filter(c => c !== 255).length;
      const p2Score = gameState.playerTwoChoices.filter(c => c !== 255).length;
      let winnerId = null;
      if (p1Score > p2Score) winnerId = isPlayerOne ? 1 : 2;
      else if (p2Score > p1Score) winnerId = isPlayerOne ? 2 : 1;
      
      setTimeout(() => onGameOver(winnerId), 1000); // Delay to show final board
    } else if (isMyTurn) {
      setMessage("Your Turn");
    } else {
      setMessage("Opponent's Turn");
    }
  }, [gameState, currentTurn, isMyTurn, isPlayerOne, playerPk, onGameOver, isProcessing]);

  const handleHexClick = async (hexIndex: number) => {
    if (!isMyTurn || isProcessing || !gameState) return;
    
    const turnIndex = Math.floor(currentTurn / 2);
    setIsProcessing(true);
    setMessage('Submitting move...');
    try {
        if (isGuest) {
            const newChoices = isPlayerOne ? [...gameState.playerOneChoices] : [...gameState.playerTwoChoices];
            newChoices[turnIndex] = hexIndex;
            const newGameState = { ...gameState, [isPlayerOne ? 'playerOneChoices' : 'playerTwoChoices']: newChoices };

            // AI Logic
            setTimeout(() => {
                const p1Hexes = newGameState.playerOneChoices.filter(c => c !== 255);
                const p2Hexes = newGameState.playerTwoChoices.filter(c => c !== 255);
                const allControlled = [...p1Hexes, ...p2Hexes];
                const p2Controlled = isPlayerOne ? p2Hexes : p1Hexes;
                const validAiMoves = p2Controlled.flatMap(h => ADJACENCY_MAP[h]).filter(h => !allControlled.includes(h));
                const aiTurnIndex = isPlayerOne ? turnIndex : turnIndex + 1;
                
                if (validAiMoves.length > 0) {
                    const aiChoice = validAiMoves[Math.floor(Math.random() * validAiMoves.length)];
                    const aiChoices = isPlayerOne ? [...newGameState.playerTwoChoices] : [...newGameState.playerOneChoices];
                    aiChoices[aiTurnIndex] = aiChoice;
                    setGameState({...newGameState, [isPlayerOne ? 'playerTwoChoices' : 'playerOneChoices']: aiChoices});
                } else { // No valid moves, this is unlikely but possible
                    setGameState(newGameState);
                }
            }, 500);
        } else {
            await playRoundOnChain(connection, provider, gamePubkey, turnIndex, hexIndex);
            await refreshGameState();
        }
    } catch (e) {
        console.error("Failed to play turn:", e);
        setMessage("Error! Try again.");
    } finally {
        setIsProcessing(false);
    }
  };

  const p1Hexes = gameState?.playerOneChoices.filter(c => c !== 255) ?? [];
  const p2Hexes = gameState?.playerTwoChoices.filter(c => c !== 255) ?? [];
  const allControlled = [...p1Hexes, ...p2Hexes];

  const getHexStatus = (index: number) => {
    if (p1Hexes.includes(index)) return 'player1';
    if (p2Hexes.includes(index)) return 'player2';
    return 'neutral';
  };

  const getIsValidMove = (index: number) => {
    if (getHexStatus(index) !== 'neutral') return false;
    const myHexes = isPlayerOne ? p1Hexes : p2Hexes;
    if (myHexes.length === 0) return true; // Can play anywhere on first turn
    return ADJACENCY_MAP[index].some(neighbor => myHexes.includes(neighbor));
  };
  
  const p1Color = isPlayerOne ? "green" : "pink";
  const p2Color = isPlayerOne ? "pink" : "green";

  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-4 animate-fadeIn">
      <div className="w-full max-w-lg flex justify-between items-center mb-4">
        <div className="text-center">
            <h3 className="text-2xl font-bold font-display">You</h3>
            <p className={`text-xl text-${p1Color}`}>{isPlayerOne ? p1Hexes.length : p2Hexes.length} / 10</p>
        </div>
        <div className="text-center">
            <h4 className="text-lg font-display text-gray-300">Total Pot</h4>
            <p className="text-2xl font-bold text-green-light">{(betAmount * 2).toFixed(2)} SOL</p>
        </div>
        <div className="text-center">
            <h3 className="text-2xl font-bold font-display">Opponent</h3>
            <p className={`text-xl text-${p2Color}`}>{isPlayerOne ? p2Hexes.length : p1Hexes.length} / 10</p>
        </div>
      </div>
      
      <p className="text-2xl h-8 mb-6 font-display tracking-wide">{message}</p>
      
      {/* Hex Grid */}
      <div className="relative w-[300px] h-[300px] flex items-center justify-center animate-pulseGlowGreen">
        <svg viewBox="-55 -60 110 120" className="w-full h-full">
            <defs>
                <g id="hexagon">
                    <polygon points="10,0 5,-8.66 -5,-8.66 -10,0 -5,8.66 5,8.66" />
                </g>
            </defs>
            {[
                {id: 0, x: 0, y: 0}, {id: 1, x: 17.32, y: -10}, {id: 2, x: 8.66, y: -25}, {id: 3, x: -8.66, y: -25},
                {id: 4, x: -17.32, y: -10}, {id: 5, x: -8.66, y: 10}, {id: 6, x: 8.66, y: 10}, {id: 7, x: 25.98, y: -25},
                {id: 8, x: 17.32, y: -40}, {id: 9, x: 0, y: -40}, {id: 10, x: -17.32, y: -40}, {id: 11, x: -25.98, y: -25},
                {id: 12, x: -17.32, y: 10}, {id: 13, x: 34.64, y: 0}, {id: 14, x: 25.98, y: -5}, {id: 15, x: 8.66, y: -5},
                {id: 16, x: -8.66, y: -5}, {id: 17, x: -25.98, y: -5}, {id: 18, x: -34.64, y: 0}
            ].map(({id, x, y}) => {
                const status = getHexStatus(id);
                let colorClass = 'fill-brand-dark stroke-green/50';
                if (status === 'player1') colorClass = `fill-${p1Color}/50 stroke-${p1Color}`;
                if (status === 'player2') colorClass = `fill-${p2Color}/50 stroke-${p2Color}`;
                
                const isValid = getIsValidMove(id);
                const canClick = isMyTurn && isValid;

                return (
                    <use key={id} href="#hexagon" x={x} y={y}
                        className={`stroke-2 transition-all duration-200 ${colorClass} ${canClick ? 'cursor-pointer hover:fill-green-light/50' : ''}`}
                        onClick={() => canClick && handleHexClick(id)}
                    />
                );
            })}
        </svg>
      </div>
      
      <div className="mt-8">
        <button onClick={onForfeit} className="text-pink-light hover:text-white bg-pink/20 hover:bg-pink/30 transition-colors p-2 px-4 rounded-lg">
            Forfeit Match
        </button>
      </div>
       <div className="hidden fill-green/50 stroke-green fill-pink/50 stroke-pink"></div>
    </div>
  );
};

export default HexCaptureGameScreen;