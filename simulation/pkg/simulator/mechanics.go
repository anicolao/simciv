package simulator

import (
	"fmt"
	"math"
)

// Constants from the design document
const (
	// Age thresholds
	AgeChild  = 15.0
	AgeAdult  = 15.0
	AgeFertileMin = 13.0  // Per design doc (HUMAN_ATTRIBUTES.md line 611)
	AgeFertileMax = 45.0

	// Work capacity
	WorkHoursFull = 8.0
	WorkHoursHalf = 4.0
	HealthFullWork = 50.0
	HealthHalfWork = 30.0

	// Food production
	FoodBaseRate = 1.0 // Food units per hour (viability threshold found via testing)
	FireMasteryFoodBonus = 1.15 // +15% from cooking

	// Science production
	ScienceBaseRate = 0.00015 // Science points per hour (tuned for 5-10 year Fire Mastery without pop bonus)
	ScienceHealthThreshold = 30.0 // Tuned for viability (originally 50 per design, relaxed to reduce pressure)
	ScienceHealthPenalty = 0.5 // Half effectiveness when malnourished

	// Food consumption
	FoodRequiredPerPerson = 2.0 // Units per day

	// Health changes
	HealthBaseDecline = -0.5
	HealthFoodMultiplier = 15.0
	HealthAgeDivisor = 30.0
	HealthAgeMultiplier = 5.0

	// Age progression
	AgeIncrementPerDay = 1.0 / 365.0 // 1 year / 365 days

	// Mortality rates (monthly to daily conversion)
	DaysPerMonth = 30.0
	MortalityInfant = 0.025 / DaysPerMonth  // < 1 year
	MortalityToddler = 0.012 / DaysPerMonth // 1-5 years
	MortalityChild = 0.003 / DaysPerMonth   // 5-15 years
	MortalityYoungAdult = 0.002 / DaysPerMonth // 15-30 years
	MortalityAdult = 0.004 / DaysPerMonth   // 30-45 years
	MortalityMiddleAge = 0.010 / DaysPerMonth // 45-60 years
	MortalityElder = 0.020 / DaysPerMonth   // 60+ years

	// Health modifiers for mortality
	HealthExcellent = 80.0
	HealthGood = 60.0
	HealthPoor = 40.0
	HealthCritical = 20.0

	// Reproduction
	MonthlyConceptionBase = 0.06 / DaysPerMonth // 6% monthly -> daily (2x increase per testing)
	BelongingThreshold = 40.0
	InfantSurvivalRate = 0.7 // 70% survival at birth
	GestationPeriod = 280 // Approximately 9 months in days

	// Technology unlock
	FireMasteryScienceRequired     = 100.0
	StoneKnappingScienceRequired   = 105.0 // Total 105 science (5 more than Fire Mastery, achievable in ~12-20 years total with realistic Fire Mastery timing)
	StoneKnappingFoodBonus         = 1.20  // +20% from better tools
)

// calculateAvailableLabor calculates total work hours available from the population
func calculateAvailableLabor(humans []*MinimalHuman) float64 {
	totalWorkHours := 0.0

	for _, human := range humans {
		if !human.IsAlive {
			continue
		}

		// Only adults (age >= 15) can work
		if human.Age < AgeAdult {
			continue
		}

		// Work capacity based on health
		if human.Health >= HealthFullWork {
			totalWorkHours += WorkHoursFull // Full day of work
		} else if human.Health >= HealthHalfWork {
			totalWorkHours += WorkHoursHalf // Half day (weakened)
		}
		// health < 30: cannot work (0 hours)
	}

	return totalWorkHours
}

// allocateLabor divides labor between food and science production
func allocateLabor(totalWorkHours, foodRatio float64) (foodHours, scienceHours float64) {
	foodHours = totalWorkHours * foodRatio
	scienceHours = totalWorkHours * (1.0 - foodRatio)
	return
}

// produceFood calculates food production for the day
func produceFood(foodHours float64, hasFireMastery bool, hasStoneKnapping bool, terrainMultiplier float64) float64 {
	multiplier := 1.0
	
	if hasFireMastery {
		multiplier *= FireMasteryFoodBonus // +15% from cooking
	}
	
	if hasStoneKnapping {
		multiplier *= StoneKnappingFoodBonus // +20% from better tools
	}

	return foodHours * FoodBaseRate * multiplier * terrainMultiplier
}

