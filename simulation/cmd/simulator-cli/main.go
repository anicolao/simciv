package main

import (
"encoding/json"
"fmt"
"os"

"github.com/anicolao/simciv/simulation/pkg/simulator"
)

// CLIConfig matches the SimulationConfig structure for JSON input
type CLIConfig struct {
Seed               int                         `json:"seed"`
MaxDays            int                         `json:"maxDays"`
StartingConditions simulator.StartingConditions `json:"startingConditions"`
}

// CLIResult wraps the ViabilityResult for JSON output
type CLIResult struct {
Result simulator.ViabilityResult `json:"result"`
}

func main() {
if len(os.Args) < 2 {
fmt.Fprintf(os.Stderr, "Usage: %s <json-config>\n", os.Args[0])
fmt.Fprintf(os.Stderr, "Example: %s '{\"seed\":1,\"maxDays\":1825,\"startingConditions\":{\"population\":100,\"startingHealthMin\":30,\"startingHealthMax\":50,\"foodStockpile\":100,\"foodAllocationRatio\":0.7,\"terrainMultiplier\":1.0}}'\n", os.Args[0])
os.Exit(1)
}

// Parse JSON config
var config CLIConfig
if err := json.Unmarshal([]byte(os.Args[1]), &config); err != nil {
fmt.Fprintf(os.Stderr, "Error parsing JSON config: %v\n", err)
os.Exit(1)
}

// Create SimulationConfig
simConfig := simulator.SimulationConfig{
Seed:               config.Seed,
MaxDays:            config.MaxDays,
StartingConditions: config.StartingConditions,
}

// Run simulation
result := simulator.RunSimulation(simConfig)

// Output result as JSON
output := CLIResult{Result: result}
jsonOutput, err := json.Marshal(output)
if err != nil {
fmt.Fprintf(os.Stderr, "Error marshaling result: %v\n", err)
os.Exit(1)
}

fmt.Println(string(jsonOutput))
}
