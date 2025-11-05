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
MaxDays:            600, // Look at the crash period
}

result := simulator.RunSimulation(config)

fmt.Println("Daily metrics (every 50 days):")
fmt.Printf("%-6s %-8s %-12s %-12s %-12s %-10s\n", "Day", "Pop", "FoodStock", "FoodProd", "FoodCons", "Health")

for i := 0; i < len(result.AllMetrics); i++ {
if i % 50 == 0 || i == len(result.AllMetrics)-1 {
m := result.AllMetrics[i]
// Estimate food produced/consumed from stockpile change
var foodChange float64
if i > 0 {
foodChange = m.FoodStockpile - result.AllMetrics[i-1].FoodStockpile
}
foodCons := float64(m.Population) * 2.0
foodProd := foodChange + foodCons

fmt.Printf("%-6d %-8d %-12.1f %-12.1f %-12.1f %-10.1f\n",
m.Day, m.Population, m.FoodStockpile, foodProd, foodCons, m.AverageHealth)
}
}
}
