# SimCiv Design Documents

This directory contains all design specifications for SimCiv, organized chronologically by version number.

## Document Organization

All design documents follow the naming convention: `0.00XX_DESCRIPTIVE_NAME.md`

The version number indicates the chronological order in which the design was created or the feature was planned. This makes it easy to understand the progression of the game's development.

## Core Design Documents (Chronological Order)

### Implemented Features

1. **0.0001_AUTHENTICATION.md** - User authentication and session management
   - Status: Implemented
   - Purpose: Cryptographic challenge/response auth, client-side key storage

2. **0.0002_GAME_CREATION.md** - Game creation, discovery, and joining
   - Status: Implemented
   - Purpose: Multiplayer game lobby, game creation, player joining

3. **0.0003_MAP_GENERATION.md** - Procedural terrain generation and player placement
   - Status: Implemented
   - Purpose: Great circle-based terrain generation, fair starting positions

4. **0.0004_TECH_TREE.md** - Prehistoric technology tree (200,000 BCE to 4,000 BCE)
   - Status: Design Review
   - Purpose: Technology progression from Paleolithic to Neolithic era

5. **0.0005_HUMAN_ATTRIBUTES.md** - Individual human behavior and decision-making
   - Status: Design Review
   - Purpose: Five-attribute system, resource allocation, population mechanics

6. **0.0006_MINIMAL_SIMULATOR.md** - Viability verification simulator
   - Status: Implemented
   - Purpose: Minimal simulator to verify starting positions support population growth

7. **0.0007_UNIT_CREATION.md** - Population-based unit system with settlers
   - Status: Design Review
   - Purpose: Unit creation from population thresholds, autonomous settlers behavior

8. **0.0008_MINIMAL_SETTLERS.md** - First cut minimal settlers implementation
   - Status: Design Review
   - Purpose: Minimal viable implementation of settlers for initial gameplay validation

### Bug Fixes and Tuning Documents

9. **0.0009_HUMAN_SCENARIO_COMPARISON.md** - Design vs implementation comparison
   - Date: 2025-10-26
   - Purpose: Identify bugs between design spec and Go implementation

10. **0.0010_HEALTH_FIX_IMPACT.md** - Health formula bug fix analysis
    - Date: 2025-10-26
    - Purpose: Document impact of health formula correction

11. **0.0011_FERTILITY_AGE_FIX.md** - Fertility age correction
    - Date: 2025-10-26
    - Purpose: Fix minimum fertility age from 15 to 13 per design spec

12. **0.0012_SCIENCE_RATE_TUNING.md** - Science rate parameter tuning
    - Date: 2025-10-26
    - Purpose: Tune science production to achieve 5-10 year Fire Mastery goal

13. **0.0013_SCIENCE_DISCONTINUITY_ANALYSIS.md** - Science production analysis
    - Date: 2025-10-26
    - Purpose: Analyze discontinuity in science production rates

14. **0.0014_SCIENCE_DISCONTINUITY_FIX.md** - Science discontinuity fix
    - Date: 2025-10-26
    - Purpose: Fix cliff effect in science production by removing log10 bonus

15. **0.0015_SCIENCE_RATE_FINAL.md** - Final science rate recommendation
    - Date: 2025-10-26
    - Purpose: Final science rate selection after testing

16. **0.0016_MAP_INTERACTIONS.md** - Interactive map controls
    - Status: Implementation
    - Purpose: Pan, zoom, and touch controls for map navigation

## Document Structure

Each design document follows a standard structure:

```markdown
# Title
## Subtitle

### Document Status
**Version:** 0.00XX
**Status:** [Design Review | Implementation | Implemented]
**Last Updated:** YYYY-MM-DD
**Purpose:** Brief description

---

## Executive Summary
High-level overview of the feature

## Related Documents
- Links to other relevant design docs

## [Feature-Specific Sections]
Detailed specification...

## Conclusion
Summary and next steps
```

## Status Definitions

- **Design Review**: Design is complete and under review
- **Implementation**: Design is approved and being implemented
- **Implemented**: Feature is fully implemented and deployed
- **Analysis**: Bug analysis or performance study
- **Fix Applied**: Bug fix has been implemented
- **Tuning Complete**: Parameter tuning has been finalized

## Reading Order

For understanding the complete system architecture, read documents in numerical order:

1. Start with authentication (0.0001)
2. Then game creation (0.0002)
3. Follow through map generation (0.0003)
4. Understand technology system (0.0004)
5. Learn population mechanics (0.0005, 0.0006)
6. Study unit systems (0.0007, 0.0008)

Bug fix documents (0.0009-0.0015) can be read after their corresponding feature documents to understand implementation challenges and solutions.

## Cross-References

Design documents reference each other using their numbered names (e.g., `0.0003_MAP_GENERATION.md`) to maintain clarity about dependencies and relationships.

## Contributing New Designs

When adding new design documents:

1. Assign the next available version number (0.00XX)
2. Use the standard naming convention: `0.00XX_DESCRIPTIVE_NAME.md`
3. Include the Document Status section with complete metadata
4. Reference related documents using their numbered names
5. Update this README to include the new document

## Version History

- **2025-10-30**: Reorganized all design documents with chronological numbering
- **2025-10-26**: Added bug fix and tuning documents
- **2025-10-23**: Initial design documents created
