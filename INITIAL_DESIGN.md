# SimCiv Initial Design

## Executive Summary

This document defines the initial architecture for SimCiv, a revolutionary strategy game combining city-building simulation with grand strategy gameplay. The design prioritizes modularity, testability, and clear separation of concerns through a database-centric architecture.

**Core Principle**: The database serves as the single source of truth for all game state and user actions, enabling independent development and testing of simulation and client components.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Node.js Server + Svelte UI (Initial Implementation)   │ │
│  │  - Presents game state to users                        │ │
│  │  - Captures user actions/policies                      │ │
│  │  - Reads/writes database directly                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Future Clients (Mobile, Desktop, Alternative UIs)     │ │
│  │  - Completely severable from simulation                │ │
│  │  - Interact via database reading/writing               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │                  │
                    │    Database      │
                    │   (MongoDB or    │
                    │    similar)      │
                    │                  │
                    │  • Game State    │
                    │  • User Actions  │
                    │  • Policies      │
                    │  • Simulation    │
                    │    Events        │
                    │                  │
                    └──────────────────┘
                              ▲
┌─────────────────────────────────────────────────────────────┐
│                     Simulation Engine                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Go Simulation                                         │ │
│  │  - Continuously processes game logic                   │ │
│  │  - Simulates citizen behavior                          │ │
│  │  - Applies policies and rules                          │ │
│  │  - Writes updated state to database                    │ │
│  │  - Reads user actions/policies from database           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Database as Single Source of Truth

The database is the central store of all game state and user actions. Both the simulation and clients interact with the game exclusively through the database.

**Benefits:**
- Clear separation of concerns
- Multiple clients can coexist without coordination
- Easy to add new client types (mobile, desktop, web)
- Simplified debugging and state inspection
- Natural audit trail of all game events

**Database Schema Domains:**
- **Player Data**: Accounts, authentication, preferences
- **Civilization State**: Resources, technology, policies, population
- **Simulation State**: Individual citizen data, buildings, cities
- **User Actions**: Policy changes, prioritization, decisions
- **Events Log**: Historical record of simulation events
- **Metrics**: Performance data, analytics

### 2. Complete Modularity

The simulation engine and clients are completely independent modules that only communicate through the database.

**Simulation Engine (Go):**
- Runs continuously, independent of client presence
- Reads user policies and actions from database
- Executes game logic and citizen AI
- Writes updated game state to database
- Can run headless for testing

**Client (Node.js + Svelte):**
- Presents game state to users
- Captures user input and decisions
- Writes user actions to database
- Polls or subscribes to state changes
- Can run against real or mock database

**Future Clients:**
- Any technology stack can be used
- Only requirement: read/write database schema
- Native mobile apps, desktop apps, alternative UIs all supported

### 3. Mockability for Testing

All components must support mock implementations for isolated testing.

**Mock Database Interface:**
- In-memory implementation for simulation testing
- Enables fast unit tests without database dependency
- Supports snapshot testing of game states
- Allows deterministic simulation testing

**Mock Datasets:**
- Pre-built game states for UI testing
- Various scenarios (early game, late game, crisis situations)
- Enables UI development without running simulation
- Facilitates visual regression testing

## Technology Stack

### Simulation Engine

**Language:** Go (Golang)

**Rationale:**
- Excellent performance for CPU-intensive simulation
- Simple concurrency with goroutines for parallel processing
- Fast compilation for rapid iteration
- Strong standard library for networking and I/O
- Easy deployment (single binary)
- Good balance of performance and development speed

**Core Libraries:**
- Database driver (MongoDB Go driver or PostgreSQL pgx)
- Logging (zap or zerolog)
- Configuration management (viper)
- Testing framework (testify)

### Database

**Primary Choice:** MongoDB

**Rationale:**
- Web-technology friendly (JSON documents)
- Flexible schema for evolving game design
- Good performance for read-heavy workloads
- Excellent Node.js and Go support
- Easy to mock with in-memory implementations

**Alternative:** PostgreSQL with JSONB columns
- If relational features become important
- More mature ecosystem
- ACID guarantees may be beneficial

