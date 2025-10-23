# SimCiv Prehistoric Tech Tree Design Specification
## Technology Progression from Paleolithic to Neolithic Era

### Document Status
**Version:** 0.0004  
**Status:** Design Review  
**Last Updated:** 2025-10-23  
**Purpose:** Specification for the prehistoric technology tree covering the emergence of Homo Sapiens through early agricultural societies

---

## Executive Summary

This document specifies the design for SimCiv's prehistoric technology tree, covering the period from approximately 200,000 BCE to 4,000 BCE. This era represents humanity's foundational technological achievements, from the mastery of fire and stone tools to the agricultural revolution that enabled permanent settlements and complex civilizations.

**Key Features:**
- Four-level technology tree spanning 196,000 years of human prehistory
- Multiple parallel technology paths with strategic dependencies
- Meaningful choices between survival strategies and civilization foundations
- Technologies that unlock new gameplay mechanics and strategic options
- Balance between immediate survival needs and long-term civilization building
- Integration with map terrain types and resource availability

This design establishes the technological foundation that will bridge into the Ancient Era tech tree, providing players with strategic choices from the earliest moments of human development.

---

## Architecture Context

The prehistoric tech tree integrates with SimCiv's core systems:
- **Database Layer**: Stores technology research progress, unlocked capabilities, and civilization tech status
- **Simulation Engine**: Uses tech status to determine available actions, building types, and resource gathering efficiency
- **Client Layer**: Displays tech tree visualization, research progress, and technology effects
- **Game State**: Technologies affect population survival rates, resource production, and available strategic options

The technology system maintains the database-as-single-source-of-truth principle while enabling rich strategic gameplay through meaningful technological choices.

---

## Timeline and Historical Context

### Homo Sapiens Emergence and Technological Development

**Key Dates in Human Prehistory:**

- **300,000 - 200,000 BCE**: Anatomically modern Homo Sapiens emerge in Africa
- **200,000 - 100,000 BCE**: Early tool use, controlled fire, basic shelter construction
- **100,000 - 50,000 BCE**: Cognitive revolution, language development, advanced tool-making
- **50,000 - 10,000 BCE**: Upper Paleolithic, sophisticated tools, art, migration across continents
- **10,000 - 4,000 BCE**: Neolithic Revolution, agriculture, permanent settlements, early metallurgy

### Game Start Date: 200,000 BCE

The game begins at approximately **200,000 BCE**, when anatomically modern Homo Sapiens had emerged but most foundational technologies were still being developed or not yet discovered. This timeframe allows players to experience the full arc of prehistoric technological development.

**Rationale for Start Date:**
- Captures the emergence of behaviorally modern humans
- Allows players to discover and develop fundamental technologies
- Provides sufficient time depth for meaningful technological progression
- Aligns with archaeological evidence of early human capabilities
- Enables strategic choices between different survival and development paths

**Time Scale Considerations:**
- Early game progression (Levels 0-1): Thousands of years per technology
- Mid-game progression (Levels 2-3): Hundreds to thousands of years per technology
- Technologies represent accumulated knowledge across generations
- Research speed increases with population size and previous tech discoveries

---

## Tech Tree Structure Overview

### Four-Level Technology Tree

The prehistoric tech tree consists of four main levels, representing major stages in human technological development:

**Level 0: Paleolithic Foundations (200,000 - 100,000 BCE)**
- Basic survival technologies
- Fundamental tools and techniques
- Simple resource gathering

**Level 1: Upper Paleolithic Innovations (100,000 - 50,000 BCE)**
- Advanced tool-making
- Improved hunting and gathering
- Social organization technologies

**Level 2: Mesolithic Adaptations (50,000 - 10,000 BCE)**
- Specialized regional technologies
- Proto-agricultural techniques
- Complex social structures

**Level 3: Neolithic Revolution (10,000 - 4,000 BCE)**
- Agricultural foundations
- Permanent settlements
- Early metallurgy and crafts

### Design Principles

1. **Meaningful Choices**: Each technology level offers multiple paths with distinct strategic advantages
2. **Dependencies**: Advanced technologies require foundational knowledge, creating natural progression
3. **Synergies**: Certain technology combinations provide bonus effects
4. **Trade-offs**: Investing in one path may delay progress in others
5. **Map Integration**: Some technologies are more valuable on certain terrain types
6. **Population Scaling**: More advanced technologies require larger populations to research and utilize

---

## Level 0: Paleolithic Foundations (200,000 - 100,000 BCE)

### Starting Position

Players begin with **no technologies unlocked**. All Level 0 technologies are immediately available for research, representing the foundational choices for early human survival and development.

### Core Philosophy

Level 0 represents the most fundamental survival technologies. Players must choose which basic capabilities to develop first, with each choice affecting their civilization's early survival rate, resource gathering efficiency, and available strategic options.

### Technology Tree: Level 0

#### Fire Mastery
**Description**: Control and maintenance of fire for warmth, cooking, and protection.

**Prerequisites**: None (Starting technology option)

**Research Requirements**:
- 5 population minimum
- 100 research points (base cost)
- Can be researched on any terrain type

**Effects**:
- +20% population survival rate in cold climates
- Enables cooking food (+15% food value from meat and fish)
- Provides defense against predatory animals (-50% animal attack casualties)
- Unlocks campfire gathering site (social/cultural bonus)
- Required for: Pottery (Level 2), Metallurgy (Level 3)

**Strategic Considerations**:
- Essential for cold climate civilizations
- Provides immediate survival benefits
- Foundational technology for many advanced techs
- High priority for players in challenging environments

---

#### Stone Knapping
**Description**: Shaping stones into tools, weapons, and implements through percussion and pressure flaking.

**Prerequisites**: None (Starting technology option)

**Research Requirements**:
- 5 population minimum
- 100 research points (base cost)
- Requires access to stone resources

**Effects**:
- Enables stone tool production (axes, scrapers, knives)
- +30% hunting efficiency
- +20% resource gathering speed (wood, stone)
- Unlocks stone weapon crafting
- Required for: Advanced Tool-Making (Level 1), Stone Building (Level 2)

**Strategic Considerations**:
- Improves resource gathering across the board
- Essential for military development path
- Required for construction technologies
- Synergizes well with hunting focus

---

#### Natural Shelter Utilization
**Description**: Finding, securing, and improving natural shelters such as caves, rock overhangs, and dense vegetation areas.

