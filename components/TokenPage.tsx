import React, { useState } from 'react';

const VisionCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-glassmorphism rounded-xl p-6 text-center border border-gray-700/50 backdrop-blur-sm h-full flex flex-col">
        <div className="flex justify-center items-center mb-4">
            <div className="w-20 h-20 bg-brand-dark rounded-full flex items-center justify-center border-2 border-violet-light/50">
                {icon}
            </div>
        </div>
        <h3 className="text-2xl font-bold font-display text-violet-light mb-3">{title}</h3>
        <p className="text-gray-300 flex-grow">{description}</p>
    </div>
);

const TokenPage: React.FC = () => {
    const [isCopied, setIsCopied] = useState(false);
    const TOKEN_CONTRACT_ADDRESS = 'So11111111111111111111111111111111111111112';

    const handleCopy = () => {
        navigator.clipboard.writeText(TOKEN_CONTRACT_ADDRESS).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <div className="animate-fadeIn w-full max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-20">
                <h1 className="text-5xl sm:text-7xl font-black font-display mb-6 pb-4 leading-tight">
                    Our Vision & The 
                    <span className="bg-gradient-to-r from-pink-light to-yellow-light bg-clip-text text-transparent block mt-2">$TRUEPVP Token</span>
                </h1>
                <p className="max-w-4xl mx-auto text-xl text-gray-300">
                    <strong>TruePVP is more than a collection of games; it's the foundation for the revolution in decentralized Web3 game development.</strong> Our proof-of-concept games, like Gold Rush, demonstrate our commitment to building the future of competitive, decentralized gaming on Solana.
                </p>
            </div>

            {/* Mission Section */}
            <div className="mb-20">
                <h2 className="text-4xl font-bold font-display text-center mb-12">The Future of Gaming is Player-Owned</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <VisionCard
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-violet-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        }
                        title="Player Sovereignty"
                        description="We believe in a world where you truly own your in-game assets and currency. Funds live in your self-custody wallet, not on our servers. This is the core of the decentralized Gamingverse—a network of interoperable games where your value flows with you."
                    />
                    <VisionCard
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-violet-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path>
                            </svg>
                        }
                        title="Global Skill-Based Economy"
                        description="Your skill is your currency. We are building a platform where gamers from all walks of life can create a genuine income stream from their passion. No matter where you are in the world, if you can compete, you can earn."
                    />
                     <VisionCard
                        icon={
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-violet-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                            </svg>
                        }
                        title="The Next Generation Studio"
                        description="We specialize in creating high-stakes, skill-based PVP games. From fast-paced 2D arcade duels to complex 3D strategy titles, our focus is on creating balanced, competitive, and endlessly replayable experiences that respect the player."
                    />
                </div>
            </div>
            
            {/* Tokenomics Section */}
            <div className="bg-glassmorphism border-2 border-violet-dark/50 rounded-xl p-8 shadow-lg shadow-violet/20 backdrop-blur-sm">
                <h2 className="text-4xl font-bold font-display text-center mb-10">The $TRUEPVP Token</h2>
                
                <div className="grid md:grid-cols-2 gap-10 items-start">
                    {/* Left Column: Utility & Contract */}
                    <div>
                        <h3 className="text-2xl font-bold font-display text-violet-light mb-4">Token Utility</h3>
                        <ul className="space-y-3 text-lg text-gray-200">
                           <li className="flex items-start"><span className="text-violet-light mr-3 mt-1">&#10148;</span> <strong>Governance:</strong> Shape the future of the TruePVP ecosystem by voting on new games, feature updates, and treasury allocation.</li>
                           <li className="flex items-start"><span className="text-violet-light mr-3 mt-1">&#10148;</span> <strong>Fee Reductions:</strong> Stake or hold $TRUEPVP tokens to receive significant discounts on game entry fees, maximizing your winnings.</li>
                           <li className="flex items-start"><span className="text-violet-light mr-3 mt-1">&#10148;</span> <strong>Exclusive Access:</strong> Gain entry to special high-stakes tournaments, early access to new game betas, and unique cosmetic rewards.</li>
                        </ul>

                        <div className="text-center my-10">
                            <h4 className="text-xl font-display text-white mb-3">Official Token Contract Address</h4>
                            <div className="bg-brand-dark inline-flex items-center gap-2 sm:gap-4 p-2 border-2 border-gray-700 rounded-lg max-w-full">
                                <code className="text-violet-light text-xs sm:text-base px-2 truncate">{TOKEN_CONTRACT_ADDRESS}</code>
                                <button onClick={handleCopy} className={`font-bold py-2 px-4 rounded-md text-sm transition-colors ${isCopied ? 'bg-green-500 text-white' : 'bg-violet-dark text-white hover:bg-violet'}`}>
                                    {isCopied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Column: Allocation */}
                    <div className="bg-brand-dark/50 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-2xl font-bold font-display text-violet-light mb-4 text-center">Token Allocation</h3>
                        <p className="text-center text-gray-400 mb-6">Total Supply: 1,000,000,000 $TRUEPVP</p>
                        <div className="space-y-4 text-gray-200">
                            <div className="flex justify-between items-center text-lg">
                                <span>Ecosystem & Rewards</span>
                                <span className="font-mono font-bold">40%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-violet-light h-2.5 rounded-full" style={{width: '40%'}}></div></div>
                            
                            <div className="flex justify-between items-center text-lg">
                                <span>Liquidity & Staking</span>
                                <span className="font-mono font-bold">25%</span>
                            </div>
                             <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-violet-light h-2.5 rounded-full" style={{width: '25%'}}></div></div>
                             
                            <div className="flex justify-between items-center text-lg">
                                <span>Team & Advisors</span>
                                <span className="font-mono font-bold">15%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-violet-light h-2.5 rounded-full" style={{width: '15%'}}></div></div>

                             <div className="flex justify-between items-center text-lg">
                                <span>Marketing & Partnerships</span>
                                <span className="font-mono font-bold">15%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-violet-light h-2.5 rounded-full" style={{width: '15%'}}></div></div>
                             
                             <div className="flex justify-between items-center text-lg">
                                <span>Public Sale</span>
                                <span className="font-mono font-bold">5%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-violet-light h-2.5 rounded-full" style={{width: '5%'}}></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TokenPage;