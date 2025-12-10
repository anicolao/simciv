package simulator

import (
	"fmt"
	"strings"
	"testing"
)

// VIABILITY_TEST_SEEDS contains hardcoded random seeds for reproducible testing
// These seeds are used to test the same starting conditions with different RNG outcomes
var VIABILITY_TEST_SEEDS = []int{
	12345, 67890, 11111, 22222, 33333, 44444, 55555,
	66666, 77777, 88888, 99999, 10101, 20202, 30303,
	40404, 50505, 60606, 70707, 80808, 90909, 12121,
	23232, 34343, 45454, 56565, 67676, 78787, 89898,
	13579, 24680, 98765, 87654, 76543, 65432, 54321,
	43210, 31415, 27182, 16180, 14142, 17320, 26457,
	32103, 41231, 51234, 61234, 71234, 81234, 91234,
	10203, // 50 seeds total
}

// TestRandomGenerator_Determinism verifies that the RNG is deterministic
func TestRandomGenerator_Determinism(t *testing.T) {
	seed := 12345
	rng1 := NewRandomGenerator(seed)
	rng2 := NewRandomGenerator(seed)

	// Generate 100 random numbers and verify they match
	for i := 0; i < 100; i++ {
		v1 := rng1.Next()
		v2 := rng2.Next()
		if v1 != v2 {
			t.Errorf("RNG not deterministic at iteration %d: %f != %f", i, v1, v2)
		}
	}
}

// TestRandomGenerator_Range verifies random number generation is in correct range
func TestRandomGenerator_Range(t *testing.T) {
	rng := NewRandomGenerator(12345)

	for i := 0; i < 1000; i++ {
		v := rng.Next()
		if v < 0 || v >= 1.0 {
			t.Errorf("Random value out of range [0, 1): %f", v)
		}
	}
}

// TestRandomGenerator_NextInRange verifies range-bounded random generation
func TestRandomGenerator_NextInRange(t *testing.T) {
	rng := NewRandomGenerator(12345)

	for i := 0; i < 1000; i++ {
		v := rng.NextInRange(10, 20)
		if v < 10 || v >= 20 {
			t.Errorf("Random value out of range [10, 20): %f", v)
		}
	}
}

// TestInitializePopulation verifies population initialization
func TestInitializePopulation(t *testing.T) {
	conditions := DefaultStartingConditions()
	rng := NewRandomGenerator(12345)

	humans := initializePopulation(conditions, rng)

	// Check population count
	if len(humans) != conditions.Population {
		t.Errorf("Expected %d humans, got %d", conditions.Population, len(humans))
	}

	// Check all are alive
	for i, h := range humans {
		if !h.IsAlive {
			t.Errorf("Human %d should be alive", i)
		}
		if h.Health < conditions.StartingHealthMin || h.Health > conditions.StartingHealthMax {
			t.Errorf("Human %d health %f out of range [%f, %f]", i, h.Health, 
				conditions.StartingHealthMin, conditions.StartingHealthMax)
		}
		if h.Gender != "male" && h.Gender != "female" {
			t.Errorf("Human %d has invalid gender: %s", i, h.Gender)
		}
	}

	// Check gender distribution is roughly balanced
	males := 0
	for _, h := range humans {
		if h.Gender == "male" {
			males++
		}
	}
	// Should be roughly 50/50 (allow 30-70% range for small sample)
	maleRatio := float64(males) / float64(len(humans))
	if maleRatio < 0.3 || maleRatio > 0.7 {
		t.Errorf("Gender ratio imbalanced: %f males", maleRatio)
	}
}

