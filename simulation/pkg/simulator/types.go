package simulator

// MinimalHuman represents a single human in the minimal simulation
type MinimalHuman struct {
	ID       string  // Unique identifier
	Age      float64 // Age in years (0-60)
	Gender   string  // "male" or "female"
	Health   float64 // 0-100 (fully implemented)
	IsAlive  bool    // Alive status
}

// MinimalCivilizationState represents the complete state of a civilization
type MinimalCivilizationState struct {
	// Population
	Humans []*MinimalHuman

	// Resources
	FoodStockpile float64 // Available food units
	SciencePoints float64 // Accumulated science

	// Configuration
	FoodAllocationRatio float64 // 0.0 to 1.0 (default 0.8 = 80%)

	// Technology
	HasFireMastery   bool // Research goal 1 (unlocks at 100 science, 5-10 years)
	HasStoneKnapping bool // Research goal 2 (unlocks at 600 science, 12-17 years)

	// Simulation State
	CurrentDay int // Day counter (increments until completion or failure)
}

// StartingConditions defines the initial conditions for a simulation
type StartingConditions struct {
	Population            int     // Number of humans to create
	StartingHealthMin     float64 // Minimum starting health
	StartingHealthMax     float64 // Maximum starting health
	FoodStockpile         float64 // Starting food units
	FoodAllocationRatio   float64 // Default food allocation ratio
	TerrainMultiplier     float64 // Terrain food production multiplier (1.0 = normal)
}

// DailyMetrics tracks statistics for a single day
type DailyMetrics struct {
	Day               int     // Day number
	Population        int     // Number of alive humans
	AverageHealth     float64 // Average health of alive humans
	FoodStockpile     float64 // Current food stockpile
	SciencePoints     float64 // Current science points
	FoodProduction    float64 // Food produced this day
	ScienceProduction float64 // Science produced this day
	Births            int     // Number of births this day
	Deaths            int     // Number of deaths this day
	HasFireMastery    bool    // Whether Fire Mastery is unlocked
	HasStoneKnapping  bool    // Whether Stone Knapping is unlocked
}

// ViabilityResult contains the results of a viability assessment
type ViabilityResult struct {
	IsViable       bool     // Whether the starting position is viable
	FailureReasons []string // List of failure reasons if not viable

	// Metrics
	FinalPopulation        int     // Final population
	FinalScience           float64 // Final science points
	AverageHealth          float64 // Average health across entire simulation
	DaysToFireMastery      int     // Days until Fire Mastery was unlocked (-1 if never)
	DaysToStoneKnapping    int     // Days until Stone Knapping was unlocked (-1 if never)
	DaysToNonViable        int     // Days until population became non-viable (-1 if never)
	FinalAverageHealth     float64 // Final average health
	PeakPopulation         int     // Peak population during simulation
	MinimumPopulation      int     // Minimum population during simulation
	FireMasteryUnlocked    bool    // Whether Fire Mastery was unlocked
	StoneKnappingUnlocked  bool    // Whether Stone Knapping was unlocked
	TotalBirths            int     // Total births during simulation
	HasFireMastery         bool    // Final Fire Mastery status
	HasStoneKnapping       bool    // Final Stone Knapping status

	// All daily metrics for analysis
	AllMetrics []*DailyMetrics
}

// SimulationConfig contains all configuration for a simulation run
type SimulationConfig struct {
	Seed                int                 // Random seed for deterministic simulation
	StartingConditions  StartingConditions  // Initial conditions
	MaxDays             int                 // Maximum days to simulate (default 1825 = 5 years)
}
