// FIX: Import Buffer to make it available for the compiler.
import { Buffer } from 'buffer';
import { IDL, TruepvpBackend } from './truepvp_backend.ts';
import { GameState, OnChainGameState, GameType } from './types.ts';

// Get Solana Web3 from the global scope. This is safe because it loads first.
const solanaWeb3 = (window as any).solanaWeb3;
const Connection: typeof solanaWeb3.Connection = solanaWeb3.Connection;
const PublicKey: typeof solanaWeb3.PublicKey = solanaWeb3.PublicKey;
const SystemProgram: typeof solanaWeb3.SystemProgram = solanaWeb3.SystemProgram;
const { LAMPORTS_PER_SOL } = solanaWeb3;


// Your deployed program ID
const PROGRAM_ID = new PublicKey(IDL.metadata.address);
// Your fee collection wallet
const TREASURY_WALLET_ADDRESS = new PublicKey('8qJYGzAMYCVyLkpMwNNo2KC78HY3cuWi5m1tM74kYz4c');

/**
 * Creates a program instance for interacting with the smart contract.
 * Accesses window.anchor inside to prevent race conditions on load.
 */
const getProgram = (connection: any, provider: any) => {
  const anchor = (window as any).anchor;
  const { Program, AnchorProvider } = anchor;
  const anchorProvider = new AnchorProvider(connection, provider, { commitment: 'confirmed' });
  // The program type is inferred from the IDL.
  return new Program(IDL, PROGRAM_ID, anchorProvider);
};

/**
 * Parses the raw on-chain state into a more UI-friendly format.
 */
const parseOnChainState = (onChainState: OnChainGameState): GameState => {
    return {
        ...onChainState,
        gameType: onChainState.gameType,
        players: [onChainState.players[0].toBase58(), onChainState.players[1].toBase58()],
        // The wager amount from the chain is a BN.js object.
        wagerAmount: (onChainState.wagerAmount as any).toNumber() / LAMPORTS_PER_SOL,
        winner: onChainState.winner.toBase58(),
    };
};

// --- CORE MATCHMAKING FUNCTIONS ---

export const findOpenGame = async (connection: any, provider: any, wagerAmount: number, gameType: GameType): Promise<typeof PublicKey | null> => {
    const anchor = (window as any).anchor;
    const { BN } = anchor;
    const program = getProgram(connection, provider);
    const lamports = new BN(wagerAmount * LAMPORTS_PER_SOL);

    const openGames = await program.account.gameState.all([
        { memcmp: { offset: 8 + 1 + 32, bytes: new PublicKey(0).toBase58() } }, // Player 2 is default/empty
        { memcmp: { offset: 8 + 1 + 32 + 32, bytes: lamports.toBuffer('le', 8) } }, // Match wager amount
        { memcmp: { offset: 8, bytes: Buffer.from([gameType]) } }, // Match game type
    ]);
    
    // Filter out games created by the current player
    const validOpenGames = openGames.filter(game => game.account.players[0].toBase58() !== provider.publicKey.toBase58());

    if (validOpenGames.length > 0) {
        return validOpenGames[0].publicKey; // Return the public key of the first available game
    }
    return null;
};

export const createGameOnChain = async (connection: any, provider: any, wagerAmount: number, gameType: GameType): Promise<typeof PublicKey> => {
  const anchor = (window as any).anchor;
  const { BN } = anchor;
  const program = getProgram(connection, provider);
  const gameAccount = (window as any).solanaWeb3.Keypair.generate();
  
  await program.methods
    .createGame(new BN(wagerAmount * LAMPORTS_PER_SOL), gameType)
    .accounts({
      game: gameAccount.publicKey,
      player: provider.publicKey,
      treasury: TREASURY_WALLET_ADDRESS,
      systemProgram: SystemProgram.programId,
    })
    .signers([gameAccount])
    .rpc();

  return gameAccount.publicKey;
};

export const joinGameOnChain = async (connection: any, provider: any, gamePubkey: any): Promise<void> => {
    const program = getProgram(connection, provider);
    await program.methods
        .joinGame()
        .accounts({
            game: gamePubkey,
            player: provider.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .rpc();
};


// --- GAME-SPECIFIC FUNCTIONS ---

export const getGameState = async (connection: any, gamePubkey: typeof PublicKey): Promise<GameState> => {
  const anchor = (window as any).anchor;
  const { Program, AnchorProvider } = anchor;
  // Create a read-only provider since we don't need a signer to fetch data.
  // The wallet object can be a dummy object for read-only operations.
  const readOnlyProvider = new AnchorProvider(connection, {}, { commitment: 'confirmed' });
  const program = new Program(IDL as TruepvpBackend, PROGRAM_ID, readOnlyProvider);
  const onChainState = await program.account.gameState.fetch(gamePubkey);
  return parseOnChainState(onChainState as unknown as OnChainGameState);
};

export const playRoundOnChain = async (connection: any, provider: any, gamePubkey: typeof PublicKey, round: number, choice: number): Promise<void> => {
  const program = getProgram(connection, provider);
  await program.methods
    .play(round, choice)
    .accounts({
      game: gamePubkey,
      player: provider.publicKey,
    })
    .rpc();
};

export const resolveGameGoldRushOnChain = async (connection: any, provider: any, gamePubkey: typeof PublicKey, playerOne: typeof PublicKey, playerTwo: typeof PublicKey): Promise<void> => {
    const program = getProgram(connection, provider);
    await program.methods
        .resolveGameGoldRush()
        .accounts({
            game: gamePubkey,
            playerOne,
            playerTwo,
            signer: provider.publicKey,
        })
        .rpc();
};

export const reportWinnerOnChain = async (connection: any, provider: any, gamePubkey: typeof PublicKey, winnerPk: typeof PublicKey): Promise<void> => {
    const program = getProgram(connection, provider);
    const state = await getGameState(connection, gamePubkey);
    const playerOne = new PublicKey(state.players[0]);
    const playerTwo = new PublicKey(state.players[1]);

    await program.methods
        .reportWinnerAndResolve(winnerPk)
        .accounts({
            game: gamePubkey,
            playerOne,
            playerTwo,
            signer: provider.publicKey,
        })
        .rpc();
};