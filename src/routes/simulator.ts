import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

// Interface for simulation parameters
interface SimulationParameters {
  // Starting conditions
  population: number;
  startingHealthMin: number;
  startingHealthMax: number;
  foodStockpile: number;
  foodAllocationRatio: number;
  terrainMultiplier: number;
  
  // Simulation config
  maxDays: number;
  numSeeds: number; // How many random seeds to run (default 50)
}

// Interface for a single simulation result
interface SimulationResult {
  seed: number;
  result: any; // The full ViabilityResult from Go
}

// Interface for batch simulation results
interface BatchSimulationResults {
  parameters: SimulationParameters;
  results: SimulationResult[];
  timestamp: number;
}

/**
 * POST /api/simulator/run - Run simulations with custom parameters
 */
router.post('/run', async (req: Request, res: Response): Promise<void> => {
  try {
    const params: SimulationParameters = req.body;

    // Validate parameters
    if (!params.population || params.population < 1) {
      res.status(400).json({ error: 'Invalid population' });
      return;
    }

    if (!params.numSeeds || params.numSeeds < 1 || params.numSeeds > 100) {
      res.status(400).json({ error: 'numSeeds must be between 1 and 100' });
      return;
    }

    // Run simulations for multiple seeds
    const results: SimulationResult[] = [];
    const cliPath = path.join(__dirname, '../../simulation/cmd/simulator-cli/simulator-cli');

    for (let seed = 1; seed <= params.numSeeds; seed++) {
      const config = {
        seed,
        maxDays: params.maxDays || 1825,
        startingConditions: {
          population: params.population,
          startingHealthMin: params.startingHealthMin,
          startingHealthMax: params.startingHealthMax,
          foodStockpile: params.foodStockpile,
          foodAllocationRatio: params.foodAllocationRatio,
          terrainMultiplier: params.terrainMultiplier,
        },
      };

      try {
        const result = await runSimulation(cliPath, config);
        results.push({ seed, result: result.result });
      } catch (error) {
        console.error(`Error running simulation for seed ${seed}:`, error);
        results.push({ 
          seed, 
          result: { 
            error: 'Simulation failed',
            message: error instanceof Error ? error.message : String(error)
          } 
        });
      }
    }

    const response: BatchSimulationResults = {
      parameters: params,
      results,
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error running simulations:', error);
    res.status(500).json({ 
      error: 'Failed to run simulations',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Helper function to run a single simulation
 */
function runSimulation(cliPath: string, config: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const configJson = JSON.stringify(config);
    const child = spawn(cliPath, [configJson]);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`CLI exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse CLI output: ${error}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

export default router;