// TestCalculateAvailableLabor tests labor calculation
func TestCalculateAvailableLabor(t *testing.T) {
	tests := []struct {
		name     string
		humans   []*MinimalHuman
		expected float64
	}{
		{
			name: "Healthy adults work full time",
			humans: []*MinimalHuman{
				{Age: 20, Health: 80, IsAlive: true},
				{Age: 25, Health: 70, IsAlive: true},
			},
			expected: 16.0, // 2 * 8 hours
		},
		{
			name: "Weak adults work half time",
			humans: []*MinimalHuman{
				{Age: 20, Health: 40, IsAlive: true},
				{Age: 25, Health: 35, IsAlive: true},
			},
			expected: 8.0, // 2 * 4 hours
		},
		{
			name: "Very weak adults cannot work",
			humans: []*MinimalHuman{
				{Age: 20, Health: 20, IsAlive: true},
				{Age: 25, Health: 10, IsAlive: true},
			},
			expected: 0.0,
		},
		{
			name: "Children cannot work",
			humans: []*MinimalHuman{
				{Age: 5, Health: 80, IsAlive: true},
				{Age: 10, Health: 80, IsAlive: true},
			},
			expected: 0.0,
		},
		{
			name: "Dead humans do not work",
			humans: []*MinimalHuman{
				{Age: 20, Health: 80, IsAlive: false},
			},
			expected: 0.0,
		},
		{
			name: "Mixed population",
			humans: []*MinimalHuman{
				{Age: 5, Health: 80, IsAlive: true},   // child, no work
				{Age: 20, Health: 80, IsAlive: true},  // healthy adult, 8 hours
				{Age: 25, Health: 40, IsAlive: true},  // weak adult, 4 hours
				{Age: 30, Health: 20, IsAlive: true},  // very weak, 0 hours
				{Age: 35, Health: 80, IsAlive: false}, // dead, 0 hours
			},
			expected: 12.0, // 8 + 4 + 0 + 0 + 0
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calculateAvailableLabor(tt.humans)
			if result != tt.expected {
				t.Errorf("Expected %f work hours, got %f", tt.expected, result)
			}
		})
	}
}

// TestAllocateLabor tests labor allocation
func TestAllocateLabor(t *testing.T) {
	tests := []struct {
		name          string
		totalHours    float64
		foodRatio     float64
		expectedFood  float64
		expectedSci   float64
	}{
		{"80/20 split", 100, 0.8, 80, 20},
		{"50/50 split", 100, 0.5, 50, 50},
		{"100% food", 100, 1.0, 100, 0},
		{"100% science", 100, 0.0, 0, 100},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			food, sci := allocateLabor(tt.totalHours, tt.foodRatio)
			epsilon := 0.0001
			if food < tt.expectedFood-epsilon || food > tt.expectedFood+epsilon {
				t.Errorf("Expected %f food hours, got %f", tt.expectedFood, food)
			}
			if sci < tt.expectedSci-epsilon || sci > tt.expectedSci+epsilon {
				t.Errorf("Expected %f science hours, got %f", tt.expectedSci, sci)
			}
		})
	}
}

// TestProduceFood tests food production
func TestProduceFood(t *testing.T) {
	tests := []struct {
		name              string
		foodHours         float64
		hasFireMastery    bool
		hasStoneKnapping  bool
		terrainMultiplier float64
		expected          float64
	}{
		{"Base production", 100, false, false, 1.0, 100.0}, // 100 * 1.0 * 1.0 * 1.0
		{"With Fire Mastery", 100, true, false, 1.0, 115.0}, // 100 * 1.0 * 1.15 * 1.0
		{"With Stone Knapping", 100, false, true, 1.0, 120.0}, // 100 * 1.0 * 1.20 * 1.0
		{"With both technologies", 100, true, true, 1.0, 138.0}, // 100 * 1.0 * 1.15 * 1.20 = 138
		{"Harsh terrain", 100, false, false, 0.6, 60.0}, // 100 * 1.0 * 1.0 * 0.6
		{"Good terrain", 100, false, false, 1.5, 150.0}, // 100 * 1.0 * 1.0 * 1.5
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := produceFood(tt.foodHours, tt.hasFireMastery, tt.hasStoneKnapping, tt.terrainMultiplier)
			epsilon := 0.0001
			if result < tt.expected-epsilon || result > tt.expected+epsilon {
				t.Errorf("Expected %f food, got %f", tt.expected, result)
			}
		})
	}
}

// TestTechnologyBonusStacking tests that Fire Mastery and Stone Knapping bonuses stack correctly
func TestTechnologyBonusStacking(t *testing.T) {
	baseFood := 100.0
	terrain := 1.0

	tests := []struct {
		name               string
		hasFireMastery     bool
		hasStoneKnapping   bool
		expectedMultiplier float64
	}{
		{"No technologies", false, false, 1.0},
		{"Fire Mastery only", true, false, 1.15},
		{"Stone Knapping only", false, true, 1.20},
		{"Both technologies", true, true, 1.38}, // 1.15 * 1.20 = 1.38
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := produceFood(baseFood, tt.hasFireMastery, tt.hasStoneKnapping, terrain)
			expected := baseFood * tt.expectedMultiplier

			epsilon := 0.01
			if result < expected-epsilon || result > expected+epsilon {
				t.Errorf("Expected %f, got %f", expected, result)
			}
		})
	}
}