// produceScience calculates science production for the day
func produceScience(scienceHours float64, population int, averageHealth float64) float64 {
	if population == 0 {
		return 0
	}

	multiplier := 1.0

	// Population collaboration bonus removed to eliminate cliff effect
	// The log10 bonus created a positive feedback loop where early population
	// growth from higher food allocations dramatically accelerated science,
	// causing a discontinuity (1 year vs 20+ years) between allocations.
	// See designs/SCIENCE_DISCONTINUITY_ANALYSIS.md for details.
	// multiplier *= math.Log10(float64(population))

	// Health threshold penalty
	if averageHealth < ScienceHealthThreshold {
		multiplier *= ScienceHealthPenalty
	}

	return scienceHours * ScienceBaseRate * multiplier
}
// consumeFood distributes available food among the population
func consumeFood(humans []*MinimalHuman, foodStockpile float64) (remainingFood, foodPerPerson float64) {
	aliveHumans := 0
	for _, h := range humans {
		if h.IsAlive {
			aliveHumans++
		}
	}

	if aliveHumans == 0 {
		return foodStockpile, 0
	}

	totalRequired := float64(aliveHumans) * FoodRequiredPerPerson
	actualConsumption := math.Min(foodStockpile, totalRequired)
	foodPerPerson = actualConsumption / float64(aliveHumans)

	return foodStockpile - actualConsumption, foodPerPerson
}

// updateHealth updates a human's health based on nutrition
func updateHealth(human *MinimalHuman, foodPerPerson float64) {
	if !human.IsAlive {
		return
	}

	// Base health decline (natural)
	healthChange := HealthBaseDecline

	// Food bonus/penalty
	// Formula per design doc (HUMAN_ATTRIBUTES.md line 86):
	// food_bonus = (food_consumed / food_required) * 15
	foodRatio := foodPerPerson / FoodRequiredPerPerson
	healthChange += foodRatio * HealthFoodMultiplier

	// Age penalty
	healthChange -= (human.Age / HealthAgeDivisor) * HealthAgeMultiplier

	// Apply change and clamp to [0, 100]
	human.Health = math.Max(0, math.Min(100, human.Health+healthChange))
}

// ageHumans increments the age of all living humans
func ageHumans(humans []*MinimalHuman) {
	for _, human := range humans {
		if human.IsAlive {
			human.Age += AgeIncrementPerDay
		}
	}
}

// checkMortality checks if a human dies this day
func checkMortality(human *MinimalHuman, rng *RandomGenerator) bool {
	if !human.IsAlive {
		return false
	}

	// Base mortality rate by age (daily)
	var dailyDeathChance float64
	switch {
	case human.Age < 1:
		dailyDeathChance = MortalityInfant
	case human.Age < 5:
		dailyDeathChance = MortalityToddler
	case human.Age < 15:
		dailyDeathChance = MortalityChild
	case human.Age < 30:
		dailyDeathChance = MortalityYoungAdult
	case human.Age < 45:
		dailyDeathChance = MortalityAdult
	case human.Age < 60:
		dailyDeathChance = MortalityMiddleAge
	default:
		dailyDeathChance = MortalityElder
	}

	// Health modifiers
	switch {
	case human.Health > HealthExcellent:
		dailyDeathChance *= 0.5
	case human.Health < HealthGood && human.Health >= HealthPoor:
		dailyDeathChance *= 1.5
	case human.Health < HealthPoor && human.Health >= HealthCritical:
		dailyDeathChance *= 3.0
	case human.Health < HealthCritical:
		dailyDeathChance *= 10.0
	}

	// Roll for death
	if rng.NextBool(dailyDeathChance) {
		human.IsAlive = false
		return true
	}

	return false
}