**Key Collections/Tables:**
- `civilizations` - High-level civilization data
- `citizens` - Individual simulated humans
- `cities` - City state and buildings
- `policies` - Active policies and priorities
- `actions` - User action queue
- `events` - Simulation event log
- `players` - Player accounts and authentication

### Initial Client

**Server:** Node.js with TypeScript

**Rationale:**
- Excellent MongoDB integration
- Large ecosystem of libraries
- Easy to find developers
- Good for rapid prototyping
- Familiar to web developers

**Framework:** Express or Fastify
- RESTful API for data access
- WebSocket support for real-time updates
- Easy middleware integration

**UI Framework:** Svelte with SvelteKit

**Rationale:**
- Lightweight and performant
- Simple reactive paradigm
- Less boilerplate than React/Vue
- Excellent developer experience
- Compiles to vanilla JavaScript
- Good fit for data-driven UI

**Additional Frontend Tools:**
- TypeScript for type safety
- Vite for fast builds and HMR
- Tailwind CSS or similar for styling
- Chart.js or D3.js for data visualization

## Database Schema Design

### Core Principles

1. **Document-Oriented** (if using MongoDB)
   - Each civilization is a document with embedded or referenced data
   - Denormalization for read performance where appropriate
   - References for large collections (citizens, events)

2. **Change Tracking**
   - Every state change is logged
   - Enables replay and debugging
   - Supports time-travel debugging

3. **Versioning**
   - Schema version in each document
   - Enables safe evolution of data structures
   - Migration support built-in

### Example Schema (MongoDB-style)

```javascript
// Civilization Document
{
  _id: ObjectId("..."),
  civilizationId: "civ_001",
  name: "Ancient Rome",
  playerId: "player_123",
  era: "classical",
  
  // Core stats
  resources: {
    gold: 1000,
    food: 500,
    production: 200,
    science: 150
  },
  
  // Technology
  technologies: ["agriculture", "writing", "bronze_working"],
  currentResearch: "iron_working",
  researchProgress: 0.45,
  
  // Active policies
  policies: {
    taxRate: 0.20,
    militaryFocus: 0.30,
    scienceFocus: 0.40,
    cultureFocus: 0.30
  },
  
  // References to other collections
  cityIds: ["city_001", "city_002"],
  
  // Metadata
  lastSimulationTick: ISODate("2024-01-15T10:30:00Z"),
  schemaVersion: 1,
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}

// Citizen Document
{
  _id: ObjectId("..."),
  citizenId: "citizen_12345",
  civilizationId: "civ_001",
  cityId: "city_001",
  
  // Personal attributes
  name: "Marcus",
  age: 32,
  occupation: "farmer",
  
  // Needs and satisfaction
  needs: {
    food: 0.8,
    shelter: 0.9,
    safety: 0.7,
    belonging: 0.6
  },
  
  // Current activity
  currentTask: "farming",
  taskProgress: 0.65,
  
  // Metadata
  schemaVersion: 1,
  lastUpdated: ISODate("2024-01-15T10:30:00Z")
}

// Action Queue Document
{
  _id: ObjectId("..."),
  actionId: "action_789",
  civilizationId: "civ_001",
  playerId: "player_123",
  
  // Action details
  actionType: "policy_change",
  payload: {
    policy: "militaryFocus",
    newValue: 0.50
  },
  
  // Processing status
  status: "pending", // pending, processing, completed, failed
  submittedAt: ISODate("2024-01-15T10:29:00Z"),
  processedAt: null,
  
  schemaVersion: 1
}

// Event Log Document
{
  _id: ObjectId("..."),
  eventId: "event_456",
  civilizationId: "civ_001",
  
  // Event details
  eventType: "city_founded",
  description: "New city founded: Athens",
  payload: {
    cityId: "city_003",
    cityName: "Athens",
    location: { x: 150, y: 200 }
  },
  
  // Metadata
  timestamp: ISODate("2024-01-15T10:28:30Z"),
  simulationTick: 12450,
  schemaVersion: 1
}
```

## Database Abstraction Layer

To enable mockability and testing, we'll create an abstraction layer for database access.

### Go Database Interface

