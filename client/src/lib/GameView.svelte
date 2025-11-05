<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getGame } from '../utils/api';
  import MapView from './MapView.svelte';

  export let gameId: string;
  export let onBack: () => void;

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

  let game: Game | null = null;
  let loading = true;
  let error = '';
  let pollingInterval: number;
  
  // Layout state
  let layoutMode: 'landscape' | 'portrait' | 'square' = 'landscape';
  let windowWidth = 0;
  let windowHeight = 0;

  onMount(async () => {
    // Initial window dimensions
    updateWindowDimensions();
    
    // Listen for window resize
    window.addEventListener('resize', updateWindowDimensions);
    
    // Load game data
    await loadGame();
    
    // Poll for updates every 2 seconds
    pollingInterval = window.setInterval(loadGame, 2000);
  });

  onDestroy(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    window.removeEventListener('resize', updateWindowDimensions);
  });

  function updateWindowDimensions() {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    
    // Determine layout mode based on aspect ratio
    const aspectRatio = windowWidth / windowHeight;
    
    // Square mode: aspect ratio between 0.8 and 1.2
    if (aspectRatio > 0.8 && aspectRatio < 1.2) {
      layoutMode = 'square';
    } else if (aspectRatio >= 1.2) {
      layoutMode = 'landscape';
    } else {
      layoutMode = 'portrait';
    }
    
    console.log('[GameView] Window dimensions:', windowWidth, 'x', windowHeight, 'layout:', layoutMode);
  }

  async function loadGame() {
    try {
      const response = await getGame(gameId);
      game = response.game;
      loading = false;
    } catch (err: any) {
      error = err.message || 'Failed to load game';
      loading = false;
    }
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

  // Calculate control panel dimensions based on layout mode
  $: controlPanelStyle = (() => {
    if (layoutMode === 'landscape') {
      // Controls on right: 20-30% of width
      const width = Math.max(280, Math.min(400, windowWidth * 0.25));
      return `width: ${width}px; height: 100vh;`;
    } else if (layoutMode === 'portrait') {
      // Controls on bottom: 20-30% of height
      const height = Math.max(200, Math.min(350, windowHeight * 0.25));
      return `width: 100vw; height: ${height}px;`;
    } else {
      // Square mode: 34% of longer dimension (height if nearly equal)
      const height = windowHeight * 0.34;
      return `width: 100vw; height: ${height}px;`;
    }
  })();

  // Calculate map area dimensions
  $: mapAreaStyle = (() => {
    if (layoutMode === 'landscape') {
      const controlWidth = Math.max(280, Math.min(400, windowWidth * 0.25));
      const mapWidth = windowWidth - controlWidth;
      return `width: ${mapWidth}px; height: 100vh;`;
    } else if (layoutMode === 'portrait') {
      const controlHeight = Math.max(200, Math.min(350, windowHeight * 0.25));
      const mapHeight = windowHeight - controlHeight;
      return `width: 100vw; height: ${mapHeight}px;`;
    } else {
      // Square mode: 66% of height
      const mapHeight = windowHeight * 0.66;
      return `width: 100vw; height: ${mapHeight}px;`;
    }
  })();
</script>

<div class="game-view" class:landscape={layoutMode === 'landscape'} class:portrait={layoutMode === 'portrait'} class:square={layoutMode === 'square'}>
  {#if loading}
    <div class="loading">Loading game...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if game}
    <div class="map-area" style={mapAreaStyle}>
      {#if game.state === 'started'}
        {#key gameId}
          <MapView {gameId} fillContainer={true} />
        {/key}
      {:else}
        <div class="map-placeholder">
          <p>Game has not started yet. Waiting for players...</p>
        </div>
      {/if}
    </div>

    <div class="control-panel" style={controlPanelStyle}>
      <div class="control-header">
        <button on:click={onBack} class="back-btn">← Back to Lobby</button>
      </div>

      <div class="control-content">
        <h2>Game #{game.gameId.slice(0, 8)}</h2>
        
        <div class="info-section">
          <div class="info-row">
            <span class="label">State:</span>
            <span class="value" class:waiting={game.state === 'waiting'} class:started={game.state === 'started'}>
              {game.state === 'waiting' ? 'Waiting' : 'Started'}
            </span>
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
          
          <div class="info-row">
            <span class="label">Creator:</span>
            <span class="value">{game.creatorUserId}</span>
          </div>
        </div>

        {#if game.playerList && game.playerList.length > 0}
          <div class="players-section">
            <h3>Players</h3>
            <ul class="player-list">
              {#each game.playerList as player}
                <li>{player}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .game-view {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #000;
    display: flex;
    overflow: hidden;
  }

  .game-view.landscape {
    flex-direction: row;
  }

  .game-view.portrait,
  .game-view.square {
    flex-direction: column;
  }

  .map-area {
    position: relative;
    background: #000;
    overflow: hidden;
  }

  .map-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #fff;
    text-align: center;
    padding: 20px;
  }

  .control-panel {
    background: #2c2c2c;
    color: #fff;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .control-header {
    padding: 15px;
    border-bottom: 2px solid #444;
    background: #1a1a1a;
  }

  .back-btn {
    padding: 10px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
  }

  .back-btn:hover {
    background: #45a049;
  }

  .control-content {
    padding: 20px;
    flex: 1;
  }

  .control-content h2 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #fff;
    font-size: 20px;
  }

  .info-section {
    margin-bottom: 30px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #444;
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .label {
    color: #aaa;
    font-size: 14px;
  }

  .value {
    color: #fff;
    font-weight: 500;
    font-size: 14px;
  }

  .value.waiting {
    color: #ffc107;
  }

  .value.started {
    color: #4CAF50;
  }

  .value.year {
    color: #2196F3;
    font-weight: bold;
  }

  .players-section {
    margin-top: 20px;
  }

  .players-section h3 {
    color: #fff;
    font-size: 16px;
    margin-bottom: 10px;
  }

  .player-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .player-list li {
    padding: 8px 12px;
    background: #3a3a3a;
    margin-bottom: 5px;
    border-radius: 4px;
    color: #fff;
  }

  .loading,
  .error {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    padding: 40px;
    font-size: 18px;
    color: #fff;
  }

  .error {
    color: #f44336;
    background: rgba(255, 235, 238, 0.1);
    border-radius: 8px;
  }
</style>
