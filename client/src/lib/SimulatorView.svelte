<script lang="ts">
  import { onMount } from 'svelte';
  import SimulationResultDetail from './SimulationResultDetail.svelte';

  interface SimulationParameters {
    population: number;
    startingHealthMin: number;
    startingHealthMax: number;
    foodStockpile: number;
    foodAllocationRatio: number;
    terrainMultiplier: number;
    maxDays: number;
    numSeeds: number;
  }

  interface SimulationResult {
    seed: number;
    result: any;
  }

  interface BatchSimulationResults {
    parameters: SimulationParameters;
    results: SimulationResult[];
    timestamp: number;
  }

  // Default parameters from mechanics.go
  let parameters: SimulationParameters = {
    population: 100,
    startingHealthMin: 30,
    startingHealthMax: 50,
    foodStockpile: 100,
    foodAllocationRatio: 0.7,
    terrainMultiplier: 1.0,
    maxDays: 1825,
    numSeeds: 50,
  };

  let isRunning = false;
  let batchResults: BatchSimulationResults | null = null;
  let selectedSeed: number | null = null;
  let error: string | null = null;

  async function runSimulations() {
    isRunning = true;
    error = null;
    batchResults = null;
    selectedSeed = null;

    try {
      const response = await fetch('/api/simulator/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run simulations');
      }

      batchResults = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error running simulations:', err);
    } finally {
      isRunning = false;
    }
  }

  function viewDetails(seed: number) {
    selectedSeed = seed;
  }

  function backToResults() {
    selectedSeed = null;
  }

  function getResultSummary(result: any): string {
    if (result.error) {
      return `Error: ${result.message}`;
    }
    if (result.IsViable) {
      return `✓ Viable (Fire Mastery: Day ${result.DaysToFireMastery})`;
    }
    return `✗ Non-viable (${result.FailureReasons?.join(', ') || 'Unknown'})`;
  }

  function getResultClass(result: any): string {
    if (result.error) return 'result-error';
    return result.IsViable ? 'result-viable' : 'result-nonviable';
  }

  function getViabilityStats(): { viable: number; total: number; rate: number } {
    if (!batchResults) return { viable: 0, total: 0, rate: 0 };
    
    const viable = batchResults.results.filter(r => r.result.IsViable).length;
    const total = batchResults.results.length;
    const rate = total > 0 ? (viable / total) * 100 : 0;
    
    return { viable, total, rate };
  }
</script>

