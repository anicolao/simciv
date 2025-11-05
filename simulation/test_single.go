package main

import (
"fmt"
"github.com/anicolao/simciv/simulation/pkg/simulator"
)

func main() {
conditions := simulator.DefaultStartingConditions()
conditions.FoodAllocationRatio = 0.7 // 70/30

config := simulator.SimulationConfig{
Seed:               12345,
StartingConditions: conditions,
MaxDays:            3650, // 10 years
}

result := simulator.RunSimulation(config)

fmt.Printf("Final Science: %.2f\n", result.FinalScience)
fmt.Printf("Final Population: %d\n", result.FinalPopulation)
fmt.Printf("Fire Mastery Unlocked: %v\n", result.FireMasteryUnlocked)
fmt.Printf("Days to Fire Mastery: %d\n", result.DaysToFireMastery)
fmt.Printf("Total Births: %d\n", result.TotalBirths)
fmt.Printf("Average Health: %.2f\n", result.AverageHealth)

// Show some daily metrics
fmt.Println("\nSample daily metrics (every 365 days):")
for i := 0; i < len(result.AllMetrics); i += 365 {
m := result.AllMetrics[i]
fmt.Printf("Day %4d: Pop=%3d, Science=%.2f, Food=%.1f, Health=%.1f\n",
m.Day, m.Population, m.SciencePoints, m.FoodStockpile, m.AverageHealth)
}
}
