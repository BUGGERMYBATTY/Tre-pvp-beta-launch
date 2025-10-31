import React from 'react';

interface WinnerScreenProps {
  winnerId: number | null;
  betAmount: number;
  onPlayAgain: () => void;
  onExitGame: () => void;
  forfeited?: boolean;
}

const ResultIcon = ({ result }: { result: 'win' | 'lose' | 'draw' | 'forfeit' }) => {
  const iconMap = {
    win: (
      <svg className="w-24 h-24 text-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 12.5 2.5 2.5 5-5" />
      </svg>
    ),
    lose: (
      <svg className="w-24 h-24 text-pink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9.17157 14.8284L14.8284 9.17157" />
        <path d="M14.8284 14.8284L9.17157 9.17157" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    draw: (
      <svg className="w-24 h-24 text-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 12H20" />
        <path d="M12 4V20" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    forfeit: (
      <svg className="w-24 h-24 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 15C4 15 5 14 8 14C11 14 13 16 16 16C19 16 20 15 20 15V3C20 3 19 4 16 4C13 4 11 2 8 2C5 2 4 3 4 3V15Z" />
        <path d="M4 22V15" />
      </svg>
    ),
  };
  return <div className="animate-fadeIn scale-125">{iconMap[result]}</div>;
};

const WinnerScreen: React.FC<WinnerScreenProps> = ({ winnerId, betAmount, onPlayAgain, onExitGame, forfeited }) => {
  const isPlayerWinner = winnerId === 1;
  const isDraw = winnerId === null;
  const totalPot = betAmount * 2;

  let title: string;
  let subtext: string;
  let resultType: 'win' | 'lose' | 'draw' | 'forfeit';
  let titleColor: string;
  let borderColor: string;

  if (forfeited) {
    title = 'Match Forfeited';
    subtext = `You lost your wager of ${betAmount.toFixed(4)} SOL and the entry fee.`;
    resultType = 'forfeit';
    titleColor = 'text-gray-300';
    borderColor = 'border-gray-600/50';
  } else if (isDraw) {
    title = "It's a Draw!";
    subtext = `Your wager of ${betAmount.toFixed(4)} SOL has been returned. The entry fee is not refunded.`;
    resultType = 'draw';
    titleColor = 'text-blue-light';
    borderColor = 'border-blue/50';
  } else if (isPlayerWinner) {
    title = 'Victory!';
    subtext = `You won the full pot of ${totalPot.toFixed(4)} SOL!`;
    resultType = 'win';
    titleColor = 'text-yellow';
    borderColor = 'border-yellow/50';
  } else {
    title = 'Defeat';
    subtext = `You lost your wager of ${betAmount.toFixed(4)} SOL and the entry fee.`;
    resultType = 'lose';
    titleColor = 'text-pink-light';
    borderColor = 'border-pink/50';
  }
  
  const primaryButtonClass = "w-full bg-blue text-brand-dark font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-light transition-transform transform hover:scale-105 shadow-lg shadow-blue/20";
  const secondaryButtonClass = "w-full bg-brand-dark/50 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-brand-dark/80 border border-gray-700 hover:border-gray-500 transition-colors";

  return (
    <div className={`flex flex-col items-center justify-center bg-glassmorphism p-10 rounded-2xl border ${borderColor} shadow-2xl animate-fadeIn w-full max-w-lg text-center backdrop-blur-sm`}>
      <div className="mb-6">
        <ResultIcon result={resultType} />
      </div>
      <h2 className={`text-6xl font-extrabold font-display ${titleColor} mb-4`}>{title}</h2>
      <p className="text-xl text-gray-200 mb-10">{subtext}</p>
      <div className="w-full flex flex-col sm:flex-row flex-wrap justify-center gap-4">
        <button
          onClick={onPlayAgain}
          className={primaryButtonClass}
        >
          Play Again
        </button>
        <button
          onClick={onExitGame}
          className={secondaryButtonClass}
        >
          Back to Lobby
        </button>
      </div>
    </div>
  );
};

export default WinnerScreen;