**Prerequisites**: None (Starting technology option)

**Research Requirements**:
- 5 population minimum
- 50 research points (lower cost due to simplicity)
- Requires mountainous, forested, or hilly terrain

**Effects**:
- +15% population survival rate in harsh weather
- Enables population growth without construction
- -50% shelter construction costs (when combined with other shelter techs)
- Population capacity: +10 per suitable natural shelter site
- Required for: Cave Painting (Level 1)

**Strategic Considerations**:
- Fastest path to early population growth
- Terrain-dependent (may not be available everywhere)
- Provides immediate shelter without resource investment
- Limits mobility and expansion compared to constructed shelters

---

#### Primitive Shelter Construction
**Description**: Building simple temporary shelters using available materials (branches, leaves, animal hides, grass).

**Prerequisites**: None (Starting technology option)

**Research Requirements**:
- 5 population minimum
- 120 research points (higher cost due to complexity)
- Any terrain type

**Effects**:
- Enables construction of temporary camps anywhere
- +10% population survival rate
- Population capacity: +5 per constructed shelter
- Enables nomadic lifestyle (mobile populations)
- Can be built on any viable terrain
- Required for: Permanent Structures (Level 1), Advanced Construction (Level 2)

**Strategic Considerations**:
- Provides flexibility in settlement location
- Enables expansion into diverse terrain types
- Foundation for advanced construction technologies
- Requires resource investment but offers greater control

---

#### Basic Foraging
**Description**: Systematic gathering of edible plants, roots, berries, nuts, and seeds.

**Prerequisites**: None (Starting technology option)

**Research Requirements**:
- 5 population minimum
- 60 research points (lower cost due to natural behavior)
- Requires forested, grassland, or jungle terrain

**Effects**:
- +40% plant food gathering efficiency
- Enables identification of edible vs. poisonous plants
- +10% population health (diverse diet)
- Population can survive on gathered foods alone
- Required for: Agriculture (Level 2), Food Storage (Level 1)

**Strategic Considerations**:
- Reliable food source in appropriate terrain
- Lower risk than hunting
- Supports larger populations in fertile areas
- Essential for agricultural development path

---

#### Primitive Hunting
**Description**: Using basic tactics and simple weapons to hunt small and medium game animals.

**Prerequisites**: None (Starting technology option)

**Research Requirements**:
- 5 population minimum
- 80 research points
- Any terrain with animal populations

**Effects**:
- Enables hunting small and medium game
- +50% meat and hide acquisition
- Provides protein for population health (+5% health bonus)
- Unlocks hunter units (basic scouts)
- Required for: Advanced Hunting (Level 1), Animal Domestication (Level 2)

**Strategic Considerations**:
- Higher risk but higher reward than foraging
- Provides valuable resources (meat, hides, bones)
- Foundation for military unit development
- Synergizes with stone tools for weapons

---

### Level 0 Strategic Considerations

**Opening Strategy Choices:**

1. **Survival Priority (Cold/Harsh Climate)**:
   - Fire Mastery → Natural Shelter Utilization → Basic Foraging
   - Focus: Immediate population survival and growth
   - Best for: Mountain, tundra, or extreme climate starts

2. **Resource Gathering Priority**:
   - Stone Knapping → Basic Foraging → Primitive Hunting
   - Focus: Efficient resource acquisition and economic foundation
   - Best for: Resource-rich areas, balanced climates

3. **Mobile Expansion Priority**:
   - Primitive Shelter Construction → Primitive Hunting → Stone Knapping
   - Focus: Flexibility, exploration, and territorial expansion
   - Best for: Large maps, competitive games, varied terrain

4. **Population Growth Priority**:
   - Natural Shelter Utilization → Basic Foraging → Fire Mastery
   - Focus: Rapid population increase for faster research
   - Best for: Cave-rich terrain, peaceful development strategies

**Technology Synergies at Level 0**:
- Fire Mastery + Natural Shelter Utilization = Maximum survival bonus in caves
- Stone Knapping + Primitive Hunting = Effective hunting with crafted weapons
- Basic Foraging + Natural Shelter Utilization = Sustainable population in forests
- Primitive Shelter Construction + Fire Mastery = Flexible settlement anywhere

---

## Level 1: Upper Paleolithic Innovations (100,000 - 50,000 BCE)

### Unlocking Level 1

Players must research **at least 2 Level 0 technologies** before Level 1 technologies become available for research. This represents the accumulated knowledge necessary for more advanced innovations.

### Core Philosophy

Level 1 technologies represent the Upper Paleolithic revolution in human capabilities. These technologies enable specialized activities, improved efficiency, and the beginnings of social complexity. Players face strategic choices between military, economic, social, and construction development paths.

### Technology Tree: Level 1

#### Advanced Tool-Making
**Description**: Sophisticated stone tool techniques including blade technology, composite tools, and specialized implements.

**Prerequisites**: 
- Stone Knapping (Level 0)
- Any 2 additional Level 0 technologies

**Research Requirements**:
- 20 population minimum
- 200 research points
- Access to high-quality stone resources

**Effects**:
- +50% resource gathering efficiency (cumulative with Level 0)
- Enables specialized tool types (burins, microliths, awls)
- +40% hunting efficiency with advanced weapons
- Unlocks bone and antler tool crafting
- Required for: Agriculture (Level 2), Advanced Construction (Level 2)

**Strategic Considerations**:
- Significant economic multiplier
- Opens advanced technological paths
- Essential for competitive resource production
- Foundation for many Level 2 technologies

---

#### Advanced Hunting Techniques
**Description**: Coordinated hunting strategies, tracking skills, large game hunting, and efficient processing.

**Prerequisites**:
- Primitive Hunting (Level 0)
- Stone Knapping (Level 0)

**Research Requirements**:
- 15 population minimum
- 180 research points
- Terrain with large game animals

**Effects**:
- Enables hunting of large game (mammoths, bison, deer)
- +80% meat yield from successful hunts
- Unlocks coordinated hunter groups (proto-military units)
- +20% hide and bone resource acquisition
- Required for: Animal Domestication (Level 2), Organized Warfare (Level 3)

**Strategic Considerations**:
- Major food production boost
- Foundation for military unit development
- Requires larger coordinated groups
- High-risk, high-reward food strategy

---

#### Permanent Structures
**Description**: Construction of durable shelters and buildings using wood, stone, and earth.

**Prerequisites**:
- Primitive Shelter Construction (Level 0)
- Stone Knapping (Level 0)

