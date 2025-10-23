package mapgen

import (
	"math"

	"github.com/anicolao/simciv/simulation/pkg/models"
)

// findStartingPositions finds fair starting positions for all players
func (g *Generator) findStartingPositions(tiles []*models.MapTile, playerIDs []string, elevationGrid [][]int, seaLevel int) []*models.StartingPosition {
	// Step 1: Identify candidate starting regions
	candidates := g.findCandidateRegions(tiles, elevationGrid, seaLevel)

	if len(candidates) < len(playerIDs) {
		// Not enough candidates, use what we have
		for len(candidates) < len(playerIDs) {
			// Add any land tile as fallback
			for _, tile := range tiles {
				if tile.TerrainType != "OCEAN" && tile.TerrainType != "SHALLOW_WATER" {
					candidates = append(candidates, &candidateRegion{
						centerX: tile.X,
						centerY: tile.Y,
						score:   10.0,
					})
					break
				}
			}
		}
	}

	// Step 2: Select positions with maximum spacing
	selectedPositions := []*models.StartingPosition{}
	usedCandidates := make(map[int]bool)

	for playerIdx, playerID := range playerIDs {
		var bestCandidate *candidateRegion
		var bestCandidateIdx int
		bestScore := -1.0

		for idx, candidate := range candidates {
			if usedCandidates[idx] {
				continue
			}

			// Calculate minimum distance to already selected positions
			minDist := math.MaxFloat64
			if len(selectedPositions) > 0 {
				for _, pos := range selectedPositions {
					dx := float64(candidate.centerX - pos.CenterX)
					dy := float64(candidate.centerY - pos.CenterY)
					dist := math.Sqrt(dx*dx + dy*dy)
					if dist < minDist {
						minDist = dist
					}
				}
			} else {
				minDist = 1.0 // First player
			}

			// Combined score: quality * spacing
			diagonal := math.Sqrt(float64(g.width*g.width + g.height*g.height))
			combinedScore := candidate.score * (minDist / diagonal)

			if combinedScore > bestScore {
				bestScore = combinedScore
				bestCandidate = candidate
				bestCandidateIdx = idx
			}
		}

		if bestCandidate == nil {
			// Fallback: use any remaining candidate
			for idx, candidate := range candidates {
				if !usedCandidates[idx] {
					bestCandidate = candidate
					bestCandidateIdx = idx
					break
				}
			}
		}

		// Mark this candidate as used
		if bestCandidate != nil {
			usedCandidates[bestCandidateIdx] = true
		}

		// Create starting position
		position := &models.StartingPosition{
			GameID:        "", // Will be set by caller
			PlayerID:      playerID,
			CenterX:       bestCandidate.centerX,
			CenterY:       bestCandidate.centerY,
			StartingCityX: bestCandidate.centerX,
			StartingCityY: bestCandidate.centerY,
			RegionScore:   bestCandidate.score,
			RevealedTiles: 15 * 15,
		}

		// Set guaranteed footprint (40x40)
		position.GuaranteedFootprint.MinX = max(0, position.CenterX-20)
		position.GuaranteedFootprint.MaxX = min(g.width-1, position.CenterX+20)
		position.GuaranteedFootprint.MinY = max(0, position.CenterY-20)
		position.GuaranteedFootprint.MaxY = min(g.height-1, position.CenterY+20)

		selectedPositions = append(selectedPositions, position)
		_ = playerIdx // Mark as used
	}

	return selectedPositions
}

type candidateRegion struct {
	centerX int
	centerY int
	score   float64
}

// findCandidateRegions scans the map for suitable 15x15 starting regions
func (g *Generator) findCandidateRegions(tiles []*models.MapTile, elevationGrid [][]int, seaLevel int) []*candidateRegion {
	candidates := []*candidateRegion{}

	// Scan every 10 tiles to find candidates
	for y := 7; y < g.height-7; y += 10 {
		for x := 7; x < g.width-7; x += 10 {
			score := g.scoreStartingRegion(tiles, x, y, elevationGrid, seaLevel)
			if score > 50 { // Minimum threshold
				candidates = append(candidates, &candidateRegion{
					centerX: x,
					centerY: y,
					score:   score,
				})
			}
		}
	}

	// Sort by score (highest first) - simple bubble sort for small arrays
	for i := 0; i < len(candidates); i++ {
		for j := i + 1; j < len(candidates); j++ {
			if candidates[j].score > candidates[i].score {
				candidates[i], candidates[j] = candidates[j], candidates[i]
			}
		}
	}

	return candidates
}

// scoreStartingRegion evaluates a 15x15 region for starting position suitability
func (g *Generator) scoreStartingRegion(tiles []*models.MapTile, centerX, centerY int, elevationGrid [][]int, seaLevel int) float64 {
	score := 0.0
	landTiles := 0
	coastalTiles := 0
	resourceCount := 0
	terrainTypes := make(map[string]bool)

	// Evaluate 15x15 region
	for dy := -7; dy <= 7; dy++ {
		for dx := -7; dx <= 7; dx++ {
			x := centerX + dx
			y := centerY + dy

			if x < 0 || x >= g.width || y < 0 || y >= g.height {
				continue
			}

			tile := getTile(tiles, x, y, g.width)
			if tile == nil {
				continue
			}

			elevation := elevationGrid[y][x]

			// Count land tiles
			if elevation >= seaLevel {
				landTiles++
				terrainTypes[tile.TerrainType] = true

				// Prefer buildable terrain
				if tile.TerrainType == "GRASSLAND" || tile.TerrainType == "PLAINS" {
					score += 2.0
				} else if tile.TerrainType == "FOREST" {
					score += 1.5
				} else if tile.TerrainType == "MOUNTAIN" || tile.TerrainType == "TUNDRA" {
					score -= 1.0 // Less desirable
				}

				// Count coastal access
				if tile.IsCoastal {
					coastalTiles++
				}

				// Count resources
				if len(tile.Resources) > 0 {
					resourceCount += len(tile.Resources)
				}

				// Prefer moderate elevation
				if elevation >= seaLevel && elevation <= 800 {
					score += 1.0
				}
			}
		}
	}

	// Apply viability criteria
	if landTiles < 180 { // Need at least 80% land
		return 0
	}

	if coastalTiles < 3 { // Need some coastal access
		score -= 10
	}

	if resourceCount < 2 { // Need some resources
		score -= 10
	}

	// Reward terrain diversity (2-4 types ideal)
	terrainDiversity := len(terrainTypes)
	if terrainDiversity >= 2 && terrainDiversity <= 4 {
		score += float64(terrainDiversity) * 5
	}

	// Add base score for land tiles
	score += float64(landTiles) / 2.0

	return score
}

// revealStartingAreas reveals the 15x15 starting region for each player
func (g *Generator) revealStartingAreas(tiles []*models.MapTile, startingPositions []*models.StartingPosition) {
	for _, position := range startingPositions {
		// Reveal 15x15 region around starting position
		for dy := -7; dy <= 7; dy++ {
			for dx := -7; dx <= 7; dx++ {
				x := position.CenterX + dx
				y := position.CenterY + dy

				if x >= 0 && x < g.width && y >= 0 && y < g.height {
					tile := getTile(tiles, x, y, g.width)
					if tile != nil {
						tile.VisibleTo = append(tile.VisibleTo, position.PlayerID)
					}
				}
			}
		}
	}
}

// Helper functions
func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