```go
// Repository interface that both real and mock implementations satisfy
type GameRepository interface {
    // Civilization operations
    GetCivilization(ctx context.Context, civilizationID string) (*Civilization, error)
    UpdateCivilization(ctx context.Context, civ *Civilization) error
    ListCivilizations(ctx context.Context) ([]*Civilization, error)
    
    // Citizen operations
    GetCitizens(ctx context.Context, civilizationID string, limit int) ([]*Citizen, error)
    UpdateCitizen(ctx context.Context, citizen *Citizen) error
    BatchUpdateCitizens(ctx context.Context, citizens []*Citizen) error
    
    // Action queue operations
    GetPendingActions(ctx context.Context, civilizationID string) ([]*Action, error)
    MarkActionProcessed(ctx context.Context, actionID string) error
    
    // Event operations
    LogEvent(ctx context.Context, event *Event) error
    GetRecentEvents(ctx context.Context, civilizationID string, limit int) ([]*Event, error)
}

// Real MongoDB implementation
type MongoRepository struct {
    client *mongo.Client
    db     *mongo.Database
}

// In-memory mock implementation for testing
type MockRepository struct {
    civilizations map[string]*Civilization
    citizens      map[string]*Citizen
    actions       map[string]*Action
    events        []*Event
}
```

### Node.js Database Interface

```typescript
// Repository interface for TypeScript client
interface GameRepository {
  // Civilization operations
  getCivilization(civilizationId: string): Promise<Civilization>;
  updateCivilization(civ: Civilization): Promise<void>;
  listCivilizations(): Promise<Civilization[]>;
  
  // Action operations
  submitAction(action: Action): Promise<string>;
  
  // Event operations
  subscribeToEvents(civilizationId: string, callback: (event: Event) => void): Subscription;
  getRecentEvents(civilizationId: string, limit: number): Promise<Event[]>;
}

// Real MongoDB implementation
class MongoRepository implements GameRepository {
  constructor(private db: Db) {}
  // Implementation...
}

// Mock implementation for testing
class MockRepository implements GameRepository {
  private civilizations: Map<string, Civilization> = new Map();
  private events: Event[] = [];
  // Implementation...
}
```

## Testing Strategy

### Unit Testing

#### Simulation Engine (Go)
- **Framework:** Go's built-in testing package with testify for assertions
- **Coverage Goal:** >80% code coverage
- **Focus Areas:**
  - Citizen AI logic
  - Resource calculations
  - Technology progression
  - Policy effects

**Example Test:**
```go
func TestCitizenNeedsCalculation(t *testing.T) {
    // Arrange
    repo := &MockRepository{
        civilizations: map[string]*Civilization{
            "civ_001": testCivilization,
        },
    }
    sim := NewSimulation(repo)
    
    // Act
    citizen := &Citizen{
        NeedsFood: 0.3,
        Age: 25,
        Occupation: "farmer",
    }
    sim.UpdateCitizenNeeds(citizen)
    
    // Assert
    assert.InRange(t, citizen.NeedsFood, 0.4, 0.6)
}
```

#### Client (Node.js/TypeScript)
- **Framework:** Vitest or Jest
- **Coverage Goal:** >75% code coverage
- **Focus Areas:**
  - Data transformation logic
  - Action validation
  - State management

**Example Test:**
```typescript
describe('PolicyService', () => {
  it('should validate policy changes', async () => {
    // Arrange
    const repo = new MockRepository();
    const service = new PolicyService(repo);
    
    // Act
    const result = await service.updatePolicy('civ_001', {
      policy: 'militaryFocus',
      value: 1.5 // Invalid: exceeds 1.0
    });
    
    // Assert
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('exceeds maximum');
  });
});
```

#### UI Components (Svelte)
- **Framework:** Vitest with @testing-library/svelte
- **Coverage Goal:** >70% component coverage
- **Focus Areas:**
  - User input handling
  - Data display
  - Interactive elements

**Example Test:**
```typescript
import { render, fireEvent } from '@testing-library/svelte';
import PolicySlider from './PolicySlider.svelte';

describe('PolicySlider', () => {
  it('should update policy value on slider change', async () => {
    const { getByRole, component } = render(PolicySlider, {
      props: { policy: 'militaryFocus', value: 0.3 }
    });
    
    const slider = getByRole('slider');
    await fireEvent.change(slider, { target: { value: '0.7' } });
    
    const events = component.$capture_state().dispatchedEvents;
    expect(events[0].detail.value).toBe(0.7);
  });
});
```