**Research Requirements**:
- 20 population minimum
- 220 research points
- Access to wood or stone resources

**Effects**:
- Enables permanent settlement construction
- Population capacity: +20 per permanent structure
- +25% population survival rate (improved shelter quality)
- Structures persist across seasons and years
- Required for: Villages (Level 2), Stone Building (Level 2)

**Strategic Considerations**:
- Enables stable population centers
- Foundation for urban development
- Significant resource investment required
- Commits population to specific locations

---

#### Food Preservation
**Description**: Techniques for drying, smoking, and storing food to survive lean seasons.

**Prerequisites**:
- Fire Mastery (Level 0)
- Basic Foraging OR Primitive Hunting (Level 0)

**Research Requirements**:
- 15 population minimum
- 150 research points

**Effects**:
- Food resources can be stored for future use
- +30% effective food value (reduced spoilage)
- Reduces famine risk by 60%
- Enables survival through seasonal food scarcity
- Required for: Trade Networks (Level 2), Agriculture (Level 2)

**Strategic Considerations**:
- Critical for seasonal climate survival
- Enables food surplus accumulation
- Foundation for trade-based economy
- Smooths population growth curves

---

#### Fishing Technology
**Description**: Tools and techniques for catching fish using nets, traps, spears, and hooks.

**Prerequisites**:
- Stone Knapping (Level 0)
- Basic Foraging OR Primitive Hunting (Level 0)

**Research Requirements**:
- 15 population minimum
- 140 research points
- Access to rivers, lakes, or coastal areas

**Effects**:
- Enables fishing in water bodies
- +40% food production in coastal/riverside settlements
- Provides reliable protein source
- Unlocks boats and rafts (basic water transport)
- Required for: Seafaring (Level 2), Trade Networks (Level 2)

**Strategic Considerations**:
- Extremely valuable for water-adjacent civilizations
- Reliable, sustainable food source
- Enables early naval development
- Geography-dependent technology

---

#### Cave Painting & Art
**Description**: Symbolic expression through painting, carving, and decorative crafts.

**Prerequisites**:
- Fire Mastery (Level 0)
- Natural Shelter Utilization (Level 0)

**Research Requirements**:
- 20 population minimum
- 120 research points
- Access to natural shelter sites

**Effects**:
- +15% population happiness
- Enables cultural identity formation
- +10% research speed (symbolic thinking bonus)
- Unlocks cultural victory condition progress
- Required for: Religion (Level 2), Oral Tradition (Level 1)

**Strategic Considerations**:
- First cultural technology
- Boosts research efficiency
- Foundation for cultural development path
- Provides non-material benefits

---

#### Oral Tradition
**Description**: Systematic passing of knowledge, stories, and customs through generations via spoken language.

**Prerequisites**:
- Any 2 Level 0 technologies

**Research Requirements**:
- 25 population minimum
- 160 research points

**Effects**:
- +20% research speed (knowledge preservation)
- Reduces technology loss from population decline
- Enables long-distance communication between settlements
- +10% population happiness (shared identity)
- Required for: Written Language (Level 3), Religion (Level 2)

**Strategic Considerations**:
- Powerful research multiplier
- Protects technological investment
- Enables coordination across distance
- Foundation for social technologies

---

#### Clothing & Textiles
**Description**: Creating garments from hides, furs, and plant fibers for protection and warmth.

**Prerequisites**:
- Stone Knapping (Level 0)
- Primitive Hunting OR Basic Foraging (Level 0)

**Research Requirements**:
- 15 population minimum
- 140 research points

**Effects**:
- +30% population survival in cold climates
- Enables expansion into colder regions
- +10% population health (weather protection)
- Unlocks textile crafting industry
- Required for: Weaving (Level 2), Trade Networks (Level 2)

**Strategic Considerations**:
- Essential for cold climate expansion
- Enables territorial growth
- Foundation for craft industry
- Provides trade goods

---

### Level 1 Strategic Considerations

**Development Path Choices:**

1. **Economic Development Path**:
   - Advanced Tool-Making → Food Preservation → Fishing Technology
   - Focus: Maximum resource production and efficiency
   - Enables: Strong economic foundation for Level 2 expansion

2. **Military Development Path**:
   - Advanced Hunting Techniques → Advanced Tool-Making → Clothing & Textiles
   - Focus: Unit capabilities and territorial control
   - Enables: Aggressive expansion and defense capabilities

3. **Social/Cultural Development Path**:
   - Oral Tradition → Cave Painting & Art → Food Preservation
   - Focus: Research speed and population happiness
   - Enables: Rapid technological advancement

4. **Settlement Development Path**:
   - Permanent Structures → Food Preservation → Fishing Technology
   - Focus: Stable population centers and growth
   - Enables: Urban development and civilization building

**Technology Synergies at Level 1**:
- Advanced Tool-Making + Advanced Hunting = Extremely efficient hunters
- Permanent Structures + Food Preservation = Stable growing population
- Oral Tradition + Cave Painting = Rapid cultural development
- Fishing Technology + Clothing = Coastal expansion capability

---

## Level 2: Mesolithic Adaptations (50,000 - 10,000 BCE)

### Unlocking Level 2

Players must research **at least 3 Level 1 technologies** before Level 2 technologies become available. This represents a critical mass of knowledge enabling the next stage of human development.

### Core Philosophy

Level 2 technologies represent regional specialization and proto-civilization capabilities. These technologies enable the transition from pure hunter-gatherer societies to more complex, settled communities with specialized labor and early agricultural practices.

### Technology Tree: Level 2

#### Agriculture Foundations
**Description**: Deliberate planting, cultivation, and harvesting of food crops.

**Prerequisites**:
- Basic Foraging (Level 0)
- Advanced Tool-Making (Level 1)
- Food Preservation (Level 1)

**Research Requirements**:
- 50 population minimum
- 400 research points
- Grassland or river valley terrain required

**Effects**:
- Enables crop farming (wheat, barley, millet, rice depending on terrain)
- +100% food production capacity per farmer
- Supports 3x larger population than hunter-gathering
- Unlocks sedentary agricultural lifestyle
- Required for: Irrigation (Level 3), Granaries (Level 3)

**Strategic Considerations**:
- Revolutionary food production increase
- Enables population explosion
- Commits civilization to specific locations
- Foundation for all advanced civilizations
- Requires significant terrain and resource investment

---

