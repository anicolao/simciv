package simulator

import (
	"fmt"
	"math"
)

// DefaultStartingConditions returns the default starting conditions from the design document
func DefaultStartingConditions() StartingConditions {
	return StartingConditions{
		Population:          100,
		StartingHealthMin:   30.0,
		StartingHealthMax:   50.0,
		FoodStockpile:       100.0,
		FoodAllocationRatio: 0.8,
		TerrainMultiplier:   1.0,
	}
}

// initializePopulation creates the initial population with age and gender distribution
func initializePopulation(conditions StartingConditions, rng *RandomGenerator) []*MinimalHuman {
	humans := make([]*MinimalHuman, 0, conditions.Population)

	// Age distribution adjusted per feedback:
	// children_0_14: 25% (reduced by 5%)
	// adults_15_30: 60% (increased by 10%)
	// elders_31_plus: 15% (reduced by 5%)

	childrenCount := int(float64(conditions.Population) * 0.25)
	adultsCount := int(float64(conditions.Population) * 0.60)
	eldersCount := conditions.Population - childrenCount - adultsCount

	// Create children (0-14 years)
	for i := 0; i < childrenCount; i++ {
		gender := "male"
		if rng.NextBool(0.5) {
			gender = "female"
		}
		humans = append(humans, &MinimalHuman{
			ID:      generateID(rng),
			Age:     rng.NextInRange(0, 15),
			Gender:  gender,
			Health:  rng.NextInRange(conditions.StartingHealthMin, conditions.StartingHealthMax),
			IsAlive: true,
		})
	}

	// Create adults (15-30 years)
	for i := 0; i < adultsCount; i++ {
		gender := "male"
		if rng.NextBool(0.5) {
			gender = "female"
		}
		humans = append(humans, &MinimalHuman{
			ID:      generateID(rng),
			Age:     rng.NextInRange(15, 31),
			Gender:  gender,
			Health:  rng.NextInRange(conditions.StartingHealthMin, conditions.StartingHealthMax),
			IsAlive: true,
		})
	}

	// Create elders (31+ years)
	for i := 0; i < eldersCount; i++ {
		gender := "male"
		if rng.NextBool(0.5) {
			gender = "female"
		}
		humans = append(humans, &MinimalHuman{
			ID:      generateID(rng),
			Age:     rng.NextInRange(31, 50),
			Gender:  gender,
			Health:  rng.NextInRange(conditions.StartingHealthMin, conditions.StartingHealthMax),
			IsAlive: true,
		})
	}

	return humans
}

