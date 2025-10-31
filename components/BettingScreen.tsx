import React, { useState } from 'react';

interface BettingScreenProps {
  onFindOpponent: (betAmount: number) => void;
  onCancel: () => void;
  onShowHowToPlay: () => void;
  gameTitle: string;
  gameColor: 'yellow' | 'blue' | 'pink' | 'green';
  balance: number;
  isGuest: boolean;
}

const BettingScreen: React.FC<BettingScreenProps> = (props) => {
    const { onFindOpponent, onCancel, onShowHowToPlay, gameTitle, gameColor, balance, isGuest } = props;
    const [betAmount, setBetAmount] = useState('0.1');
    const [error, setError] = useState('');

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

    const handleFindMatch = () => {
        if (parsedBetAmount < 0.05) {
            setError('Minimum wager is 0.05 SOL.');
            return;
        }
        if (balance < totalCost && !isGuest) {
            setError('Insufficient balance for this wager.');
            return;
        }
        setError('');
        onFindOpponent(parsedBetAmount);
    };

    if (isGuest) {
        return (
            <div className={`flex flex-col items-center justify-center bg-glassmorphism p-8 rounded-2xl border ${colors.border}/50 shadow-2xl ${colors.shadow} animate-fadeIn w-full max-w-lg backdrop-blur-sm`}>
                <h2 className={`text-5xl font-extrabold font-display ${colors.text} mb-2`}>{gameTitle}</h2>
                <p className="text-gray-300 mb-8 text-lg">Guest Mode</p>
                <div className="bg-yellow-dark/20 border border-yellow-dark text-yellow-light p-3 rounded-lg text-center mb-8 text-sm">
                    You are playing against an AI. All currency is for demonstration only.
                </div>
                <button onClick={() => onFindOpponent(1)} className={`w-full ${colors.bg} text-brand-dark font-bold py-4 px-6 rounded-lg text-xl ${colors.hoverBg} transition-transform transform hover:scale-105 shadow-lg ${colors.shadow}`}>
                    Play vs AI (1 SOL)
                </button>
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                    <button onClick={onCancel} className="w-full bg-brand-dark/50 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-dark/80 border border-gray-700 hover:border-gray-500 transition-colors">Back to Lobby</button>
                    <button onClick={onShowHowToPlay} className="w-full bg-brand-dark/50 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-dark/80 border border-gray-700 hover:border-gray-500 transition-colors">How to Play?</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center bg-glassmorphism p-10 rounded-2xl border ${colors.border}/50 shadow-2xl ${colors.shadow} animate-fadeIn w-full max-w-lg text-center backdrop-blur-sm`}>
            <h2 className={`text-5xl font-extrabold font-display ${colors.text} mb-2`}>{gameTitle}</h2>
            <p className="text-gray-300 mb-8 text-lg">Set your wager and find an opponent.</p>
            <div className="w-full flex flex-col gap-4 mb-6">
                <label htmlFor="wager-input" className="text-gray-300 text-left">Wager Amount (SOL)</label>
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
                <div className="bg-brand-dark/50 rounded-lg p-3 text-sm text-left">
                    <div className="flex justify-between items-center"><span className="text-gray-400">Entry Fee (1.5%):</span> <span className="font-mono">{entryFee.toFixed(4)} SOL</span></div>
                    <div className="flex justify-between items-center font-bold mt-1"><span className="text-white">Total Cost:</span> <span className="font-mono">{totalCost.toFixed(4)} SOL</span></div>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
            <button
                onClick={handleFindMatch}
                className={`w-full ${colors.bg} text-brand-dark font-bold py-4 px-6 rounded-lg text-xl ${colors.hoverBg} transition-transform transform hover:scale-105 shadow-lg ${colors.shadow}`}
            >
                Find Match
            </button>
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
                <button onClick={onCancel} className="w-full bg-brand-dark/50 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-dark/80 border border-gray-700 hover:border-gray-500 transition-colors">Back to Lobby</button>
                <button onClick={onShowHowToPlay} className="w-full bg-brand-dark/50 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-dark/80 border border-gray-700 hover:border-gray-500 transition-colors">How to Play?</button>
            </div>
        </div>
    );
};

export default BettingScreen;