#### Animal Domestication
**Description**: Taming, breeding, and managing animals for food, labor, and resources.

**Prerequisites**:
- Primitive Hunting (Level 0)
- Advanced Hunting Techniques (Level 1)
- Food Preservation (Level 1)

**Research Requirements**:
- 40 population minimum
- 380 research points
- Terrain with domesticable animals

**Effects**:
- Enables livestock raising (cattle, sheep, goats, pigs, chickens)
- Provides renewable meat, milk, eggs, wool, and leather
- +60% sustained food production
- Unlocks draft animals for labor and transport
- Required for: Cavalry Units (Level 3), Plowing (Level 3)

**Strategic Considerations**:
- Complements agriculture perfectly
- Provides diverse resources
- Foundation for mobile military units
- Enables pastoral nomadic lifestyle alternative

---

#### Pottery Technology
**Description**: Creating clay vessels for storage, cooking, and transport.

**Prerequisites**:
- Fire Mastery (Level 0)
- Permanent Structures (Level 1)

**Research Requirements**:
- 30 population minimum
- 280 research points
- Access to clay deposits

**Effects**:
- Enables ceramic production for storage and cooking
- +40% food preservation efficiency
- Unlocks pottery as trade good
- Improves water transport and storage
- Required for: Kilns (Level 3), Advanced Crafts (Level 3)

**Strategic Considerations**:
- Important economic multiplier
- Enables better resource management
- Foundation for craft economy
- Valuable trade commodity

---

#### Stone Building
**Description**: Advanced construction using quarried stone, creating durable structures and monuments.

**Prerequisites**:
- Stone Knapping (Level 0)
- Advanced Tool-Making (Level 1)
- Permanent Structures (Level 1)

**Research Requirements**:
- 40 population minimum
- 350 research points
- Access to stone resources

**Effects**:
- Enables stone buildings and fortifications
- Population capacity: +40 per stone structure
- +40% structure durability and defense
- Unlocks defensive walls and fortifications
- Required for: Masonry (Level 3), Megaliths (Level 3)

**Strategic Considerations**:
- Superior defensive capabilities
- Long-lasting infrastructure
- High resource cost but permanent benefits
- Foundation for advanced architecture

---

#### Weaving & Textiles
**Description**: Creating cloth from plant fibers and animal hair using looms and spinning.

**Prerequisites**:
- Basic Foraging OR Primitive Hunting (Level 0)
- Clothing & Textiles (Level 1)
- Advanced Tool-Making (Level 1)

**Research Requirements**:
- 30 population minimum
- 260 research points

**Effects**:
- Enables fabric production from flax, cotton, wool
- +30% clothing quality and durability
- Unlocks textile trade goods (high value)
- +15% population comfort
- Required for: Dyes & Pigments (Level 3), Trade Networks (Level 2)

**Strategic Considerations**:
- Valuable craft industry
- Significant trade potential
- Improves population quality of life
- Foundation for luxury goods economy

---

#### Trade Networks
**Description**: Establishing regular exchange of goods and resources between settlements.

**Prerequisites**:
- Food Preservation (Level 1)
- Fishing Technology OR Clothing & Textiles (Level 1)
- Oral Tradition (Level 1)

**Research Requirements**:
- 50 population minimum
- 320 research points
- Multiple settlements required

**Effects**:
- Enables resource trading between settlements
- +25% resource value through trade
- Unlocks merchant units
- Spreads technologies faster (+15% research from trading partners)
- Required for: Currency (Level 3), Long-Distance Trade (Level 3)

**Strategic Considerations**:
- Economic multiplier through specialization
- Enables diplomatic relationships
- Spreads technology and culture
- Requires multiple population centers

---

#### Religion & Rituals
**Description**: Organized belief systems, spiritual practices, and communal ceremonies.

**Prerequisites**:
- Cave Painting & Art (Level 1)
- Oral Tradition (Level 1)

**Research Requirements**:
- 40 population minimum
- 300 research points

**Effects**:
- +25% population happiness
- +20% social cohesion (reduces unrest)
- Enables priests and spiritual leaders
- +10% research speed (philosophical inquiry)
- Required for: Organized Religion (Level 3), Ancestor Worship (Level 3)

**Strategic Considerations**:
- Powerful social stability tool
- Cultural development path
- Happiness bonus supports larger populations
- Foundation for cultural influence

---

#### Advanced Construction
**Description**: Sophisticated building techniques using multiple materials and engineering principles.

**Prerequisites**:
- Permanent Structures (Level 1)
- Advanced Tool-Making (Level 1)

**Research Requirements**:
- 45 population minimum
- 360 research points

**Effects**:
- Enables multi-story buildings
- +50% construction efficiency
- Population capacity: +30 per advanced structure
- Unlocks specialized building types (workshops, storehouses)
- Required for: Urban Planning (Level 3), Aqueducts (Level 3)

**Strategic Considerations**:
- Enables dense population centers
- More efficient use of land
- Foundation for urban civilization
- Unlocks specialized economic buildings

---

#### Boats & Rafts
**Description**: Watercraft for fishing, transport, and exploration.

**Prerequisites**:
- Fishing Technology (Level 1)
- Advanced Tool-Making (Level 1)

**Research Requirements**:
- 30 population minimum
- 280 research points
- Coastal or major river access

**Effects**:
- Enables water-based transport
- +60% fishing efficiency
- Allows settlement on islands
- Unlocks naval exploration
- Required for: Seafaring (Level 2), Naval Warfare (Level 3)

**Strategic Considerations**:
- Critical for water-based civilizations
- Opens new territories
- Enables water-based trade
- Foundation for naval power

---

#### Seafaring
**Description**: Ocean navigation and coastal maritime activities.

**Prerequisites**:
- Boats & Rafts (Level 2)
- Fishing Technology (Level 1)

**Research Requirements**:
- 40 population minimum
- 340 research points
- Ocean access required

**Effects**:
- Enables ocean travel and exploration
- Unlocks coastal trade routes (+30% trade range)
- Allows colonization of distant lands
- +40% maritime food production
- Required for: Navigation (Level 3), Ocean Trade (Level 3)

**Strategic Considerations**:
- Massive strategic advantage for coastal civilizations
- Enables expansion beyond local geography
- Opens global trade opportunities
- High risk but high reward exploration

---

### Level 2 Strategic Considerations

**Civilization Development Strategies:**