{#if selectedSeed !== null && batchResults}
  {@const selectedResult = batchResults.results.find(r => r.seed === selectedSeed)}
  {#if selectedResult}
    <SimulationResultDetail 
      seed={selectedSeed}
      result={selectedResult.result}
      parameters={batchResults.parameters}
      onBack={backToResults}
    />
  {/if}
{:else}
  <div class="simulator-view">
    <h2>Civilization Simulator</h2>
    <p class="description">
      Adjust parameters and run multiple simulation seeds to explore viability.
      Each simulation runs until Fire Mastery is achieved or the civilization fails.
    </p>

    <div class="parameters">
      <h3>Starting Conditions</h3>
      
      <div class="param-group">
        <label>
          Population: {parameters.population}
          <input type="range" bind:value={parameters.population} min="10" max="500" step="10" />
        </label>
        
        <label>
          Starting Health Min: {parameters.startingHealthMin}
          <input type="range" bind:value={parameters.startingHealthMin} min="0" max="100" step="5" />
        </label>
        
        <label>
          Starting Health Max: {parameters.startingHealthMax}
          <input type="range" bind:value={parameters.startingHealthMax} min="0" max="100" step="5" />
        </label>
        
        <label>
          Food Stockpile: {parameters.foodStockpile}
          <input type="range" bind:value={parameters.foodStockpile} min="0" max="1000" step="50" />
        </label>
        
        <label>
          Food Allocation Ratio: {parameters.foodAllocationRatio.toFixed(2)} (70% food, 30% science recommended)
          <input type="range" bind:value={parameters.foodAllocationRatio} min="0" max="1" step="0.05" />
        </label>
        
        <label>
          Terrain Multiplier: {parameters.terrainMultiplier.toFixed(2)}
          <input type="range" bind:value={parameters.terrainMultiplier} min="0.5" max="2.0" step="0.1" />
        </label>
      </div>

      <h3>Simulation Settings</h3>
      
      <div class="param-group">
        <label>
          Max Days: {parameters.maxDays} ({(parameters.maxDays / 365).toFixed(1)} years)
          <input type="range" bind:value={parameters.maxDays} min="365" max="7300" step="365" />
        </label>
        
        <label>
          Number of Seeds: {parameters.numSeeds}
          <input type="range" bind:value={parameters.numSeeds} min="1" max="100" step="1" />
        </label>
      </div>
    </div>

    <div class="actions">
      <button 
        on:click={runSimulations} 
        disabled={isRunning}
        class="run-button"
      >
        {isRunning ? 'Running Simulations...' : 'Run Simulations'}
      </button>
    </div>

    {#if error}
      <div class="error">{error}</div>
    {/if}

    {#if batchResults}
      {@const stats = getViabilityStats()}
      <div class="results">
        <h3>Results Summary</h3>
        <div class="stats">
          <div class="stat">
            <span class="stat-label">Viable:</span>
            <span class="stat-value">{stats.viable} / {stats.total}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Viability Rate:</span>
            <span class="stat-value">{stats.rate.toFixed(1)}%</span>
          </div>
        </div>

        <div class="results-table">
          <table>
            <thead>
              <tr>
                <th>Seed</th>
                <th>Status</th>
                <th>Final Pop</th>
                <th>Science</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each batchResults.results as { seed, result }}
                <tr class={getResultClass(result)}>
                  <td>{seed}</td>
                  <td>{getResultSummary(result)}</td>
                  <td>{result.FinalPopulation || 'N/A'}</td>
                  <td>{result.FinalScience?.toFixed(1) || 'N/A'}</td>
                  <td>
                    {#if !result.error}
                      <button on:click={() => viewDetails(seed)} class="detail-button">
                        View Details
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .simulator-view {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  h2 {
    color: #333;
    margin-bottom: 10px;
  }

  .description {
    color: #666;
    margin-bottom: 20px;
  }

  .parameters {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  h3 {
    color: #444;
    margin-bottom: 15px;
  }

  .param-group {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 5px;
    color: #555;
    font-weight: 500;
  }

  input[type="range"] {
    width: 100%;
  }

  .actions {
    text-align: center;
    margin: 20px 0;
  }

  .run-button {
    padding: 12px 32px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .run-button:hover:not(:disabled) {
    background: #45a049;
  }

  .run-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .error {
    padding: 15px;
    background: #ffebee;
    color: #c62828;
    border-radius: 4px;
    margin: 20px 0;
  }

  .results {
    margin-top: 30px;
  }

  .stats {
    display: flex;
    gap: 30px;
    margin-bottom: 20px;
    padding: 15px;
    background: #e8f5e9;
    border-radius: 4px;
  }

  .stat {
    display: flex;
    gap: 10px;
  }

  .stat-label {
    font-weight: bold;
    color: #333;
  }

  .stat-value {
    color: #2e7d32;
    font-weight: 500;
  }

  .results-table {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  thead {
    background: #f5f5f5;
  }

  th {
    padding: 12px;
    text-align: left;
    font-weight: bold;
    color: #333;
    border-bottom: 2px solid #ddd;
  }

  td {
    padding: 10px 12px;
    border-bottom: 1px solid #eee;
  }

  .result-viable {
    background: #f1f8f4;
  }

  .result-nonviable {
    background: #fff3e0;
  }

  .result-error {
    background: #ffebee;
  }

  .detail-button {
    padding: 6px 12px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .detail-button:hover {
    background: #1976D2;
  }
</style>
