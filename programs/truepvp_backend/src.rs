
use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("3FW4SxQYGK7p2Cp5U422LmZdi3WbatBr9zWj4RGtmoXi");

#[program]
pub mod truepvp_backend {
    use super::*;

    pub fn create_game(ctx: Context<CreateGame>, wager_amount: u64, game_type: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        game.game_type = game_type;
        game.wager_amount = wager_amount;
        game.players[0] = ctx.accounts.player.key();
        game.is_over = false;

        // Transfer wager to the game account
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: game.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, wager_amount)?;

        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.players[1] == Pubkey::default(), GameError::GameAlreadyFull);
        require!(game.players[0] != ctx.accounts.player.key(), GameError::PlayerCannotJoinOwnGame);
        game.players[1] = ctx.accounts.player.key();

        // Transfer wager to the game account
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: game.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, game.wager_amount)?;

        Ok(())
    }

    pub fn play(ctx: Context<Play>, round: u8, choice: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player_index = if ctx.accounts.player.key() == game.players[0] { 0 } else { 1 };

        require!(!game.is_over, GameError::GameAlreadyOver);
        require!(round < 5, GameError::InvalidRound);

        let choices = if player_index == 0 { &mut game.player_one_choices } else { &mut game.player_two_choices };
        require!(choices[round as usize] == 0, GameError::AlreadyPlayedRound);
        choices[round as usize] = choice;

        Ok(())
    }

    pub fn resolve_game(ctx: Context<ResolveGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(!game.is_over, GameError::GameAlreadyOver);

        let mut player_one_score = 0;
        let mut player_two_score = 0;

        for i in 0..5 {
            if game.player_one_choices[i] > game.player_two_choices[i] {
                player_one_score += 1;
            } else if game.player_two_choices[i] > game.player_one_choices[i] {
                player_two_score += 1;
            }
        }

        let winner_pubkey = if player_one_score > player_two_score {
            game.players[0]
        } else {
            game.players[1]
        };

        game.winner = winner_pubkey;
        game.is_over = true;

        let winner_account_info = if winner_pubkey == ctx.accounts.player_one.key() {
            &ctx.accounts.player_one
        } else {
            &ctx.accounts.player_two
        };

        let total_wager = game.wager_amount * 2;
        **game.to_account_info().try_borrow_mut_lamports()? -= total_wager;
        **winner_account_info.try_borrow_mut_lamports()? += total_wager;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(init, payer = player, space = 8 + 1 + 32 * 2 + 8 + 1 * 5 + 1 * 5 + 1 * 5 + 1 + 32)]
    pub game: Account<'info, GameState>,
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: Treasury account for fees
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Play<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveGame<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    /// CHECK: Safe because of constraint
    #[account(mut)]
    pub player_one: AccountInfo<'info>,
    /// CHECK: Safe because of constraint
    #[account(mut)]
    pub player_two: AccountInfo<'info>,
}

#[account]
pub struct GameState {
    pub game_type: u8,
    pub players: [Pubkey; 2],
    pub wager_amount: u64,
    pub player_one_choices: [u8; 5],
    pub player_two_choices: [u8; 5],
    pub round_numbers: [u8; 5],
    pub is_over: bool,
    pub winner: Pubkey,
}

#[error_code]
pub enum GameError {
    #[msg("A player cannot join their own game.")]
    PlayerCannotJoinOwnGame,
    #[msg("This game is already full.")]
    GameAlreadyFull,
    #[msg("Invalid round number.")]
    InvalidRound,
    #[msg("Invalid choice.")]
    InvalidChoice,
    #[msg("You have already played this round.")]
    AlreadyPlayedRound,
    #[msg("You cannot use the same chip twice.")]
    DuplicateChoice,
    #[msg("The game is already over.")]
    GameAlreadyOver,
    #[msg("The game is not finished yet.")]
    GameNotFinished,
    #[msg("Instruction is not valid for this game type.")]
    WrongGameType,
    #[msg("Winner must be one of the players.")]
    InvalidWinner,
    #[msg("The signer is not authorized to perform this action.")]
    Unauthorized,
    #[msg("Invalid player account passed.")]
    InvalidPlayer,
    #[msg("Arithmetic overflow.")]
    Overflow,
}