1. **Agricultural Revolution Strategy**:
   - Agriculture Foundations → Animal Domestication → Pottery → Advanced Construction
   - Focus: Population explosion and settled civilization
   - Enables: Rapid transition to Level 3 urban technologies
   - Best for: Fertile river valleys, grasslands

2. **Maritime Expansion Strategy**:
   - Boats & Rafts → Seafaring → Trade Networks → Weaving & Textiles
   - Focus: Naval power and trade dominance
   - Enables: Island colonization and global reach
   - Best for: Coastal starts, archipelago maps

3. **Cultural Development Strategy**:
   - Religion & Rituals → Trade Networks → Weaving & Textiles → Pottery
   - Focus: Happiness, research speed, and cultural influence
   - Enables: Cultural victory path and peaceful expansion
   - Best for: Large population civilizations

4. **Military/Defensive Strategy**:
   - Stone Building → Animal Domestication → Advanced Construction → Pottery
   - Focus: Fortifications and mobile military
   - Enables: Territorial defense and mounted warfare
   - Best for: Competitive multiplayer games

**Critical Technology Combinations:**
- Agriculture + Animal Domestication = Complete food security and population boom
- Seafaring + Trade Networks = Maritime trade empire
- Stone Building + Advanced Construction = Fortified urban centers
- Religion + Trade Networks = Cultural influence spreading through trade

---

## Level 3: Neolithic Revolution (10,000 - 4,000 BCE)

### Unlocking Level 3

Players must research **at least 4 Level 2 technologies** before Level 3 technologies become available. At this stage, civilizations are transitioning from prehistoric societies to early civilizations with specialized labor, complex social structures, and the foundations of recorded history.

### Core Philosophy

Level 3 represents the culmination of the prehistoric era and the threshold of civilization. These technologies enable urban centers, specialized economies, organized warfare, and the infrastructure necessary for the Ancient Era that follows. Players must choose technologies that will define their civilization's character as they transition into recorded history.

### Technology Tree: Level 3

#### Irrigation Systems
**Description**: Engineered water management for agricultural enhancement using canals, dikes, and reservoirs.

**Prerequisites**:
- Agriculture Foundations (Level 2)
- Advanced Construction (Level 2)

**Research Requirements**:
- 100 population minimum
- 600 research points
- River or water source access

**Effects**:
- +80% agricultural output in irrigated regions
- Enables farming in arid areas adjacent to water
- Supports 2x population per farmland
- Reduces vulnerability to drought
- Required for: Aqueducts (Level 3), Advanced Agriculture (Future)

**Strategic Considerations**:
- Massive food production multiplier
- Enables desert civilization development
- Critical for large urban populations
- High infrastructure investment requirement

---

#### Copper Working (Early Metallurgy)
**Description**: Extracting and shaping copper, the first metal to be widely used by humans.

**Prerequisites**:
- Fire Mastery (Level 0)
- Stone Building (Level 2)
- Pottery Technology (Level 2)

**Research Requirements**:
- 80 population minimum
- 550 research points
- Access to copper deposits

**Effects**:
- Enables copper tool and weapon production
- +40% tool durability and effectiveness
- Unlocks copper trade goods (high value)
- +30% military unit effectiveness (copper weapons)
- Required for: Bronze Working (Future), Mining (Level 3)

**Strategic Considerations**:
- First metal technology
- Significant military advantage
- Valuable trade commodity
- Resource-dependent (requires copper deposits)
- Transitional technology toward true metallurgy

---

#### Written Language (Proto-Writing)
**Description**: Using symbols and pictographs to record information permanently.

**Prerequisites**:
- Oral Tradition (Level 1)
- Pottery Technology (Level 2)
- Trade Networks OR Religion & Rituals (Level 2)

**Research Requirements**:
- 120 population minimum
- 650 research points

**Effects**:
- Enables permanent record-keeping
- +40% research speed (cumulative knowledge)
- Unlocks administrative capabilities (taxation, census)
- +30% trade efficiency (contracts and records)
- Technologies no longer lost from population decline
- Required for: Laws & Governance (Future), Advanced Mathematics (Future)

**Strategic Considerations**:
- Revolutionary research multiplier
- Protects all technological investments
- Enables complex administration
- Foundation for all advanced civilizations
- Often considered the transition point from prehistory to history

---

#### Urban Planning
**Description**: Organized city layout with specialized districts, roads, and public spaces.

**Prerequisites**:
- Advanced Construction (Level 2)
- Stone Building (Level 2)
- Trade Networks (Level 2)

**Research Requirements**:
- 150 population minimum
- 700 research points

**Effects**:
- Enables planned city development
- +60% city population capacity
- +25% all production in cities (efficiency bonus)
- Unlocks specialized city districts (markets, workshops, temples)
- Reduces disease spread (-40% epidemic impact)
- Required for: Sanitation (Future), Monuments (Level 3)

**Strategic Considerations**:
- Enables true urban civilization
- Massive efficiency multiplier
- Foundation for city-based gameplay
- Requires large population to benefit fully

---

#### Organized Religion
**Description**: Hierarchical religious institutions with temples, priesthoods, and codified beliefs.

**Prerequisites**:
- Religion & Rituals (Level 2)
- Stone Building OR Advanced Construction (Level 2)
- Written Language (Level 3)

**Research Requirements**:
- 100 population minimum
- 580 research points

**Effects**:
- Enables temple construction (cultural landmarks)
- +35% population happiness in cities with temples
- +25% social cohesion (reduces unrest)
- Unlocks religious units (priests) for cultural influence
- +15% research speed (monastic scholarship)
- Required for: State Religion (Future), Theology (Future)

**Strategic Considerations**:
- Powerful cultural and social technology
- Enables cultural victory progress
- Provides multiple bonuses across systems
- Foundation for religious-based civilization identity

---

#### Mining Technology
**Description**: Systematic extraction of minerals and metals from underground deposits.

**Prerequisites**:
- Stone Building (Level 2)
- Copper Working (Level 3)

**Research Requirements**:
- 90 population minimum
- 560 research points
- Mountain or hilly terrain access

**Effects**:
- Enables underground mining operations
- +100% mineral resource extraction efficiency
- Access to rare resources (gems, precious metals)
- Required for: Bronze Working (Future), Advanced Metallurgy (Future)

**Strategic Considerations**:
- Unlocks rare strategic resources
- Foundation for metal age technologies
- Geography-dependent advantage
- Enables resource-based economy

---

