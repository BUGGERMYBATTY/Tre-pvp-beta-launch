import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getOpenGames, createGameOnChain, joinGameOnChain } from '../program-client.ts';
import { GameType, GameState, PublicKey } from '../types.ts';
import { getNicknameForPubkey } from '../utils/mockNicknames.ts';

interface MatchmakingLobbyProps {
  onMatchCreated: (gamePubkey: PublicKey | null, betAmount: number) => void;
  onMatchJoined: (gamePubkey: PublicKey, betAmount: number) => void;
  onCancel: () => void;
  onShowHowToPlay: () => void;
  gameTitle: string;
  gameColor: 'yellow' | 'blue' | 'pink' | 'green';
  gameType: GameType;
  balance: number;
  isGuest: boolean;
  provider: any;
  connection: any;
  nickname: string | null;
}

type LobbyGame = { publicKey: PublicKey; account: GameState };

const MatchmakingLobby: React.FC<MatchmakingLobbyProps> = (props) => {
  const { onMatchCreated, onMatchJoined, onCancel, onShowHowToPlay, gameTitle, gameColor, gameType, balance, isGuest, provider, connection, nickname } = props;
  
  const [betAmount, setBetAmount] = useState('0.05');
  const [error, setError] = useState('');
  const [openGames, setOpenGames] = useState<LobbyGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);

  // Guest-specific state
  const [isGuestWaiting, setIsGuestWaiting] = useState(false);
  const [countdown, setCountdown] = useState(30);
  // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
  const guestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const parsedBetAmount = parseFloat(betAmount) || 0;
  const entryFee = parsedBetAmount * 0.015;
  const totalCost = parsedBetAmount + entryFee;

  const colorClasses = {
    blue: { border: 'border-blue', text: 'text-blue', ring: 'ring-blue-dark', bg: 'bg-blue', hoverBg: 'hover:bg-blue-light', shadow: 'shadow-blue/20' },
    yellow: { border: 'border-yellow', text: 'text-yellow', ring: 'ring-yellow-dark', bg: 'bg-yellow', hoverBg: 'hover:bg-yellow-light', shadow: 'shadow-yellow/20' },
    pink: { border: 'border-pink', text: 'text-pink', ring: 'ring-pink-dark', bg: 'bg-pink', hoverBg: 'hover:bg-pink-light', shadow: 'shadow-pink/20' },
    green: { border: 'border-green', text: 'text-green', ring: 'ring-green-dark', bg: 'bg-green', hoverBg: 'hover:bg-green-light', shadow: 'shadow-green/20' },
  };
  const colors = colorClasses[gameColor];

  const fetchOpenGames = useCallback(async () => {
    if (isGuest || !connection) return;
    try {
      const games = await getOpenGames(connection, provider, gameType);
      setOpenGames(games);
    } catch (err) {
      console.error("Failed to fetch open games:", err);
    }
  }, [connection, provider, gameType, isGuest]);

  useEffect(() => {
    if (!isGuest) {
      fetchOpenGames();
      const interval = setInterval(fetchOpenGames, 15000); // Refresh every 15 seconds for real players
      return () => clearInterval(interval);
    }
  }, [fetchOpenGames, isGuest]);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
        if(guestTimerRef.current) clearTimeout(guestTimerRef.current);
        if(countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
  }, []);

  const handleCreateMatch = async () => {
    if (parsedBetAmount < 0.05) {
      setError('Minimum wager is 0.05 SOL.');
      return;
    }
    if (balance < totalCost) {
      setError('Insufficient balance for this wager.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const newGamePubkey = await createGameOnChain(connection, provider, parsedBetAmount, gameType);
      onMatchCreated(newGamePubkey, parsedBetAmount);
    } catch (err) {
      console.error("Failed to create game:", err);
      setError('Failed to create match. Please try again.');
      setIsLoading(false);
    }
  };

  const handleJoinMatch = async (game: LobbyGame) => {
    const joinFee = game.account.wagerAmount * 0.015;
    const joinTotalCost = game.account.wagerAmount + joinFee;
    if (balance < joinTotalCost) {
        alert("You do not have enough SOL to join this match.");
        return;
    }
    setIsJoining(game.publicKey.toBase58());
    try {
        await joinGameOnChain(connection, provider, game.publicKey);
        onMatchJoined(game.publicKey, game.account.wagerAmount);
    } catch(err) {
        console.error("Failed to join game:", err);
        alert("Failed to join match. It may have been taken. Please refresh and try again.");
        setIsJoining(null);
    }
  };
  
  const handleGuestFindMatch = () => {
    if (balance < 1.015) {
      alert("You don't have enough pretend SOL!");
      return;
    }
    setIsGuestWaiting(true);
    setCountdown(30);

    countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => prev - 1);
    }, 1000);

    guestTimerRef.current = setTimeout(() => {
        if(countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        onMatchCreated(null, 1); // Match with AI
    }, 30000);
  };

  const handleCancelGuestMatchmaking = () => {
    setIsGuestWaiting(false);
    if(guestTimerRef.current) clearTimeout(guestTimerRef.current);
    if(countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  if (isGuest) {
    return (
      <div className={`flex flex-col items-center justify-center bg-glassmorphism p-8 rounded-2xl border ${colors.border}/50 shadow-2xl ${colors.shadow} animate-fadeIn w-full max-w-lg backdrop-blur-sm`}>
        <h2 className={`text-5xl font-extrabold font-display ${colors.text} mb-2`}>{gameTitle}</h2>
        <p className="text-gray-300 mb-6 text-lg">Guest Matchmaking</p>
        
        {isGuestWaiting ? (
            <div className="w-full text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-yellow mx-auto mb-4"></div>
                <p className="text-xl font-display text-yellow mb-2">Searching for another guest...</p>
                <p className="text-3xl font-mono font-bold mb-6">{countdown}</p>
                <p className="text-sm text-gray-400 mb-6">If no opponent is found, you will be matched against an AI.</p>
                <button onClick={handleCancelGuestMatchmaking} className="w-full bg-pink/80 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-pink transition-colors">
                    Cancel
                </button>
            </div>
        ) : (
            <div className="w-full text-center">
                <div className="bg-brand-dark/50 rounded-lg p-4 text-center mb-8 border border-gray-700/50">
                    <p className="text-gray-400">Wager Amount (Fixed for Guests)</p>
                    <p className="text-2xl font-mono font-bold text-yellow-light">1.00 SOL</p>
                </div>
                <button onClick={handleGuestFindMatch} className={`w-full ${colors.bg} text-brand-dark font-bold py-4 px-6 rounded-lg text-xl ${colors.hoverBg} transition-transform transform hover:scale-105 shadow-lg ${colors.shadow}`}>
                    Find Match
                </button>
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                    <button onClick={onCancel} className="w-full bg-brand-dark/50 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-dark/80 border border-gray-700 hover:border-gray-500 transition-colors">Back to Lobby</button>
                    <button onClick={onShowHowToPlay} className="w-full bg-brand-dark/50 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-dark/80 border border-gray-700 hover:border-gray-500 transition-colors">How to Play?</button>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-glassmorphism p-6 rounded-2xl border ${colors.border}/50 shadow-2xl ${colors.shadow} animate-fadeIn w-full max-w-4xl backdrop-blur-sm`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-4xl font-extrabold font-display ${colors.text}`}>{gameTitle} Lobby</h2>
        <div>
            <button onClick={onShowHowToPlay} className="bg-brand-dark/50 text-white font-bold py-2 px-4 rounded-lg text-base hover:bg-brand-dark/80 border border-gray-700 hover:border-gray-500 transition-colors mr-2">How to Play?</button>
            <button onClick={onCancel} className="bg-brand-dark/50 text-white font-bold py-2 px-4 rounded-lg text-base hover:bg-brand-dark/80 border border-gray-700 hover:border-gray-500 transition-colors">Back</button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Match Section */}
        <div className="bg-brand-dark/30 p-6 rounded-xl border border-gray-700/50">
          <h3 className="text-2xl font-bold font-display text-white mb-4">Create a New Match</h3>
          <div className="flex flex-col gap-4">
            <label htmlFor="wager-input" className="text-gray-300">Wager Amount (SOL)</label>
            <input
              id="wager-input"
              type="number"
              step="0.01"
              min="0.05"
              value={betAmount}
              onChange={(e) => { setBetAmount(e.target.value); setError(''); }}
              placeholder="0.05"
              className="w-full bg-brand-dark/70 text-white font-mono py-3 px-4 rounded-lg text-lg border-2 border-gray-600 focus:border-blue focus:ring-blue focus:outline-none transition-colors"
            />
            <div className="bg-brand-dark/50 rounded-lg p-3 text-sm">
                <div className="flex justify-between items-center"><span className="text-gray-400">Entry Fee (1.5%):</span> <span className="font-mono">{entryFee.toFixed(4)} SOL</span></div>
                <div className="flex justify-between items-center font-bold mt-1"><span className="text-white">Total Cost:</span> <span className="font-mono">{totalCost.toFixed(4)} SOL</span></div>
            </div>
            {error && <p className="text-red-400 text-center text-sm">{error}</p>}
            <button onClick={handleCreateMatch} disabled={isLoading} className={`w-full ${colors.bg} text-brand-dark font-bold py-3 px-6 rounded-lg text-xl ${colors.hoverBg} transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-wait`}>
              {isLoading ? 'Creating...' : 'Create Match'}
            </button>
          </div>
        </div>

        {/* Open Matches Section */}
        <div className="bg-brand-dark/30 p-6 rounded-xl border border-gray-700/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold font-display text-white">Open Matches</h3>
              <button onClick={fetchOpenGames} className="text-sm text-blue-light hover:underline">Refresh</button>
            </div>
            <div className="h-64 overflow-y-auto custom-scrollbar pr-2">
                {openGames.length > 0 ? (
                    <table className="w-full text-left">
                        <thead><tr className="text-sm text-gray-400"><th className="py-2">Player</th><th className="py-2 text-right">Wager (SOL)</th><th className="py-2 text-right"></th></tr></thead>
                        <tbody>
                        {openGames.map(game => (
                            <tr key={game.publicKey.toBase58()} className="border-t border-gray-700/50">
                                <td className="py-3 text-white">{getNicknameForPubkey(game.account.players[0])}</td>
                                <td className="py-3 text-yellow-light font-mono text-right">{game.account.wagerAmount.toFixed(4)}</td>
                                <td className="py-3 text-right">
                                    <button onClick={() => handleJoinMatch(game)} disabled={!!isJoining} className={`px-4 py-1 rounded-md text-sm font-bold ${colors.bg} text-brand-dark ${colors.hoverBg} disabled:bg-gray-500`}>
                                        {isJoining === game.publicKey.toBase58() ? 'Joining...' : 'Join'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No open matches found.</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MatchmakingLobby;