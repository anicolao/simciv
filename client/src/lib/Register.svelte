<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    generateKeyPair,
    exportPublicKey,
    exportPrivateKey,
    encryptPrivateKey
  } from '../utils/crypto';
  import { checkAliasAvailability, registerUser } from '../utils/api';
  import { storeEncryptedKey, storeAlias, getSessionGuid } from '../utils/storage';

  const dispatch = createEventDispatcher();

  let alias = '';
  let password = '';
  let passwordConfirm = '';
  let message = '';
  let messageType: 'info' | 'error' | 'success' = 'info';
  let isLoading = false;

  async function handleRegister() {
    message = '';
    
    if (!alias || !password || !passwordConfirm) {
      messageType = 'error';
      message = 'All fields are required';
      return;
    }

    if (password !== passwordConfirm) {
      messageType = 'error';
      message = 'Passwords do not match';
      return;
    }

    isLoading = true;

    try {
      messageType = 'info';
      message = 'Checking alias availability...';

      const available = await checkAliasAvailability(alias);
      if (!available) {
        messageType = 'error';
        message = 'Alias already taken';
        isLoading = false;
        return;
      }

      message = 'Generating keys... (this may take a moment)';

      const keyPair = await generateKeyPair();
      const publicKeyPem = await exportPublicKey(keyPair.publicKey);
      const privateKeyData = await exportPrivateKey(keyPair.privateKey);

      message = 'Encrypting private key...';

      const encryptedPrivateKey = await encryptPrivateKey(privateKeyData, password);
      const guid = getSessionGuid();

      if (guid) {
        storeEncryptedKey(guid, encryptedPrivateKey);
        storeAlias(guid, alias);
      }

      message = 'Registering account...';

      const result = await registerUser(alias, publicKeyPem);

      if (result.success) {
        messageType = 'success';
        message = 'Registration successful!';
        setTimeout(() => {
          dispatch('registered', { alias });
        }, 1000);
      } else {
        messageType = 'error';
        message = result.error || 'Registration failed';
      }
    } catch (error) {
      messageType = 'error';
      message = error instanceof Error ? error.message : 'An error occurred';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="register-form">
  <h2>Register New Account</h2>
  <form on:submit|preventDefault={handleRegister}>
    <div class="form-group">
      <label for="alias">Alias:</label>
      <input
        type="text"
        id="alias"
        bind:value={alias}
        disabled={isLoading}
        required
      />
    </div>
    <div class="form-group">
      <label for="password">Password:</label>
      <input
        type="password"
        id="password"
        bind:value={password}
        disabled={isLoading}
        required
      />
    </div>
    <div class="form-group">
      <label for="passwordConfirm">Confirm Password:</label>
      <input
        type="password"
        id="passwordConfirm"
        bind:value={passwordConfirm}
        disabled={isLoading}
        required
      />
    </div>
    <button type="submit" disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Register'}
    </button>
    {#if message}
      <div class="message {messageType}">{message}</div>
    {/if}
  </form>
</div>

<style>
  .register-form {
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
