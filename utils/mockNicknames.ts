// This is a mock service to simulate fetching nicknames for public keys.
// In a real-world application, this would be replaced with a backend service
// or an on-chain program that maps public keys to user-chosen nicknames.

const MOCK_NICKNAME_MAP = new Map<string, string>([
    ['G4v55b3pZWd4wz2a3fQh8jT6kR9cX1Y7LzU5eN0iB3aF', 'QuantumLeap'],
    ['8t4Yf2bN6pX9vR3cE7gH1jA5kL0wZqU8sI2dO3xV4mB7', 'SynthRider'],
    ['F9zXcV6bN2jH7kL4pA8gE3qR1tY5uI0oPwbD6sVfG8hT', 'GlitchMaverick'],
    ['C1vB2n3M4lK5jH6g7F8d9S0aZqWwXeRtYuIoPpLkTbVv', 'ByteSavvy'],
    ['H1j2k3L4p5A6s7D8f9G0qWwXeRtYuIoPzXcVBnMMkLzK', 'DataWraith'],
]);

const formatAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

export const getNicknameForPubkey = (pubkey: string): string => {
    return MOCK_NICKNAME_MAP.get(pubkey) || formatAddress(pubkey);
};
