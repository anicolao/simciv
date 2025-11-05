package main

import "fmt"

func main() {
rate := 0.00015

// Assume stable population of ~300 (middle of 100-500 range)
pop := 300
workHoursPerDay := float64(pop) * 8.0 // 8 hours per person

allocations := []float64{0.4, 0.5, 0.6, 0.7}

fmt.Println("Expected science production:")
fmt.Printf("Rate: %.5f, Population: %d, Work hours/day: %.0f\n\n", rate, pop, workHoursPerDay)

for _, alloc := range allocations {
sciAlloc := 1.0 - alloc  // food allocation, so science is the remainder
sciHours := workHoursPerDay * sciAlloc
sciPerDay := sciHours * rate
daysTo100 := 100.0 / sciPerDay
yearsTo100 := daysTo100 / 365.0

fmt.Printf("%.0f/%.0f allocation: %.0f sci hours/day, %.3f sci/day, %.0f days (%.1f years) to 100 points\n",
alloc*100, sciAlloc*100, sciHours, sciPerDay, daysTo100, yearsTo100)
}
}
