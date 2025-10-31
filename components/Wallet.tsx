import React, { useState, useEffect } from 'react';

interface WalletProps {
    provider: any;
    setProvider: (provider: any) => void;
    balance: number;
    refreshBalance: () => void;
    isGuest: boolean;
    onPlayAsGuest: () => void;
    nickname: string | null;
}

const Wallet: React.FC<WalletProps> = ({ provider, setProvider, balance, refreshBalance, isGuest, onPlayAsGuest, nickname }) => {
    const [showModal, setShowModal] = useState(false);

    // Listen for account changes in the wallet
    useEffect(() => {
        if (provider?.on) {
            const onAccountChanged = (publicKey: any) => {
                if (publicKey) {
                    refreshBalance();
                } else {
                    setProvider(null);
                }
            };
            provider.on('accountChanged', onAccountChanged);
            return () => {
                provider.removeListener('accountChanged', onAccountChanged);
            };
        }
    }, [provider, refreshBalance, setProvider]);

    const connectToWallet = async (walletProvider: any) => {
        if (walletProvider) {
            try {
                await walletProvider.connect();
                setProvider(walletProvider);
                setShowModal(false);
            } catch (err) {
                console.error("Connection error:", err);
                alert("Failed to connect wallet. Please try again.");
            }
        }
    };

    const handleConnectPhantom = () => {
        const phantomProvider = (window as any).phantom?.solana;
        if (phantomProvider?.isPhantom) {
            connectToWallet(phantomProvider);
        } else {
            window.open('https://phantom.app/', '_blank');
        }
    };

    const handleConnectSolflare = () => {
        const solflareProvider = (window as any).solflare;
        if (solflareProvider) {
            connectToWallet(solflareProvider);
        } else {
            window.open('https://solflare.com/', '_blank');
        }
    };

    const handleDisconnect = async () => {
        if (provider && provider.disconnect) {
            try {
                await provider.disconnect();
            } catch (err) {
                console.error("Disconnection error:", err);
            } finally {
                setProvider(null);
            }
        } else {
            setProvider(null);
        }
    };
    
    const formatAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    if (provider && provider.publicKey) {
        return (
            <div className="flex items-center gap-3">
                <div className="bg-glassmorphism border border-gray-700/50 rounded-lg p-2 px-4 text-right backdrop-blur-sm">
                    <div className="font-mono text-lg text-white font-bold">{balance.toFixed(4)} SOL</div>
                    <div className="text-xs text-gray-300">{nickname || formatAddress(provider.publicKey.toBase58())}</div>
                </div>
                <button
                    onClick={handleDisconnect}
                    className="bg-brand-gray/50 text-gray-300 hover:text-white hover:bg-brand-gray/80 transition-colors w-10 h-10 flex items-center justify-center rounded-lg border border-gray-700/50"
                    aria-label="Disconnect Wallet"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center gap-4">
                 <button
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-to-r from-blue to-violet-dark text-white font-bold py-2 px-6 rounded-lg text-lg transition-all transform hover:scale-105 hover:shadow-glow-blue border border-blue/50"
                >
                    Connect Wallet
                </button>
                <button
                    onClick={onPlayAsGuest}
                    className="bg-brand-dark/50 text-gray-200 font-bold py-2 px-6 rounded-lg text-lg hover:bg-brand-gray/80 border border-gray-700/50 hover:border-gray-500 transition-colors"
                >
                    Play as Guest
                </button>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn backdrop-blur-md" onClick={() => setShowModal(false)}>
                    <div 
                        className="bg-glassmorphism p-8 rounded-2xl shadow-2xl w-full max-w-sm mx-4 border-2 border-blue/50 relative animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="connect-wallet-title"
                    >
                        <h2 id="connect-wallet-title" className="text-3xl font-bold font-display text-center mb-8 text-white">Connect a Wallet</h2>
                        <div className="flex flex-col gap-4">
                            <button onClick={handleConnectPhantom} className="w-full bg-[#512da8]/80 text-white font-bold py-4 px-6 rounded-lg text-lg hover:bg-[#512da8] transition-colors border border-violet-light/50 flex items-center justify-center gap-3">
                                <img src="https://phantom.app/img/logo.png" alt="Phantom Wallet" className="w-7 h-7" />
                                Phantom
                            </button>
                            <button onClick={handleConnectSolflare} className="w-full bg-brand-gray/70 text-white font-bold py-4 px-6 rounded-lg text-lg hover:bg-brand-gray border-2 border-gray-700 hover:border-gray-500 transition-colors flex items-center justify-center gap-3">
                                <img src="https://solflare.com/favicon.ico" alt="Solflare Wallet" className="w-7 h-7" />
                                Solflare
                            </button>
                        </div>
                        <button onClick={() => setShowModal(false)} className="absolute top-3 right-4 text-gray-400 hover:text-white transition-colors text-3xl font-bold" aria-label="Close modal">&times;</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Wallet;