import React, { useState, useEffect } from 'react';
import MainPage from './components/MainPage.tsx';
import TokenPage from './components/TokenPage.tsx';
import SolanaGoldRush from './games/SolanaGoldRush.tsx';
import NeonPong from './games/NeonPong.tsx';
import ViperPit from './games/ViperPit.tsx';
import Wallet from './components/Wallet.tsx';
import LeaderboardPage from './components/LeaderboardPage.tsx';
import NicknameModal from './components/NicknameModal.tsx';
import { GameId } from './types';

const { Connection, clusterApiUrl, PublicKey, Keypair } = (window as any).solanaWeb3;

type Page = 'games' | 'leaderboard' | 'token';

const App: React.FC = () => {
    const [provider, setProvider] = useState<any>(null);
    const [connection, setConnection] = useState<any>(null);
    const [balance, setBalance] = useState(0);
    const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [guestBalance, setGuestBalance] = useState(10);
    const [page, setPage] = useState<Page>('games');
    const [nickname, setNickname] = useState<string | null>(null);
    const [showNicknameModal, setShowNicknameModal] = useState(false);


    useEffect(() => {
        const network = clusterApiUrl('devnet');
        const conn = new Connection(network, 'confirmed');
        setConnection(conn);
    }, []);

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
    
    // Check for nickname when provider is set
    useEffect(() => {
        if (provider?.publicKey && !isGuest) {
            const pkString = provider.publicKey.toBase58();
            const storedNickname = localStorage.getItem(`nickname_${pkString}`);
            if (storedNickname) {
                setNickname(storedNickname);
            } else {
                setShowNicknameModal(true); // Prompt for nickname if not found
            }
        } else if (isGuest) {
            setNickname('Guest');
        } else {
            setNickname(null);
        }
    }, [provider, isGuest]);


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
        const guestProvider = {
            publicKey: guestKeypair.publicKey,
            isGuest: true,
            signTransaction: () => Promise.reject(new Error("Guest cannot sign transactions.")),
            signAllTransactions: () => Promise.reject(new Error("Guest cannot sign transactions.")),
            connect: () => Promise.resolve(),
            disconnect: () => new Promise<void>(resolve => { setProvider(null); resolve(); }),
        };
        setProvider(guestProvider);
        setIsGuest(true);
        setGuestBalance(10);
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
    
    const handleSetNickname = (chosenNickname: string) => {
        if (provider?.publicKey) {
            const pkString = provider.publicKey.toBase58();
            localStorage.setItem(`nickname_${pkString}`, chosenNickname);
            setNickname(chosenNickname);
            setShowNicknameModal(false);
        }
    };

    const renderContent = () => {
        if (selectedGame && provider) {
            const commonProps = {
                onExit: handleExitGame,
                provider,
                connection,
                balance,
                onRefreshBalance: refreshBalance,
                isGuest,
                onSetBalance: setGuestBalance,
                nickname: nickname || 'Player',
                opponentNickname: 'Opponent' // Placeholder for actual opponent nickname logic
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
        }
        
        switch (page) {
            case 'games':
                return <MainPage onSelectGame={handleSelectGame} />;
            case 'leaderboard':
                return <LeaderboardPage isGuest={isGuest} />;
            case 'token':
                return <TokenPage />;
            default:
                return <MainPage onSelectGame={handleSelectGame} />;
        }
    };
    
    const NavLink: React.FC<{ targetPage: Page, children: React.ReactNode }> = ({ targetPage, children }) => {
        const isActive = page === targetPage && !selectedGame;
        return (
            <button
                onClick={() => {
                    setSelectedGame(null); // Always exit game when changing pages
                    setPage(targetPage);
                }}
                className={`px-4 py-2 rounded-lg font-bold transition-colors duration-200 text-lg ${
                    isActive
                        ? 'bg-blue text-brand-dark'
                        : 'bg-transparent text-gray-300 hover:bg-brand-gray/80 hover:text-white'
                }`}
            >
                {children}
            </button>
        );
    };

    return (
        <div className="bg-brand-dark min-h-screen text-brand-light font-sans flex flex-col items-center p-4 sm:p-6">
            {showNicknameModal && <NicknameModal onSetNickname={handleSetNickname} />}
            <div className="fixed top-0 left-0 w-full h-24 bg-gradient-to-b from-brand-dark to-transparent z-10 pointer-events-none"></div>
            <header className="w-full max-w-7xl flex justify-between items-center mb-12 z-30">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-wider bg-gradient-to-r from-blue-light to-violet-light bg-clip-text text-transparent cursor-pointer" style={{ textShadow: '0 0 10px rgba(0, 191, 255, 0.5)' }} onClick={() => { setSelectedGame(null); setPage('games'); }}>
                        TRUEPVP
                    </h1>
                </div>
                <nav className="hidden md:flex items-center gap-4 bg-brand-gray/50 border border-gray-700/50 p-1 rounded-xl">
                    <NavLink targetPage="games">Games</NavLink>
                    <NavLink targetPage="leaderboard">Leaderboard</NavLink>
                    <NavLink targetPage="token">$TRUEPVP</NavLink>
                </nav>
                <Wallet 
                    provider={provider}
                    setProvider={setProvider}
                    balance={balance}
                    refreshBalance={refreshBalance}
                    isGuest={isGuest}
                    onPlayAsGuest={handlePlayAsGuest}
                    nickname={nickname}
                />
            </header>
            <main className="w-full max-w-7xl flex-grow flex items-center justify-center z-20">
                {renderContent()}
            </main>
            <footer className="w-full max-w-7xl text-center text-gray-400 mt-24 text-sm z-20">
                <p>&copy; {new Date().getFullYear()} TRUEPVP Games. All rights reserved.</p>
            </footer>
            <div className="fixed bottom-0 left-0 w-full h-24 bg-gradient-to-t from-brand-dark to-transparent z-10 pointer-events-none"></div>
        </div>
    );
};

export default App;