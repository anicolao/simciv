<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { getGames, createGame, joinGame } from '../utils/api';

  export let currentUser: string;
  
  const dispatch = createEventDispatcher();

  interface Game {
    gameId: string;
    creatorUserId: string;
    maxPlayers: number;
    currentPlayers: number;
    playerList?: string[];
    state: 'waiting' | 'started';
    currentYear: number;
    createdAt: string;
    startedAt?: string;
  }

  let games: Game[] = [];
  let showCreateForm = false;
  let maxPlayers = 4;
  let loading = false;
  let error = '';
  let pollingInterval: number;

  onMount(() => {
    loadGames();
    // Poll for updates every 2 seconds
    pollingInterval = window.setInterval(loadGames, 2000);
  });

  onDestroy(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  });

  async function loadGames() {
    try {
      const response = await getGames();
      games = response.games;
    } catch (err) {
      console.error('Failed to load games:', err);
    }
  }

  async function handleCreateGame() {
    loading = true;
    error = '';
    try {
      await createGame(maxPlayers);
      showCreateForm = false;
      await loadGames();
    } catch (err: any) {
      error = err.message || 'Failed to create game';
    } finally {
      loading = false;
    }
  }

  async function handleJoinGame(gameId: string) {
    loading = true;
    error = '';
    try {
      await joinGame(gameId);
      await loadGames();
      // Don't automatically select - user will click View button
    } catch (err: any) {
      error = err.message || 'Failed to join game';
    } finally {
      loading = false;
    }
  }

  function handleViewGame(gameId: string) {
    dispatch('viewGame', { gameId });
  }

  function formatYear(year: number): string {
    if (year < 0) {
      return `${Math.abs(year)} BC`;
    } else if (year === 0) {
      return '1 BC';
    } else {
      return `${year} AD`;
    }
  }

  function isInGame(game: Game): boolean {
    // If we have playerList (from detailed view), check it
    if (game.playerList) {
      return game.playerList.includes(currentUser);
    }
    // Otherwise, just check if user is the creator
    return game.creatorUserId === currentUser;
  }

  function canJoin(game: Game): boolean {
    return game.state === 'waiting' && 
           game.currentPlayers < game.maxPlayers && 
           !isInGame(game);
  }
</script>

<div class="game-lobby">
  <h2>Game Lobby</h2>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <div class="actions">
    <button on:click={() => showCreateForm = !showCreateForm} class="create-btn">
      {showCreateForm ? 'Cancel' : 'Create New Game'}
    </button>
  </div>

  {#if showCreateForm}
    <div class="create-form">
      <h3>Create New Game</h3>
      <div class="form-group">
        <label for="maxPlayers">Number of Players:</label>
        <select id="maxPlayers" bind:value={maxPlayers} disabled={loading}>
          {#each [2, 3, 4, 5, 6, 7, 8] as num}
            <option value={num}>{num} players</option>
          {/each}
        </select>
      </div>
      <button on:click={handleCreateGame} disabled={loading} class="primary-btn">
        {loading ? 'Creating...' : 'Create Game'}
      </button>
    </div>
  {/if}

  <div class="games-list">
    <h3>Available Games</h3>
    {#if games.length === 0}
      <p class="empty-state">No games yet. Create one to get started!</p>
    {:else}
      <div class="games-grid">
        {#each games as game}
          <div class="game-card" class:in-game={isInGame(game)}>
            <div class="game-header">
              <span class="game-id">Game #{game.gameId.slice(0, 8)}</span>
              <span class="game-state" class:waiting={game.state === 'waiting'} class:started={game.state === 'started'}>
                {game.state === 'waiting' ? 'Waiting' : 'Started'}
              </span>
            </div>
            
            <div class="game-info">
              <div class="info-row">
                <span class="label">Creator:</span>
                <span class="value">{game.creatorUserId}</span>
              </div>
              <div class="info-row">
                <span class="label">Players:</span>
                <span class="value">{game.currentPlayers}/{game.maxPlayers}</span>
              </div>
              {#if game.state === 'started'}
                <div class="info-row">
                  <span class="label">Year:</span>
                  <span class="value year">{formatYear(game.currentYear)}</span>
                </div>
              {/if}
            </div>

            <div class="game-actions">
              {#if canJoin(game)}
                <button on:click={() => handleJoinGame(game.gameId)} disabled={loading} class="join-btn">
                  Join
                </button>
              {/if}
              <button on:click={() => handleViewGame(game.gameId)} class="view-btn">
                View
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>


</div>

<style>
  .game-lobby {
    padding: 20px;
  }

  h2 {
    color: #333;
    margin-bottom: 20px;
  }

  h3 {
    color: #555;
    margin-bottom: 15px;
  }

  .error {
    background: #ffebee;
    color: #c62828;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .actions {
    margin-bottom: 20px;
  }

  .create-btn {
    padding: 10px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .create-btn:hover {
    background: #45a049;
  }

  .create-form {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #555;
  }

  .form-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .primary-btn {
    padding: 10px 20px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .primary-btn:hover:not(:disabled) {
    background: #1976D2;
  }

  .primary-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .games-list {
    margin-top: 30px;
  }

  .empty-state {
    text-align: center;
    color: #999;
    padding: 40px;
  }

  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .game-card {
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
    transition: border-color 0.2s;
  }

  .game-card:hover {
    border-color: #2196F3;
  }

  .game-card.in-game {
    border-color: #4CAF50;
    background: #f1f8f4;
  }

  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  .game-id {
    font-weight: bold;
    color: #333;
  }

  .game-state {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }

  .game-state.waiting {
    background: #fff3cd;
    color: #856404;
  }

  .game-state.started {
    background: #d4edda;
    color: #155724;
  }

  .game-info {
    margin-bottom: 15px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .label {
    color: #666;
    font-size: 13px;
  }

  .value {
    color: #333;
    font-weight: 500;
    font-size: 13px;
  }

  .value.year {
    color: #2196F3;
    font-weight: bold;
  }

  .game-actions {
    display: flex;
    gap: 10px;
  }

  .join-btn {
    flex: 1;
    padding: 8px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
  }

  .join-btn:hover:not(:disabled) {
    background: #45a049;
  }

  .join-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .view-btn {
    flex: 1;
    padding: 8px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
  }

  .view-btn:hover {
    background: #1976D2;
  }
</style>
