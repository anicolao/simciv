package simulator

import (
	"testing"
)

// TestInitializeTechnologyResearch tests the initialization of the technology research system
func TestInitializeTechnologyResearch(t *testing.T) {
	state := &MinimalCivilizationState{}
	state.InitializeTechnologyResearch()

	// Verify research map is initialized
	if state.TechnologyResearch == nil {
		t.Fatal("TechnologyResearch map not initialized")
	}

	// Verify Fire Mastery is initialized
	fireTech, err := state.GetTechnologyProgress("Fire Mastery")
	if err != nil {
		t.Fatalf("Failed to get Fire Mastery: %v", err)
	}
	if fireTech.Name != "Fire Mastery" {
		t.Errorf("Expected name 'Fire Mastery', got '%s'", fireTech.Name)
	}
	if fireTech.ProgressPoints != 0 {
		t.Errorf("Expected 0 progress points, got %f", fireTech.ProgressPoints)
	}
	if fireTech.RequiredPoints != FireMasteryScienceRequired {
		t.Errorf("Expected %f required points, got %f", FireMasteryScienceRequired, fireTech.RequiredPoints)
	}
	if fireTech.IsUnlocked {
		t.Error("Fire Mastery should not be unlocked initially")
	}
	if fireTech.FoodBonus != FireMasteryFoodBonus {
		t.Errorf("Expected food bonus %f, got %f", FireMasteryFoodBonus, fireTech.FoodBonus)
	}

	// Verify Stone Knapping is initialized with independent cost
	stoneTech, err := state.GetTechnologyProgress("Stone Knapping")
	if err != nil {
		t.Fatalf("Failed to get Stone Knapping: %v", err)
	}
	if stoneTech.Name != "Stone Knapping" {
		t.Errorf("Expected name 'Stone Knapping', got '%s'", stoneTech.Name)
	}
	if stoneTech.ProgressPoints != 0 {
		t.Errorf("Expected 0 progress points, got %f", stoneTech.ProgressPoints)
	}
	expectedIndependentCost := StoneKnappingScienceRequired
	if stoneTech.RequiredPoints != expectedIndependentCost {
		t.Errorf("Expected %f independent required points, got %f", expectedIndependentCost, stoneTech.RequiredPoints)
	}
	if stoneTech.IsUnlocked {
		t.Error("Stone Knapping should not be unlocked initially")
	}

	// Verify default research focus is set
	if state.GetResearchFocus() != "Fire Mastery" {
		t.Errorf("Expected default focus 'Fire Mastery', got '%s'", state.GetResearchFocus())
	}
}

// TestSetResearchFocus tests changing the research focus
func TestSetResearchFocus(t *testing.T) {
	state := &MinimalCivilizationState{}
	state.InitializeTechnologyResearch()

	// Initial focus should be Fire Mastery
	if state.GetResearchFocus() != "Fire Mastery" {
		t.Errorf("Expected initial focus 'Fire Mastery', got '%s'", state.GetResearchFocus())
	}

	// Change to Stone Knapping
	err := state.SetResearchFocus("Stone Knapping")
	if err != nil {
		t.Fatalf("Failed to set focus to Stone Knapping: %v", err)
	}
	if state.GetResearchFocus() != "Stone Knapping" {
		t.Errorf("Expected focus 'Stone Knapping', got '%s'", state.GetResearchFocus())
	}

	// Try to set invalid technology
	err = state.SetResearchFocus("Invalid Tech")
	if err == nil {
		t.Error("Expected error when setting invalid technology, got nil")
	}

	// Focus should remain unchanged after error
	if state.GetResearchFocus() != "Stone Knapping" {
		t.Errorf("Expected focus to remain 'Stone Knapping', got '%s'", state.GetResearchFocus())
	}
}

