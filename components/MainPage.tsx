import React from 'react';
import { GameId } from '../types';

interface GameCardProps {
  gameId: GameId;
  title: string;
  description: string;
  color: 'yellow' | 'blue' | 'pink';
  onSelect: (gameId: GameId) => void;
  bgImageUrl: string;
  disabled?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ gameId, title, description, color, onSelect, bgImageUrl, disabled = false }) => {
  const colorClasses = {
    blue: { border: 'border-blue', text: 'text-blue-light', shadow: 'shadow-blue/30', bg: 'bg-blue', hoverBg: 'hover:bg-blue-light' },
    yellow: { border: 'border-yellow', text: 'text-yellow-light', shadow: 'shadow-yellow/30', bg: 'bg-yellow', hoverBg: 'hover:bg-yellow-light' },
    pink: { border: 'border-pink', text: 'text-pink-light', shadow: 'shadow-pink/30', bg: 'bg-pink', hoverBg: 'hover:bg-pink-light' },
  };
  const colors = colorClasses[color];

  return (
    <div className={`relative bg-brand-gray rounded-xl p-6 flex flex-col text-center transition-transform duration-300 overflow-hidden group ${disabled ? 'cursor-not-allowed' : 'transform hover:-translate-y-2'}`}>
      <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-300 group-hover:scale-110" style={{ backgroundImage: `url(${bgImageUrl})`, opacity: '0.2' }}></div>
      {disabled && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10"></div>}
      
      <div className="relative z-20 flex flex-col flex-grow">
          <h3 className={`text-3xl font-bold font-display mb-3 ${disabled ? 'text-gray-500' : colors.text}`}>{title}</h3>
          <p className="text-gray-300 mb-6 flex-grow">{description}</p>
          <button 
            onClick={() => !disabled && onSelect(gameId)}
            disabled={disabled}
            className={`w-full font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 transform shadow-md ${
                disabled ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : `${colors.bg} text-brand-dark ${colors.hoverBg} group-hover:scale-105 group-hover:shadow-lg ${colors.shadow}`
            }`}
          >
            {disabled ? 'Coming Soon' : 'Select Game'}
          </button>
      </div>
    </div>
  );
};


const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: React.ReactNode }) => (
    <div className="bg-glassmorphism rounded-xl p-6 text-center border border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:border-blue/50 hover:bg-brand-gray/80">
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
        <div className="text-center mb-24">
            <h2 className="text-4xl sm:text-6xl font-black font-display mb-6 pb-4 leading-tight">
                The Decentralized Arena for
                <span className="bg-gradient-to-r from-blue-light to-violet-light bg-clip-text text-transparent block mt-2">Competitive Gaming</span>
            </h2>
            <p className="max-w-3xl mx-auto text-lg text-gray-300 mb-12">
                This is where skill meets stakes. Challenge real players in high-energy games. Outplay your opponent to win the pot and climb the leaderboards.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                <FeatureCard 
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    }
                    title="Instant Payouts"
                    description="Victories are paid out instantly and directly to your wallet by the on-chain smart contract. No waiting, no withdrawals."
                />
                <FeatureCard 
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    title="Low Fees"
                    description="Built on Solana for lightning-fast transactions and incredibly low gas fees, so you keep more of what you win."
                />
                <FeatureCard 
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    }
                    title="Provably Fair"
                    description="All wagers and payouts are handled by an on-chain smart contract, ensuring a transparent and provably fair outcome for every match."
                />
            </div>
        </div>
      
      <div className="bg-yellow-dark/20 border border-yellow-dark text-yellow-light p-4 rounded-xl text-center mb-16 max-w-4xl mx-auto">
          <h3 className="font-bold text-lg mb-1">Important: Guest Mode</h3>
          <p>When you 'Play as Guest', all currency is for demonstration purposes only. Connect a wallet for real stakes.</p>
      </div>
        
      <h2 className="text-5xl font-bold font-display text-center mb-12">The Arena</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <GameCard 
          gameId="solana-gold-rush"
          title="Gold Rush"
          description="A 5-round game of wits and bluffing. Outsmart your opponent by playing the right data chip at the right time to win the pot."
          color="yellow"
          onSelect={onSelectGame}
          bgImageUrl="https://media.istockphoto.com/id/1323545281/vector/gold-glitter-texture-on-black-background-vector.jpg?s=612x612&w=0&k=20&c=Zz_S2_x3Gws2BFw0LVJ1Fw1-fP2SAdgke2R0j1YFq7I="
        />
        <GameCard 
          gameId="neon-pong"
          title="Neon Pong"
          description="The classic arcade game with a high-stakes twist. First to win two rounds of fast-paced paddle action takes all."
          color="blue"
          onSelect={onSelectGame}
          bgImageUrl="https://img.freepik.com/premium-photo/abstract-background-with-moving-lines-generative-ai_841229-3788.jpg"
          disabled
        />
        <GameCard 
          gameId="viper-pit"
          title="Cosmic Dodge"
          description="A bullet-hell survival duel where you and your opponent face the exact same wave of hazards. Last pilot standing wins."
          color="pink"
          onSelect={onSelectGame}
          bgImageUrl="https://t4.ftcdn.net/jpg/05/56/94/31/360_F_556943179_eK5Q3k0vS70wzV4rrdje3nQ9s1R12iUD.jpg"
          disabled
        />
      </div>
    </div>
  );
};

export default MainPage;