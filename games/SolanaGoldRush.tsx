import React, { useState, useEffect } from 'react';
import MatchmakingLobby from '../components/MatchmakingLobby.tsx';
import GameScreen from '../components/GameScreen.tsx';
import WinnerScreen from '../components/WinnerScreen.tsx';
import HowToPlayModal from '../components/HowToPlayModal.tsx';
import { Screen, GameType, PublicKey } from '../types.ts';
import { getGameState } from '../program-client.ts';

const { Keypair } = (window as any).solanaWeb3;

interface SolanaGoldRushProps {
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

const SolanaGoldRush: React.FC<SolanaGoldRushProps> = ({ onExit, provider, connection, balance, onRefreshBalance, isGuest, onSetBalance, nickname, opponentNickname }) => {
  const [screen, setScreen] = useState<Screen>(Screen.Matchmaking);
  const [betAmount, setBetAmount] = useState(0.1);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [gamePubkey, setGamePubkey] = useState<PublicKey | null>(null);
  const [message, setMessage] = useState('');
  const [forfeited, setForfeited] = useState(false);
  
  // WebSocket listener for when a player creates a game and is waiting for an opponent.
  useEffect(() => {
    if (!isGuest && screen === Screen.Waiting && gamePubkey && connection) {
      setMessage('Game created! Waiting for an opponent...');
      const subscriptionId = connection.onAccountChange(
        gamePubkey,
        async () => {
          try {
            const state = await getGameState(connection, gamePubkey);
            // Check if player 2 has joined (is not the default empty public key)
            if (state && state.players[1] !== new (window as any).solanaWeb3.PublicKey(0).toBase58()) {
              console.log("Opponent joined! Starting game.");
              setMessage('Opponent found! Starting match...');
              setTimeout(() => setScreen(Screen.Game), 1500);
            }
          } catch (e) { console.error("Error checking game state for opponent:", e); }
        },
        'confirmed'
      );
      return () => {
        connection.removeAccountChangeListener(subscriptionId).catch((err: any) => console.error("Failed to remove listener:", err));
      };
    }
  }, [screen, gamePubkey, connection, isGuest]);

  const handleMatchCreated = (newGamePubkey: PublicKey | null, amount: number) => {
    setBetAmount(amount);
    if (isGuest) {
      const totalCost = amount + (amount * 0.015);
      onSetBalance(balance - totalCost);
      setGamePubkey(Keypair.generate().publicKey); // Dummy pubkey for guest game
      setScreen(Screen.Game);
    } else {
      setGamePubkey(newGamePubkey);
      setScreen(Screen.Waiting);
    }
  };

  const handleMatchJoined = (joinedGamePubkey: PublicKey, amount: number) => {
    setBetAmount(amount);
    setGamePubkey(joinedGamePubkey);
    setScreen(Screen.Game);
  };

  const handleGameOver = (winner: number | null) => {
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
    setScreen(Screen.Matchmaking);
    setWinnerId(null);
    setGamePubkey(null);
    setForfeited(false);
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
            gameTitle="Gold Rush"
            gameColor="yellow"
            gameType={GameType.GoldRush}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-yellow mx-auto mb-4"></div>
            <p className={`text-xl font-display text-yellow`}>{message}</p>
          </div>
        );
      case Screen.Game:
        return (
          <GameScreen
            onGameOver={handleGameOver}
            betAmount={betAmount}
            gamePubkey={gamePubkey}
            provider={provider}
            connection={connection}
            onForfeit={handleForfeit}
            isGuest={isGuest}
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
        <HowToPlayModal title="How to Play Gold Rush" onClose={() => setShowHowToPlay(false)} borderColorClass="border-yellow">
          <p>Gold Rush is a game of strategy and bluffing fought over 5 rounds.</p>
          <ul className="list-disc list-inside space-y-2 mt-4">
            <li>Each player has 5 Data Chips, numbered 1 through 5. You can only use each chip once.</li>
            <li>In each round, a random "Jackpot" value is revealed.</li>
            <li>Both players secretly choose one of their remaining Data Chips to play for that round.</li>
            <li>Once both players have chosen, the chips are revealed. The player who played the higher numbered chip wins the round.</li>
            <li>The winner of the round collects points equal to the Jackpot value PLUS both players' chip values.</li>
            <li>After 5 rounds, the player with the highest total score wins the entire pot!</li>
          </ul>
        </HowToPlayModal>
      )}
    </div>
  );
};

export default SolanaGoldRush;