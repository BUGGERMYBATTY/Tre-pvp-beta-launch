import React, { useState } from 'react';

interface BettingScreenProps {
  onFindOpponent: (betAmount: number) => void;
  onCancel: () => void;
  gameTitle: string;
  gameColor: 'yellow' | 'blue' | 'pink' | 'green';
  balance: number;
  onShowHowToPlay: () => void;
  isGuest: boolean;
}

const WAGER_AMOUNTS = [1];

const BettingScreen: React.FC<BettingScreenProps> = ({ onFindOpponent, onCancel, gameTitle, gameColor, balance, onShowHowToPlay, isGuest }) => {
  const [selectedBet, setSelectedBet] = useState(WAGER_AMOUNTS[0]);

  const entryFee = selectedBet * 0.015;
  const totalCost = selectedBet + entryFee;
  const hasSufficientFunds = balance >= totalCost;

  const colorClasses = {
    blue: { border: 'border-blue', text: 'text-blue', ring: 'ring-blue-dark', bg: 'bg-blue', hoverBg: 'hover:bg-blue-light', shadow: 'shadow-blue/20' },
    yellow: { border: 'border-yellow', text: 'text-yellow', ring: 'ring-yellow-dark', bg: 'bg-yellow', hoverBg: 'hover:bg-yellow-light', shadow: 'shadow-yellow/20' },
    pink: { border: 'border-pink', text: 'text-pink', ring: 'ring-pink-dark', bg: 'bg-pink', hoverBg: 'hover:bg-pink-light', shadow: 'shadow-pink/20' },
    green: { border: 'border-green', text: 'text-green', ring: 'ring-green-dark', bg: 'bg-green', hoverBg: 'hover:bg-green-light', shadow: 'shadow-green/20' },
  };
  const colors = colorClasses[gameColor];

  const formatAmount = (amount: number) => {
    if (amount < 1) {
      return amount.toFixed(3).replace(/0+$/, '');
    }
    return amount.toFixed(2);
  };

  return (
    <div className={`flex flex-col items-center justify-center bg-glassmorphism p-8 rounded-2xl border ${colors.border}/50 shadow-2xl ${colors.shadow} animate-fadeIn w-full max-w-lg backdrop-blur-sm`}>
      <h2 className={`text-5xl font-extrabold font-display ${colors.text} mb-2`} style={{ textShadow: `0 0 10px var(--tw-shadow-color)` }}>{gameTitle}</h2>
      <p className="text-gray-300 mb-8 text-lg">Select your wager amount (SOL).</p>
      
      {isGuest && (
        <div className="bg-yellow-dark/20 border border-yellow-dark text-yellow-light p-3 rounded-lg text-center mb-8 text-sm">
          You are in <span className="font-bold">Guest Mode</span>. All currency is for demonstration purposes only, not real Solana.
        </div>
      )}

      <div className="flex justify-center gap-4 mb-8 w-full">
        {WAGER_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => setSelectedBet(amount)}
            className={`py-4 px-12 rounded-xl font-bold text-xl border-2 transition-all duration-200 transform hover:scale-105
              ${selectedBet === amount
                ? `${colors.border} ${colors.text} bg-brand-dark/70 ring-2 ${colors.ring}`
                : 'border-gray-700 text-gray-200 bg-brand-dark/30 hover:border-gray-500 hover:text-white'
              }`}
          >
            {formatAmount(amount)}
          </button>
        ))}
      </div>
      
      <div className="bg-brand-dark/50 rounded-lg p-4 w-full mb-8 text-base">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300">Wager Amount:</span>
          <span className="font-mono text-white">{selectedBet.toFixed(4)} SOL</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300">Entry Fee (1.5%):</span>
          <span className="font-mono text-white">{entryFee.toFixed(4)} SOL</span>
        </div>
        <div className="h-px bg-gray-700 my-2"></div>
        <div className="flex justify-between items-center font-bold text-lg">
          <span className="text-white">Total Cost:</span>
          <span className={`font-mono ${hasSufficientFunds ? 'text-white' : 'text-red-500'}`}>{totalCost.toFixed(4)} SOL</span>
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-4">
        <button
            onClick={() => onFindOpponent(selectedBet)}
            disabled={!hasSufficientFunds}
            className={`w-full ${colors.bg} text-brand-dark font-bold py-4 px-6 rounded-lg text-xl ${colors.hoverBg} transition-transform transform hover:scale-105 shadow-lg ${colors.shadow} disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none animate-pulseGlow`}
            // FIX: Cast style object to allow CSS custom properties.
            style={{ '--glow-color': 'rgba(0, 191, 255, 0.4)' } as React.CSSProperties}
        >
          {hasSufficientFunds ? 'Find Opponent' : 'Insufficient SOL'}
        </button>
        <div className="grid grid-cols-2 gap-4 w-full">
           <button
              onClick={onCancel}
              className="w-full bg-brand-dark/50 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-dark/80 border border-gray-700 hover:border-gray-500 transition-colors"
            >
              Back to Lobby
          </button>
          <button
            onClick={onShowHowToPlay}
            className="w-full bg-brand-dark/50 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-dark/80 border border-gray-700 hover:border-gray-500 transition-colors"
          >
            How to Play?
          </button>
        </div>
      </div>
    </div>
  );
};

export default BettingScreen;