<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { decryptPrivateKey, decryptChallenge } from '../utils/crypto';
  import { requestChallenge, submitChallengeResponse } from '../utils/api';
  import { getStoredEncryptedKey, storeAlias, getSessionGuid } from '../utils/storage';

  const dispatch = createEventDispatcher();

  let alias = '';
  let password = '';
  let message = '';
  let messageType: 'info' | 'error' | 'success' = 'info';
  let isLoading = false;

  async function handleLogin() {
    message = '';
    
    if (!alias || !password) {
      messageType = 'error';
      message = 'All fields are required';
      return;
    }

    isLoading = true;

    try {
      messageType = 'info';
      message = 'Requesting challenge...';

      const challengeData = await requestChallenge(alias);

      message = 'Decrypting challenge...';

      const guid = getSessionGuid();
      if (!guid) {
        throw new Error('No session GUID found');
      }

      const encryptedKey = getStoredEncryptedKey(guid);
      if (!encryptedKey) {
        messageType = 'error';
        message = 'No account found! Register instead.';
        isLoading = false;
        return;
      }

      let privateKey;
      try {
        privateKey = await decryptPrivateKey(encryptedKey, password);
      } catch (error) {
        messageType = 'error';
        message = 'Wrong password';
        isLoading = false;
        return;
      }

      const challengeText = await decryptChallenge(challengeData.encryptedChallenge, privateKey);

      message = 'Submitting response...';

      const result = await submitChallengeResponse(challengeData.challengeId, challengeText);

      if (result.success) {
        messageType = 'success';
        message = 'Login successful!';
        storeAlias(guid, alias);
        setTimeout(() => {
          dispatch('loggedIn', { alias });
        }, 1000);
      } else {
        messageType = 'error';
        message = result.error || 'Login failed';
      }
    } catch (error) {
      messageType = 'error';
      message = error instanceof Error ? error.message : 'An error occurred';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="login-form">
  <h2>Login</h2>
  <form on:submit|preventDefault={handleLogin}>
    <div class="form-group">
      <label for="loginAlias">Alias:</label>
      <input
        type="text"
        id="loginAlias"
        bind:value={alias}
        disabled={isLoading}
        required
      />
    </div>
    <div class="form-group">
      <label for="loginPassword">Password:</label>
      <input
        type="password"
        id="loginPassword"
        bind:value={password}
        disabled={isLoading}
        required
      />
    </div>
    <button type="submit" disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Login'}
    </button>
    {#if message}
      <div class="message {messageType}">{message}</div>
    {/if}
  </form>
</div>

<style>
  .login-form {
    padding: 20px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  button {
    padding: 10px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .message {
    margin-top: 10px;
    padding: 10px;
    border-radius: 4px;
  }

  .message.error {
    color: #d32f2f;
    background: #ffebee;
  }

  .message.success {
    color: #388e3c;
    background: #e8f5e9;
  }

  .message.info {
    color: #1976d2;
    background: #e3f2fd;
  }
</style>
