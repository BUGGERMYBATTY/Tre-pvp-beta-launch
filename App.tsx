import React, { useState, useEffect } from 'react';
// FIX: Add .tsx extension to MainPage import to fix module resolution error.
import MainPage from './components/MainPage.tsx';
// FIX: Added .tsx extensions for consistency and to prevent module resolution errors.
import SolanaGoldRush from './games/SolanaGoldRush.tsx';
import NeonPong from './games/NeonPong.tsx';
import ViperPit from './games/ViperPit.tsx';
import Wallet from './components/Wallet.tsx';
import { GameId } from './types';

// Solana web3 objects will be on the window
const { Connection, clusterApiUrl, PublicKey, Keypair } = (window as any).solanaWeb3;

const App: React.FC = () => {
    const [provider, setProvider] = useState<any>(null); // From Phantom wallet
    const [connection, setConnection] = useState<any>(null);
    const [balance, setBalance] = useState(0);
    const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [guestBalance, setGuestBalance] = useState(10); // Start guests with 10 pSOL

    // Initialize connection
    useEffect(() => {
        const network = clusterApiUrl('devnet');
        const conn = new Connection(network, 'confirmed');
        setConnection(conn);
    }, []);

    // Function to refresh balance for real wallets
    const refreshBalance = async () => {
        if (provider && connection && provider.publicKey && !isGuest) {
            try {
                const lamports = await connection.getBalance(provider.publicKey);
                setBalance(lamports / 1e9);
            } catch (error) {
                console.error("Could not refresh balance:", error);
                setBalance(0);
            }
        }
    };
    
    // Refresh balance and UI state when provider changes
    useEffect(() => {
        if (provider) {
            if (isGuest) {
                setBalance(guestBalance);
            } else {
                refreshBalance();
            }
        } else {
            setBalance(0);
            setIsGuest(false);
            setSelectedGame(null);
        }
    }, [provider, connection, isGuest, guestBalance]);

    const handlePlayAsGuest = () => {
        const guestKeypair = Keypair.generate();
        // Create a mock provider for the guest
        const guestProvider = {
            publicKey: guestKeypair.publicKey,
            isGuest: true,
            // Add dummy methods to mimic a real provider if needed
            signTransaction: () => Promise.reject(new Error("Guest cannot sign transactions.")),
            signAllTransactions: () => Promise.reject(new Error("Guest cannot sign transactions.")),
            connect: () => Promise.resolve(),
            disconnect: () => new Promise<void>(resolve => { setProvider(null); resolve(); }),
        };
        setProvider(guestProvider);
        setIsGuest(true);
        setGuestBalance(10); // Reset balance on new guest session
    };

    const handleSelectGame = (gameId: GameId) => {
        if (!provider) {
            alert("Please play as a guest to begin.");
            return;
        }
        setSelectedGame(gameId);
    };

    const handleExitGame = () => {
        setSelectedGame(null);
        if (!isGuest) {
            refreshBalance();
        }
    };
    
    const renderGame = () => {
        if (!provider) return null;

        const commonProps = {
            onExit: handleExitGame,
            provider,
            connection,
            balance,
            onRefreshBalance: refreshBalance,
            isGuest,
            onSetBalance: setGuestBalance,
        };

        switch (selectedGame) {
            case 'solana-gold-rush':
                return <SolanaGoldRush {...commonProps} />;
            case 'neon-pong':
                return <NeonPong {...commonProps} />;
            case 'viper-pit':
                return <ViperPit {...commonProps} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-brand-dark min-h-screen text-white font-sans flex flex-col items-center p-4 sm:p-8">
            <header className="w-full max-w-7xl flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold font-display tracking-wider bg-gradient-to-r from-blue-light to-violet-light bg-clip-text text-transparent">TRUEPVP</h1>
                </div>
                <Wallet 
                    provider={provider}
                    setProvider={setProvider}
                    balance={balance}
                    refreshBalance={refreshBalance}
                    isGuest={isGuest}
                    onPlayAsGuest={handlePlayAsGuest}
                />
            </header>
            <main className="w-full max-w-7xl flex-grow flex items-center justify-center">
                {selectedGame ? renderGame() : <MainPage onSelectGame={handleSelectGame} />}
            </main>
            <footer className="w-full max-w-7xl text-center text-gray-300 mt-12 text-sm">
                <p>&copy; {new Date().getFullYear()} TRUEPVP Games. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;