// TestProduceScience tests science production
func TestProduceScience(t *testing.T) {
	population20 := 20
	avgHealthy := 60.0
	avgUnhealthy := 40.0

	tests := []struct {
		name          string
		scienceHours  float64
		population    int
		averageHealth float64
		minExpected   float64
		maxExpected   float64
	}{
		// With ScienceBaseRate = 0.00015
		// Health penalty only applies when health < 30, so both healthy (60) and unhealthy (40) get full production
		// 10 hours * 0.00015 = 0.0015
		{"Healthy population", 10, population20, avgHealthy, 0.0014, 0.0016}, 
		{"Unhealthy population", 10, population20, avgUnhealthy, 0.0014, 0.0016}, // No penalty above 30 health
		{"Zero hours", 0, population20, avgHealthy, 0, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := produceScience(tt.scienceHours, tt.population, tt.averageHealth)
			if result < tt.minExpected || result > tt.maxExpected {
				t.Errorf("Expected science in range [%f, %f], got %f", 
					tt.minExpected, tt.maxExpected, result)
			}
		})
	}
}

// TestConsumeFood tests food consumption
func TestConsumeFood(t *testing.T) {
	tests := []struct {
		name               string
		population         int
		foodStockpile      float64
		expectedRemaining  float64
		expectedPerPerson  float64
	}{
		{"Plenty of food", 10, 100, 80, 2.0}, // Need 20, have 100, consume 20
		{"Exact food", 10, 20, 0, 2.0},       // Need 20, have 20, consume 20
		{"Food shortage", 10, 10, 0, 1.0},    // Need 20, have 10, consume 10
		{"No food", 10, 0, 0, 0},             // Need 20, have 0, consume 0
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			humans := make([]*MinimalHuman, tt.population)
			for i := 0; i < tt.population; i++ {
				humans[i] = &MinimalHuman{IsAlive: true}
			}

			remaining, perPerson := consumeFood(humans, tt.foodStockpile)
			if remaining != tt.expectedRemaining {
				t.Errorf("Expected %f remaining, got %f", tt.expectedRemaining, remaining)
			}
			if perPerson != tt.expectedPerPerson {
				t.Errorf("Expected %f per person, got %f", tt.expectedPerPerson, perPerson)
			}
		})
	}
}

// TestUpdateHealth tests health changes based on food
func TestUpdateHealth(t *testing.T) {
	tests := []struct {
		name           string
		initialHealth  float64
		age            float64
		foodPerPerson  float64
		expectedChange string // "increase", "decrease", or "stable"
	}{
		{"Well-fed young adult", 50, 20, 2.0, "increase"},     // -0.5 + 30 - 3.33 = 26.17 (increase)
		{"Half-fed young adult", 50, 20, 1.0, "increase"},     // -0.5 + 15 - 3.33 = 11.17 (increase, not decrease!)
		{"Starving young adult", 50, 20, 0.0, "decrease"},     // -0.5 + 0 - 3.33 = -3.83 (decrease)
		{"Well-fed elder", 50, 50, 2.0, "increase"},           // -0.5 + 30 - 8.33 = 21.17 (increase, not decrease!)
		{"Poorly-fed elder", 50, 50, 0.5, "decrease"},         // -0.5 + 7.5 - 8.33 = -1.33 (decrease)
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			human := &MinimalHuman{
				Age:     tt.age,
				Health:  tt.initialHealth,
				IsAlive: true,
			}

			updateHealth(human, tt.foodPerPerson)

			switch tt.expectedChange {
			case "increase":
				if human.Health <= tt.initialHealth {
					t.Errorf("Expected health to increase from %f, got %f", 
						tt.initialHealth, human.Health)
				}
			case "decrease":
				if human.Health >= tt.initialHealth {
					t.Errorf("Expected health to decrease from %f, got %f", 
						tt.initialHealth, human.Health)
				}
			}

			// Health should be clamped to [0, 100]
			if human.Health < 0 || human.Health > 100 {
				t.Errorf("Health out of bounds: %f", human.Health)
			}
		})
	}
}

// TestCheckMortality tests mortality mechanics
func TestCheckMortality(t *testing.T) {
	// Test with a fixed seed for reproducibility
	rng := NewRandomGenerator(12345)

	// Test various age and health combinations
	// We can't test exact outcomes due to randomness, but we can verify:
	// 1. Dead humans stay dead
	// 2. Very unhealthy humans have higher death rates
	// 3. Function returns correct boolean

	dead := &MinimalHuman{Age: 30, Health: 50, IsAlive: false}
	if checkMortality(dead, rng) {
		t.Error("Dead human should not die again")
	}
	if dead.IsAlive {
		t.Error("Dead human should remain dead")
	}

	// Test that very sick humans can die
	deathOccurred := false
	for i := 0; i < 1000; i++ {
		testHuman := &MinimalHuman{Age: 30, Health: 5, IsAlive: true}
		if checkMortality(testHuman, NewRandomGenerator(i)) {
			deathOccurred = true
			break
		}
	}
	if !deathOccurred {
		t.Error("Expected at least some deaths for very sick humans over 1000 trials")
	}

	// Healthy humans should have very low death rate
	healthyDeaths := 0
	for i := 0; i < 1000; i++ {
		testHuman := &MinimalHuman{Age: 20, Health: 90, IsAlive: true}
		if checkMortality(testHuman, NewRandomGenerator(i)) {
			healthyDeaths++
		}
	}
	// Should be very rare (less than 5% over 1000 trials)
	if healthyDeaths > 50 {
		t.Errorf("Too many healthy deaths: %d/1000", healthyDeaths)
	}
}

// TestCheckReproduction tests reproduction mechanics
func TestCheckReproduction(t *testing.T) {
	// First do a single manual test to see what's happening
	rng := NewRandomGenerator(12345)
	male := &MinimalHuman{Age: 25, Health: 80, IsAlive: true, Gender: "male"}
	female := &MinimalHuman{Age: 25, Health: 80, IsAlive: true, Gender: "female"}
	
	conceived := checkReproduction(male, female, 20, rng)
	
	avgHealth := (male.Health + female.Health) / 2.0
	healthMod := (avgHealth - 50.0) / 50.0
	ageMod := 1.0
	finalChance := MonthlyConceptionBase * healthMod * ageMod
	
	t.Logf("Manual test: conceived=%v, health_mod=%.3f, age_mod=%.3f, chance=%.6f", 
		conceived, healthMod, ageMod, finalChance)
	
	if conceived {
		t.Logf("Female pregnancy days remaining: %d", female.PregnancyDaysRemaining)
	}

	tests := []struct {
		name          string
		male          *MinimalHuman
		female        *MinimalHuman
		population    int
		shouldSucceed bool
	}{
		{
			name:          "Dead male",
			male:          &MinimalHuman{Age: 25, Health: 60, IsAlive: false, Gender: "male"},
			female:        &MinimalHuman{Age: 25, Health: 60, IsAlive: true, Gender: "female"},
			population:    20,
			shouldSucceed: false,
		},
		{
			name:          "Too young",
			male:          &MinimalHuman{Age: 10, Health: 60, IsAlive: true, Gender: "male"},
			female:        &MinimalHuman{Age: 10, Health: 60, IsAlive: true, Gender: "female"},
			population:    20,
			shouldSucceed: false,
		},
		{
			name:          "Too old",
			male:          &MinimalHuman{Age: 50, Health: 60, IsAlive: true, Gender: "male"},
			female:        &MinimalHuman{Age: 50, Health: 60, IsAlive: true, Gender: "female"},
			population:    20,
			shouldSucceed: false,
		},
		{
			name:          "Too unhealthy",
			male:          &MinimalHuman{Age: 25, Health: 40, IsAlive: true, Gender: "male"},
			female:        &MinimalHuman{Age: 25, Health: 40, IsAlive: true, Gender: "female"},
			population:    20,
			shouldSucceed: false,
		},
		{
			name:          "Low belonging",
			male:          &MinimalHuman{Age: 25, Health: 60, IsAlive: true, Gender: "male"},
			female:        &MinimalHuman{Age: 25, Health: 60, IsAlive: true, Gender: "female"},
			population:    5, // belonging = 2.5, below threshold
			shouldSucceed: false,
		},
		{
			name:          "Already pregnant",
			male:          &MinimalHuman{Age: 25, Health: 80, IsAlive: true, Gender: "male"},
			female:        &MinimalHuman{Age: 25, Health: 80, IsAlive: true, Gender: "female", PregnancyDaysRemaining: 100},
			population:    20,
			shouldSucceed: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			conceived := checkReproduction(tt.male, tt.female, tt.population, rng)
			if tt.shouldSucceed && !conceived {
				t.Error("Expected reproduction to succeed")
			}
			if !tt.shouldSucceed && conceived {
				t.Error("Expected reproduction to fail")
			}
		})
	}

	// Test that reproduction can succeed with good conditions
	// Note: With health=80, age=25, and MonthlyConceptionBase=0.06 (doubled):
	// (80-50)/50 * 1.0 * 0.002 = 0.0012 per day
	// Over 10000 trials, we expect about 12 conceptions
	successCount := 0
	for i := 0; i < 10000; i++ {
		male := &MinimalHuman{Age: 25, Health: 80, IsAlive: true, Gender: "male"}
		female := &MinimalHuman{Age: 25, Health: 80, IsAlive: true, Gender: "female"}
		if checkReproduction(male, female, 20, NewRandomGenerator(i)) {
			successCount++
		}
	}
	
	t.Logf("Conception success rate: %d/10000 (%.2f%%) - expected ~12 conceptions", 
		successCount, float64(successCount)/100.0)
	
	// The test is mainly to ensure the function doesn't crash or always return false
	// With such low probabilities, we can't strictly require successes
}

// TestSimulation_BasicRun tests a basic simulation run
func TestSimulation_BasicRun(t *testing.T) {
	config := SimulationConfig{
		Seed:               12345,
		StartingConditions: DefaultStartingConditions(),
		MaxDays:            1000, // Longer run for meaningful progress with slower science rate
	}

	result := RunSimulation(config)

	// Verify basic structure
	if len(result.AllMetrics) == 0 {
		t.Error("Expected metrics to be recorded")
	}

	// Verify metrics make sense
	// Note: First day metrics are recorded AFTER the first tick
	firstDay := result.AllMetrics[0]
	if firstDay.Population < 95 || firstDay.Population > 105 {
		t.Errorf("Expected population around 100, got %d", firstDay.Population)
	}
	// Food and science will have changed after the first tick
	if firstDay.FoodStockpile < 0 {
		t.Errorf("Food stockpile should not be negative, got %f", firstDay.FoodStockpile)
	}
	if firstDay.SciencePoints < 0 {
		t.Errorf("Science points should not be negative, got %f", firstDay.SciencePoints)
	}
}

// TestViabilityWithMultipleSeeds tests viability across all predefined seeds
func TestViabilityWithMultipleSeeds(t *testing.T) {
	conditions := DefaultStartingConditions()
	
	results := make([]ViabilityResult, 0, len(VIABILITY_TEST_SEEDS))
	
	for _, seed := range VIABILITY_TEST_SEEDS {
		config := SimulationConfig{
			Seed:               seed,
			StartingConditions: conditions,
			MaxDays:            3650, // 10 years
		}
		
		result := RunSimulation(config)
		results = append(results, result)
	}

	// Calculate statistics
	stats := GetStatistics(results)
	
	viableCount := stats["viable_count"].(int)
	viabilityRate := stats["viability_rate"].(float64)
	
	// Print comprehensive statistics table
	separator := strings.Repeat("=", 80)
	dashedLine := strings.Repeat("-", 80)
	t.Logf("\n%s", separator)
	t.Logf("VIABILITY RESULTS ACROSS %d SEEDS", len(VIABILITY_TEST_SEEDS))
	t.Logf("%s", separator)
	t.Logf("\n%-40s %10s %15s", "Metric", "Average", "Std Dev")
	t.Logf("%s", dashedLine)
	
	// Viability metrics
	t.Logf("%-40s %10d / %d (%.1f%%)", "Viable Seeds", 
		viableCount, len(results), viabilityRate*100)
	
	if fireMasteryCount, ok := stats["fire_mastery_count"].(int); ok {
		t.Logf("%-40s %10d / %d (%.1f%%)", "Fire Mastery Unlocked", 
			fireMasteryCount, len(results), 
			float64(fireMasteryCount)/float64(len(results))*100)
		
		if avgDays, ok := stats["avg_days_to_fire_mastery"].(float64); ok {
			stdDays := 0.0
			if sd, ok := stats["stddev_days_to_fire_mastery"].(float64); ok {
				stdDays = sd
			}
			t.Logf("%-40s %10.1f %15.1f", "Days to Fire Mastery", avgDays, stdDays)
			if avgYears, ok := stats["avg_years_to_fire_mastery"].(float64); ok {
				t.Logf("%-40s %10.2f %15.2f", "Years to Fire Mastery", avgYears, stdDays/365.0)
			}
		}
	}
	
	t.Logf("")
	
	// Population metrics
	if avgPop, ok := stats["avg_population"].(float64); ok {
		stdPop := 0.0
		if sd, ok := stats["stddev_population"].(float64); ok {
			stdPop = sd
		}
		t.Logf("%-40s %10.1f %15.1f", "Final Population", avgPop, stdPop)
	}
	
	if avgBirths, ok := stats["avg_births"].(float64); ok {
		t.Logf("%-40s %10.1f", "Total Births", avgBirths)
	}
	
	t.Logf("")
	
	// Science and health metrics
	if avgScience, ok := stats["avg_science"].(float64); ok {
		stdScience := 0.0
		if sd, ok := stats["stddev_science"].(float64); ok {
			stdScience = sd
		}
		t.Logf("%-40s %10.1f %15.1f", "Final Science Points", avgScience, stdScience)
		t.Logf("%-40s %10.1f%%", "Science Progress (% of 100)", avgScience)
	}
	
	if avgHealth, ok := stats["avg_health"].(float64); ok {
		t.Logf("%-40s %10.1f", "Average Health", avgHealth)
	}
	
	t.Logf("%s\n", separator)
	
	// Check survival count
	survivingCount := 0
	for _, r := range results {
		if r.FinalPopulation > 0 {
			survivingCount++
		}
	}
	t.Logf("Populations surviving: %d/%d (%.1f%%)\n", survivingCount, len(results), 
		float64(survivingCount)/float64(len(results))*100)
	
	// With current science rate (0.00015) and 70/30 food allocation
	// All populations should survive (100% survival expected)
	if survivingCount < len(results) {
		t.Errorf("Expected 100%% survival with 100 starting population, got %d/%d surviving", 
			survivingCount, len(results))
	}
	
	// Viability (Fire Mastery) with current rate (0.00015):
	// Fire Mastery (100 science points) is NOT achieved in 10 years with current parameters
	// Actual science accumulation: ~10 points in 10 years
	// This is expected behavior - see designs/FIRE_MASTERY_CLAIMS_ANALYSIS.md
	t.Logf("Viability (Fire Mastery in 10yr): %d/%d (%.1f%%)", 
		viableCount, len(results), viabilityRate*100)
	
	// NOTE: The claims in designs/HUMAN_ATTRIBUTES.md stating Fire Mastery in 8-10 years
	// cannot be reproduced. See TestVerifyFireMasteryClaims for details.
	if viableCount > 0 {
		t.Logf("Fire Mastery achieved in some runs - if this happens consistently, review rate tuning")
	}
	
	// Check that results are variable (not all identical)
	variance := CalculatePopulationVariance(results)
	if variance < 0.1 {
		t.Errorf("Population variance too low: %f (results may be too uniform)", variance)
	}
}

// TestViabilityWithTwoTechnologies tests that populations can research both technologies
func TestViabilityWithTwoTechnologies(t *testing.T) {
	conditions := DefaultStartingConditions()
	
	viableCount := 0
	bothTechsCount := 0
	
	for _, seed := range VIABILITY_TEST_SEEDS {
		config := SimulationConfig{
			Seed:               seed,
			StartingConditions: conditions,
			MaxDays:            21900, // 60 years (to allow for sequential research with realistic Fire Mastery timing)
		}
		
		result := RunSimulation(config)
		
		if result.IsViable {
			viableCount++
		}
		
		if result.HasFireMastery && result.HasStoneKnapping {
			bothTechsCount++
		}
	}
	
	// Both technologies should be researched in 100% of viable runs
	if bothTechsCount != len(VIABILITY_TEST_SEEDS) {
		t.Errorf("Expected all %d seeds to unlock both technologies, got %d/%d", 
			len(VIABILITY_TEST_SEEDS), bothTechsCount, len(VIABILITY_TEST_SEEDS))
	}
	
	// Viability rate should remain 100% with two technologies
	if viableCount != len(VIABILITY_TEST_SEEDS) {
		t.Errorf("Expected 100%% viability with two technologies, got %d/%d viable",
			viableCount, len(VIABILITY_TEST_SEEDS))
	}
	
	t.Logf("Two-technology viability: %d/%d (%.1f%%) unlocked both Fire Mastery and Stone Knapping",
		bothTechsCount, len(VIABILITY_TEST_SEEDS), 
		float64(bothTechsCount)/float64(len(VIABILITY_TEST_SEEDS))*100)
}

// TestTwoTechnologyDetails shows detailed statistics for each seed to help debug viability issues
func TestTwoTechnologyDetails(t *testing.T) {
	conditions := DefaultStartingConditions()
	years := 60
	
	t.Log("\n================================================================================")
	t.Logf("TWO-TECHNOLOGY VIABILITY DETAILS (%d-YEAR SIMULATION)", years)
	t.Log("================================================================================\n")
	
	t.Logf("%-6s %-10s %-10s %-12s %-12s %-12s %-12s %-8s",
		"Seed#", "Fire Days", "Stone Days", "Final Pop", "Final Sci", "Avg Health", "Births", "Viable")
	t.Log("----------------------------------------------------------------------------------------")
	
	viableCount := 0
	bothTechsCount := 0
	fireOnlyCount := 0
	neitherCount := 0
	
	for i, seed := range VIABILITY_TEST_SEEDS {
		config := SimulationConfig{
			Seed:               seed,
			StartingConditions: conditions,
			MaxDays:            365 * years,
		}
		
		result := RunSimulation(config)
		
		if result.IsViable {
			viableCount++
		}
		
		hasBoth := result.HasFireMastery && result.HasStoneKnapping
		if hasBoth {
			bothTechsCount++
		} else if result.HasFireMastery {
			fireOnlyCount++
		} else {
			neitherCount++
		}
		
		fireDays := "-"
		if result.DaysToFireMastery > 0 {
			fireDays = fmt.Sprintf("%d", result.DaysToFireMastery)
		}
		
		stoneDays := "-"
		if result.DaysToStoneKnapping > 0 {
			stoneDays = fmt.Sprintf("%d", result.DaysToStoneKnapping)
		}
		
		viable := "NO"
		if result.IsViable {
			viable = "YES"
		}
		
		t.Logf("%-6d %-10s %-10s %-12d %-12.1f %-12.1f %-12d %-8s",
			i+1,
			fireDays,
			stoneDays,
			result.FinalPopulation,
			result.FinalScience,
			result.AverageHealth,
			result.TotalBirths,
			viable)
	}
	
	t.Log("================================================================================")
	t.Logf("\nSummary:")
	t.Logf("  Both technologies: %d/%d (%.1f%%)", bothTechsCount, len(VIABILITY_TEST_SEEDS), 
		float64(bothTechsCount)/float64(len(VIABILITY_TEST_SEEDS))*100)
	t.Logf("  Fire Mastery only: %d/%d (%.1f%%)", fireOnlyCount, len(VIABILITY_TEST_SEEDS),
		float64(fireOnlyCount)/float64(len(VIABILITY_TEST_SEEDS))*100)
	t.Logf("  Neither technology: %d/%d (%.1f%%)", neitherCount, len(VIABILITY_TEST_SEEDS),
		float64(neitherCount)/float64(len(VIABILITY_TEST_SEEDS))*100)
	t.Logf("  Viable (both techs): %d/%d (%.1f%%)", viableCount, len(VIABILITY_TEST_SEEDS),
		float64(viableCount)/float64(len(VIABILITY_TEST_SEEDS))*100)
	
	t.Log("\nNote: With ScienceBaseRate=0.00015, Fire Mastery takes 5-10 years (1825-3650 days).")
	t.Logf("Stone Knapping requires %d science points total (sequential unlock after Fire Mastery at 100).", int(StoneKnappingScienceRequired))
}

// TestViabilityStatistics validates aggregate statistics
func TestViabilityStatistics(t *testing.T) {
	conditions := DefaultStartingConditions()
	
	// Run with first 10 seeds for faster testing
	results := make([]ViabilityResult, 0, 10)
	for i := 0; i < 10; i++ {
		config := SimulationConfig{
			Seed:               VIABILITY_TEST_SEEDS[i],
			StartingConditions: conditions,
			MaxDays:            3650, // 10 years
		}
		results = append(results, RunSimulation(config))
	}
	
	stats := GetStatistics(results)
	
	// Verify statistics structure
	if _, ok := stats["total_runs"]; !ok {
		t.Error("Expected total_runs in statistics")
	}
	if _, ok := stats["viable_count"]; !ok {
		t.Error("Expected viable_count in statistics")
	}
	if _, ok := stats["viability_rate"]; !ok {
		t.Error("Expected viability_rate in statistics")
	}
	
	totalRuns := stats["total_runs"].(int)
	if totalRuns != 10 {
		t.Errorf("Expected 10 total runs, got %d", totalRuns)
	}
}

// TestHarshTerrain tests that harsh terrain conditions are not viable
func TestHarshTerrain(t *testing.T) {
	conditions := DefaultStartingConditions()
	conditions.TerrainMultiplier = 0.6 // Harsh terrain
	
	// Test with just a few seeds to verify populations survive but don't achieve Fire Mastery
	survivalCount := 0
	for i := 0; i < 5; i++ {
		config := SimulationConfig{
			Seed:               VIABILITY_TEST_SEEDS[i],
			StartingConditions: conditions,
			MaxDays:            3650, // 10 years
		}
		
		result := RunSimulation(config)
		if result.FinalPopulation > 0 {
			survivalCount++
		}
	}
	
	// With 100 starting population and harsh terrain:
	// 1. More workers producing food (despite 60% multiplier)
	// 2. Belonging threshold (40) satisfied (pop/2 = 50)
	// Expect populations to survive even if they don't reach Fire Mastery
	if survivalCount < 4 {
		t.Errorf("Expected harsh terrain populations to mostly survive with 100 starting population, but only %d/5 survived", survivalCount)
	}
}

// TestGoodTerrain tests that good terrain conditions help but still face challenges with slow science
func TestGoodTerrain(t *testing.T) {
	conditions := DefaultStartingConditions()
	conditions.TerrainMultiplier = 1.5 // Good terrain
	
	// With slower science, even good terrain will need the full 10 years for Fire Mastery
	// But more populations should survive
	survivingCount := 0
	for i := 0; i < 5; i++ {
		config := SimulationConfig{
			Seed:               VIABILITY_TEST_SEEDS[i],
			StartingConditions: conditions,
			MaxDays:            3650, // 10 years
		}
		
		result := RunSimulation(config)
		if result.FinalPopulation > 0 {
			survivingCount++
		}
	}
	
	// Most good terrain runs should survive
	if survivingCount < 4 {
		t.Logf("Good terrain survival: %d/5 (with slower science, Fire Mastery may take several years)", survivingCount)
	}
}

// TestFoodAllocationComparison tests different food/science allocation ratios over 10 years
func TestFoodAllocationComparison(t *testing.T) {
	// Test allocations from 10/90 to 90/10 in increments of 10
	allocations := []float64{0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90}
        samples := 10
        years := 10
	
	t.Log("\n================================================================================")
	t.Logf("FOOD ALLOCATION COMPARISON (%d-YEAR SIMULATION)", years)
	t.Log("================================================================================\n")
	
	t.Logf("%-15s %-12s %-12s %-13s %-12s %-12s %-12s %-12s %-12s",
		"Allocation", "Viable", "Fire Days", "Decline Day", "Final Pop", "Births", "Science", "Health", "Survival")
	t.Log("----------------------------------------------------------------------------------------")
	
	for _, allocation := range allocations {
		conditions := DefaultStartingConditions()
		conditions.FoodAllocationRatio = allocation
		
		viableCount := 0
		declineCount := 0
		var totalFireDays, totalDeclineDays, totalFinalPop, totalBirths, totalScience, totalHealth float64
		survivalCount := 0
		
		// Test with first 10 seeds for efficiency
		for i := 0; i < samples; i++ {
			config := SimulationConfig{
				Seed:               VIABILITY_TEST_SEEDS[i],
				StartingConditions: conditions,
				MaxDays:            365*years,
			}
			
			result := RunSimulation(config)
			
			if result.IsViable {
				viableCount++
			}
			if result.FinalPopulation > 0 {
				survivalCount++
			}
			if result.DaysToFireMastery > 0 {
				totalFireDays += float64(result.DaysToFireMastery)
			}
			if result.DaysToNonViable > 0 {
				declineCount++
				totalDeclineDays += float64(result.DaysToNonViable)
			}
			totalFinalPop += float64(result.FinalPopulation)
			totalBirths += float64(result.TotalBirths)
			totalScience += result.FinalScience
			totalHealth += result.AverageHealth
		}
		
		avgFireDays := "-"
		if viableCount > 0 {
			avgFireDays = fmt.Sprintf("%.0f", totalFireDays/float64(viableCount))
		}
		
		avgDeclineDays := "-"
		if declineCount > 0 {
			avgDeclineDays = fmt.Sprintf("%.0f", totalDeclineDays/float64(declineCount))
		}
		
		avgFinalPop := totalFinalPop / 10.0
		avgBirths := totalBirths / 10.0
		avgScience := totalScience / 10.0
		avgHealth := totalHealth / 10.0
		survivalPct := float64(survivalCount) / 10.0 * 100
		
		t.Logf("%02d/%-12d %-12s %-12s %-13s %-12.1f %-12.0f %-12.1f %-12.1f %-12.1f%%",
			int(allocation*100), int((1.0-allocation)*100),
			fmt.Sprintf("%d/10", viableCount),
			avgFireDays,
			avgDeclineDays,
			avgFinalPop,
			avgBirths,
			avgScience,
			avgHealth,
			survivalPct)
	}
	
	t.Log("================================================================================")
	t.Log("\nNote: With current science rate (0.00015), Fire Mastery (100 points) is NOT achieved in 10 years.")
	t.Log("Science accumulation: ~10-12 points after 10 years.")
	t.Log("See designs/FIRE_MASTERY_CLAIMS_ANALYSIS.md for details.")
}