// TestAddResearchPoints tests adding research points to technologies
func TestAddResearchPoints(t *testing.T) {
	state := &MinimalCivilizationState{}
	state.InitializeTechnologyResearch()

	// Add 40 points to Fire Mastery
	err := state.AddResearchPoints(40.0)
	if err != nil {
		t.Fatalf("Failed to add research points: %v", err)
	}

	fireTech, _ := state.GetTechnologyProgress("Fire Mastery")
	if fireTech.ProgressPoints != 40.0 {
		t.Errorf("Expected 40 progress points, got %f", fireTech.ProgressPoints)
	}
	if fireTech.IsUnlocked {
		t.Error("Fire Mastery should not be unlocked at 40 points")
	}

	// Switch to Stone Knapping
	state.SetResearchFocus("Stone Knapping")

	// Add 30 points to Stone Knapping
	err = state.AddResearchPoints(30.0)
	if err != nil {
		t.Fatalf("Failed to add research points: %v", err)
	}

	stoneTech, _ := state.GetTechnologyProgress("Stone Knapping")
	if stoneTech.ProgressPoints != 30.0 {
		t.Errorf("Expected 30 progress points, got %f", stoneTech.ProgressPoints)
	}

	// Fire Mastery should still have 40 points (saved progress)
	fireTech, _ = state.GetTechnologyProgress("Fire Mastery")
	if fireTech.ProgressPoints != 40.0 {
		t.Errorf("Expected Fire Mastery to still have 40 points, got %f", fireTech.ProgressPoints)
	}

	// Switch back to Fire Mastery and complete it
	state.SetResearchFocus("Fire Mastery")
	err = state.AddResearchPoints(60.0) // 40 + 60 = 100
	if err != nil {
		t.Fatalf("Failed to add research points: %v", err)
	}

	fireTech, _ = state.GetTechnologyProgress("Fire Mastery")
	if fireTech.ProgressPoints != 100.0 {
		t.Errorf("Expected 100 progress points, got %f", fireTech.ProgressPoints)
	}
	if !fireTech.IsUnlocked {
		t.Error("Fire Mastery should be unlocked at 100 points")
	}
	if !state.HasFireMastery {
		t.Error("Legacy HasFireMastery flag should be set")
	}

	// Complete Stone Knapping
	state.SetResearchFocus("Stone Knapping")
	err = state.AddResearchPoints(StoneKnappingScienceRequired - 30.0)
	if err != nil {
		t.Fatalf("Failed to add research points: %v", err)
	}

	stoneTech, _ = state.GetTechnologyProgress("Stone Knapping")
	if stoneTech.ProgressPoints != StoneKnappingScienceRequired {
		t.Errorf("Expected %f progress points, got %f", StoneKnappingScienceRequired, stoneTech.ProgressPoints)
	}
	if !stoneTech.IsUnlocked {
		t.Errorf("Stone Knapping should be unlocked at %f points", StoneKnappingScienceRequired)
	}
	if !state.HasStoneKnapping {
		t.Error("Legacy HasStoneKnapping flag should be set")
	}

	if err := state.AddResearchPoints(-1); err == nil {
		t.Error("Expected negative research points to be rejected")
	}
}

// TestIndependentResearchCosts tests that research costs are independent per technology
func TestIndependentResearchCosts(t *testing.T) {
	state := &MinimalCivilizationState{}
	state.InitializeTechnologyResearch()

	// Start researching Fire Mastery
	state.SetResearchFocus("Fire Mastery")
	state.AddResearchPoints(40.0)

	// Switch to Stone Knapping without completing Fire
	state.SetResearchFocus("Stone Knapping")
	state.AddResearchPoints(StoneKnappingScienceRequired) // Complete Stone Knapping first!

	// Stone Knapping should be unlocked
	stoneTech, _ := state.GetTechnologyProgress("Stone Knapping")
	if !stoneTech.IsUnlocked {
		t.Error("Stone Knapping should be unlocked (independent research)")
	}

	// Fire Mastery should NOT be unlocked
	fireTech, _ := state.GetTechnologyProgress("Fire Mastery")
	if fireTech.IsUnlocked {
		t.Error("Fire Mastery should not be unlocked yet")
	}
	if fireTech.ProgressPoints != 40.0 {
		t.Errorf("Fire Mastery should still have 40 points, got %f", fireTech.ProgressPoints)
	}

	// Complete Fire Mastery later
	state.SetResearchFocus("Fire Mastery")
	state.AddResearchPoints(60.0)

	fireTech, _ = state.GetTechnologyProgress("Fire Mastery")
	if !fireTech.IsUnlocked {
		t.Error("Fire Mastery should now be unlocked")
	}
}

