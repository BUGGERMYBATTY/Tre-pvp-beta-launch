import React, { useState, useEffect } from 'react';
import MatchmakingLobby from '../components/MatchmakingLobby.tsx';
import ViperPitGameScreen from '../components/ViperPitGameScreen.tsx';
import WinnerScreen from '../components/WinnerScreen.tsx';
import HowToPlayModal from '../components/HowToPlayModal.tsx';
import { Screen, GameType, PublicKey } from '../types.ts';

const { Keypair } = (window as any).solanaWeb3;

interface ViperPitProps {
  onExit: () => void;
  provider: any;
  connection: any;
  balance: number;
  onRefreshBalance: () => void;
  onSetBalance: (newBalance: number) => void;
  isGuest: boolean;
  nickname: string;
  opponentNickname: string;
}

const ViperPit: React.FC<ViperPitProps> = ({ onExit, provider, connection, balance, onRefreshBalance, onSetBalance, isGuest, nickname, opponentNickname }) => {
  const [screen, setScreen] = useState<Screen>(Screen.Matchmaking);
  const [betAmount, setBetAmount] = useState(0.1);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [forfeited, setForfeited] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [gamePubkey, setGamePubkey] = useState<PublicKey | null>(null);
  const [message, setMessage] = useState('');

  // This component doesn't use the waiting/matchmaking flow yet as it's disabled,
  // but the handlers are here for future implementation.
  const handleMatchCreated = (newGamePubkey: PublicKey | null, amount: number) => {
    setBetAmount(amount);
    if (isGuest) {
        onSetBalance(balance - (amount + amount * 0.015));
        setGamePubkey(Keypair.generate().publicKey);
        setScreen(Screen.Game);
    } else {
        setMessage('This feature is coming soon!');
        setTimeout(() => setScreen(Screen.Matchmaking), 2000);
    }
  };

  const handleMatchJoined = (joinedGamePubkey: PublicKey, amount: number) => {
    setBetAmount(amount);
    setGamePubkey(joinedGamePubkey);
    setMessage('This feature is coming soon!');
    setTimeout(() => setScreen(Screen.Matchmaking), 2000);
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
    handleGameOver(2);
    setForfeited(true);
  };

  const handlePlayAgain = () => {
    setScreen(Screen.Matchmaking);
    setWinnerId(null);
    setForfeited(false);
    setGamePubkey(null);
  };
  
  const renderContent = () => {
    switch (screen) {
      case Screen.Matchmaking:
        return (
          <MatchmakingLobby
            onMatchCreated={handleMatchCreated}
            onMatchJoined={handleMatchJoined}
            onCancel={onExit}
            onShowHowToPlay={() => setShowHowToPlay(true)}
            gameTitle="Cosmic Dodge"
            gameColor="pink"
            gameType={GameType.ViperPit}
            balance={balance}
            isGuest={isGuest}
            provider={provider}
            connection={connection}
            nickname={nickname}
          />
        );
      case Screen.Waiting:
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-pink mx-auto mb-4"></div>
            <p className={`text-xl font-display text-pink`}>{message}</p>
          </div>
        );
      case Screen.Game:
        return (
          <ViperPitGameScreen
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
       {screen !== Screen.Matchmaking && (
        <div className="absolute top-4 left-4">
          <button onClick={onExit} className="text-gray-300 hover:text-white transition-colors">&larr; Back to Lobby</button>
        </div>
      )}

      {renderContent()}

      {showHowToPlay && (
        <HowToPlayModal title="How to Play Cosmic Dodge" onClose={() => setShowHowToPlay(false)} borderColorClass="border-pink">
            <p>Cosmic Dodge is a bullet-hell survival duel. The last pilot standing wins.</p>
            <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Use 'W', 'A', 'S', 'D' keys to pilot your ship and dodge incoming hazards.</li>
                <li>You and your opponent face the exact same pattern of asteroids and lasers.</li>
                <li>The first pilot to be destroyed loses the round.</li>
                <li>Win 3 rounds to win the match and claim the prize!</li>
                <li>The waves of hazards get progressively harder. Good luck, pilot.</li>
            </ul>
        </HowToPlayModal>
      )}
    </div>
  );
};

export default ViperPit;