// checkReproduction checks if a male and female can conceive a child
// Returns true if conception occurred (pregnancy started)
func checkReproduction(male, female *MinimalHuman, population int, rng *RandomGenerator) bool {
	// Prerequisites
	if !male.IsAlive || !female.IsAlive {
		return false
	}
	if male.Age < AgeFertileMin || male.Age > AgeFertileMax {
		return false
	}
	if female.Age < AgeFertileMin || female.Age > AgeFertileMax {
		return false
	}
	if male.Health < HealthFullWork || female.Health < HealthFullWork {
		return false
	}
	
	// Check if female is already pregnant
	if female.PregnancyDaysRemaining > 0 {
		return false
	}

	// Calculate simplified belonging
	belonging := math.Min(50.0, float64(population)/2.0)
	if belonging < BelongingThreshold {
		return false
	}

	// Calculate conception chance
	modifiers := 1.0

	// Health modifier (average of both parents)
	avgHealth := (male.Health + female.Health) / 2.0
	modifiers *= (avgHealth - 50.0) / 50.0 // 0.0 at health=50, 1.0 at health=100

	// Age modifier (peak at 15-25)
	avgAge := (male.Age + female.Age) / 2.0
	switch {
	case avgAge >= 15 && avgAge <= 25:
		modifiers *= 1.0 // Peak fertility
	case avgAge > 25 && avgAge <= 30:
		modifiers *= 0.8
	case avgAge > 30 && avgAge <= 40:
		modifiers *= 0.5
	default:
		modifiers *= 0.2
	}

	finalChance := MonthlyConceptionBase * math.Max(0, modifiers)

	// Roll for conception
	if rng.NextBool(finalChance) {
		// Start pregnancy
		female.PregnancyDaysRemaining = GestationPeriod
		return true
	}

	return false
}

// attemptReproduction tries to start pregnancies for eligible females
func attemptReproduction(humans []*MinimalHuman, rng *RandomGenerator) int {
	conceptions := 0

	// Count alive population
	aliveCount := 0
	for _, h := range humans {
		if h.IsAlive {
			aliveCount++
		}
	}

	// Get males and females
	var males, females []*MinimalHuman
	for _, h := range humans {
		if !h.IsAlive {
			continue
		}
		if h.Gender == "male" {
			males = append(males, h)
		} else {
			females = append(females, h)
		}
	}

	// Try to pair each eligible female with an eligible male
	for _, female := range females {
		for _, male := range males {
			if checkReproduction(male, female, aliveCount, rng) {
				conceptions++
				break // Each female can only conceive once per check
			}
		}
	}

	return conceptions
}

// processPregnancies decrements pregnancy counters and creates babies when pregnancy completes
func processPregnancies(humans []*MinimalHuman, rng *RandomGenerator) []*MinimalHuman {
	newborns := []*MinimalHuman{}

	for _, human := range humans {
		if !human.IsAlive || human.Gender != "female" {
			continue
		}

		if human.PregnancyDaysRemaining > 0 {
			human.PregnancyDaysRemaining--

			// Check if pregnancy completed
			if human.PregnancyDaysRemaining == 0 {
				// Birth occurs
				childHealth := human.Health * 0.8 // Child starts at 80% of mother's health

				// 70% infant survival rate at birth
				if rng.NextBool(InfantSurvivalRate) {
					child := &MinimalHuman{
						ID:                     generateID(rng),
						Age:                    0,
						Gender:                 "male",
						Health:                 childHealth,
						IsAlive:                true,
						PregnancyDaysRemaining: 0,
					}
					if rng.NextBool(0.5) {
						child.Gender = "female"
					}
					newborns = append(newborns, child)
				}
				// If not successful, it's stillborn/infant mortality
			}
		}
	}

	return newborns
}

// checkTechnologyUnlocks checks if any technologies should be unlocked
func checkTechnologyUnlocks(state *MinimalCivilizationState) []string {
	unlocked := []string{}
	
	// Check Fire Mastery
	if !state.HasFireMastery && state.SciencePoints >= FireMasteryScienceRequired {
		state.HasFireMastery = true
		unlocked = append(unlocked, "Fire Mastery")
	}
	
	// Check Stone Knapping
	if !state.HasStoneKnapping && state.SciencePoints >= StoneKnappingScienceRequired {
		state.HasStoneKnapping = true
		unlocked = append(unlocked, "Stone Knapping")
	}
	
	return unlocked
}

// calculateAverageHealth calculates the average health of alive humans
func calculateAverageHealth(humans []*MinimalHuman) float64 {
	total := 0.0
	count := 0
	for _, h := range humans {
		if h.IsAlive {
			total += h.Health
			count++
		}
	}
	if count == 0 {
		return 0
	}
	return total / float64(count)
}

// countAlive counts the number of alive humans
func countAlive(humans []*MinimalHuman) int {
	count := 0
	for _, h := range humans {
		if h.IsAlive {
			count++
		}
	}
	return count
}

// generateID creates a unique ID for a human
func generateID(rng *RandomGenerator) string {
	return fmt.Sprintf("human-%d", int(rng.Next()*1000000000))
}
