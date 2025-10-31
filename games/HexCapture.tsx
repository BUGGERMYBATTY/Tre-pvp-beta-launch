import React, { useState, useEffect } from 'react';
import MatchmakingLobby from '../components/MatchmakingLobby.tsx';
import HexCaptureGameScreen from '../components/HexCaptureGameScreen.tsx';
import WinnerScreen from '../components/WinnerScreen.tsx';
import HowToPlayModal from '../components/HowToPlayModal.tsx';
import { Screen, GameType, PublicKey } from '../types.ts';
import { getOpenGames, createGameOnChain, joinGameOnChain, reportWinnerOnChain, getGameState } from '../program-client.ts';

const { Keypair } = (window as any).solanaWeb3;

interface HexCaptureProps {
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

const HexCapture: React.FC<HexCaptureProps> = ({ onExit, provider, connection, balance, onRefreshBalance, onSetBalance, isGuest, nickname, opponentNickname }) => {
  const [screen, setScreen] = useState<Screen>(Screen.Matchmaking);
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

  const handleMatchCreated = (newGamePubkey: PublicKey | null, amount: number) => {
    setBetAmount(amount);
    if (isGuest) {
        const totalCost = amount + (amount * 0.015);
        if (balance < totalCost) {
            alert("You don't have enough pretend SOL!");
            setScreen(Screen.Matchmaking);
            return;
        }
        onSetBalance(balance - totalCost);
        setMessage('Starting local match vs AI...');
        setGamePubkey(Keypair.generate().publicKey);
        setTimeout(() => setScreen(Screen.Game), 1000);
        return;
    }

    setMessage('Creating a new match...');
    setGamePubkey(newGamePubkey);
    setMessage('Game created! Waiting for an opponent...');
    setScreen(Screen.Waiting);
  };

  const handleMatchJoined = async (joinedGamePubkey: PublicKey, amount: number) => {
      setBetAmount(amount);
      setGamePubkey(joinedGamePubkey);
      setScreen(Screen.Game);
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
    setScreen(Screen.Matchmaking);
    setWinnerId(null);
    setForfeited(false);
    setGamePubkey(null);
  };

  const renderContent = () => {
    switch (screen) {
      // FIX: Replace BettingScreen with MatchmakingLobby and adjust props.
      case Screen.Matchmaking:
        return <MatchmakingLobby
          onMatchCreated={handleMatchCreated}
          onMatchJoined={handleMatchJoined}
          onCancel={onExit}
          gameTitle="Hex Capture"
          gameColor="green"
          balance={balance}
          onShowHowToPlay={() => setShowHowToPlay(true)}
          isGuest={isGuest}
          gameType={GameType.HexCapture}
          provider={provider}
          connection={connection}
          nickname={nickname}
        />;
      case Screen.Waiting:
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-green mx-auto mb-4"></div>
            <p className="text-xl font-display text-green">{message}</p>
          </div>
        );
      case Screen.Game:
        return <HexCaptureGameScreen
          onGameOver={handleGameOver}
          betAmount={betAmount}
          onForfeit={handleForfeit}
          gamePubkey={gamePubkey}
          provider={provider}
          connection={connection}
          isGuest={isGuest}
          nickname={nickname}
          opponentNickname={opponentNickname}
        />;
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
      {screen !== Screen.Matchmaking && (
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