// RunSimulation executes the minimal simulator until Fire Mastery or failure
func RunSimulation(config SimulationConfig) ViabilityResult {
	// Initialize RNG
	rng := NewRandomGenerator(config.Seed)

	// Set defaults
	if config.MaxDays == 0 {
		config.MaxDays = 1825 // 5 years
	}

	// Initialize population
	humans := initializePopulation(config.StartingConditions, rng)

	// Initialize state
	state := &MinimalCivilizationState{
		Humans:              humans,
		FoodStockpile:       config.StartingConditions.FoodStockpile,
		SciencePoints:       0,
		FoodAllocationRatio: config.StartingConditions.FoodAllocationRatio,
		HasFireMastery:      false,
		CurrentDay:          0,
	}

	// Track metrics
	allMetrics := make([]*DailyMetrics, 0, config.MaxDays)

	// Simulation loop
	for state.CurrentDay < config.MaxDays {
		state.CurrentDay++

		// Step 1: Calculate available labor
		totalWorkHours := calculateAvailableLabor(state.Humans)

		// Step 2: Allocate labor to food/science
		foodHours, scienceHours := allocateLabor(totalWorkHours, state.FoodAllocationRatio)

		// Step 3: Produce food and science
		avgHealth := calculateAverageHealth(state.Humans)
		population := countAlive(state.Humans)

		foodProduced := produceFood(foodHours, state.HasFireMastery, config.StartingConditions.TerrainMultiplier)
		scienceProduced := produceScience(scienceHours, population, avgHealth)

		state.FoodStockpile += foodProduced
		state.SciencePoints += scienceProduced

		// Step 4: Consume food
		remainingFood, foodPerPerson := consumeFood(state.Humans, state.FoodStockpile)
		state.FoodStockpile = remainingFood

		// Step 5: Update health based on nutrition
		for _, human := range state.Humans {
			updateHealth(human, foodPerPerson)
		}

		// Step 6: Age all humans
		ageHumans(state.Humans)

		// Step 7: Process mortality checks
		deaths := 0
		for _, human := range state.Humans {
			if checkMortality(human, rng) {
				deaths++
			}
		}

		// Step 8: Process reproduction checks
		newborns := attemptReproduction(state.Humans, rng)
		births := len(newborns)
		state.Humans = append(state.Humans, newborns...)

		// Step 9: Check for Fire Mastery unlock
		checkTechnologyUnlock(state)

		// Step 10: Record metrics
		metrics := &DailyMetrics{
			Day:               state.CurrentDay,
			Population:        countAlive(state.Humans),
			AverageHealth:     calculateAverageHealth(state.Humans),
			FoodStockpile:     state.FoodStockpile,
			SciencePoints:     state.SciencePoints,
			FoodProduction:    foodProduced,
			ScienceProduction: scienceProduced,
			Births:            births,
			Deaths:            deaths,
			HasFireMastery:    state.HasFireMastery,
		}
		allMetrics = append(allMetrics, metrics)

		// Check for termination conditions
		if state.HasFireMastery {
			// Success! Fire Mastery unlocked
			break
		}
		if countAlive(state.Humans) == 0 {
			// Extinction
			break
		}
		
		// Check for population decline over past year (365 days)
		// If population has declined or stayed same, halt as non-viable
		if state.CurrentDay >= 365 {
			yearAgoIdx := state.CurrentDay - 365 - 1 // -1 for 0-indexing
			if yearAgoIdx >= 0 && yearAgoIdx < len(allMetrics) {
				yearAgoPop := allMetrics[yearAgoIdx].Population
				currentPop := metrics.Population
				if currentPop <= yearAgoPop {
					// Population not growing - halt simulation
					break
				}
			}
		}
	}

	// Assess viability
	return assessViability(config.StartingConditions.Population, allMetrics, config.MaxDays)
}

// assessViability evaluates whether a starting position is viable
func assessViability(startingPopulation int, allMetrics []*DailyMetrics, maxDays int) ViabilityResult {
	if len(allMetrics) == 0 {
		return ViabilityResult{
			IsViable:         false,
			FailureReasons:   []string{"No metrics recorded"},
			DaysToNonViable:  -1,
			AllMetrics:       allMetrics,
		}
	}

	failures := []string{}
	lastDay := allMetrics[len(allMetrics)-1]
	daysToNonViable := -1

	// Find day when Fire Mastery was unlocked (if ever)
	fireMasteryDay := -1
	for _, m := range allMetrics {
		if m.HasFireMastery {
			fireMasteryDay = m.Day
			break
		}
	}

	// Calculate population metrics and check for 1-year decline
	peakPopulation := 0
	minimumPopulation := startingPopulation
	totalBirths := 0
	
	// Check for population decline in any 1-year (365-day) period
	for i, m := range allMetrics {
		if m.Population > peakPopulation {
			peakPopulation = m.Population
		}
		if m.Population < minimumPopulation {
			minimumPopulation = m.Population
		}
		totalBirths += m.Births
		
		// Check if we have a full year of data from this point
		if i >= 365 {
			yearAgoPop := allMetrics[i-365].Population
			currentPop := m.Population
			
			// If population declined or stayed same over the past year, mark as non-viable
			if currentPop <= yearAgoPop && daysToNonViable == -1 {
				daysToNonViable = m.Day
				failures = append(failures, fmt.Sprintf("Population declined/stagnated over 1-year period (day %d: %d -> day %d: %d)", 
					allMetrics[i-365].Day, yearAgoPop, m.Day, currentPop))
			}
		}
	}

	// Criterion 1: Fire Mastery must be unlocked
	if !lastDay.HasFireMastery {
		failures = append(failures, "Fire Mastery not unlocked")
	}

	// Criterion 2: Fire Mastery must be unlocked in reasonable time
	if fireMasteryDay < 0 {
		failures = append(failures, "Fire Mastery never unlocked")
	} else if fireMasteryDay > maxDays {
		failures = append(failures, "Fire Mastery took too long")
	}

	// Criterion 3: Population must not go extinct
	if lastDay.Population == 0 {
		failures = append(failures, "Population extinct")
		if daysToNonViable == -1 {
			// Find when extinction happened
			for _, m := range allMetrics {
				if m.Population == 0 {
					daysToNonViable = m.Day
					break
				}
			}
		}
	}

	// Criterion 4: Average health must remain viable
	totalHealth := 0.0
	for _, m := range allMetrics {
		totalHealth += m.AverageHealth
	}
	avgHealthOverTime := totalHealth / float64(len(allMetrics))
	if avgHealthOverTime < 30 {
		failures = append(failures, "Average health too low over time")
	}

	return ViabilityResult{
		IsViable:            len(failures) == 0,
		FailureReasons:      failures,
		FinalPopulation:     lastDay.Population,
		FinalScience:        lastDay.SciencePoints,
		AverageHealth:       avgHealthOverTime,
		DaysToFireMastery:   fireMasteryDay,
		DaysToNonViable:     daysToNonViable,
		FinalAverageHealth:  lastDay.AverageHealth,
		PeakPopulation:      peakPopulation,
		MinimumPopulation:   minimumPopulation,
		FireMasteryUnlocked: lastDay.HasFireMastery,
		TotalBirths:         totalBirths,
		HasFireMastery:      lastDay.HasFireMastery,
		AllMetrics:          allMetrics,
	}
}

