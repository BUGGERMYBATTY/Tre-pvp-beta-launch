import React, { useState, useEffect } from 'react';
import BettingScreen from '../components/BettingScreen.tsx';
import HexCaptureGameScreen from '../components/HexCaptureGameScreen.tsx';
import WinnerScreen from '../components/WinnerScreen.tsx';
import HowToPlayModal from '../components/HowToPlayModal.tsx';
import { Screen, GameType, PublicKey } from '../types.ts';
import { findOpenGame, createGameOnChain, joinGameOnChain, reportWinnerOnChain, getGameState } from '../program-client.ts';

const { Keypair } = (window as any).solanaWeb3;

interface HexCaptureProps {
  onExit: () => void;
  provider: any;
  connection: any;
  balance: number;
  onRefreshBalance: () => void;
  onSetBalance: (newBalance: number) => void;
  isGuest: boolean;
}

const HexCapture: React.FC<HexCaptureProps> = ({ onExit, provider, connection, balance, onRefreshBalance, onSetBalance, isGuest }) => {
  const [screen, setScreen] = useState<Screen>(Screen.Betting);
  const [betAmount, setBetAmount] = useState(0.1);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [forfeited, setForfeited] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [gamePubkey, setGamePubkey] = useState<PublicKey | null>(null);
  const [message, setMessage] = useState('');

  // Use WebSocket subscription to wait for an opponent (non-guest only)
  useEffect(() => {
    if (!isGuest && screen === Screen.Waiting && gamePubkey && connection) {
      const subscriptionId = connection.onAccountChange(
        gamePubkey,
        async () => {
          try {
            const state = await getGameState(connection, gamePubkey);
            if (state && state.players[1] !== new (window as any).solanaWeb3.PublicKey(0).toBase58()) {
              console.log("Opponent joined! Starting game.");
              setScreen(Screen.Game);
            }
          } catch (e) { console.error("Error processing account change for opponent detection:", e); }
        },
        'confirmed'
      );
      return () => {
        connection.removeAccountChangeListener(subscriptionId).catch((err: any) => console.error("Failed to remove listener:", err));
      };
    }
  }, [screen, gamePubkey, connection, isGuest]);

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
        setMessage('Starting local match vs AI...');
        setGamePubkey(Keypair.generate().publicKey);
        setTimeout(() => setScreen(Screen.Game), 1000);
        return;
    }

    setMessage('Searching for an open match...');
    try {
      const openGamePubkey = await findOpenGame(connection, provider, amount, GameType.HexCapture);
      if (openGamePubkey) {
        setMessage('Open match found! Joining game...');
        await joinGameOnChain(connection, provider, openGamePubkey);
        await onRefreshBalance();
        setGamePubkey(openGamePubkey);
        setScreen(Screen.Game);
      } else {
        setMessage('No open matches found. Creating a new one...');
        const newGamePubkey = await createGameOnChain(connection, provider, amount, GameType.HexCapture);
        await onRefreshBalance();
        setGamePubkey(newGamePubkey);
        setMessage('Game created! Waiting for an opponent...');
      }
    } catch (error) {
      console.error("Matchmaking failed:", error);
      setMessage('Matchmaking failed! Please try again.');
      setScreen(Screen.Betting);
    }
  };

  const handleGameOver = async (winner: number | null) => {
    if (isGuest) {
        if (winner === 1) onSetBalance(balance + (betAmount * 2));
        setWinnerId(winner);
        setScreen(Screen.Winner);
        return;
    }
    if (!gamePubkey) return;

    setMessage('Verifying final game state...');
    try {
      const onChainState = await getGameState(connection, gamePubkey);
      const myPkStr = provider.publicKey.toBase58();
      const isPlayerOne = myPkStr === onChainState.players[0];
      if (winner && isPlayerOne) { // Only player one reports winner to avoid race conditions
        const myPlayerIndex = isPlayerOne ? 0 : 1;
        const opponentPlayerIndex = isPlayerOne ? 1 : 0;
        const winnerPlayerIndex = winner === 1 ? myPlayerIndex : opponentPlayerIndex;
        const winnerPk = new (window as any).solanaWeb3.PublicKey(onChainState.players[winnerPlayerIndex]);
        setMessage('Reporting winner to the blockchain...');
        await reportWinnerOnChain(connection, provider, gamePubkey, winnerPk);
      }
    } catch (error) {
      console.error("Failed to report winner:", error);
    } finally {
      setWinnerId(winner);
      setScreen(Screen.Winner);
      onRefreshBalance();
    }
  };

  const handleForfeit = () => {
    handleGameOver(2);
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
      // FIX: Replace incorrect object spread with standard prop passing and correct handler names.
      case Screen.Betting:
        return <BettingScreen
          onFindOpponent={handleFindOpponent}
          onCancel={onExit}
          gameTitle="Hex Capture"
          gameColor="green"
          balance={balance}
          onShowHowToPlay={() => setShowHowToPlay(true)}
          isGuest={isGuest}
        />;
      case Screen.Waiting:
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-green mx-auto mb-4"></div>
            <p className="text-xl font-display text-green">{message}</p>
          </div>
        );
      // FIX: Replace incorrect object spread with standard prop passing and correct handler names.
      case Screen.Game:
        return <HexCaptureGameScreen
          onGameOver={handleGameOver}
          betAmount={betAmount}
          onForfeit={handleForfeit}
          gamePubkey={gamePubkey}
          provider={provider}
          connection={connection}
          isGuest={isGuest}
        />;
      // FIX: Replace incorrect object spread with standard prop passing and correct handler names.
      case Screen.Winner:
        return <WinnerScreen
          winnerId={winnerId}
          betAmount={betAmount}
          onPlayAgain={handlePlayAgain}
          onExitGame={onExit}
          forfeited={forfeited}
        />;
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
        <HowToPlayModal title="How to Play Hex Capture" onClose={() => setShowHowToPlay(false)} borderColorClass="border-green">
          <p>Hex Capture is a turn-based strategy game of territory control.</p>
          <ul className="list-disc list-inside space-y-2 mt-4">
            <li>The game is played on a grid of 19 hexagons.</li>
            <li>Players take turns capturing an adjacent, neutral hex.</li>
            <li>Each player gets 5 turns. The game ends after 10 total turns.</li>
            <li>The player who has captured the most hexes at the end of the game wins the pot!</li>
            <li>If the score is tied, the match is a draw and wagers are returned.</li>
          </ul>
        </HowToPlayModal>
      )}
    </div>
  );
};

export default HexCapture;