#### Granaries & Storage
**Description**: Large-scale food storage facilities for surplus management.

**Prerequisites**:
- Agriculture Foundations (Level 2)
- Pottery Technology (Level 2)
- Advanced Construction OR Stone Building (Level 2)

**Research Requirements**:
- 80 population minimum
- 520 research points

**Effects**:
- Enables massive food surplus storage
- +60% food preservation (cumulative with earlier techs)
- Eliminates famine risk in cities with granaries
- Enables population growth through lean seasons
- +30% food trade value
- Required for: Trade Caravans (Future), Market Economy (Future)

**Strategic Considerations**:
- Critical for stable urban populations
- Enables food-based economy
- Protects against climate catastrophes
- Foundation for complex economies

---

#### Organized Warfare
**Description**: Structured military units with training, command hierarchy, and tactical coordination.

**Prerequisites**:
- Advanced Hunting Techniques (Level 1)
- Stone Building OR Advanced Construction (Level 2)
- Oral Tradition (Level 1)

**Research Requirements**:
- 100 population minimum
- 600 research points

**Effects**:
- Enables organized military units
- +80% military effectiveness (tactics and coordination)
- Unlocks barracks and training facilities
- +50% defensive capabilities in fortified positions
- Required for: Professional Army (Future), Military Engineering (Future)

**Strategic Considerations**:
- Massive military multiplier
- Essential for competitive gameplay
- Enables defensive and offensive strategies
- Foundation for all advanced military technologies

---

#### Monumental Architecture (Megaliths)
**Description**: Constructing large stone monuments and ceremonial structures.

**Prerequisites**:
- Stone Building (Level 2)
- Religion & Rituals (Level 2)
- Advanced Construction (Level 2)

**Research Requirements**:
- 120 population minimum
- 680 research points

**Effects**:
- Enables construction of monuments and megaliths
- +40% cultural influence (visible civilization power)
- +20% population happiness (civic pride)
- Monuments provide permanent bonuses to territory
- Progress toward cultural victory
- Required for: Great Wonders (Future), Empire Prestige (Future)

**Strategic Considerations**:
- Cultural and happiness benefits
- Long-term strategic investment
- Demonstrates civilization power
- Foundation for wonder-based strategies

---

#### Long-Distance Trade Routes
**Description**: Establishing extensive trade networks spanning multiple regions.

**Prerequisites**:
- Trade Networks (Level 2)
- Animal Domestication (Level 2)
- Boats & Rafts OR Seafaring (Level 2)

**Research Requirements**:
- 100 population minimum
- 580 research points
- Multiple settlements separated by distance

**Effects**:
- Enables trade across vast distances
- +50% trade value (exotic goods premium)
- Spreads technologies between civilizations (+25% research from trading)
- Unlocks trade caravans and merchant ships
- Cultural influence spreads through trade routes
- Required for: Currency (Future), International Trade (Future)

**Strategic Considerations**:
- Economic and diplomatic technology
- Enables peaceful interaction with rivals
- Technology spreading can benefit all parties
- Foundation for trade-based economy

---

#### Calendars & Astronomy
**Description**: Observing celestial patterns to track seasons, create calendars, and navigate.

**Prerequisites**:
- Oral Tradition (Level 1)
- Agriculture Foundations (Level 2)

**Research Requirements**:
- 80 population minimum
- 500 research points

**Effects**:
- Enables calendar system (optimal planting/harvesting)
- +30% agricultural efficiency (timing optimization)
- Improves navigation (+40% exploration speed)
- +15% research speed (mathematical understanding)
- Required for: Mathematics (Future), Navigation (Future), Astronomy (Future)

**Strategic Considerations**:
- Multiple system benefits
- Agricultural and scientific technology
- Improves several civilization aspects
- Foundation for scientific advancement path

---

### Level 3 Strategic Considerations

**Civilization Specialization Paths:**

1. **Urban Civilization Strategy**:
   - Urban Planning → Written Language → Granaries & Storage → Irrigation Systems
   - Focus: Large, efficient cities with stable food supply
   - Enables: Classical Era city-state or empire
   - Victory Path: Economic or Cultural dominance
   - Best for: River valley starts, high food potential terrain

2. **Military Expansion Strategy**:
   - Organized Warfare → Copper Working → Mining Technology → Granaries & Storage
   - Focus: Military superiority and territorial conquest
   - Enables: Aggressive expansion into Ancient Era
   - Victory Path: Domination through superior forces
   - Best for: Resource-rich, defensible starting positions

3. **Maritime Empire Strategy**:
   - Long-Distance Trade Routes → Written Language → Urban Planning → Organized Religion
   - Focus: Naval power and global trade network
   - Enables: Maritime-based civilization spanning coastlines
   - Victory Path: Economic dominance through trade
   - Best for: Coastal starts with multiple water bodies

4. **Cultural/Scientific Strategy**:
   - Written Language → Organized Religion → Calendars & Astronomy → Monumental Architecture
   - Focus: Research speed and cultural influence
   - Enables: Cultural and scientific leadership
   - Victory Path: Cultural victory or technological supremacy
   - Best for: Large stable populations with good defense

5. **Resource/Economic Strategy**:
   - Mining Technology → Copper Working → Long-Distance Trade Routes → Granaries & Storage
   - Focus: Resource extraction and economic power
   - Enables: Resource-based wealth and trade dominance
   - Victory Path: Economic victory
   - Best for: Resource-rich mountainous or diverse terrain

**Technology Synergy Clusters:**

**Agricultural Cluster** (Population boom enabler):
- Agriculture Foundations + Irrigation Systems + Granaries & Storage + Calendars & Astronomy
- Result: Massive sustainable population supporting rapid development

**Military Cluster** (Domination enabler):
- Organized Warfare + Copper Working + Mining Technology + Stone Building
- Result: Superior armed forces with fortified bases

**Cultural Cluster** (Cultural victory enabler):
- Organized Religion + Written Language + Monumental Architecture + Urban Planning
- Result: High culture output with happy, productive population

**Economic Cluster** (Trade dominance enabler):
- Long-Distance Trade Routes + Granaries & Storage + Written Language + Mining Technology
- Result: Diverse resource economy with efficient administration

**Scientific Cluster** (Research speed enabler):
- Written Language + Calendars & Astronomy + Organized Religion + Urban Planning
- Result: Maximum research output for rapid progression

---

## Technology Research Mechanics

### Research Point Generation

