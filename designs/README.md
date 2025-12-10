# SimCiv Design Documents

This directory contains all design specifications for SimCiv, organized chronologically by version number.

## Document Organization

All design documents follow the naming convention: `0.00XX_DESCRIPTIVE_NAME.md`

The version number indicates the **chronological order** based on the "Last Updated" or "Date" field in each document. This makes it easy to understand the progression of the game's development.

## Core Design Documents (Chronological Order)

### Implemented Features

1. **0.0001_AUTHENTICATION.md** - User authentication and session management
   - Date: 2025-10-22
   - Status: Implemented
   - Purpose: Cryptographic challenge/response auth, client-side key storage

2. **0.0002_GAME_CREATION.md** - Game creation, discovery, and joining
   - Date: 2025-10-22
   - Status: Implemented
   - Purpose: Multiplayer game lobby, game creation, player joining

3. **0.0003_MAP_GENERATION.md** - Procedural terrain generation and player placement
   - Date: 2025-10-23
   - Status: Implemented
   - Purpose: Great circle-based terrain generation, fair starting positions

4. **0.0004_TECH_TREE.md** - Prehistoric technology tree (200,000 BCE to 4,000 BCE)
   - Date: 2025-10-23
   - Status: Design Review
   - Purpose: Technology progression from Paleolithic to Neolithic era

5. **0.0005_HUMAN_ATTRIBUTES.md** - Individual human behavior and decision-making
   - Date: 2025-10-23
   - Status: Design Review
   - Purpose: Five-attribute system, resource allocation, population mechanics

6. **0.0006_MINIMAL_SIMULATOR.md** - Viability verification simulator
   - Date: 2025-10-23
   - Status: Implemented
   - Purpose: Minimal simulator to verify starting positions support population growth

7. **0.0007_MAP_INTERACTIONS.md** - Interactive map controls
   - Date: 2025-10-25
   - Status: Implementation
   - Purpose: Pan, zoom, and touch controls for map navigation

### Bug Fixes and Tuning Documents

8. **0.0008_HUMAN_SCENARIO_COMPARISON.md** - Design vs implementation comparison
   - Date: 2025-10-25 (started), 2025-10-26 (updated)
   - Purpose: Identify bugs between design spec and Go implementation

9. **0.0009_HEALTH_FIX_IMPACT.md** - Health formula bug fix analysis
   - Date: 2025-10-26
   - Purpose: Document impact of health formula correction

10. **0.0010_FERTILITY_AGE_FIX.md** - Fertility age correction
    - Date: 2025-10-26
    - Purpose: Fix minimum fertility age from 15 to 13 per design spec

11. **0.0011_SCIENCE_RATE_TUNING.md** - Science rate parameter tuning
    - Date: 2025-10-26
    - Purpose: Tune science production to achieve 5-10 year Fire Mastery goal

12. **0.0012_SCIENCE_DISCONTINUITY_ANALYSIS.md** - Science production analysis
    - Date: 2025-10-26
    - Purpose: Analyze discontinuity in science production rates

13. **0.0013_SCIENCE_DISCONTINUITY_FIX.md** - Science discontinuity fix
    - Date: 2025-10-26
    - Purpose: Fix cliff effect in science production by removing log10 bonus

14. **0.0014_SCIENCE_RATE_FINAL.md** - Final science rate recommendation
    - Date: 2025-10-26
    - Purpose: Final science rate selection after testing

### Advanced Features

15. **0.0015_UNIT_CREATION.md** - Population-based unit system with settlers
    - Date: 2025-10-30
    - Status: Design Review
    - Purpose: Unit creation from population thresholds, autonomous settlers behavior

16. **0.0016_MINIMAL_SETTLERS.md** - First cut minimal settlers implementation
    - Date: 2025-10-30
    - Status: Design Review
    - Purpose: Minimal viable settlers with simple 3-step autonomous placement

17. **0.0017_CIVILIZATION_DIMENSIONS.md** - Core dimensions of civilization development
    - Date: 2025-10-30
    - Status: Design Review
    - Purpose: Ten fundamental dimensions driving civilization complexity and growth

18. **0.0018_VICTORY_PROGRESSION_TREES.md** - Victory condition progression trees
    - Date: 2025-10-30
    - Status: Design Review
    - Purpose: Application-focused progression trees (Military, Cultural, Economic) determining how civilizations apply technological knowledge toward victory. Scientific Victory achieved through unified Technology Tree advancement.

19. **0.0019_MILITARY_TREE_PREHISTORIC.md** - Prehistoric military progression tree
    - Date: 2025-10-30
    - Status: Design Review
    - Purpose: Military development from tribal violence to early armies (200,000 BCE - 4,000 BCE)

20. **0.0020_CULTURAL_TREE_PREHISTORIC.md** - Prehistoric cultural progression tree
    - Date: 2025-10-30
    - Status: Design Review
    - Purpose: Cultural development from oral traditions to organized religion (200,000 BCE - 4,000 BCE)

21. **0.0021_ECONOMIC_TREE_PREHISTORIC.md** - Prehistoric economic progression tree
    - Date: 2025-10-30
    - Status: Design Review
    - Purpose: Economic development from subsistence to trade networks (200,000 BCE - 4,000 BCE)

22. **0.0022_STONE_KNAPPING_EXPANSION.md** - Stone Knapping technology addition
    - Date: 2025-11-05
    - Status: Design Proposal
    - Purpose: Add second technology to minimal simulator with realistic 5-10 year research timeframes

23. **0.0023_PREREQUISITE_TECHNOLOGY.md** - Advanced Tool-Making with prerequisites
    - Date: 2025-11-05
    - Status: Design Proposal
    - Purpose: Add first Level 1 technology with prerequisites to test technology tree progression mechanics

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

## Chronological Order Determination

The version numbers are assigned based on the chronological order determined by:
1. The "Last Updated" date field in implemented design documents
2. The "Date" field in bug fix and analysis documents
3. When multiple documents share the same date, they maintain their relative order within that date

This ensures that reading documents in numerical order provides a clear progression of how the game evolved over time.

## Reading Order

For understanding the complete system architecture, read documents in numerical order:

1. Start with authentication (0.0001)
2. Then game creation (0.0002)
3. Follow through map generation (0.0003)
4. Understand technology system (0.0004)
5. Learn population mechanics (0.0005, 0.0006)
6. Study map interactions (0.0007)
7. Review bug fixes and tuning (0.0008-0.0014)
8. Understand unit systems (0.0015, 0.0016)
9. Study civilization dimensions (0.0017)
10. Learn victory progression systems (0.0018-0.0021)
11. Follow minimal simulator expansions (0.0022-0.0023)

Bug fix documents (0.0008-0.0014) can be read after their corresponding feature documents to understand implementation challenges and solutions.

## Cross-References

Design documents reference each other using their numbered names (e.g., `0.0003_MAP_GENERATION.md`) to maintain clarity about dependencies and relationships.

## Contributing New Designs

When adding new design documents:

1. Determine the date of the new design
2. Assign the next available version number (0.00XX) based on chronological order
3. Use the standard naming convention: `0.00XX_DESCRIPTIVE_NAME.md`
4. Include the Document Status section with complete metadata
5. Reference related documents using their numbered names
6. Update this README to include the new document

## Version History

- **2025-10-30**: Reorganized all design documents with chronological numbering based on document dates
- **2025-10-26**: Added bug fix and tuning documents
- **2025-10-23**: Initial design documents created
