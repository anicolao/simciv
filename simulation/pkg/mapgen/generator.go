package mapgen

import (
	"context"
	"crypto/sha256"
	"fmt"
	"math"
	"math/rand"
	"sort"
	"time"

	"github.com/anicolao/simciv/simulation/pkg/models"
)

// Generator generates procedural maps for SimCiv
type Generator struct {
	seed   string
	rng    *rand.Rand
	width  int
	height int
}

// NewGenerator creates a new map generator
func NewGenerator(seed string, playerCount int) *Generator {
	// Calculate map dimensions based on player count
	// Formula: sqrt(players * 1600 * 2)
	tiles := playerCount * 1600 * 2
	dimension := int(math.Ceil(math.Sqrt(float64(tiles))))

	// Generate seed hash for RNG
	h := sha256.Sum256([]byte(seed))
	seedInt := int64(h[0])<<56 | int64(h[1])<<48 | int64(h[2])<<40 | int64(h[3])<<32 |
		int64(h[4])<<24 | int64(h[5])<<16 | int64(h[6])<<8 | int64(h[7])

	return &Generator{
		seed:   seed,
		rng:    rand.New(rand.NewSource(seedInt)),
		width:  dimension,
		height: dimension,
	}
}

// GenerateMap generates a complete map with terrain, resources, and starting positions
func (g *Generator) GenerateMap(ctx context.Context, gameID string, playerCount int) (*models.MapMetadata, []*models.MapTile, []*models.StartingPosition, error) {
	startTime := time.Now()

	// Step 1: Generate great circles for terrain features
	greatCircles := g.generateGreatCircles(playerCount)

	// Step 2: Calculate base elevation for all tiles
	tiles := make([]*models.MapTile, 0, g.width*g.height)
	elevationGrid := make([][]int, g.height)
	for y := 0; y < g.height; y++ {
		elevationGrid[y] = make([]int, g.width)
	}

	for y := 0; y < g.height; y++ {
		for x := 0; x < g.width; x++ {
			elevation := g.calculateElevation(x, y, greatCircles)
			elevationGrid[y][x] = elevation
		}
	}

	// Step 3: Determine sea level (median elevation)
	seaLevel := g.calculateSeaLevel(elevationGrid)

	// Step 4: Assign terrain types based on elevation and climate
	for y := 0; y < g.height; y++ {
		for x := 0; x < g.width; x++ {
			tile := &models.MapTile{
				GameID:       gameID,
				X:            x,
				Y:            y,
				Elevation:    elevationGrid[y][x],
				Resources:    []string{},
				Improvements: []string{},
				VisibleTo:    []string{},
				CreatedAt:    time.Now(),
			}

			// Assign terrain type
			tile.TerrainType = g.assignTerrainType(x, y, elevationGrid[y][x], seaLevel)
			tile.ClimateZone = g.assignClimateZone(y, elevationGrid[y][x])
			tile.IsCoastal = g.isCoastal(x, y, elevationGrid, seaLevel)
			tile.HasRiver = false // Will be set during river generation

			tiles = append(tiles, tile)
		}
	}

	// Step 5: Generate rivers
	g.generateRivers(tiles, elevationGrid, seaLevel)

	// Step 6: Distribute resources
	g.distributeResources(tiles, elevationGrid, seaLevel)

	// Step 7: Find starting positions
	playerIDs := make([]string, playerCount)
	for i := 0; i < playerCount; i++ {
		playerIDs[i] = fmt.Sprintf("player%d", i+1) // Placeholder, will be updated by caller
	}
	startingPositions := g.findStartingPositions(tiles, playerIDs, elevationGrid, seaLevel)

	// Step 8: Reveal starting areas for each player
	g.revealStartingAreas(tiles, startingPositions)

	// Create metadata
	metadata := &models.MapMetadata{
		GameID:           gameID,
		Seed:             g.seed,
		Width:            g.width,
		Height:           g.height,
		PlayerCount:      playerCount,
		SeaLevel:         seaLevel,
		GreatCircles:     greatCircles,
		GeneratedAt:      time.Now(),
		GenerationTimeMs: time.Since(startTime).Milliseconds(),
	}

	return metadata, tiles, startingPositions, nil
}

