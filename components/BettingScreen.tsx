import React, { useState } from 'react';

interface BettingScreenProps {
  onFindOpponent: (betAmount: number) => void;
  onCancel: () => void;
  gameTitle: string;
  // FIX: Added 'green' to support the HexCapture game color scheme.
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
    blue: { border: 'border-blue', text: 'text-blue', ring: 'ring-blue', bg: 'bg-blue', hoverBg: 'hover:bg-blue-light' },
    yellow: { border: 'border-yellow', text: 'text-yellow', ring: 'ring-yellow', bg: 'bg-yellow', hoverBg: 'hover:bg-yellow-light' },
    pink: { border: 'border-pink', text: 'text-pink', ring: 'ring-pink', bg: 'bg-pink', hoverBg: 'hover:bg-pink-light' },
    // FIX: Added 'green' color classes for the HexCapture game.
    green: { border: 'border-green', text: 'text-green', ring: 'ring-green', bg: 'bg-green', hoverBg: 'hover:bg-green-light' },
  };
  const colors = colorClasses[gameColor];

  const formatAmount = (amount: number) => {
    if (amount < 1) {
      return amount.toFixed(3).replace(/0+$/, '');
    }
    return amount.toFixed(2);
  };

  return (
    <div className="flex flex-col items-center justify-center bg-brand-gray p-8 rounded-xl shadow-2xl animate-fadeIn w-full max-w-lg">
      <h2 className={`text-4xl font-extrabold font-display ${colors.text} mb-2`}>{gameTitle}</h2>
      <p className="text-gray-200 mb-6">Select your wager amount (SOL).</p>
      
      {isGuest && (
        <div className="bg-yellow-dark/20 border border-yellow-dark text-yellow-light p-3 rounded-lg text-center mb-6 text-sm">
          You are in <span className="font-bold">Guest Mode</span>. All currency is for demonstration purposes only, not real Solana.
        </div>
      )}

      <div className="flex justify-center gap-3 mb-6 w-full">
        {WAGER_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => setSelectedBet(amount)}
            className={`py-3 px-12 rounded-lg font-bold text-lg border-2 transition-all duration-200
              ${selectedBet === amount
                ? `${colors.border} ${colors.text} bg-brand-dark ring-2 ${colors.ring}`
                : 'border-gray-700 text-gray-200 hover:border-gray-500 hover:text-white'
              }`}
          >
            {formatAmount(amount)}
          </button>
        ))}
      </div>
      
      <div className="bg-brand-dark rounded-lg p-4 w-full mb-6 text-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300">Wager Amount:</span>
          <span className="font-mono text-white">{selectedBet.toFixed(4)} SOL</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300">Entry Fee (1.5%):</span>
          <span className="font-mono text-white">{entryFee.toFixed(4)} SOL</span>
        </div>
        <div className="h-px bg-gray-700 my-2"></div>
        <div className="flex justify-between items-center font-bold">
          <span className="text-white">Total Cost:</span>
          <span className={`font-mono ${hasSufficientFunds ? 'text-white' : 'text-red-500'}`}>{totalCost.toFixed(4)} SOL</span>
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-4">
        <div className="grid grid-cols-2 gap-4 w-full">
           <button
              onClick={onCancel}
              className="w-full bg-gray-700 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-gray-600 transition-colors"
            >
              Back to Lobby
          </button>
          <button
              onClick={() => onFindOpponent(selectedBet)}
              disabled={!hasSufficientFunds}
              className={`w-full ${colors.bg} text-brand-dark font-bold py-3 px-6 rounded-lg text-lg ${colors.hoverBg} transition-transform transform hover:scale-105 shadow-md disabled:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {hasSufficientFunds ? 'Find Opponent' : 'Insufficient SOL'}
          </button>
        </div>
        <button
          onClick={onShowHowToPlay}
          className="text-gray-300 hover:text-white transition-colors mt-2"
        >
          How to Play?
        </button>
      </div>
    </div>
  );
};

export default BettingScreen;