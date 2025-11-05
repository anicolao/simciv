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
MaxDays:            400, // Look at first 400 days
}

result := simulator.RunSimulation(config)

fmt.Println("Detailed metrics (selected days):")
fmt.Printf("%-6s %-6s %-8s %-8s %-10s %-8s %-10s\n", "Day", "Pop", "Labor", "SciHrs", "SciProd", "TotSci", "Health")

days := []int{1, 50, 100, 150, 200, 250, 300, 350, 399}
for _, dayIdx := range days {
if dayIdx < len(result.AllMetrics) {
m := result.AllMetrics[dayIdx]

// Calculate labor hours (rough estimate)
// Assume each person works 8 hours if healthy
laborHours := float64(m.Population) * 8.0 * (m.AverageHealth / 100.0)
sciHours := laborHours * 0.3

// Calculate science production
sciProd := sciHours * 0.00015
if m.AverageHealth < 30.0 {
sciProd *= 0.5
}

fmt.Printf("%-6d %-6d %-8.0f %-8.0f %-10.3f %-8.2f %-10.1f\n",
m.Day, m.Population, laborHours, sciHours, sciProd, m.SciencePoints, m.AverageHealth)
}
}
}
