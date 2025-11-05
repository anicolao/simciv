<script lang="ts">
  import { onMount } from 'svelte';
  import Register from './lib/Register.svelte';
  import Login from './lib/Login.svelte';
  import GameLobby from './lib/GameLobby.svelte';
  import GameView from './lib/GameView.svelte';
  import { getSessionStatus, logout } from './utils/api';
  import { getSessionGuid } from './utils/storage';

  let activeTab: 'register' | 'login' = 'register';
  let isAuthenticated = false;
  let currentUser = '';
  let currentView: 'lobby' | 'game' = 'lobby';
  let selectedGameId: string | null = null;

  onMount(async () => {
    try {
      const status = await getSessionStatus();
      
      if (status.state === 'authenticated' && status.userId) {
        isAuthenticated = true;
        currentUser = status.userId;
      }
    } catch (error) {
      console.error('Failed to get session status:', error);
    }
  });

  function handleRegistered(event: CustomEvent) {
    isAuthenticated = true;
    currentUser = event.detail.alias;
  }

  function handleLoggedIn(event: CustomEvent) {
    isAuthenticated = true;
    currentUser = event.detail.alias;
  }

  async function handleLogout() {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  function switchTab(tab: 'register' | 'login') {
    activeTab = tab;
  }

  function handleViewGame(event: CustomEvent) {
    selectedGameId = event.detail.gameId;
    currentView = 'game';
  }

  function handleBackToLobby() {
    currentView = 'lobby';
    selectedGameId = null;
  }
</script>

{#if isAuthenticated && currentView === 'game' && selectedGameId}
  <GameView gameId={selectedGameId} onBack={handleBackToLobby} />
{:else}
  <main>
    <h1>SimCiv Authentication</h1>

    {#if isAuthenticated}
      <div class="authenticated">
        <div class="header">
          <div class="user-info">
            <h2>Welcome, {currentUser}!</h2>
          </div>
          <button on:click={handleLogout} class="logout-btn">Logout</button>
        </div>
        <GameLobby {currentUser} on:viewGame={handleViewGame} />
      </div>
    {:else}
      <div class="tabs">
        <button
          class:active={activeTab === 'register'}
          on:click={() => switchTab('register')}
        >
          Register
        </button>
        <button
          class:active={activeTab === 'login'}
          on:click={() => switchTab('login')}
        >
          Login
        </button>
      </div>

      <div class="tab-content">
        {#if activeTab === 'register'}
          <Register on:registered={handleRegistered} />
        {:else}
          <Login on:loggedIn={handleLoggedIn} />
        {/if}
      </div>
    {/if}
  </main>
{/if}

<style>
  :global(body) {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
  }

  main {
    max-width: 600px;
    margin: 50px auto;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 20px;
  }

  .tabs {
    display: flex;
    gap: 0;
    margin-bottom: 20px;
    border-bottom: 2px solid #ddd;
  }

  .tabs button {
    flex: 1;
    padding: 12px;
    background: #f5f5f5;
    border: none;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  .tabs button:hover {
    background: #e0e0e0;
  }

  .tabs button.active {
    background: white;
    color: #4CAF50;
    font-weight: bold;
    border-bottom: 2px solid #4CAF50;
    margin-bottom: -2px;
  }

  .tab-content {
    min-height: 300px;
  }

  .authenticated {
    padding: 0;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: #f5f5f5;
    border-bottom: 2px solid #ddd;
  }

  .user-info h2 {
    color: #388e3c;
    margin: 0;
    font-size: 20px;
  }

  .logout-btn {
    padding: 10px 20px;
    background: #f44336;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
  }

  .logout-btn:hover {
    background: #d32f2f;
  }
</style>