// GetStatistics calculates aggregate statistics across multiple simulation results
func GetStatistics(results []ViabilityResult) map[string]interface{} {
	if len(results) == 0 {
		return map[string]interface{}{}
	}

	viableCount := 0
	totalDaysToFire := 0
	fireMasteryCount := 0
	totalPopulation := 0
	totalScience := 0.0
	totalBirths := 0
	totalHealth := 0.0
	
	// For variance calculations
	populations := make([]float64, len(results))
	sciences := make([]float64, len(results))
	daysToFire := make([]float64, 0, len(results))

	for i, r := range results {
		if r.IsViable {
			viableCount++
		}
		if r.FireMasteryUnlocked {
			fireMasteryCount++
			totalDaysToFire += r.DaysToFireMastery
			daysToFire = append(daysToFire, float64(r.DaysToFireMastery))
		}
		totalPopulation += r.FinalPopulation
		totalScience += r.FinalScience
		totalBirths += r.TotalBirths
		totalHealth += r.AverageHealth
		
		populations[i] = float64(r.FinalPopulation)
		sciences[i] = r.FinalScience
	}

	stats := map[string]interface{}{
		"total_runs":         len(results),
		"viable_count":       viableCount,
		"viability_rate":     float64(viableCount) / float64(len(results)),
		"fire_mastery_count": fireMasteryCount,
		"avg_population":     float64(totalPopulation) / float64(len(results)),
		"avg_science":        totalScience / float64(len(results)),
		"avg_births":         float64(totalBirths) / float64(len(results)),
		"avg_health":         totalHealth / float64(len(results)),
	}

	if fireMasteryCount > 0 {
		avgDays := float64(totalDaysToFire) / float64(fireMasteryCount)
		stats["avg_days_to_fire_mastery"] = avgDays
		stats["avg_years_to_fire_mastery"] = avgDays / 365.0
		stats["stddev_days_to_fire_mastery"] = calculateStdDev(daysToFire)
	}
	
	// Calculate standard deviations
	stats["stddev_population"] = calculateStdDev(populations)
	stats["stddev_science"] = calculateStdDev(sciences)

	return stats
}

// calculateStdDev calculates standard deviation of a slice of float64
func calculateStdDev(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	
	// Calculate mean
	sum := 0.0
	for _, v := range values {
		sum += v
	}
	mean := sum / float64(len(values))
	
	// Calculate variance
	varianceSum := 0.0
	for _, v := range values {
		diff := v - mean
		varianceSum += diff * diff
	}
	
	return math.Sqrt(varianceSum / float64(len(values)))
}

// CalculatePopulationVariance calculates variance in final populations across runs
func CalculatePopulationVariance(results []ViabilityResult) float64 {
	if len(results) == 0 {
		return 0
	}

	// Calculate mean
	sum := 0.0
	for _, r := range results {
		sum += float64(r.FinalPopulation)
	}
	mean := sum / float64(len(results))

	// Calculate variance
	varianceSum := 0.0
	for _, r := range results {
		diff := float64(r.FinalPopulation) - mean
		varianceSum += diff * diff
	}

	return math.Sqrt(varianceSum / float64(len(results)))
}
