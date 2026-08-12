# Minimal Simulator

This package is the deterministic balance harness for SimCiv's population,
food, health, reproduction, and early research mechanics. It is intentionally
small enough to run the same scenario across a fixed set of 50 random seeds.

## Current contract

The default scenario starts with 100 people and splits labor equally between
food and science. It runs until both initial technologies are complete, the
population becomes extinct, or the 100-year safety limit is reached.

- Fire Mastery costs 100 research points.
- Stone Knapping costs 120 research points.
- Each technology stores its own progress.
- The autonomous simulation focuses Fire Mastery first and switches to Stone
  Knapping only after Fire Mastery completes.
- Callers may switch focus at any time with `SetResearchFocus`; unfinished
  progress remains attached to its technology.
- Each technology must take between 5 and 10 years in every standard seed.
  Stone Knapping must take longer than Fire Mastery.
- All 50 standard seeds must survive long enough to unlock both technologies.

A healthy population that remains stable is viable. A year without net growth
is neither a failure nor a reason to stop the simulation. Viability fails when
required research is incomplete at termination, the population becomes
extinct, or average health over the run falls below the supported threshold.

## Tuned defaults

- Food production: 1.25 units per labor hour
- Food allocation: 50%
- Science production: 0.00015 points per science labor hour
- Fire Mastery food multiplier: 1.15
- Stone Knapping food multiplier: 1.20

The food-production adjustment gives every deterministic seed enough margin to
complete the second research phase without changing mortality or reproduction
rules. Technology food bonuses remain multiplicative.

## Research API

`MinimalCivilizationState` exposes:

- `InitializeTechnologyResearch()`
- `SetResearchFocus(name)`
- `GetResearchFocus()`
- `AddResearchPoints(points)`
- `GetTechnologyProgress(name)`
- `GetAllTechnologyProgress()`

Read methods return copies so callers cannot mutate research state without the
API. Negative research additions are rejected and completed technologies do
not accept additional points.

## Testing

From `simulation/`:

```bash
go test ./...
go test -v -run TestTwoTechnologyDetails ./pkg/simulator
```

`TestViabilityWithTwoTechnologies` is the enforceable regression test for the
50-seed viability and timing contract. `TestTwoTechnologyDetails` prints the
per-seed diagnostics used for balance work.