// generateGreatCircles creates great circles for terrain generation
func (g *Generator) generateGreatCircles(playerCount int) []models.GreatCircle {
	numCircles := 8 + playerCount*2
	circles := make([]models.GreatCircle, numCircles)

	for i := 0; i < numCircles; i++ {
		// Random point on sphere
		lon := g.rng.Float64()*2*math.Pi - math.Pi
		lat := math.Asin(g.rng.Float64()*2 - 1)

		// Random vector through center
		theta := g.rng.Float64() * 2 * math.Pi
		phi := math.Acos(g.rng.Float64()*2 - 1)
		vx := math.Sin(phi) * math.Cos(theta)
		vy := math.Sin(phi) * math.Sin(theta)
		vz := math.Cos(phi)

		// Assign type based on distribution
		roll := g.rng.Float64()
		var circleType string
		var heightModifier float64
		if roll < 0.3 {
			circleType = "continental_boundary"
			heightModifier = g.rng.Float64()*1000 - 500 // -500 to +500m
		} else if roll < 0.7 {
			circleType = "mountain_range"
			heightModifier = g.rng.Float64()*2000 + 500 // 500 to 2500m
		} else {
			circleType = "ocean_trench"
			heightModifier = g.rng.Float64()*-600 - 200 // -800 to -200m
		}

		circles[i] = models.GreatCircle{
			CenterLon:      lon,
			CenterLat:      lat,
			VectorX:        vx,
			VectorY:        vy,
			VectorZ:        vz,
			Type:           circleType,
			Radius:         g.rng.Float64()*8 + 4, // 4-12 tiles
			HeightModifier: heightModifier,
			Weight:         g.rng.Float64()*0.7 + 0.3, // 0.3-1.0
		}
	}

	return circles
}

// calculateElevation calculates elevation for a tile based on great circles
func (g *Generator) calculateElevation(x, y int, circles []models.GreatCircle) int {
	// Start with lower base elevation
	baseElevation := 0.0
	
	// Convert tile coordinates to spherical coordinates
	lon := (float64(x)/float64(g.width) - 0.5) * 2 * math.Pi
	lat := (float64(y)/float64(g.height) - 0.5) * math.Pi

	// Convert to 3D point on unit sphere
	px := math.Cos(lat) * math.Cos(lon)
	py := math.Cos(lat) * math.Sin(lon)
	pz := math.Sin(lat)

	// Sum influence from all great circles
	totalElevation := baseElevation
	for _, circle := range circles {
		// Calculate distance from point to great circle
		// Distance is based on dot product with circle's normal vector
		dotProduct := px*circle.VectorX + py*circle.VectorY + pz*circle.VectorZ
		// Clamp to valid range for asin
		if dotProduct > 1 {
			dotProduct = 1
		} else if dotProduct < -1 {
			dotProduct = -1
		}
		distance := math.Abs(math.Asin(dotProduct))

		// Use a smoother falloff function instead of tight Gaussian
		// Influence decreases linearly within radius, then drops to zero
		influence := 0.0
		if distance < circle.Radius {
			influence = circle.Weight * (1.0 - distance/circle.Radius)
		}
		totalElevation += influence * circle.HeightModifier
	}

	// Add noise for detail (simplified - using sin/cos patterns)
	noise := g.calculateNoise(x, y)
	totalElevation += noise

	// Normalize to range -100 to 3000
	elevation := int(totalElevation)
	if elevation < -100 {
		elevation = -100
	}
	if elevation > 3000 {
		elevation = 3000
	}

	return elevation
}

// calculateNoise adds multi-octave noise for terrain detail
func (g *Generator) calculateNoise(x, y int) float64 {
	noise := 0.0
	for octave := 0; octave < 4; octave++ {
		frequency := math.Pow(2, float64(octave)) / 64.0
		amplitude := 200.0 / math.Pow(2, float64(octave))

		// Simplified noise using sin/cos (would use proper Perlin/Simplex in production)
		fx := float64(x) * frequency
		fy := float64(y) * frequency
		value := (math.Sin(fx*0.1) + math.Cos(fy*0.1)) / 2.0

		noise += value * amplitude
	}
	return noise
}

