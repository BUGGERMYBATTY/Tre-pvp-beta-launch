import React, { useState, useMemo } from 'react';

interface LeaderboardPageProps {
  isGuest: boolean;
}

type Timeframe = '1d' | '3d' | '7d';

interface PlayerStat {
  rank: number;
  nickname: string;
  games: number;
  earnings: number;
  winrate: string;
}

const NICKNAMES = ['ZeroCool', 'AcidBurn', 'CrashOverride', 'CerealKiller', 'LordNikon', 'PhantomPhreak', 'TheGimp', 'Blade', 'Trinity', 'Neo', 'Morpheus', 'AgentSmith'];

// Generates pseudo-random, deterministic data for the leaderboard based on filters
const generateLeaderboardData = (timeframe: Timeframe): PlayerStat[] => {
    const data: PlayerStat[] = [];
    const seed = parseInt(timeframe); // Simple seed for deterministic randomness

    for (let i = 1; i <= 100; i++) {
        const prng = (seed: number) => {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };

        const keypairSeed = seed + i * 1000;
        const nickname = `${NICKNAMES[Math.floor(prng(keypairSeed) * NICKNAMES.length)]}${Math.floor(prng(keypairSeed + 1) * 900) + 100}`;
        
        const gamesPlayed = Math.floor(prng(keypairSeed + 1) * (150 / (parseInt(timeframe) || 1)) + 20);
        const earnings = parseFloat((prng(keypairSeed + 2) * (300 / (parseInt(timeframe) || 1)) + 10).toFixed(2));
        const winrate = `${Math.floor(prng(keypairSeed + 3) * 40 + 50)}%`;

        data.push({
            rank: i,
            nickname: nickname,
            games: gamesPlayed,
            earnings: earnings,
            winrate: winrate,
        });
    }

    return data.sort((a, b) => b.earnings - a.earnings).map((p, i) => ({ ...p, rank: i + 1 }));
};


const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ isGuest }) => {
    const [timeframe, setTimeframe] = useState<Timeframe>('7d');
    
    const leaderboardData = useMemo(() => generateLeaderboardData(timeframe), [timeframe]);

    const FilterButton: React.FC<{
        onClick: () => void;
        isActive: boolean;
        children: React.ReactNode;
    }> = ({ onClick, isActive, children }) => (
        <button
            onClick={onClick}
            className={`w-full px-4 py-2 rounded-full font-bold transition-all duration-300 text-base ${
                isActive ? 'bg-blue text-brand-dark shadow-md shadow-blue/20' : 'bg-transparent text-gray-300 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
    
    const getRowStyle = (rank: number) => {
        if (rank === 1) return 'border-l-4 border-yellow bg-yellow/10';
        if (rank === 2) return 'border-l-4 border-gray-400 bg-gray-400/10';
        if (rank === 3) return 'border-l-4 border-orange-500 bg-orange-500/10';
        return 'border-l-4 border-transparent';
    }

    return (
        <div className="animate-fadeIn w-full max-w-5xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-5xl sm:text-6xl font-black font-display mb-4 leading-tight">
                    Top Players
                </h1>
                <p className="max-w-3xl mx-auto text-lg text-gray-300">
                    Climb the ranks by winning matches and prove you're the MVP.
                </p>
            </div>

            <div className="relative bg-gradient-to-br from-brand-gray/80 to-brand-dark/70 border-2 border-blue/20 rounded-2xl shadow-2xl shadow-blue/10 p-4 sm:p-6">
                 {isGuest && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 rounded-2xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-light mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h3 className="font-bold text-2xl font-display text-yellow-light mb-2">Leaderboard for Wallet Players</h3>
                        <p className="text-center text-lg text-gray-200">Connect a wallet to track your stats and compete for a spot on the leaderboard.</p>
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold font-display text-center">Overall Rankings ({timeframe})</h2>
                    <div className="flex justify-center gap-2 bg-brand-dark/50 p-1 rounded-full border border-gray-700/50 mt-4 sm:mt-0">
                        <FilterButton onClick={() => setTimeframe('1d')} isActive={timeframe === '1d'}>1 Day</FilterButton>
                        <FilterButton onClick={() => setTimeframe('3d')} isActive={timeframe === '3d'}>3 Days</FilterButton>
                        <FilterButton onClick={() => setTimeframe('7d')} isActive={timeframe === '7d'}>7 Days</FilterButton>
                    </div>
                </div>

                <div className="h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    <table className="w-full text-left border-separate" style={{ borderSpacing: '0 0.5rem' }}>
                        <thead className="text-sm text-blue-light/70 uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-display w-24 text-center">Rank</th>
                                <th className="p-4 font-display">Player</th>
                                <th className="p-4 font-display text-right">Games</th>
                                <th className="p-4 font-display text-right">Win Rate</th>
                                <th className="p-4 font-display text-right">Earnings (SOL)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboardData.slice(0, 100).map((player) => (
                            <tr key={player.rank} className={`transition-colors duration-200 hover:bg-brand-gray/50 ${getRowStyle(player.rank)}`}>
                                <td className="p-4 text-xl font-bold text-center rounded-l-lg">
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="w-6 text-center text-2xl">
                                            {player.rank === 1 && '🏆'}
                                            {player.rank === 2 && '🥈'}
                                            {player.rank === 3 && '🥉'}
                                        </span>
                                        <span className="text-white">{player.rank}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-lg font-bold text-white">{player.nickname}</td>
                                <td className="p-4 text-lg font-mono text-right text-gray-300">{player.games}</td>
                                <td className="p-4 text-lg font-mono text-right text-gray-300">{player.winrate}</td>
                                <td className="p-4 text-xl font-mono text-right text-yellow-light font-bold rounded-r-lg">{player.earnings.toFixed(2)}</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;