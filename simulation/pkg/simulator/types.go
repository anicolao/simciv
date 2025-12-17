package simulator

import "fmt"

// MinimalHuman represents a single human in the minimal simulation
type MinimalHuman struct {
	ID                     string  // Unique identifier
	Age                    float64 // Age in years (0-60)
	Gender                 string  // "male" or "female"
	Health                 float64 // 0-100 (fully implemented)
	IsAlive                bool    // Alive status
	PregnancyDaysRemaining int     // Days remaining in pregnancy (0 if not pregnant, only for females)
}

// TechnologyProgress tracks research progress for a single technology
type TechnologyProgress struct {
	Name              string  // Technology name
	ProgressPoints    float64 // Points accumulated toward this technology
	RequiredPoints    float64 // Points needed to unlock
	IsUnlocked        bool    // Whether this technology is unlocked
	FoodBonus         float64 // Food production multiplier (1.0 = no bonus)
}

// MinimalCivilizationState represents the complete state of a civilization
type MinimalCivilizationState struct {
	// Population
	Humans []*MinimalHuman

	// Resources
	FoodStockpile float64 // Available food units
	SciencePoints float64 // Accumulated science (deprecated - use TechnologyResearch)

	// Configuration
	FoodAllocationRatio float64 // 0.0 to 1.0 (default 0.8 = 80%)

	// Technology Research (new per-tech tracking system)
	TechnologyResearch map[string]*TechnologyProgress // Research progress per technology
	ResearchFocus      string                         // Currently focused technology for research

	// Technology (deprecated - maintained for backward compatibility)
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

// Technology Research API Methods

// InitializeTechnologyResearch sets up the technology research system with default technologies
func (s *MinimalCivilizationState) InitializeTechnologyResearch() {
	s.TechnologyResearch = make(map[string]*TechnologyProgress)
	
	// Fire Mastery
	s.TechnologyResearch["Fire Mastery"] = &TechnologyProgress{
		Name:           "Fire Mastery",
		ProgressPoints: 0,
		RequiredPoints: FireMasteryScienceRequired,
		IsUnlocked:     false,
		FoodBonus:      FireMasteryFoodBonus,
	}
	
	// Stone Knapping
	s.TechnologyResearch["Stone Knapping"] = &TechnologyProgress{
		Name:           "Stone Knapping",
		ProgressPoints: 0,
		RequiredPoints: StoneKnappingScienceRequired - FireMasteryScienceRequired, // 50 points (independent cost)
		IsUnlocked:     false,
		FoodBonus:      StoneKnappingFoodBonus,
	}
	
	// Set default research focus to Fire Mastery
	s.ResearchFocus = "Fire Mastery"
}

// SetResearchFocus changes which technology is currently being researched
func (s *MinimalCivilizationState) SetResearchFocus(technologyName string) error {
	if s.TechnologyResearch == nil {
		return fmt.Errorf("technology research not initialized")
	}
	if _, exists := s.TechnologyResearch[technologyName]; !exists {
		return fmt.Errorf("unknown technology: %s", technologyName)
	}
	s.ResearchFocus = technologyName
	return nil
}

// GetResearchFocus returns the currently focused technology
func (s *MinimalCivilizationState) GetResearchFocus() string {
	return s.ResearchFocus
}

// GetTechnologyProgress returns the progress for a specific technology
func (s *MinimalCivilizationState) GetTechnologyProgress(technologyName string) (*TechnologyProgress, error) {
	if s.TechnologyResearch == nil {
		return nil, fmt.Errorf("technology research not initialized")
	}
	tech, exists := s.TechnologyResearch[technologyName]
	if !exists {
		return nil, fmt.Errorf("unknown technology: %s", technologyName)
	}
	// Return a copy to prevent external modification
	return &TechnologyProgress{
		Name:           tech.Name,
		ProgressPoints: tech.ProgressPoints,
		RequiredPoints: tech.RequiredPoints,
		IsUnlocked:     tech.IsUnlocked,
		FoodBonus:      tech.FoodBonus,
	}, nil
}

// GetAllTechnologyProgress returns progress for all technologies
func (s *MinimalCivilizationState) GetAllTechnologyProgress() map[string]*TechnologyProgress {
	if s.TechnologyResearch == nil {
		return make(map[string]*TechnologyProgress)
	}
	// Return copies to prevent external modification
	result := make(map[string]*TechnologyProgress)
	for name, tech := range s.TechnologyResearch {
		result[name] = &TechnologyProgress{
			Name:           tech.Name,
			ProgressPoints: tech.ProgressPoints,
			RequiredPoints: tech.RequiredPoints,
			IsUnlocked:     tech.IsUnlocked,
			FoodBonus:      tech.FoodBonus,
		}
	}
	return result
}

// AddResearchPoints adds science points to the currently focused technology
func (s *MinimalCivilizationState) AddResearchPoints(points float64) error {
	if s.TechnologyResearch == nil {
		return fmt.Errorf("technology research not initialized")
	}
	if s.ResearchFocus == "" {
		return fmt.Errorf("no research focus set")
	}
	tech, exists := s.TechnologyResearch[s.ResearchFocus]
	if !exists {
		return fmt.Errorf("unknown technology: %s", s.ResearchFocus)
	}
	
	// Don't add points to already unlocked technologies
	if tech.IsUnlocked {
		return nil
	}
	
	tech.ProgressPoints += points
	
	// Check if technology unlocked
	if tech.ProgressPoints >= tech.RequiredPoints {
		tech.IsUnlocked = true
		// Update legacy flags for backward compatibility
		if tech.Name == "Fire Mastery" {
			s.HasFireMastery = true
		} else if tech.Name == "Stone Knapping" {
			s.HasStoneKnapping = true
		}
	}
	
	return nil
}

// SimulationConfig contains all configuration for a simulation run
type SimulationConfig struct {
	Seed                int                 // Random seed for deterministic simulation
	StartingConditions  StartingConditions  // Initial conditions
	MaxDays             int                 // Maximum days to simulate (default 1825 = 5 years)
}
