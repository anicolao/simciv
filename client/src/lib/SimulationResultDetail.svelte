<script lang="ts">
  import { onMount } from 'svelte';

  export let seed: number;
  export let result: any;
  export let parameters: any;
  export let onBack: () => void;

  let chartCanvas: HTMLCanvasElement;
  let chartInstance: any = null;

  onMount(async () => {
    // Dynamically import Chart.js
    const ChartModule = await import('chart.js/auto');
    const Chart = ChartModule.default;

    if (!result.AllMetrics || result.AllMetrics.length === 0) {
      return;
    }

    const metrics = result.AllMetrics;
    const days = metrics.map((m: any) => m.Day);
    
    // Create the chart
    chartInstance = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Population',
            data: metrics.map((m: any) => m.Population),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            yAxisID: 'y',
          },
          {
            label: 'Average Health',
            data: metrics.map((m: any) => m.AverageHealth),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            yAxisID: 'y1',
          },
          {
            label: 'Food Stockpile',
            data: metrics.map((m: any) => m.FoodStockpile),
            borderColor: 'rgb(255, 205, 86)',
            backgroundColor: 'rgba(255, 205, 86, 0.1)',
            yAxisID: 'y2',
          },
          {
            label: 'Science Points',
            data: metrics.map((m: any) => m.SciencePoints),
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            yAxisID: 'y3',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          title: {
            display: true,
            text: `Simulation Seed ${seed} - Metrics Over Time`,
          },
          legend: {
            position: 'top',
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Day',
            },
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Population',
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Health (0-100)',
            },
            grid: {
              drawOnChartArea: false,
            },
            max: 100,
          },
          y2: {
            type: 'linear',
            display: false,
            position: 'right',
            title: {
              display: true,
              text: 'Food Stockpile',
            },
          },
          y3: {
            type: 'linear',
            display: false,
            position: 'right',
            title: {
              display: true,
              text: 'Science Points',
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  });

  function getStatusBadge(): { text: string; class: string } {
    if (result.IsViable) {
      return { text: 'VIABLE', class: 'status-viable' };
    }
    return { text: 'NON-VIABLE', class: 'status-nonviable' };
  }
</script>

<div class="detail-view">
  <div class="header">
    <button on:click={onBack} class="back-button">← Back to Results</button>
    <h2>Simulation Seed {seed}</h2>
    <div class="status-badge {getStatusBadge().class}">
      {getStatusBadge().text}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <h3>Final Metrics</h3>
      <div class="metrics">
        <div class="metric">
          <span class="metric-label">Final Population:</span>
          <span class="metric-value">{result.FinalPopulation}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Final Health:</span>
          <span class="metric-value">{result.FinalAverageHealth?.toFixed(1)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Science Points:</span>
          <span class="metric-value">{result.FinalScience?.toFixed(1)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Fire Mastery:</span>
          <span class="metric-value">{result.HasFireMastery ? 'Unlocked' : 'Not Unlocked'}</span>
        </div>
      </div>
    </div>

    <div class="info-card">
      <h3>Progression</h3>
      <div class="metrics">
        <div class="metric">
          <span class="metric-label">Days to Fire Mastery:</span>
          <span class="metric-value">
            {result.DaysToFireMastery > 0 
              ? `${result.DaysToFireMastery} (${(result.DaysToFireMastery / 365).toFixed(1)} years)`
              : 'Never'}
          </span>
        </div>
        <div class="metric">
          <span class="metric-label">Peak Population:</span>
          <span class="metric-value">{result.PeakPopulation}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Minimum Population:</span>
          <span class="metric-value">{result.MinimumPopulation}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total Births:</span>
          <span class="metric-value">{result.TotalBirths}</span>
        </div>
      </div>
    </div>

    <div class="info-card">
      <h3>Starting Parameters</h3>
      <div class="metrics">
        <div class="metric">
          <span class="metric-label">Population:</span>
          <span class="metric-value">{parameters.population}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Health Range:</span>
          <span class="metric-value">{parameters.startingHealthMin}-{parameters.startingHealthMax}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Food Stockpile:</span>
          <span class="metric-value">{parameters.foodStockpile}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Food Allocation:</span>
          <span class="metric-value">{(parameters.foodAllocationRatio * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>

    {#if result.FailureReasons && result.FailureReasons.length > 0}
      <div class="info-card failure-reasons">
        <h3>Failure Reasons</h3>
        <ul>
          {#each result.FailureReasons as reason}
            <li>{reason}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>

  <div class="chart-container">
    <canvas bind:this={chartCanvas}></canvas>
  </div>

  {#if result.AllMetrics && result.AllMetrics.length > 0}
    <div class="data-table">
      <h3>Daily Metrics (Sample)</h3>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Population</th>
              <th>Health</th>
              <th>Food</th>
              <th>Science</th>
              <th>Births</th>
              <th>Deaths</th>
            </tr>
          </thead>
          <tbody>
            {#each result.AllMetrics.filter((_, i) => i % Math.max(1, Math.floor(result.AllMetrics.length / 50)) === 0) as metric}
              <tr>
                <td>{metric.Day}</td>
                <td>{metric.Population}</td>
                <td>{metric.AverageHealth.toFixed(1)}</td>
                <td>{metric.FoodStockpile.toFixed(1)}</td>
                <td>{metric.SciencePoints.toFixed(1)}</td>
                <td>{metric.Births}</td>
                <td>{metric.Deaths}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<style>
  .detail-view {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
  }

  .back-button {
    padding: 8px 16px;
    background: #666;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .back-button:hover {
    background: #555;
  }

  h2 {
    flex: 1;
    margin: 0;
    color: #333;
  }

  .status-badge {
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 14px;
  }

  .status-viable {
    background: #4CAF50;
    color: white;
  }

  .status-nonviable {
    background: #ff9800;
    color: white;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .info-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .info-card h3 {
    margin: 0 0 15px 0;
    color: #444;
    font-size: 16px;
  }

  .metrics {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .metric {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }

  .metric:last-child {
    border-bottom: none;
  }

  .metric-label {
    color: #666;
    font-weight: 500;
  }

  .metric-value {
    color: #333;
    font-weight: bold;
  }

  .failure-reasons {
    background: #fff3e0;
  }

  .failure-reasons ul {
    margin: 0;
    padding-left: 20px;
  }

  .failure-reasons li {
    color: #e65100;
    margin: 5px 0;
  }

  .chart-container {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
    height: 500px;
  }

  .data-table {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .data-table h3 {
    margin: 0 0 15px 0;
    color: #444;
  }

  .table-scroll {
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {
    background: #f5f5f5;
    position: sticky;
    top: 0;
  }

  th {
    padding: 12px;
    text-align: left;
    font-weight: bold;
    color: #333;
    border-bottom: 2px solid #ddd;
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
  }

  tbody tr:hover {
    background: #f9f9f9;
  }
</style>
