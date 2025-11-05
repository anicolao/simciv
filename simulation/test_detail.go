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

fmt.Println("Daily metrics (every 100 days):")
fmt.Printf("%-6s %-8s %-10s %-10s %-10s %-10s\n", "Day", "Pop", "Science", "SciGained", "Food", "Health")

prevScience := 0.0
for i := 0; i < len(result.AllMetrics); i++ {
if i % 100 == 0 || i == len(result.AllMetrics)-1 {
m := result.AllMetrics[i]
sciGained := m.SciencePoints - prevScience
fmt.Printf("%-6d %-8d %-10.2f %-10.3f %-10.1f %-10.1f\n",
m.Day, m.Population, m.SciencePoints, sciGained, m.FoodStockpile, m.AverageHealth)
prevScience = m.SciencePoints
}
}
}
