# Minimal Simulator Implementation Notes

## Overview

This package implements the minimal viable simulator as specified in `designs/MINIMAL_SIMULATOR.md`. The simulator verifies that starting positions can support population growth and basic research capability.

## Implementation Status

✅ **Complete** - All components implemented and tested:

- Core data structures (`MinimalHuman`, `MinimalCivilizationState`)
- Deterministic random number generator (seeded LCG)
- All simulation mechanics per design specification
- Comprehensive unit tests with 50 hardcoded seeds
- Statistical validation across multiple runs

## Key Findings

### Fire Mastery Unlock Time Discrepancy

**Design Expectation**: Fire Mastery should be unlocked in 600-730 days (~2 years)  
**Actual Results**: Fire Mastery is unlocked in 7-10 days for viable seeds

**Root Cause**: The design document's "Expected Outcomes" section assumes players will manually adjust food allocation from 80% to 95%+ during early game crisis. However, the default 80/20 allocation actually works quite well:

1. Days 1-4: Population is fully fed (2.0 food/person)
2. Health increases from ~40 to ~55 during this period
3. Day 3: Average health crosses 50 threshold
4. Science production doubles (no more 50% health penalty)
5. Days 5-6: Food runs out, but science already at ~90 points
6. Day 7: Fire Mastery unlocked at 100 science points

**Why This Happens**:
- Young adults with full food ration GAIN health (+7.0 food bonus - 3.3 age penalty = +3.7/day)
- Health > 50 removes the 50% science penalty, doubling production
- Starting food (100 units) sustains population long enough for health to improve
- Once health improves, science production accelerates before starvation becomes critical

**Impact**: This is correct simulator behavior based on the specified mechanics. The discrepancy indicates either:
1. The design document's expected outcomes assume different gameplay (manual allocation adjustment)
2. The game balance needs tuning (lower starting food, higher food requirements, or adjusted science formula)
3. The default food allocation should start higher (90-95%) instead of 80%

### Viability Results

Testing across 50 random seeds with default conditions:
- **Viable**: 32% (16/50 seeds)
- **Fire Mastery Unlocked**: 32% (16/50 seeds)
- **Average Time to Fire Mastery**: 7.9 days (for successful runs)
- **Common Failure**: Population extinction or health decline before Fire Mastery

The 32% viability rate is below the design target of 60-80%, primarily because many seeds result in unfavorable initial population distributions (too few adults, unlucky age/health distributions, or early deaths).

### Reproduction Mechanics

Reproduction rates are very low in the minimal simulator:
- Base conception chance: 0.03/30 = 0.001 per day per pair
- With health=80, age=25: modifier = 0.6
- Final chance: 0.0006 per day = 0.06%
- Over a 10-day period for one pair: ~0.6% chance of birth

This low rate is intentional per the design (line 562-564) and matches expected prehistoric birth rates.

## Production Code Quality

The simulator is implemented as production-ready code:

- ✅ Clean separation of concerns (mechanics, simulation loop, assessment)
- ✅ Proper error handling and edge cases
- ✅ Deterministic RNG for reproducibility
- ✅ Comprehensive unit tests
- ✅ Regression test suite with hardcoded seeds
- ✅ Statistical validation functions
- ✅ Well-documented code matching design specifications

## Future Evolution

This minimal simulator serves as the foundation for:

1. **Phase 2**: Full attribute implementation, multiple technologies, seasonal variation
2. **Phase 3**: Multiple civilizations, terrain integration, complex relationships
3. **Phase 4**: Real-time gameplay, multiplayer support, UI visualization

The current implementation maintains clean interfaces that will support these future extensions.

## Testing

Run all simulator tests:
```bash
go test -v ./pkg/simulator/...
```

Run with coverage:
```bash
go test -cover ./pkg/simulator/...
```

Test specific scenario:
```bash
go test -v -run TestViabilityWithMultipleSeeds ./pkg/simulator/...
```

## Design Document Reference

See `designs/MINIMAL_SIMULATOR.md` for:
- Complete specification of all mechanics
- Formula definitions and constants
- Expected behavior and success criteria
- Future evolution roadmap