### Integration Testing

#### Database Integration
- **Approach:** Test against real database (MongoDB) in isolated test environment
- **Tools:** Docker containers for test database
- **Cleanup:** Reset database state between tests

**Example Test:**
```go
func TestDatabaseIntegration(t *testing.T) {
    // Setup test database
    container := setupMongoContainer(t)
    defer container.Terminate()
    
    repo := NewMongoRepository(container.ConnectionString())
    
    // Test full flow
    civ := &Civilization{
        CivilizationID: "test_civ",
        Name: "Test Civilization",
    }
    
    err := repo.UpdateCivilization(context.Background(), civ)
    require.NoError(t, err)
    
    retrieved, err := repo.GetCivilization(context.Background(), "test_civ")
    require.NoError(t, err)
    assert.Equal(t, civ.Name, retrieved.Name)
}
```

#### Simulation-Database Integration
- Test complete simulation cycles
- Verify state persistence
- Check concurrent access handling

#### Client-Database Integration
- Test API endpoints against real database
- Verify action submission and processing
- Test real-time event subscriptions

### End-to-End Testing

#### Full System Tests
- **Approach:** Run simulation engine, database, and client together
- **Tools:** Docker Compose for orchestration
- **Focus:** User workflows from login to gameplay

**Test Scenarios:**
1. **New Player Onboarding**
   - Create account
   - Start new civilization
   - Verify initial game state
   - Make first policy decision
   - Verify simulation processes action

2. **Policy Change Flow**
   - User changes policy via UI
   - Action submitted to database
   - Simulation picks up action
   - Simulation applies policy effect
   - UI reflects updated state

3. **Technology Research**
   - Select technology to research
   - Simulation progresses research over time
   - Technology completes
   - UI shows new technology unlocked

**Example E2E Test:**
```typescript
describe('E2E: Policy Change', () => {
  it('should complete full policy change workflow', async () => {
    // Start all services
    const { simulation, database, client } = await startTestEnvironment();
    
    // User logs in and views civilization
    const session = await client.login('testuser', 'password');
    const civ = await client.getCivilization(session, 'civ_001');
    
    // User changes military focus
    await client.updatePolicy(session, 'civ_001', {
      policy: 'militaryFocus',
      value: 0.5
    });
    
    // Wait for simulation to process (with timeout)
    await waitFor(async () => {
      const updated = await client.getCivilization(session, 'civ_001');
      return updated.policies.militaryFocus === 0.5;
    }, { timeout: 10000 });
    
    // Verify change persisted
    const final = await database.getCivilization('civ_001');
    expect(final.policies.militaryFocus).toBe(0.5);
    
    // Cleanup
    await stopTestEnvironment({ simulation, database, client });
  });
});
```

### Performance Testing

#### Simulation Performance
- **Metrics:** Ticks per second, citizens processed per tick
- **Tools:** Go's built-in benchmarking
- **Targets:** 
  - Handle 10,000+ citizens per simulation instance
  - Process 1 tick per second minimum
  - < 100ms response time for policy changes

**Example Benchmark:**
```go
func BenchmarkSimulationTick(b *testing.B) {
    repo := setupMockRepository(10000) // 10k citizens
    sim := NewSimulation(repo)
    
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        sim.ProcessTick(context.Background())
    }
}
```

#### Database Performance
- Load testing with realistic data volumes
- Query optimization
- Index tuning

#### Client Performance
- Page load times
- Bundle size optimization
- Rendering performance

### Test Infrastructure

#### Continuous Integration
- **Platform:** GitHub Actions
- **Triggers:** Every pull request, main branch commits
- **Steps:**
  1. Lint code (golangci-lint, ESLint)
  2. Run unit tests (Go and TypeScript)
  3. Run integration tests
  4. Build Docker images
  5. Run E2E tests
  6. Generate coverage reports

#### Test Data Management
- **Mock Data Generator:** Create realistic game states
- **Snapshots:** Save interesting game states for testing
- **Seeding:** Populate test databases with known data

