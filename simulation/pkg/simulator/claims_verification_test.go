package simulator

import (
	"fmt"
	"strings"
	"testing"
)

// TestVerifyFireMasteryClaims attempts to verify the claims from designs/HUMAN_ATTRIBUTES.md
// that Fire Mastery can be achieved in 8.7-9.8 years with different allocations.
//
// Expected claims (from HUMAN_ATTRIBUTES.md lines 428-431):
//   - 40/60: ~8.7 years
//   - 50/50: ~8.3 years
//   - 60/40: ~8.5 years
//   - 70/30: ~9.8 years
//
// NOTE: This test documents that these claims CANNOT be reproduced with the current code.
// See designs/FIRE_MASTERY_CLAIMS_ANALYSIS.md for full explanation.
func TestVerifyFireMasteryClaims(t *testing.T) {
	allocations := []struct {
		name              string
		ratio             float64
		claimedYears      float64
		claimedDays       int
	}{
		{"40/60", 0.4, 8.7, 3176},
		{"50/50", 0.5, 8.3, 3030},
		{"60/40", 0.6, 8.5, 3103},
		{"70/30", 0.7, 9.8, 3577},
	}

	t.Log("\n" + strings.Repeat("=", 80))
	t.Log("VERIFICATION OF FIRE MASTERY CLAIMS")
	t.Log(strings.Repeat("=", 80))
	t.Logf("\nClaims from designs/HUMAN_ATTRIBUTES.md (lines 428-431):")
	t.Log("  - 40/60 allocation: ~8.7 years to Fire Mastery")
	t.Log("  - 50/50 allocation: ~8.3 years to Fire Mastery")
	t.Log("  - 60/40 allocation: ~8.5 years to Fire Mastery")
	t.Log("  - 70/30 allocation: ~9.8 years to Fire Mastery")
	t.Log("")

	testDuration := 3650 // 10 years
	samples := 10

	t.Logf("Testing with %d samples over %d days (%.1f years)\n", samples, testDuration, float64(testDuration)/365.0)
	t.Logf("%-12s %-10s %-12s %-15s %-15s %-10s", "Allocation", "Claimed", "Viable", "Avg Days", "Avg Science", "Status")
	t.Log(strings.Repeat("-", 80))

	allTestsPassed := true

	for _, alloc := range allocations {
		conditions := DefaultStartingConditions()
		conditions.FoodAllocationRatio = alloc.ratio

		viableCount := 0
		totalDays := 0
		totalScience := 0.0

		for i := 0; i < samples; i++ {
			config := SimulationConfig{
				Seed:               VIABILITY_TEST_SEEDS[i],
				StartingConditions: conditions,
				MaxDays:            testDuration,
			}

			result := RunSimulation(config)
			totalScience += result.FinalScience

			if result.IsViable {
				viableCount++
				totalDays += result.DaysToFireMastery
			}
		}

		avgScience := totalScience / float64(samples)
		avgDaysStr := "-"
		status := "❌ FAIL"

		if viableCount > 0 {
			avgDays := totalDays / viableCount
			avgYears := float64(avgDays) / 365.0
			avgDaysStr = fmt.Sprintf("%d (%.1fy)", avgDays, avgYears)

			// Check if achieved within claimed time ±20%
			if avgDays <= int(float64(alloc.claimedDays)*1.2) {
				status = "✅ PASS"
			} else {
				status = "❌ FAIL (too slow)"
				allTestsPassed = false
			}
		} else {
			status = "❌ FAIL (never achieved)"
			allTestsPassed = false
		}

		t.Logf("%-12s %-10.1fy %-12s %-15s %-15.1f %-10s",
			alloc.name,
			alloc.claimedYears,
			fmt.Sprintf("%d/%d", viableCount, samples),
			avgDaysStr,
			avgScience,
			status)
	}

	t.Log(strings.Repeat("=", 80))

	if !allTestsPassed {
		t.Log("\n❌ CLAIMS VERIFICATION FAILED (EXPECTED)")
		t.Log("\nActual behavior:")
		t.Log("  - With current science rate (0.00015), NO allocations achieve Fire Mastery in 10 years")
		t.Log("  - Science accumulation: ~10-12 points after 10 years (need 100 for Fire Mastery)")
		t.Log("  - Time to Fire Mastery at current rate: ~100 years")
		t.Log("\nPossible explanations:")
		t.Log("  1. Claims were based on incorrect extrapolations")
		t.Log("  2. Science rate should be much higher (~0.00150 instead of 0.00015)")
		t.Log("  3. Population dynamics cause crash, preventing science production")
		t.Log("\nSee designs/FIRE_MASTERY_CLAIMS_ANALYSIS.md for detailed analysis.")
		t.Log("\nThis failure is EXPECTED and documents the issue.")
	} else {
		t.Log("\n✅ ALL CLAIMS VERIFIED")
		t.Log("If this test passes, the claims have been fixed!")
	}
}

// TestCompareWithHigherScienceRate shows what happens with a higher science rate
// to help understand what rate would be needed to achieve the claimed times.
func TestCompareWithHigherScienceRate(t *testing.T) {
	t.Log("\n" + strings.Repeat("=", 80))
	t.Log("COMPARISON: What if science rate was higher?")
	t.Log(strings.Repeat("=", 80))
	t.Log("\nThis test calculates what results would be with different science rates,")
	t.Log("based on the current test results with rate 0.00015.")
	t.Log("")

	conditions := DefaultStartingConditions()
	conditions.FoodAllocationRatio = 0.7 // 70/30 default

	config := SimulationConfig{
		Seed:               VIABILITY_TEST_SEEDS[0],
		StartingConditions: conditions,
		MaxDays:            3650, // 10 years
	}

	result := RunSimulation(config)
	currentRate := 0.00015
	actualScience := result.FinalScience

	t.Logf("Baseline (70/30 allocation):")
	t.Logf("  Current rate: %.5f", currentRate)
	t.Logf("  Science after 10 years: %.2f", actualScience)
	t.Logf("  Fire Mastery (100 points): %v", result.FireMasteryUnlocked)
	t.Log("")

	// Calculate what rates would be needed
	targetYears := []float64{9.8, 5.0, 3.0, 1.0}

	t.Logf("%-15s %-15s %-20s %-20s", "Target Time", "Required Rate", "Rate Multiplier", "10yr Science")
	t.Log(strings.Repeat("-", 80))

	for _, years := range targetYears {
		days := years * 365.0
		// If we need 100 science in 'days', and currently get 'actualScience' in 3650 days:
		requiredRate := currentRate * (100.0 / actualScience) * (3650.0 / days)
		multiplier := requiredRate / currentRate
		scienceIn10y := actualScience * multiplier

		t.Logf("%-15.1f yr %-15.5f %-20.1fx %-20.1f",
			years, requiredRate, multiplier, scienceIn10y)
	}

	t.Log(strings.Repeat("=", 80))
	t.Log("\nNote: These calculations assume linear scaling, which may not be accurate")
	t.Log("due to population dynamics and health effects on science production.")
}
