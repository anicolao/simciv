package simulator

import "fmt"

func TestDebug() {
config := SimulationConfig{
Seed:               12345,
StartingConditions: DefaultStartingConditions(),
MaxDays:            7300, // 20 years
}

result := RunSimulation(config)

fmt.Printf("Final science: %.2f\n", result.FinalScience)
fmt.Printf("Fire Mastery: %v (day %d)\n", result.HasFireMastery, result.DaysToFireMastery)
fmt.Printf("Stone Knapping: %v (day %d)\n", result.HasStoneKnapping, result.DaysToStoneKnapping)
fmt.Printf("Final population: %d\n", result.FinalPopulation)

// Check some metrics
if len(result.AllMetrics) > 0 {
day1000 := -1
day3650 := -1
day7300 := -1
for i, m := range result.AllMetrics {
if m.Day == 1000 {
day1000 = i
}
if m.Day == 3650 {
day3650 = i
}
if m.Day == 7300 {
day7300 = i
}
}

if day1000 >= 0 {
m := result.AllMetrics[day1000]
fmt.Printf("Day 1000: Science=%.2f, Pop=%d\n", m.SciencePoints, m.Population)
}
if day3650 >= 0 {
m := result.AllMetrics[day3650]
fmt.Printf("Day 3650 (10yr): Science=%.2f, Pop=%d\n", m.SciencePoints, m.Population)
}
if day7300 >= 0 {
m := result.AllMetrics[day7300]
fmt.Printf("Day 7300 (20yr): Science=%.2f, Pop=%d\n", m.SciencePoints, m.Population)
}
}
}