#### Test Environments
- **Local Development:** Docker Compose with all services
- **CI Environment:** Isolated containers per test run
- **Staging:** Persistent environment for manual testing

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

**Deliverables:**
- Database schema design and implementation
- Repository abstraction layer (Go and Node.js)
- Mock implementations for testing
- Basic simulation engine structure
- Basic client application structure
- CI/CD pipeline setup

**Key Tasks:**
1. Set up project repositories (monorepo or separate repos)
2. Define database schema (MongoDB collections)
3. Implement repository interfaces
4. Create mock repositories
5. Set up testing frameworks
6. Establish development environment (Docker Compose)

**Success Criteria:**
- Can run simulation with mock data
- Can run client with mock data
- Unit tests passing for core functionality
- Development environment documented

### Phase 2: Core Simulation (Weeks 5-8)

**Deliverables:**
- Citizen simulation logic
- Basic resource management
- Simple city growth mechanics
- Policy system implementation
- Action queue processing

**Key Tasks:**
1. Implement citizen AI (needs, goals, actions)
2. Build resource calculation systems
3. Create city growth algorithms
4. Implement policy effects on simulation
5. Build action queue processor
6. Write comprehensive unit tests

**Success Criteria:**
- Simulation runs continuously
- Citizens make decisions based on needs
- Policies affect citizen behavior
- Resources are tracked and consumed
- All core logic has >80% test coverage

### Phase 3: Client Development (Weeks 9-12)

**Deliverables:**
- Svelte UI components
- Civilization dashboard
- Policy control interface
- Real-time state updates
- User authentication

**Key Tasks:**
1. Build main dashboard UI
2. Create policy control components
3. Implement data visualization (charts, graphs)
4. Add real-time updates (polling or WebSocket)
5. Build authentication system
6. Create responsive layouts

**Success Criteria:**
- Users can view civilization state
- Users can change policies
- UI updates reflect simulation changes
- Mobile-friendly responsive design
- Component tests passing

### Phase 4: Integration (Weeks 13-16)

**Deliverables:**
- Connected simulation and client
- End-to-end workflows
- Database optimization
- Performance tuning
- Documentation

**Key Tasks:**
1. Connect simulation to real database
2. Connect client to real database
3. Test complete user workflows
4. Optimize database queries and indexes
5. Profile and optimize performance
6. Write user documentation
7. Create deployment guides

**Success Criteria:**
- All components work together
- E2E tests passing
- Performance targets met
- Production-ready deployment
- Complete documentation

### Phase 5: Advanced Features (Weeks 17-24)

**Deliverables:**
- Technology tree system
- Multiple civilizations
- Diplomatic interactions
- Combat mechanics
- Victory conditions

**Key Tasks:**
1. Implement technology progression
2. Support multiple civilizations per game
3. Add inter-civilization interactions
4. Build combat system
5. Define and implement victory conditions
6. Expand test coverage for new features

**Success Criteria:**
- Complete gameplay loop
- Multiple players can compete
- All victory conditions implementable
- System scales to multiple civilizations

## Architecture Decision Records

### ADR-001: Database as Central Store

**Status:** Accepted

**Context:** Need to coordinate between continuously running simulation and intermittently connected clients.

**Decision:** Use database as single source of truth for all game state and user actions.

**Consequences:**
- Positive: Clear separation of concerns, easy to add new clients
- Positive: Simple debugging and state inspection
- Negative: Database becomes critical bottleneck
- Negative: Need careful schema design and optimization

### ADR-002: Go for Simulation

**Status:** Accepted

**Context:** Simulation needs good performance for CPU-intensive citizen AI while remaining maintainable.

**Decision:** Use Go for simulation engine.

**Consequences:**
- Positive: Good performance and concurrency
- Positive: Fast compilation and easy deployment
- Positive: Strong standard library
- Negative: Learning curve for team
- Negative: Fewer game-specific libraries than C++/C#

### ADR-003: MongoDB for Database

**Status:** Accepted

**Context:** Need web-friendly database that works well with both Go and Node.js.

**Decision:** Use MongoDB as primary database.

