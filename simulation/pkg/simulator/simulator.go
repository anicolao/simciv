package simulator

import "math"

// DefaultStartingConditions returns the default starting conditions from the design document
func DefaultStartingConditions() StartingConditions {
	return StartingConditions{
		Population:          20,
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
	}

	// Assess viability
	return assessViability(config.StartingConditions.Population, allMetrics, config.MaxDays)
}

// assessViability evaluates whether a starting position is viable
func assessViability(startingPopulation int, allMetrics []*DailyMetrics, maxDays int) ViabilityResult {
	if len(allMetrics) == 0 {
		return ViabilityResult{
			IsViable:       false,
			FailureReasons: []string{"No metrics recorded"},
			AllMetrics:     allMetrics,
		}
	}

	failures := []string{}
	lastDay := allMetrics[len(allMetrics)-1]

	// Find day when Fire Mastery was unlocked (if ever)
	fireMasteryDay := -1
	for _, m := range allMetrics {
		if m.HasFireMastery {
			fireMasteryDay = m.Day
			break
		}
	}

	// Calculate population metrics
	peakPopulation := 0
	minimumPopulation := startingPopulation
	for _, m := range allMetrics {
		if m.Population > peakPopulation {
			peakPopulation = m.Population
		}
		if m.Population < minimumPopulation {
			minimumPopulation = m.Population
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

	// Criterion 3: Population must be growing or stable (not declining at end)
	// Check last 90 days for trend
	recentStartIdx := len(allMetrics) - 90
	if recentStartIdx < 0 {
		recentStartIdx = 0
	}
	recentGrowth := 0
	if recentStartIdx < len(allMetrics) {
		recentGrowth = lastDay.Population - allMetrics[recentStartIdx].Population
	}
	if recentGrowth < 0 && lastDay.Population < int(float64(startingPopulation)*0.9) {
		failures = append(failures, "Population declining")
	}

	// Criterion 4: Population must not go extinct
	if lastDay.Population == 0 {
		failures = append(failures, "Population extinct")
	}

	// Criterion 5: Average health must remain viable
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
		DaysToFireMastery:   fireMasteryDay,
		FinalAverageHealth:  lastDay.AverageHealth,
		PeakPopulation:      peakPopulation,
		MinimumPopulation:   minimumPopulation,
		FireMasteryUnlocked: lastDay.HasFireMastery,
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

	for _, r := range results {
		if r.IsViable {
			viableCount++
		}
		if r.FireMasteryUnlocked {
			fireMasteryCount++
			totalDaysToFire += r.DaysToFireMastery
		}
	}

	stats := map[string]interface{}{
		"total_runs":         len(results),
		"viable_count":       viableCount,
		"viability_rate":     float64(viableCount) / float64(len(results)),
		"fire_mastery_count": fireMasteryCount,
	}

	if fireMasteryCount > 0 {
		stats["avg_days_to_fire_mastery"] = float64(totalDaysToFire) / float64(fireMasteryCount)
	}

	return stats
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