// TestGetAllTechnologyProgress tests retrieving all technology progress
func TestGetAllTechnologyProgress(t *testing.T) {
	state := &MinimalCivilizationState{}
	state.InitializeTechnologyResearch()

	// Add progress to both technologies
	state.SetResearchFocus("Fire Mastery")
	state.AddResearchPoints(40.0)
	state.SetResearchFocus("Stone Knapping")
	state.AddResearchPoints(20.0)

	allProgress := state.GetAllTechnologyProgress()

	if len(allProgress) != 2 {
		t.Errorf("Expected 2 technologies, got %d", len(allProgress))
	}

	fireTech, exists := allProgress["Fire Mastery"]
	if !exists {
		t.Error("Fire Mastery not found in all progress")
	}
	if fireTech.ProgressPoints != 40.0 {
		t.Errorf("Expected Fire Mastery to have 40 points, got %f", fireTech.ProgressPoints)
	}

	stoneTech, exists := allProgress["Stone Knapping"]
	if !exists {
		t.Error("Stone Knapping not found in all progress")
	}
	if stoneTech.ProgressPoints != 20.0 {
		t.Errorf("Expected Stone Knapping to have 20 points, got %f", stoneTech.ProgressPoints)
	}
}

// TestResearchPointsNotAddedToUnlockedTech tests that points aren't wasted on unlocked technologies
func TestResearchPointsNotAddedToUnlockedTech(t *testing.T) {
	state := &MinimalCivilizationState{}
	state.InitializeTechnologyResearch()

	// Unlock Fire Mastery
	state.SetResearchFocus("Fire Mastery")
	state.AddResearchPoints(100.0)

	fireTech, _ := state.GetTechnologyProgress("Fire Mastery")
	if !fireTech.IsUnlocked {
		t.Fatal("Fire Mastery should be unlocked")
	}

	// Try to add more points - they should not be added
	state.AddResearchPoints(50.0)

	fireTech, _ = state.GetTechnologyProgress("Fire Mastery")
	if fireTech.ProgressPoints != 100.0 {
		t.Errorf("Fire Mastery should still have 100 points, got %f", fireTech.ProgressPoints)
	}
}

// TestSimulationWithResearchFocusSwitching tests a full simulation with research focus changes
func TestSimulationWithResearchFocusSwitching(t *testing.T) {
	// This test verifies the API works correctly for research focus switching
	// A real simulation with mid-run focus changes would need a callback system

	state := &MinimalCivilizationState{}
	state.InitializeTechnologyResearch()

	// Simulate research switching:
	// Days 1-100: Research Fire Mastery
	state.SetResearchFocus("Fire Mastery")
	for i := 0; i < 100; i++ {
		state.AddResearchPoints(0.5) // Add some points each day
	}

	// Days 101-200: Switch to Stone Knapping
	state.SetResearchFocus("Stone Knapping")
	for i := 0; i < 100; i++ {
		state.AddResearchPoints(0.3)
	}

	// Days 201-300: Back to Fire Mastery to complete it
	state.SetResearchFocus("Fire Mastery")
	for i := 0; i < 100; i++ {
		state.AddResearchPoints(0.5)
	}

	fireTech, _ := state.GetTechnologyProgress("Fire Mastery")
	stoneTech, _ := state.GetTechnologyProgress("Stone Knapping")

	// Fire: 100*0.5 + 100*0.5 = 100 points (should be unlocked)
	// Stone: 100*0.3 = 30 points (should not be unlocked)

	if !fireTech.IsUnlocked {
		t.Errorf("Fire Mastery should be unlocked, has %f points", fireTech.ProgressPoints)
	}
	if stoneTech.IsUnlocked {
		t.Errorf("Stone Knapping should not be unlocked, has %f points", stoneTech.ProgressPoints)
	}

	// Verify Stone Knapping has expected progress
	expectedStoneProgress := 30.0
	if stoneTech.ProgressPoints < expectedStoneProgress-0.01 || stoneTech.ProgressPoints > expectedStoneProgress+0.01 {
		t.Errorf("Stone Knapping should have ~30 points, got %f", stoneTech.ProgressPoints)
	}
}