**Consequences:**
- Positive: Flexible schema for iteration
- Positive: Excellent JavaScript/Node.js support
- Positive: Easy to mock
- Negative: Less mature than PostgreSQL
- Negative: Need to carefully manage indexes

### ADR-004: Svelte for UI

**Status:** Accepted

**Context:** Need modern, performant UI framework for data-driven interface.

**Decision:** Use Svelte with SvelteKit for client UI.

**Consequences:**
- Positive: Lightweight and fast
- Positive: Simple reactivity model
- Positive: Growing ecosystem
- Negative: Smaller community than React
- Negative: Fewer ready-made components

### ADR-005: Repository Pattern

**Status:** Accepted

**Context:** Need to support both real database and mock implementations for testing.

**Decision:** Use repository pattern with interface-based abstraction.

**Consequences:**
- Positive: Easy to test with mocks
- Positive: Can swap database implementations
- Positive: Clear API boundaries
- Negative: Additional abstraction layer
- Negative: More code to maintain

## Risk Assessment and Mitigation

### Technical Risks

#### Risk 1: Database Performance Bottleneck
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Design schema for read-heavy workloads
- Implement proper indexing strategy
- Use caching layer (Redis) if needed
- Plan for database sharding if scaling needed
- Monitor query performance from day one

#### Risk 2: Real-time Synchronization Complexity
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Start with simple polling mechanism
- Add WebSocket support incrementally
- Implement optimistic updates in UI
- Use event sourcing for audit trail
- Test with various latency scenarios

#### Risk 3: Simulation Performance at Scale
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Profile simulation early and often
- Use benchmarking to track performance
- Optimize hot paths first
- Consider spatial partitioning for large populations
- Plan for horizontal scaling of simulation instances

#### Risk 4: State Consistency Between Components
**Likelihood:** High  
**Impact:** High  
**Mitigation:**
- Define clear ownership of state changes
- Implement versioning for documents
- Use transactions where appropriate
- Build comprehensive integration tests
- Monitor for consistency issues in production

### Process Risks

#### Risk 5: Technology Learning Curve
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Invest in training for Go and Svelte
- Start with small proof-of-concept projects
- Pair programming for knowledge transfer
- Build internal documentation and examples
- Allocate time for learning in sprints

#### Risk 6: Testing Overhead
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Establish testing patterns early
- Automate test execution in CI
- Make testing part of definition of done
- Use test-driven development where appropriate
- Invest in test infrastructure and tooling

## Success Metrics

### Technical Metrics
- **Simulation Performance:** 10,000+ citizens per instance
- **API Response Time:** 95th percentile < 200ms
- **Database Query Time:** 95th percentile < 50ms
- **UI Render Time:** First contentful paint < 1.5s
- **Test Coverage:** >80% for simulation, >75% for client
- **Build Time:** < 5 minutes for CI pipeline

### Quality Metrics
- **Bug Rate:** < 1 critical bug per 1000 lines of code
- **Code Review Time:** < 2 business days average
- **Test Stability:** < 1% flaky test rate
- **Documentation Coverage:** 100% of public APIs

### Business Metrics
- **Time to MVP:** 16 weeks (end of Phase 4)
- **Development Velocity:** Consistent sprint velocity after week 8
- **Developer Satisfaction:** Positive feedback on tooling and workflow

## Conclusion

This design provides a solid foundation for SimCiv development, emphasizing modularity, testability, and clear separation of concerns. The database-centric architecture enables independent development of simulation and client components while maintaining a single source of truth for game state.

Key strengths of this approach:
1. **Flexibility:** Easy to add new clients or modify existing ones
2. **Testability:** Mock implementations enable isolated testing
3. **Scalability:** Clear separation allows independent scaling
4. **Maintainability:** Well-defined interfaces and responsibilities
5. **Debuggability:** Database provides visibility into all state changes

The technology choices balance performance requirements with development velocity and maintainability. Go provides excellent simulation performance while remaining approachable, and the Svelte/Node.js stack offers rapid UI development with modern tooling.

By following this design and the phased implementation plan, we can deliver a working MVP in 16 weeks while establishing patterns and infrastructure that will support long-term development and scaling.

---

*This design document is a living document and will be updated as implementation progresses and new insights are gained.*
