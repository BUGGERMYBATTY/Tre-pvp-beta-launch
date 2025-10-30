import React from 'react';
import { GameId } from '../types';

interface GameCardProps {
  gameId: GameId;
  title: string;
  description: string;
  color: 'yellow' | 'blue' | 'pink';
  onSelect: (gameId: GameId) => void;
  disabled?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ gameId, title, description, color, onSelect, disabled = false }) => {
  const colorClasses = {
    blue: { border: 'border-blue', text: 'text-blue', shadow: 'shadow-blue/20', bg: 'bg-blue', hoverBg: 'hover:bg-blue-light' },
    yellow: { border: 'border-yellow', text: 'text-yellow', shadow: 'shadow-yellow/20', bg: 'bg-yellow', hoverBg: 'hover:bg-yellow-light' },
    pink: { border: 'border-pink', text: 'text-pink', shadow: 'shadow-pink/20', bg: 'bg-pink', hoverBg: 'hover:bg-pink-light' },
  };
  const colors = colorClasses[color];

  const disabledClasses = "opacity-60 cursor-not-allowed";

  return (
    <div className={`bg-brand-gray border-2 ${disabled ? 'border-gray-700' : colors.border} rounded-xl p-6 flex flex-col items-center text-center ${!disabled ? 'transform hover:-translate-y-2' : ''} transition-transform duration-300 shadow-lg ${disabled ? 'shadow-none' : colors.shadow} ${disabled ? disabledClasses : ''}`}>
      <h3 className={`text-3xl font-bold font-display mb-3 ${disabled ? 'text-gray-500' : colors.text}`}>{title}</h3>
      <p className="text-gray-200 mb-6 flex-grow">{description}</p>
      <button 
        onClick={() => !disabled && onSelect(gameId)}
        disabled={disabled}
        className={`w-full font-bold py-3 px-6 rounded-lg text-lg transition-transform transform shadow-md ${
            disabled ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : `${colors.bg} text-brand-dark ${colors.hoverBg} hover:scale-105`
        }`}
      >
        {disabled ? 'Coming Soon' : 'Play'}
      </button>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: React.ReactNode }) => (
    <div className="bg-brand-gray/50 rounded-lg p-6 text-center">
        <div className="flex justify-center items-center mb-4">
            <div className="w-16 h-16 bg-brand-dark rounded-full flex items-center justify-center border-2 border-blue/50">
                {icon}
            </div>
        </div>
        <h3 className="text-xl font-bold font-display text-blue-light mb-2">{title}</h3>
        <p className="text-gray-300 text-sm">{description}</p>
    </div>
);


interface MainPageProps {
  onSelectGame: (gameId: GameId) => void;
}

const MainPage: React.FC<MainPageProps> = ({ onSelectGame }) => {
  return (
    <div className="animate-fadeIn w-full">
        {/* Introduction Section */}
        <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold font-display mb-16 pb-4">
                Welcome to the Future of
                <div className="bg-gradient-to-r from-blue-light to-violet-light bg-clip-text text-transparent py-2">Competitive Gaming</div>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                <FeatureCard 
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    }
                    title="Your Keys, Your Crypto"
                    description="TRUEPVP is a decentralized application. Your funds remain in your self-custody wallet until a wager is placed. We never take control of your assets."
                />
                <FeatureCard 
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    }
                    title="The Ultimate PVP Arena"
                    description="This is where skill meets stakes. Challenge real players in high-energy games. Outplay your opponent to win the pot and climb the leaderboards."
                />
                <FeatureCard 
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    }
                    title="Provably Fair & Transparent"
                    description="All wagers, matches, and payouts are handled by an on-chain smart contract on the Solana blockchain, ensuring a transparent and provably fair outcome every time."
                />
            </div>
        </div>
      
      <div className="bg-yellow-dark/20 border border-yellow-dark text-yellow-light p-4 rounded-xl text-center mb-12 max-w-4xl mx-auto">
          <h3 className="font-bold text-lg mb-1">Important Disclaimer</h3>
          <p>When you 'Play as Guest', all currency is pretend and for demonstration purposes only.</p>
      </div>
        
      <h2 className="text-4xl font-bold font-display text-center mb-10">The Arena</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <GameCard 
          gameId="solana-gold-rush"
          title="Gold Rush"
          description="A 5-round game of wits and bluffing. Outsmart your opponent by playing the right data chip at the right time to win the pot."
          color="yellow"
          onSelect={onSelectGame}
        />
        <GameCard 
          gameId="neon-pong"
          title="Neon Pong"
          description="The classic arcade game with a high-stakes twist. First to win two rounds of fast-paced paddle action takes all."
          color="blue"
          onSelect={onSelectGame}
          disabled
        />
        <GameCard 
          gameId="viper-pit"
          title="Cosmic Dodge"
          description="A bullet-hell survival duel where you and your opponent face the exact same wave of hazards. Last pilot standing wins."
          color="pink"
          onSelect={onSelectGame}
          disabled
        />
      </div>

       {/* Leaderboard Section */}
      <div className="text-center mt-24 w-full">
          <h2 className="text-4xl font-bold font-display text-center mb-10">Leaderboard</h2>
          <div className="bg-brand-gray border-2 border-gray-700 rounded-xl p-8 max-w-3xl mx-auto text-center shadow-lg">
              <h3 className="text-3xl font-bold font-display text-gray-400 mb-4">Coming Soon!</h3>
              <p className="text-gray-300">
                  Track your stats, climb the ranks, and see how you stack up against the top players in the TRUEPVP arena. The global leaderboard is under construction and will be launching soon.
              </p>
          </div>
      </div>
    </div>
  );
};

export default MainPage;