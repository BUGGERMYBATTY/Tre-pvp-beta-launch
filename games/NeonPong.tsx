import React, { useState, useEffect } from 'react';
import BettingScreen from '../components/BettingScreen.tsx';
import PongGameScreen from '../components/PongGameScreen.tsx';
import WinnerScreen from '../components/WinnerScreen.tsx';
import HowToPlayModal from '../components/HowToPlayModal.tsx';
import { Screen, GameType, PublicKey } from '../types.ts';

const { Keypair } = (window as any).solanaWeb3;

interface NeonPongProps {
  onExit: () => void;
  provider: any;
  connection: any;
  balance: number;
  onRefreshBalance: () => void;
  isGuest: boolean;
  onSetBalance: (newBalance: number) => void;
  nickname: string;
  opponentNickname: string;
}

const NeonPong: React.FC<NeonPongProps> = ({ onExit, provider, connection, balance, onRefreshBalance, isGuest, onSetBalance, nickname, opponentNickname }) => {
  const [screen, setScreen] = useState<Screen>(Screen.Betting);
  const [betAmount, setBetAmount] = useState(0.1);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [forfeited, setForfeited] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [gamePubkey, setGamePubkey] = useState<PublicKey | null>(null);
  const [message, setMessage] = useState('');

  // This effect is now disabled as guests don't need real-time on-chain updates.
  // useEffect(() => { ... });


  const handleFindOpponent = async (amount: number) => {
    setBetAmount(amount);
    setScreen(Screen.Waiting);
    
    if (isGuest) {
      const totalCost = amount + (amount * 0.015);
      if (balance < totalCost) {
          alert("You don't have enough pretend SOL!");
          setScreen(Screen.Betting);
          return;
      }
      onSetBalance(balance - totalCost);
      setMessage('Searching for another guest...');
      // Simulate finding an opponent
      setTimeout(() => {
        setMessage('Opponent found! Starting match...');
        setGamePubkey(Keypair.generate().publicKey); // Dummy pubkey for guest game
        setTimeout(() => setScreen(Screen.Game), 1500);
      }, 3000);
      return;
    }

    setMessage('This feature is coming soon!');
    setTimeout(() => setScreen(Screen.Betting), 2000);
  };

  const handleGameOver = async (winner: number | null) => {
    if (isGuest) {
        if (winner === 1) { // Player wins
            onSetBalance(balance + (betAmount * 2));
        } else if (winner === null) { // Draw
            onSetBalance(balance + betAmount);
        }
    }
    setWinnerId(winner);
    setScreen(Screen.Winner);
  };

  const handleForfeit = () => {
    handleGameOver(2); // Opponent wins
    setForfeited(true);
  };

  const handlePlayAgain = () => {
    setScreen(Screen.Betting);
    setWinnerId(null);
    setForfeited(false);
    setGamePubkey(null);
  };
  
  const renderContent = () => {
    switch (screen) {
      case Screen.Betting:
        return (
          <BettingScreen
            onFindOpponent={handleFindOpponent}
            onCancel={onExit}
            gameTitle="Neon Pong"
            gameColor="blue"
            balance={balance}
            onShowHowToPlay={() => setShowHowToPlay(true)}
            isGuest={isGuest}
          />
        );
      case Screen.Waiting:
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue mx-auto mb-4"></div>
            <p className={`text-xl font-display text-blue`}>{message}</p>
          </div>
        );
      case Screen.Game:
        return (
          <PongGameScreen
            onGameOver={handleGameOver}
            betAmount={betAmount}
            onForfeit={handleForfeit}
            nickname={nickname}
            opponentNickname={opponentNickname}
          />
        );
      case Screen.Winner:
        return (
          <WinnerScreen
            winnerId={winnerId}
            betAmount={betAmount}
            onPlayAgain={handlePlayAgain}
            onExitGame={onExit}
            forfeited={forfeited}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 relative">
       {screen !== Screen.Betting && (
        <div className="absolute top-4 left-4">
          <button onClick={onExit} className="text-gray-300 hover:text-white transition-colors">&larr; Back to Lobby</button>
        </div>
      )}

      {renderContent()}

      {showHowToPlay && (
        <HowToPlayModal title="How to Play Neon Pong" onClose={() => setShowHowToPlay(false)} borderColorClass="border-blue">
            <p>Neon Pong is a high-stakes twist on the arcade classic.</p>
            <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Use the 'W' and 'S' keys to move your paddle up and down.</li>
                <li>The first player to score 3 points wins the round.</li>
                <li>The first player to win 2 rounds wins the match and the entire pot!</li>
                <li>The ball and paddles speed up with every few returns, so stay sharp!</li>
            </ul>
        </HowToPlayModal>
      )}
    </div>
  );
};

export default NeonPong;