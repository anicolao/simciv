<script lang="ts">
  import { onMount } from 'svelte';
  import Register from './lib/Register.svelte';
  import Login from './lib/Login.svelte';
  import { getSessionStatus, logout } from './utils/api';
  import { getSessionGuid } from './utils/storage';

  let activeTab: 'register' | 'login' = 'register';
  let isAuthenticated = false;
  let currentUser = '';
  let sessionInfo = '';

  onMount(async () => {
    try {
      const status = await getSessionStatus();
      sessionInfo = `Session: ${status.sessionGuid} | State: ${status.state}`;
      
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
</script>

<main>
  <h1>SimCiv Authentication</h1>
  
  {#if sessionInfo}
    <div class="session-info">{sessionInfo}</div>
  {/if}

  {#if isAuthenticated}
    <div class="authenticated">
      <h2>Welcome!</h2>
      <p>You are logged in as: <strong>{currentUser}</strong></p>
      <button on:click={handleLogout}>Logout</button>
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

  .session-info {
    background: #e3f2fd;
    color: #1976d2;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
    font-size: 12px;
    text-align: center;
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
    text-align: center;
    padding: 40px 20px;
  }

  .authenticated h2 {
    color: #388e3c;
    margin-bottom: 20px;
  }

  .authenticated p {
    font-size: 16px;
    margin-bottom: 30px;
  }

  .authenticated strong {
    color: #4CAF50;
  }

  .authenticated button {
    padding: 10px 30px;
    background: #f44336;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
  }

  .authenticated button:hover {
    background: #d32f2f;
  }
</style>
