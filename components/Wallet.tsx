import React, { useState, useEffect } from 'react';

interface WalletProps {
    provider: any;
    setProvider: (provider: any) => void;
    balance: number;
    refreshBalance: () => void;
    isGuest: boolean;
    onPlayAsGuest: () => void;
}

const Wallet: React.FC<WalletProps> = ({ provider, setProvider, balance, refreshBalance, isGuest, onPlayAsGuest }) => {
    const [showModal, setShowModal] = useState(false);

    // Listen for account changes in the wallet
    useEffect(() => {
        if (provider?.on) {
            const onAccountChanged = (publicKey: any) => {
                // When the user switches accounts, refresh the balance.
                // If they disconnect, the publicKey will be null.
                if (publicKey) {
                    refreshBalance();
                } else {
                    // Handle disconnection from within the wallet
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
            // For guest provider which doesn't have a real disconnect method
            setProvider(null);
        }
    };
    
    const formatAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    if (provider && provider.publicKey) {
        return (
            <div className="flex items-center gap-4">
                <div className="bg-brand-gray border border-gray-700 rounded-lg p-2 px-4 text-center">
                    <div className="font-mono text-lg text-white">{balance.toFixed(4)} SOL</div>
                    <div className="text-xs text-gray-300">{isGuest ? "Guest Player" : formatAddress(provider.publicKey.toBase58())}</div>
                     {isGuest && <div className="text-xs text-yellow-light/70">(Pretend Funds)</div>}
                </div>
                <button
                    onClick={handleDisconnect}
                    className="bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-start gap-4">
                 <button
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-to-r from-blue-light to-violet-light text-brand-dark font-bold py-2 px-6 rounded-lg text-lg transition-transform transform hover:scale-105"
                >
                    Connect Wallet
                </button>
                <button
                    onClick={onPlayAsGuest}
                    className="bg-gray-700 text-white font-bold py-2 px-6 rounded-lg text-lg hover:bg-gray-600 transition-colors"
                >
                    Play as Guest
                </button>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setShowModal(false)}>
                    <div 
                        className="bg-brand-dark p-8 rounded-xl shadow-2xl w-full max-w-xs mx-4 border-2 border-blue relative" 
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="connect-wallet-title"
                    >
                        <h2 id="connect-wallet-title" className="text-3xl font-bold font-display text-center mb-6 text-white">Connect Wallet</h2>
                        <div className="flex flex-col gap-4">
                            <button onClick={handleConnectPhantom} className="w-full bg-[#512da8] text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-[#5a36b3] transition-colors">
                                Phantom
                            </button>
                            <button onClick={handleConnectSolflare} className="w-full bg-brand-gray text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-gray-700 border-2 border-gray-700 hover:border-gray-600 transition-colors">
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