Research points are generated by population engaged in research activities. The base generation rate increases with:

**Base Research Rate**:
- 1 research point per 10 population per turn (base rate)
- Modified by technologies (+research speed bonuses)
- Modified by population happiness (unhappy populations research slower)
- Modified by available resources (certain technologies require specific resources)

**Research Speed Modifiers** (Cumulative):
- Oral Tradition (Level 1): +20%
- Cave Painting & Art (Level 1): +10%
- Religion & Rituals (Level 2): +10%
- Trade Networks (Level 2): +15% (if actively trading)
- Organized Religion (Level 3): +15%
- Written Language (Level 3): +40%
- Calendars & Astronomy (Level 3): +15%

**Maximum Cumulative Bonus**: +125% research speed by end of Level 3

### Research Requirements Scaling

**Population Requirements**:
- Level 0: 5 population minimum per technology
- Level 1: 15-25 population minimum per technology
- Level 2: 30-50 population minimum per technology
- Level 3: 80-150 population minimum per technology

These requirements ensure technologies are unlocked as civilization populations grow, providing natural pacing and preventing tech rushing.

**Research Point Costs**:
- Level 0: 60-120 research points (early game, quick progression)
- Level 1: 120-220 research points (mid early game)
- Level 2: 260-400 research points (late early game)
- Level 3: 500-700 research points (transition to Ancient Era)

### Technology Prerequisites

Technologies have two types of prerequisites:

1. **Direct Prerequisites**: Specific earlier technologies that must be researched
2. **Tier Prerequisites**: Minimum number of technologies from previous tiers

**Tier Prerequisites Summary**:
- Level 0: No prerequisites (all available at start)
- Level 1: Any 2 Level 0 technologies
- Level 2: Any 3 Level 1 technologies (implies 5 total: 2 Level 0 + 3 Level 1)
- Level 3: Any 4 Level 2 technologies (implies 7 total technologies researched)

### Resource Requirements

Some technologies require access to specific resources or terrain:

**Terrain-Dependent Technologies**:
- Natural Shelter Utilization: Caves, mountains, or dense forests
- Basic Foraging: Forests, grasslands, or jungles
- Fishing Technology: Rivers, lakes, or coasts
- Agriculture Foundations: Grasslands or river valleys
- Seafaring: Ocean access
- Mining Technology: Mountains or hills
- Irrigation Systems: River access

**Resource-Dependent Technologies**:
- Stone Knapping: Stone deposits
- Copper Working: Copper deposits
- Mining Technology: Mineral deposits

Civilizations lacking required resources or terrain cannot research these technologies, creating natural differentiation and encouraging trade or conquest for strategic resources.

---

## Gameplay Integration

### Technology Effects on Game Systems

#### Population System
- Survival Rate: Technologies improve population survival in harsh conditions
- Growth Rate: Food technologies enable faster population growth
- Capacity: Construction technologies increase maximum population per settlement
- Happiness: Cultural technologies improve population happiness and productivity

#### Resource System
- Gathering Efficiency: Tool technologies improve resource gathering speed
- Resource Types: Technologies unlock new resource types (copper, textiles, etc.)
- Storage: Storage technologies allow resource accumulation
- Trade Value: Craft technologies create high-value trade goods

#### Military System
- Unit Types: Military technologies unlock new unit types
- Combat Effectiveness: Weapon and tactical technologies improve military strength
- Defense: Fortification technologies improve defensive capabilities
- Mobility: Transportation technologies improve unit movement

#### Economic System
- Production: Efficiency technologies increase production rates
- Trade: Trade technologies enable resource exchange and economy growth
- Specialization: Advanced technologies enable specialized labor
- Infrastructure: Construction technologies build economic foundations

### Strategic Decision Points

Players face meaningful choices at each technology level:

**Early Game (Level 0-1)**: Survival vs. Expansion
- Focus on immediate survival (fire, shelter, food)
- OR expand aggressively (tools, hunting, mobile shelters)
- Risk/Reward: Expansion risks early population loss but gains territory

**Mid Game (Level 1-2)**: Specialization vs. Balance
- Specialize in military, economy, or culture
- OR maintain balanced development
- Risk/Reward: Specialization creates advantages and vulnerabilities

**Late Game (Level 2-3)**: Civilization Type Definition
- Choose technologies that define civilization character
- Commit to victory condition path (domination, cultural, economic, scientific)
- Risk/Reward: Late-game pivot is expensive; early commitment is risky

### Technology Tree Navigation UI

**Recommended UI Elements**:

1. **Visual Tech Tree**: 
   - Nodes for each technology
   - Lines showing dependencies
   - Color coding by level and category
   - Icons representing technology type

2. **Technology Information Panel**:
   - Prerequisites and requirements
   - Research cost and time estimate
   - Detailed effects description
   - Technologies unlocked by this research

3. **Research Queue**:
   - Current research progress
   - Queued next technologies
   - Estimated completion time based on current research rate

4. **Civilization Tech Status**:
   - Technologies researched
   - Available technologies
   - Locked technologies (prerequisites not met)
   - Resource/terrain blocked technologies

---

## Transition to Ancient Era

### Bridging Technologies

Level 3 technologies serve as bridges to the Ancient Era (4,000 BCE - 500 CE) tech tree:

**Ancient Era Prerequisites** (Future):
- Bronze Working: Requires Copper Working (Level 3) + Mining Technology (Level 3)
- Professional Army: Requires Organized Warfare (Level 3) + Copper Working (Level 3)
- Code of Laws: Requires Written Language (Level 3) + Organized Religion (Level 3)
- Mathematics: Requires Written Language (Level 3) + Calendars & Astronomy (Level 3)
- Monarchy: Requires Urban Planning (Level 3) + Organized Religion (Level 3)

### Victory Conditions at Prehistoric Era End

While formal victory conditions are defined for later eras, civilizations at the end of Level 3 can be evaluated on:

**Survival Victory**: Successfully reaching 4,000 BCE with stable population
**Dominance Leader**: Largest territory and military power
**Cultural Leader**: Highest cultural influence and happiness
**Economic Leader**: Most resources and trade value
**Scientific Leader**: Fastest research rate and most technologies

These informal "victories" provide benchmarks for player performance and set the stage for Ancient Era competition.

---

## Balance Considerations

### Technology Cost Balancing

Technologies are balanced to ensure:

