// Use a global PublicKey type from the solanaWeb3 script
// FIX: Define PublicKey in a way that TypeScript recognizes it as a class/type.
const solanaWeb3 = (window as any).solanaWeb3;
// FIX: Changed PublicKey from a const to a type to be used in interfaces.
// FIX: Export PublicKey type to make it available for other modules.
export type PublicKey = InstanceType<typeof solanaWeb3.PublicKey>;

/**
 * Represents the different screens a user can be on within a game flow.
 */
export enum Screen {
  Betting,
  Game,
  Winner,
  Waiting,
}

/**
 * Represents the on-chain state for any game.
 * This matches the final Rust program's GameState struct.
 */
export interface OnChainGameState {
  gameType: number; // 0: GoldRush, 1: NeonPong, 2: ViperPit
  // FIX: Use PublicKey as instance type instead of typeof PublicKey.
  players: [PublicKey, PublicKey];
  wagerAmount: any; // Using `any` as it's a BN.js object
  playerOneChoices: number[];
  playerTwoChoices: number[];
  roundNumbers: number[];
  isOver: boolean;
  // FIX: Use PublicKey as instance type instead of typeof PublicKey.
  winner: PublicKey;
}

// FIX: Export GoldRushGameState as an alias for OnChainGameState.
export type GoldRushGameState = OnChainGameState;

/**
 * A client-friendly version of the on-chain state.
 */
export interface GameState {
  gameType: GameType;
  players: [string, string];
  wagerAmount: number;
  playerOneChoices: number[];
  playerTwoChoices: number[];
  roundNumbers: number[];
  isOver: boolean;
  winner: string;
}

/**
 * Represents the unique identifier for each game type.
 */
export type GameId = 'solana-gold-rush' | 'neon-pong' | 'viper-pit';

/**
 * Enum for game types to be passed to the on-chain program.
 */
export enum GameType {
  GoldRush = 0,
  NeonPong = 1,
  ViperPit = 2,
  // FIX: Added HexCapture to GameType enum to resolve reference errors.
  HexCapture = 3,
}