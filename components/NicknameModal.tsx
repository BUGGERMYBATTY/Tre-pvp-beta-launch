import React, { useState } from 'react';

interface NicknameModalProps {
  onSetNickname: (nickname: string) => void;
}

const NicknameModal: React.FC<NicknameModalProps> = ({ onSetNickname }) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const validateAndSetNickname = () => {
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 3 || trimmedNickname.length > 15) {
      setError('Nickname must be between 3 and 15 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedNickname)) {
      setError('Only letters, numbers, and underscores are allowed.');
      return;
    }
    onSetNickname(trimmedNickname);
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      validateAndSetNickname();
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nickname-title"
    >
      <div 
        className="bg-glassmorphism p-8 rounded-2xl shadow-2xl w-full max-w-sm mx-4 border-2 border-blue/50 relative"
      >
        <h2 id="nickname-title" className="text-3xl font-bold font-display text-center mb-4 text-white">Choose Your Nickname</h2>
        <p className="text-center text-gray-300 mb-6">This will be your permanent name on TRUEPVP and cannot be changed.</p>
        
        <div className="flex flex-col gap-4">
            <input
                type="text"
                value={nickname}
                onChange={(e) => {
                    setNickname(e.target.value);
                    if (error) setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter nickname..."
                className="w-full bg-brand-dark/70 text-white font-bold py-3 px-4 rounded-lg text-lg border-2 border-gray-600 focus:border-blue focus:ring-blue focus:outline-none transition-colors"
                maxLength={15}
            />
            {error && <p className="text-red-400 text-sm text-center -mt-2">{error}</p>}
            <button 
                onClick={validateAndSetNickname}
                className="w-full bg-blue text-brand-dark font-bold py-3 px-6 rounded-lg text-xl hover:bg-blue-light transition-transform transform hover:scale-105 shadow-lg shadow-blue/20"
            >
                Confirm Nickname
            </button>
        </div>
      </div>
    </div>
  );
};

export default NicknameModal;