1. **No Dominant Path**: Each development path (military, economic, cultural) has roughly equivalent value
2. **Early Game Variety**: Multiple viable Level 0 opening strategies
3. **Mid Game Choices**: Level 1-2 technologies offer meaningful strategic tradeoffs
4. **Late Game Commitment**: Level 3 technologies require significant investment

### Population Scaling

Technology requirements scale with population to:
- Prevent tech rushing with small populations
- Encourage population growth
- Create natural pacing
- Ensure technological progression matches civilization development

### Resource Dependencies

Resource-dependent technologies:
- Create geographic variation between games
- Encourage exploration and expansion
- Drive trade and diplomacy
- Create strategic value for territory

### Research Speed Curve

The cumulative research speed bonuses (up to +125%) are designed to:
- Accelerate mid-to-late game progression
- Reward earlier cultural/social technology investments
- Prevent endless grind in later eras
- Enable catch-up mechanics for less developed civilizations

---

## Implementation Notes

### Database Schema Considerations

**Technology Status Collection**:
```
{
  gameId: ObjectId,
  civilizationId: ObjectId,
  technologyId: string,
  status: "locked" | "available" | "researching" | "completed",
  researchProgress: number,
  completedDate: Date,
  researchStartDate: Date
}
```

**Technology Definition Collection**:
```
{
  technologyId: string,
  name: string,
  level: number,
  category: string,
  description: string,
  prerequisites: [string],
  tierPrerequisites: {level: number, count: number},
  researchCost: number,
  populationRequired: number,
  resourceRequirements: [string],
  terrainRequirements: [string],
  effects: [object]
}
```

### Simulation Engine Integration

The Go-based simulation engine will:
- Calculate research point generation per turn
- Check technology prerequisites and requirements
- Apply technology effects to population, resources, and units
- Handle technology unlock events
- Process technology-dependent actions (building types, unit types, etc.)

### Client UI Considerations

The client should display:
- Interactive technology tree visualization
- Current research progress and queue
- Available vs. locked technologies
- Technology effects and benefits
- Research rate and estimated completion times
- Historical timeline context

---

## Future Expansion

### Ancient Era Tech Tree (4,000 BCE - 500 CE)

Technologies will include:
- Bronze Age innovations
- Writing system evolution
- Classical architecture
- Professional military units
- Mathematics and science
- Philosophy and governance
- Advanced maritime technology

### Conditional Technologies

Future versions may include:
- Region-specific technologies (based on starting location)
- Culture-specific technologies (based on early choices)
- Breakthrough technologies (rare, powerful, game-changing)
- Technology trading between civilizations

### Technology Loss and Degradation

Future mechanics may include:
- Technology loss from population catastrophes
- Knowledge degradation without Written Language
- Technology recovery from ruins
- Archaeological discoveries

---

## Related Documents

- **VISION.md**: Overall game vision and strategic gameplay goals
- **version0.0001.md**: Authentication and session management system
- **MAP_GENERATION.md**: Terrain generation and resource distribution
- **Future: ANCIENT_ERA_TECH_TREE.md**: Continuation of technology progression

---

## Revision History

**Version 0.0004 (2025-10-23)**:
- Initial design specification
- Four-level prehistoric technology tree (Levels 0-3)
- 47 total technologies spanning 196,000 years
- Multiple strategic paths with meaningful dependencies
- Integration with existing game systems
- Bridge to Ancient Era technologies

---

## Appendices

### Appendix A: Complete Technology List

**Level 0 (6 technologies)**:
1. Fire Mastery
2. Stone Knapping
3. Natural Shelter Utilization
4. Primitive Shelter Construction
5. Basic Foraging
6. Primitive Hunting

**Level 1 (8 technologies)**:
1. Advanced Tool-Making
2. Advanced Hunting Techniques
3. Permanent Structures
4. Food Preservation
5. Fishing Technology
6. Cave Painting & Art
7. Oral Tradition
8. Clothing & Textiles

**Level 2 (10 technologies)**:
1. Agriculture Foundations
2. Animal Domestication
3. Pottery Technology
4. Stone Building
5. Weaving & Textiles
6. Trade Networks
7. Religion & Rituals
8. Advanced Construction
9. Boats & Rafts
10. Seafaring

**Level 3 (11 technologies)**:
1. Irrigation Systems
2. Copper Working (Early Metallurgy)
3. Written Language (Proto-Writing)
4. Urban Planning
5. Organized Religion
6. Mining Technology
7. Granaries & Storage
8. Organized Warfare
9. Monumental Architecture (Megaliths)
10. Long-Distance Trade Routes
11. Calendars & Astronomy

**Total Prehistoric Technologies**: 35 core technologies

### Appendix B: Technology Research Time Estimates

Based on 100 population civilization with base research rate (1 point per 10 population per turn):

**Level 0 Average**: 6-12 turns per technology (early game pacing)
**Level 1 Average**: 12-22 turns per technology (with +30% research speed)
**Level 2 Average**: 20-30 turns per technology (with +55% research speed)
**Level 3 Average**: 25-35 turns per technology (with +125% research speed)

These estimates assume continuous research and no population catastrophes. Actual game time will vary based on population size, technology choices, and events.

### Appendix C: Quick Reference Strategic Paths

**Speed Run to Agriculture**:
1. Basic Foraging → Stone Knapping → Fire Mastery
2. Advanced Tool-Making → Food Preservation → Permanent Structures
3. Agriculture Foundations → Irrigation Systems

**Military Supremacy Path**:
1. Stone Knapping → Primitive Hunting → Fire Mastery
2. Advanced Tool-Making → Advanced Hunting Techniques → Clothing & Textiles
3. Animal Domestication → Stone Building → Advanced Construction
4. Organized Warfare → Copper Working → Mining Technology

**Cultural Victory Path**:
1. Fire Mastery → Natural Shelter Utilization → Stone Knapping
2. Cave Painting & Art → Oral Tradition → Food Preservation
3. Religion & Rituals → Pottery Technology → Trade Networks
4. Written Language → Organized Religion → Monumental Architecture

**Maritime Empire Path**:
1. Stone Knapping → Basic Foraging → Primitive Hunting
2. Fishing Technology → Advanced Tool-Making → Food Preservation
3. Boats & Rafts → Seafaring → Trade Networks
4. Long-Distance Trade Routes → Urban Planning → Written Language

---

*"From the first spark of fire to the first written word, humanity's journey through prehistory shaped the civilizations that would rise in the ages to come."*
