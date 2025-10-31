import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Renamed GoldRushGameState to GameState to match what is returned from getGameState.
import { GameState, GameType } from '../types';
// FIX: Changed import from non-existent 'resolveGameOnChain' to 'resolveGameGoldRushOnChain'.
import { playRoundOnChain, getGameState, resolveGameGoldRushOnChain } from '../program-client';

const { PublicKey } = (window as any).solanaWeb3;

interface GameScreenProps {
  onGameOver: (winnerId: number | null) => void;
  betAmount: number;
  gamePubkey: any;
  provider: any;
  connection: any;
  isGuest: boolean;
  onForfeit: () => void;
  nickname: string;
  opponentNickname: string;
}

const GameScreen: React.FC<GameScreenProps> = ({ onGameOver, betAmount, gamePubkey, provider, connection, isGuest, onForfeit, nickname, opponentNickname }) => {
  const [onChainState, setOnChainState] = useState<GameState | null>(null);
  const [localMessage, setLocalMessage] = useState('Loading game state...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [roundResult, setRoundResult] = useState<'player' | 'opponent' | 'tie' | null>(null);
  const [uiRound, setUiRound] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);

  const playerPubkey = provider.publicKey;
  const isPlayerOne = onChainState?.players[0] === playerPubkey.toBase58();
  
  const currentRound = onChainState ? uiRound : -1;

  // Function to fetch and update game state for real players
  const refreshGameState = useCallback(async () => {
    if (isGuest || !connection || !gamePubkey) return;
    try {
      const state = await getGameState(connection, gamePubkey);
      setOnChainState(state);
    } catch (error) {
      console.error("Could not fetch game state:", error);
      setLocalMessage('Error: Could not load game data.');
    }
  }, [connection, gamePubkey, isGuest]);

  // Initial setup effect
  useEffect(() => {
    if (isGuest) {
      // Create a local game state for the guest
      const roundNumbers = Array.from({length: 5}, () => Math.floor(Math.random() * 5) + 1);
      const guestGameState: GameState = {
        gameType: GameType.GoldRush,
        players: [playerPubkey.toBase58(), 'AI_OPPONENT'],
        wagerAmount: betAmount,
        playerOneChoices: [0,0,0,0,0],
        playerTwoChoices: [0,0,0,0,0],
        roundNumbers: roundNumbers,
        isOver: false,
        winner: new PublicKey(0).toBase58(),
      };
      setOnChainState(guestGameState);
    } else {
       // Use WebSocket subscription for real-time updates for real players
      if (!connection || !gamePubkey) return;
      refreshGameState(); // Initial fetch
      const subscriptionId = connection.onAccountChange(
        gamePubkey,
        () => {
          console.log("Game state updated via subscription.");
          refreshGameState();
        },
        'confirmed'
      );
      return () => {
        connection.removeAccountChangeListener(subscriptionId).catch((err: any) => {
            console.error("Failed to remove account change listener:", err);
        });
      };
    }
  }, [isGuest, connection, gamePubkey, refreshGameState, playerPubkey, betAmount]);
  
  const handlePlayerChoice = useCallback(async (nugget: number) => {
    if (isProcessing || !onChainState || currentRound === -1) return;
    
    // Check if it's our turn to play this round
    if (onChainState.playerOneChoices[currentRound] !== 0) {
      setLocalMessage("You've already played this round.");
      return;
    }

    setIsProcessing(true);
    setTimer(null); // Stop the timer as soon as a choice is made.
    
    if (isGuest) {
      setLocalMessage('Processing your move...');
      const newState = { ...onChainState };
      newState.playerOneChoices[currentRound] = nugget;
      
      // AI Logic: pick a random available chip
      const aiChips = [1, 2, 3, 4, 5].filter(c => !newState.playerTwoChoices.includes(c));
      const aiChoice = aiChips[Math.floor(Math.random() * aiChips.length)];
      
      setTimeout(() => {
        newState.playerTwoChoices[currentRound] = aiChoice;
        setOnChainState(newState);
        setIsProcessing(false);
      }, 750); // Simulate AI thinking time

    } else {
      setLocalMessage('Submitting your choice...');
      try {
        await playRoundOnChain(connection, provider, gamePubkey, currentRound, nugget);
        await refreshGameState();
        setLocalMessage('Choice submitted! Waiting for opponent...');
      } catch (error) {
          console.error("Failed to play round:", error);
          setLocalMessage('Error submitting choice. Please try again.');
      } finally {
          setIsProcessing(false);
      }
    }
  }, [isProcessing, onChainState, currentRound, isGuest, connection, provider, gamePubkey, refreshGameState]);
  
  // This effect creates a deliberate 2-second pause between rounds for the UI.
  // It syncs the `uiRound` to the true game round after a delay, preventing the UI
  // from "flashing" to the next round before the user can see the previous round's result.
  useEffect(() => {
    if (!onChainState) return;
    const trueCurrentRound = onChainState.playerOneChoices.findIndex(c => c === 0);

    // Handle game over case where all rounds are played
    if (trueCurrentRound === -1) {
        if (uiRound < 4) setUiRound(4); // Ensure UI shows the final round
        return;
    }

    if (trueCurrentRound > uiRound) {
        // A round has completed. Wait 2 seconds before updating the UI to the next round.
        const timer = setTimeout(() => {
            setUiRound(trueCurrentRound);
        }, 2000); // 2-second pause to see the round result.
        return () => clearTimeout(timer);
    } else if (trueCurrentRound < uiRound) {
        // State has been reset (e.g. play again), so sync uiRound immediately.
        setUiRound(trueCurrentRound);
    }
  }, [onChainState, uiRound]);

  // Timer logic for auto-playing a move
  useEffect(() => {
    let intervalId: number | undefined;

    const myChoiceThisRound = onChainState?.playerOneChoices[currentRound];
    const shouldRunTimer = onChainState && myChoiceThisRound === 0 && !isProcessing;

    if (shouldRunTimer) {
      if (timer === null) {
        setTimer(30);
      } else if (timer > 0) {
        intervalId = window.setInterval(() => {
          setTimer(t => (t !== null ? t - 1 : null));
        }, 1000);
      } else if (timer === 0) {
        setLocalMessage("Time's up! Making a random move...");
        const availableChips = [1, 2, 3, 4, 5].filter(n => !(onChainState.playerOneChoices.includes(n)));
        if (availableChips.length > 0) {
          const randomChip = availableChips[Math.floor(Math.random() * availableChips.length)];
          handlePlayerChoice(randomChip);
        }
        setTimer(null);
      }
    } else {
      if (timer !== null) {
        setTimer(null);
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [onChainState, currentRound, timer, isProcessing, handlePlayerChoice]);


  // Effect to manage game flow and messaging
  useEffect(() => {
    if (!onChainState || currentRound === -1) return;
    
    const myChoices = onChainState.playerOneChoices;
    const opponentChoices = onChainState.playerTwoChoices;
    const myChoiceThisRound = myChoices[currentRound];
    const opponentChoiceThisRound = opponentChoices[currentRound];

    if (myChoiceThisRound === 0) {
        setLocalMessage(`Round ${currentRound + 1} - Choose Your Data Chip!`);
        setRoundResult(null); // Reset for new round
    } else if (opponentChoiceThisRound === 0) {
        setLocalMessage('Waiting for opponent to play...');
    } else {
        // Both players have played
        if (roundResult === null) { // Only run this logic once per round
            setLocalMessage('Choices are in! Weighing the data...');
            setTimeout(() => {
                if (myChoiceThisRound > opponentChoiceThisRound) {
                    setRoundResult('player');
                    setLocalMessage(`You win the round!`);
                } else if (opponentChoiceThisRound > myChoiceThisRound) {
                    setRoundResult('opponent');
                    setLocalMessage(`Opponent wins the round.`);
                } else {
                    setRoundResult('tie');
                    setLocalMessage(`It's a tie!`);
                }
            }, 750); // Delay for suspense before tipping the scales
        }
    }
    
    // Check for game over
    const lastRoundIndex = onChainState.playerOneChoices.length - 1;
    const allRoundsPlayed = myChoices[lastRoundIndex] !== 0 && opponentChoices[lastRoundIndex] !== 0;

    if (allRoundsPlayed && !onChainState.isOver) {
        if (!isProcessing) { // Prevent multiple calls
            setLocalMessage('All rounds complete! Calculating winner...');
            setIsProcessing(true);

            const resolveGame = async () => {
                if (isGuest) {
                    const myScore = calculateScore(myChoices, opponentChoices, onChainState.roundNumbers);
                    const opponentScore = calculateScore(opponentChoices, myChoices, onChainState.roundNumbers);
                    let winnerId = null;
                    if (myScore > opponentScore) winnerId = 1;
                    else if (opponentScore > myScore) winnerId = 2;
                    
                    setTimeout(() => onGameOver(winnerId), 2500); // Wait for scale animation to finish

                } else {
                    try {
                        const playerOne = new PublicKey(onChainState.players[0]);
                        const playerTwo = new PublicKey(onChainState.players[1]);
                        await resolveGameGoldRushOnChain(connection, provider, gamePubkey, playerOne, playerTwo);
                    } catch (error) {
                        console.error("Failed to resolve game:", error);
                        setLocalMessage('Error calculating winner.');
                        setIsProcessing(false);
                    }
                }
            };
            
            // In on-chain games, only player 1 resolves to avoid duplicate transactions.
            // Delay resolution to allow players to see the final round result
            setTimeout(() => {
              if (isGuest || isPlayerOne) {
                  resolveGame();
              }
            }, 2000);
        }
    }

    if (!isGuest && onChainState.isOver) {
        let winnerId = null;
        if(onChainState.winner !== PublicKey.default.toBase58()) {
            winnerId = onChainState.winner === playerPubkey.toBase58() ? 1 : 2;
        }
        onGameOver(winnerId);
    }

  }, [onChainState, currentRound, isPlayerOne, connection, provider, gamePubkey, onGameOver, playerPubkey, isGuest, roundResult, isProcessing]);

  // Handle disconnection as a forfeit
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // This is primarily for guest mode, as on-chain transactions in beforeunload are unreliable.
      // For real games, an on-chain timeout mechanism would be more robust.
      onForfeit();
      // Most browsers will show a generic message and not this custom one.
      event.returnValue = 'Are you sure you want to leave? Leaving will forfeit the match.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [onForfeit]);

  if (!onChainState) {
    return <div className="text-center"><p className="text-2xl font-display">{localMessage}</p></div>;
  }

  const myPlayerState = {
      nuggets: [1, 2, 3, 4, 5].filter(n => !onChainState.playerOneChoices.includes(n)),
      choice: onChainState.playerOneChoices[currentRound]
  };
  
  const calculateScore = (playerChoices: number[], opponentChoices: number[], roundNumbers: number[]): number => {
    let score = 0;
    for (let i = 0; i < 5; i++) {
        if (playerChoices[i] > opponentChoices[i]) {
            score += roundNumbers[i] + playerChoices[i] + opponentChoices[i];
        }
    }
    return score;
  };
  
  const myScore = calculateScore(onChainState.playerOneChoices, onChainState.playerTwoChoices, onChainState.roundNumbers);
  // FIX: Corrected typo from `twoPlayerChoices` to `playerTwoChoices`.
  const opponentScore = calculateScore(onChainState.playerTwoChoices, onChainState.playerOneChoices, onChainState.roundNumbers);

  const myChoiceThisRound = onChainState.playerOneChoices[currentRound];
  const opponentChoiceThisRound = onChainState.playerTwoChoices[currentRound];
  
  const jackpotValue = (currentRound !== -1 && currentRound < onChainState.roundNumbers.length) ? onChainState.roundNumbers[currentRound] : '-';

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-4 animate-fadeIn max-w-4xl mx-auto">
       {/* Player HUD */}
       <div className="w-full grid grid-cols-3 items-center gap-4 mb-6">
            <div className={`flex flex-col items-start p-4 bg-glassmorphism border border-blue/50 rounded-lg`}>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-blue-light truncate">{nickname}</h3>
                <p className={`text-lg sm:text-xl text-white`}>Score: {myScore}</p>
            </div>
            <div className="text-center">
                <h4 className="text-base sm:text-lg font-display text-gray-300">Total Pot</h4>
                <p className="text-xl sm:text-3xl font-bold text-yellow-light">{(betAmount * 2).toFixed(4)} SOL</p>
            </div>
             <div className={`flex flex-col items-end p-4 bg-glassmorphism border border-pink/50 rounded-lg`}>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-pink-light truncate">{opponentNickname}</h3>
                <p className={`text-lg sm:text-xl text-white`}>Score: {opponentScore}</p>
            </div>
      </div>
      
      {/* --- The Digital Scale --- */}
      <div className="flex flex-col items-center justify-center flex-grow w-full">
        {timer !== null && myChoiceThisRound === 0 && (
          <div className="mb-2 text-5xl font-mono font-bold text-yellow-light">
            {timer}
          </div>
        )}
        <p className="text-2xl h-8 mb-6 font-display tracking-wide text-gray-200">{localMessage}</p>
        
        <div className="relative w-full h-48 flex items-center justify-between max-w-2xl px-8">
            {/* Player's Node */}
            <div className={`relative w-32 h-32 flex items-center justify-center transition-transform duration-500 ${roundResult === 'player' ? 'scale-110' : ''}`}>
                {/* FIX: Cast style object to allow CSS custom properties. */}
                <div className={`absolute w-full h-full rounded-full bg-blue/20 animate-pulseGlow`} style={{'--glow-color': 'rgba(0,191,255,0.3)'} as React.CSSProperties}></div>
                <div className="w-24 h-24 bg-brand-dark border-4 border-blue rounded-full flex items-center justify-center">
                    <span className="text-5xl font-bold font-display text-blue transition-opacity duration-300">
                        {myChoiceThisRound !== 0 ? myChoiceThisRound : '?'}
                    </span>
                </div>
            </div>

            {/* Central Prism */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                 {/* FIX: Cast style object to allow CSS custom properties. */}
                 <div className={`absolute w-full h-full rounded-full bg-yellow/20 animate-pulseGlow`} style={{'--glow-color': 'rgba(255,215,0,0.3)'} as React.CSSProperties}></div>
                 <div className="w-28 h-28 bg-brand-dark border-4 border-yellow rounded-full flex items-center justify-center">
                    <span className="text-6xl font-bold font-display text-yellow">{jackpotValue}</span>
                 </div>
            </div>

            {/* Opponent's Node */}
            <div className={`relative w-32 h-32 flex items-center justify-center transition-transform duration-500 ${roundResult === 'opponent' ? 'scale-110' : ''}`}>
                {/* FIX: Cast style object to allow CSS custom properties. */}
                <div className={`absolute w-full h-full rounded-full bg-pink/20 animate-pulseGlow`} style={{'--glow-color': 'rgba(255,20,147,0.3)'} as React.CSSProperties}></div>
                <div className="w-24 h-24 bg-brand-dark border-4 border-pink rounded-full flex items-center justify-center">
                     <span className="text-5xl font-bold font-display text-pink transition-opacity duration-300">
                        {opponentChoiceThisRound !== 0 ? opponentChoiceThisRound : '?'}
                    </span>
                </div>
            </div>
            
            {/* Connecting Lines */}
            <svg className="absolute top-0 left-0 w-full h-full z-[-1]" preserveAspectRatio="none">
                <line x1="20%" y1="50%" x2="40%" y2="50%" stroke="url(#line-grad-blue)" strokeWidth="2" />
                <line x1="60%" y1="50%" x2="80%" y2="50%" stroke="url(#line-grad-pink)" strokeWidth="2" />
                <defs>
                    <linearGradient id="line-grad-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00BFFF" />
                        <stop offset="100%" stopColor="#FFD700" />
                    </linearGradient>
                    <linearGradient id="line-grad-pink" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#FF1493" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
      </div>
      
      {/* Player Controls */}
      <div className="w-full flex flex-col items-center mt-6">
        <p className="mb-4 text-gray-200 text-lg">Your Data Chips</p>
        <div className="flex gap-3 justify-center">
          {[1, 2, 3, 4, 5].map(num => {
            const isUsed = !myPlayerState.nuggets.includes(num);
            const isDisabled = isUsed || isProcessing || myPlayerState.choice !== 0;
            return (
              <button
                key={num}
                disabled={isDisabled}
                onClick={() => handlePlayerChoice(num)}
                className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center font-bold text-2xl rounded-xl transition-all duration-300 transform font-display border-2
                  ${isUsed 
                    ? 'bg-brand-gray text-gray-600 cursor-not-allowed opacity-50 border-gray-700' 
                    : isDisabled
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700'
                    : 'bg-glassmorphism text-white hover:bg-yellow hover:text-brand-dark hover:scale-110 hover:border-yellow border-blue/50'
                  }`}
              >
                {num}
              </button>
            );
          })}
        </div>
         <div className="mt-8">
            <button
              onClick={onForfeit}
              className="text-pink-light hover:text-white bg-pink/20 hover:bg-pink/30 transition-colors p-2 px-4 rounded-lg"
              aria-label="Forfeit Match"
            >
              Forfeit Match
            </button>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