// calculateSeaLevel determines the sea level threshold (use 35th percentile for more land)
func (g *Generator) calculateSeaLevel(elevationGrid [][]int) int {
	// Collect all elevations
	elevations := make([]int, 0, g.width*g.height)
	for y := 0; y < g.height; y++ {
		for x := 0; x < g.width; x++ {
			elevations = append(elevations, elevationGrid[y][x])
		}
	}

	// Sort using Go's built-in sort (much faster than insertion sort)
	sort.Ints(elevations)

	// Use 35th percentile instead of median for more land
	percentileIndex := len(elevations) * 35 / 100
	return elevations[percentileIndex]
}

// assignTerrainType assigns terrain type based on elevation and climate
func (g *Generator) assignTerrainType(x, y, elevation, seaLevel int) string {
	if elevation < seaLevel-20 {
		return "OCEAN"
	} else if elevation < seaLevel {
		return "SHALLOW_WATER"
	} else if elevation > 2200 {
		return "MOUNTAIN"
	} else if elevation > 1600 {
		return "HILLS"
	}

	// For land, use climate to determine type
	lat := math.Abs(float64(y)/float64(g.height) - 0.5) * 180 // 0-90 degrees

	// Add some elevation-based variation
	elevAboveSeaLevel := elevation - seaLevel
	
	// Simplified climate-based terrain (would be more sophisticated in production)
	if lat > 60 || elevAboveSeaLevel > 800 {
		if elevAboveSeaLevel > 800 {
			return "TUNDRA"
		}
		return "TUNDRA"
	} else if lat > 45 {
		if elevAboveSeaLevel > 600 {
			return "HILLS"
		}
		return "GRASSLAND"
	} else if lat > 30 {
		if g.rng.Float64() < 0.4 {
			return "GRASSLAND"
		}
		return "FOREST"
	} else if lat > 15 {
		if g.rng.Float64() < 0.3 {
			return "DESERT"
		} else if g.rng.Float64() < 0.5 {
			return "PLAINS"
		}
		return "GRASSLAND"
	} else {
		if g.rng.Float64() < 0.3 {
			return "JUNGLE"
		} else if g.rng.Float64() < 0.6 {
			return "FOREST"
		}
		return "GRASSLAND"
	}
}

// assignClimateZone assigns climate zone based on latitude and elevation
func (g *Generator) assignClimateZone(y, elevation int) string {
	lat := math.Abs(float64(y)/float64(g.height) - 0.5) * 180

	// Adjust for elevation
	if elevation > 1500 {
		lat += 15 // High elevation acts as higher latitude
	} else if elevation > 2500 {
		lat += 30
	}

	if lat > 60 {
		return "POLAR"
	} else if lat > 30 {
		return "TEMPERATE"
	} else if lat > 15 {
		return "SUBTROPICAL"
	} else {
		return "TROPICAL"
	}
}

// isCoastal checks if a land tile is adjacent to water
func (g *Generator) isCoastal(x, y int, elevationGrid [][]int, seaLevel int) bool {
	elevation := elevationGrid[y][x]
	if elevation < seaLevel {
		return false // Water tiles are not coastal
	}

	// Check adjacent tiles
	for dy := -1; dy <= 1; dy++ {
		for dx := -1; dx <= 1; dx++ {
			if dx == 0 && dy == 0 {
				continue
			}
			nx, ny := x+dx, y+dy
			if nx >= 0 && nx < g.width && ny >= 0 && ny < g.height {
				if elevationGrid[ny][nx] < seaLevel {
					return true
				}
			}
		}
	}
	return false
}

// getTile helper to get tile by coordinates
func getTile(tiles []*models.MapTile, x, y, width int) *models.MapTile {
	if x < 0 || y < 0 {
		return nil
	}
	idx := y*width + x
	if idx >= len(tiles) {
		return nil
	}
	return tiles[idx]
}
