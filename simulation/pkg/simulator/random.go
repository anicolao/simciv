package simulator

import "math"

// RandomGenerator provides a deterministic random number generator using Linear Congruential Generator
type RandomGenerator struct {
	seed int64
}

// NewRandomGenerator creates a new random generator with the given seed
func NewRandomGenerator(seed int) *RandomGenerator {
	return &RandomGenerator{
		seed: int64(seed),
	}
}

// Next returns the next random float64 in [0, 1)
func (r *RandomGenerator) Next() float64 {
	// Simple LCG (Linear Congruential Generator)
	// Constants from Numerical Recipes
	r.seed = (r.seed * 1103515245 + 12345) % 2147483648
	return float64(r.seed) / 2147483648.0
}

// NextInRange returns a random float64 in [min, max)
func (r *RandomGenerator) NextInRange(min, max float64) float64 {
	return min + r.Next()*(max-min)
}

// NextInt returns a random integer in [0, n)
func (r *RandomGenerator) NextInt(n int) int {
	return int(math.Floor(r.Next() * float64(n)))
}

// NextBool returns a random boolean with the given probability of being true
func (r *RandomGenerator) NextBool(probability float64) bool {
	return r.Next() < probability
}
