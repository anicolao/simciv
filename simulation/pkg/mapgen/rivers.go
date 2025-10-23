package mapgen

import (
	"github.com/anicolao/simciv/simulation/pkg/models"
)

// generateRivers creates rivers flowing from high elevations to the sea
func (g *Generator) generateRivers(tiles []*models.MapTile, elevationGrid [][]int, seaLevel int) {
	numRivers := g.width / 20
	if numRivers < 3 {
		numRivers = 3
	}

	for i := 0; i < numRivers; i++ {
		// Find a high elevation tile as source
		sourceX, sourceY := g.findRiverSource(elevationGrid, seaLevel)
		if sourceX == -1 {
			continue
		}

		// Trace river path downhill
		g.traceRiver(tiles, elevationGrid, seaLevel, sourceX, sourceY)
	}
}

// findRiverSource finds a suitable starting point for a river
func (g *Generator) findRiverSource(elevationGrid [][]int, seaLevel int) (int, int) {
	// Try to find a mountain tile (elevation > 1200)
	for attempt := 0; attempt < 50; attempt++ {
		x := g.rng.Intn(g.width)
		y := g.rng.Intn(g.height)
		if elevationGrid[y][x] > 1200 && elevationGrid[y][x] >= seaLevel {
			return x, y
		}
	}
	return -1, -1
}

// traceRiver traces a river path from source to sea
func (g *Generator) traceRiver(tiles []*models.MapTile, elevationGrid [][]int, seaLevel, startX, startY int) {
	x, y := startX, startY
	visited := make(map[int]bool)
	maxSteps := g.width * g.height // Prevent infinite loops

	for step := 0; step < maxSteps; step++ {
		// Mark current tile as having river
		idx := y*g.width + x
		if visited[idx] {
			break // River loop detected
		}
		visited[idx] = true

		tile := getTile(tiles, x, y, g.width)
		if tile != nil {
			tile.HasRiver = true

			// Rivers make adjacent desert tiles into grassland
			if tile.TerrainType == "DESERT" {
				tile.TerrainType = "GRASSLAND"
			}
		}

		// Check if we reached the sea
		if elevationGrid[y][x] < seaLevel {
			break
		}

		// Find lowest neighboring tile
		lowestElev := elevationGrid[y][x]
		nextX, nextY := x, y

		for dy := -1; dy <= 1; dy++ {
			for dx := -1; dx <= 1; dx++ {
				if dx == 0 && dy == 0 {
					continue
				}
				nx, ny := x+dx, y+dy
				if nx >= 0 && nx < g.width && ny >= 0 && ny < g.height {
					if elevationGrid[ny][nx] < lowestElev {
						lowestElev = elevationGrid[ny][nx]
						nextX, nextY = nx, ny
					}
				}
			}
		}

		// If no lower tile found, stop
		if nextX == x && nextY == y {
			break
		}

		x, y = nextX, nextY
	}
}

// distributeResources places resources on the map based on terrain
func (g *Generator) distributeResources(tiles []*models.MapTile, elevationGrid [][]int, seaLevel int) {
	// Strategic resources
	g.placeResource(tiles, "IRON", 0.03, []string{"HILLS", "MOUNTAIN"})
	g.placeResource(tiles, "COPPER", 0.02, []string{"HILLS"})
	g.placeResource(tiles, "COAL", 0.02, []string{"FOREST", "GRASSLAND"})
	g.placeResource(tiles, "GOLD", 0.01, []string{"MOUNTAIN", "HILLS"})

	// Basic resources
	g.placeResource(tiles, "WHEAT", 0.08, []string{"GRASSLAND", "PLAINS"})
	g.placeResource(tiles, "CATTLE", 0.06, []string{"GRASSLAND", "PLAINS"})
	g.placeResource(tiles, "FISH", 0.05, []string{"OCEAN", "SHALLOW_WATER"})
	g.placeResource(tiles, "STONE", 0.05, []string{"HILLS", "MOUNTAIN"})
	g.placeResource(tiles, "WOOD", 0.06, []string{"FOREST", "JUNGLE"})
	g.placeResource(tiles, "GAME", 0.04, []string{"FOREST"})
}

// placeResource places a specific resource type on suitable terrain
func (g *Generator) placeResource(tiles []*models.MapTile, resourceType string, density float64, suitableTerrain []string) {
	// Find suitable tiles
	suitable := []*models.MapTile{}
	for _, tile := range tiles {
		for _, terrain := range suitableTerrain {
			if tile.TerrainType == terrain {
				suitable = append(suitable, tile)
				break
			}
		}
	}

	if len(suitable) == 0 {
		return
	}

	// Place resources in clusters
	numClusters := int(float64(len(suitable)) * density / 5.0)
	if numClusters < 1 {
		numClusters = 1
	}

	for i := 0; i < numClusters; i++ {
		// Pick random starting tile
		centerTile := suitable[g.rng.Intn(len(suitable))]

		// Place 3-7 tiles per cluster
		clusterSize := g.rng.Intn(5) + 3
		placed := 0

		// Try to place around center
		for attempt := 0; attempt < clusterSize*3 && placed < clusterSize; attempt++ {
			// Random offset from center
			dx := g.rng.Intn(5) - 2
			dy := g.rng.Intn(5) - 2
			x := centerTile.X + dx
			y := centerTile.Y + dy

			if x >= 0 && x < g.width && y >= 0 && y < g.height {
				tile := getTile(tiles, x, y, g.width)
				if tile != nil && len(tile.Resources) == 0 {
					// Check if terrain is suitable
					for _, terrain := range suitableTerrain {
						if tile.TerrainType == terrain {
							tile.Resources = append(tile.Resources, resourceType)
							placed++
							break
						}
					}
				}
			}
		}
	}
}
