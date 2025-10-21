# SimCiv Design Options

## Executive Summary

This document outlines four distinct implementation strategies for SimCiv, a multiplayer civilization simulation game. Each option addresses the core architectural challenge: running a persistent server-side simulation while providing responsive, modern clients for iOS, Android, and desktop platforms.

**Key Requirements:**
- **Primary Platforms**: iOS and Android for casual, on-the-go gameplay
- **Secondary Platforms**: Windows, Linux, and macOS for serious players
- **Server-Side Simulation**: Continuous simulation running 24/7, independent of player presence
- **Client Purpose**: Slick, modern UI for short interaction sessions and push notifications
- **Scale**: Support thousands to millions of simulated humans across multiple civilizations

**Recommended Approach**: Option 3 (Rust/Go Backend with React Native/Flutter)

---

## Option 1: Node.js/TypeScript Full Stack with React Native

### Architecture Overview

**Backend Stack:**
- **Server**: Node.js with TypeScript
- **Framework**: NestJS or Express with TypeScript
- **Database**: PostgreSQL for game state, Redis for real-time data
- **Game Loop**: Event-driven architecture with worker threads for simulation
- **Real-time Communication**: Socket.io or WebSockets

**Frontend Stack:**
- **Mobile**: React Native with TypeScript
- **Desktop**: Electron with React
- **State Management**: Redux or Recoil
- **UI Framework**: React Native Paper or Native Base

### Toolchain

**Development:**
- TypeScript compiler across all platforms
- Jest for testing (unit and integration)
- ESLint and Prettier for code quality
- npm/yarn for package management

**Build & Deployment:**
- GitHub Actions for CI/CD
- Docker for backend containerization
- Expo for React Native build management
- Electron Builder for desktop distributions
- TestFlight (iOS) and Google Play Beta (Android) for mobile testing

**Testing Infrastructure:**
- Jest for unit tests (backend and frontend)
- Supertest for API testing
- React Native Testing Library
- Detox for E2E mobile testing
- Cypress for E2E web/desktop testing
- k6 or Artillery for load testing

### Target Platforms

- **iOS**: React Native (iOS 13+)
- **Android**: React Native (API 21+)
- **Windows**: Electron (Windows 10+)
- **Linux**: Electron (Ubuntu 20.04+, other distros)
- **macOS**: Electron (macOS 10.13+)

### Pros

1. **Unified Language**: TypeScript everywhere reduces context switching
2. **Code Sharing**: Share business logic, types, and utilities between client and server
3. **Developer Pool**: Large community and extensive hiring options
4. **Rapid Development**: Rich ecosystem of libraries and tools
5. **Cross-Platform**: Single codebase for iOS, Android, and desktop
6. **Hot Reload**: Fast development iteration with hot module replacement
7. **JSON-Native**: Natural fit for JSON-based APIs and WebSocket communication
8. **Easy Debugging**: Chrome DevTools work across stack

### Cons

1. **Performance Limitations**: Node.js single-threaded nature limits simulation throughput
2. **Memory Intensive**: JavaScript/TypeScript can be memory-hungry for large simulations
3. **CPU-Bound Work**: Poor performance for intensive calculations compared to compiled languages
4. **Electron Bloat**: Desktop apps will be larger and more resource-intensive
5. **Scaling Challenges**: May need complex architecture (microservices, workers) to scale simulation
6. **Battery Life**: React Native can impact mobile battery life
7. **Native Features**: Limited access to platform-specific optimizations
8. **GC Pauses**: Garbage collection can cause simulation hiccups

### Best For

Teams prioritizing rapid development and time-to-market over raw performance, with strong JavaScript/TypeScript expertise.

---

## Option 2: Unity Game Engine with C#

### Architecture Overview

**Backend Stack:**
- **Server**: Unity Headless Server or ASP.NET Core
- **Game Logic**: Unity for both client and server (shared codebase)
- **Database**: PostgreSQL or MongoDB
- **Networking**: Unity Netcode, Mirror, or custom solution
- **Background Services**: ASP.NET Core for non-game services

**Frontend Stack:**
- **All Platforms**: Unity with C#
- **UI**: Unity UI Toolkit or TextMeshPro
- **Platform Services**: Unity Mobile Notifications, In-App Purchases

### Toolchain

**Development:**
- Unity Editor (2022 LTS recommended)
- Visual Studio or Rider
- Unity Test Framework
- Unity Profiler for performance analysis

**Build & Deployment:**
- Unity Cloud Build or local build automation
- Docker for headless server deployment
- GitHub Actions with Unity Builder action
- App Store Connect and Google Play Console for mobile

**Testing Infrastructure:**
- Unity Test Framework (Play Mode and Edit Mode tests)
- Unity Performance Testing Extension
- Unity Multiplayer PlayMode Testing
- Jenkins or CircleCI for CI/CD
- Custom load testing with headless clients

### Target Platforms

- **iOS**: Native build (iOS 13+)
- **Android**: Native build (API 21+)
- **Windows**: Native build (Windows 10+)
- **Linux**: Native build (Ubuntu 18.04+)
- **macOS**: Native build (macOS 10.13+)

### Pros

1. **Game-Focused**: Purpose-built for game development
2. **Excellent Tooling**: Visual editor, profiler, and debugging tools
3. **Cross-Platform Native**: True native builds for all platforms
4. **Physics Engine**: Built-in physics if needed for simulation
5. **Code Reuse**: Share simulation logic between client and server
6. **Asset Pipeline**: Powerful asset management and optimization
7. **Performance**: C# with IL2CPP compiles to native code
8. **Visual Development**: Scene editor and visual scripting options
9. **Large Community**: Extensive tutorials, assets, and support
10. **Proven at Scale**: Used for many successful multiplayer games

### Cons

1. **Learning Curve**: Unity-specific patterns and workflows to learn
2. **License Costs**: Unity Pro licenses required for revenue > $100k/year
3. **Headless Limitations**: Unity server mode is less mature than dedicated server frameworks
4. **Asset Size**: Unity builds tend to be large (100MB+ for mobile)
5. **Server Overhead**: Running Unity headless uses more resources than minimal servers
6. **UI Development**: Unity UI is less flexible than web-based approaches
7. **Hot Reload Limited**: Slower iteration than web-based hot reload
8. **Vendor Lock-in**: Heavy dependency on Unity ecosystem
9. **Non-Game Services**: Awkward for traditional web services (auth, notifications)

### Best For

Teams with Unity expertise wanting to maximize code reuse between client and server, prioritizing game-specific features.

---

## Option 3: Rust/Go Backend with React Native/Flutter

### Architecture Overview

**Backend Stack:**
- **Core Simulation**: Rust for performance-critical simulation engine
- **API Layer**: Go (or Rust with Actix-web) for REST/GraphQL APIs
- **Database**: PostgreSQL for persistent state, Redis for caching
- **Message Queue**: NATS or RabbitMQ for event distribution
- **Real-time**: WebSocket server in Go/Rust

**Frontend Stack:**
- **Mobile Option A**: React Native with TypeScript
- **Mobile Option B**: Flutter with Dart
- **Desktop**: Tauri (Rust) or Electron
- **State Management**: Redux/MobX (React Native) or Provider/Riverpod (Flutter)

### Toolchain

**Development:**
- Rust toolchain (cargo, rustfmt, clippy)
- Go toolchain (go build, go fmt, go vet)
- Node.js/Dart SDK for frontend
- Docker and Docker Compose for local development

**Build & Deployment:**
- GitHub Actions or GitLab CI
- Multi-stage Docker builds
- Kubernetes for orchestration (optional)
- Terraform for infrastructure as code
- CodePush or Over-The-Air updates for mobile

**Testing Infrastructure:**
- Rust: cargo test, proptest for property testing, criterion for benchmarking
- Go: go test, testify, gomock
- Frontend: Jest/Testing Library (React Native) or Flutter test framework
- Integration: Custom test harness with Docker Compose
- Load Testing: k6 or Gatling
- Chaos Testing: Chaos Monkey for resilience

### Target Platforms

- **iOS**: React Native or Flutter (iOS 13+)
- **Android**: React Native or Flutter (API 21+)
- **Windows**: Tauri or Electron (Windows 10+)
- **Linux**: Tauri or native (Ubuntu 20.04+)
- **macOS**: Tauri or Electron (macOS 10.15+)

### Pros

1. **Performance**: Rust provides near-C++ performance for simulation
2. **Memory Safety**: Rust eliminates entire classes of bugs (no null, no data races)
3. **Concurrency**: Excellent support for parallel simulation processing
4. **Resource Efficiency**: Low memory footprint and CPU usage
5. **Scalability**: Can handle thousands of players per server instance
6. **Modern UX**: React Native/Flutter provide excellent mobile experiences
7. **Type Safety**: Strong typing across entire stack
8. **Cost Effective**: Fewer servers needed due to efficiency
9. **Battery Friendly**: Native performance helps mobile battery life
10. **Future Proof**: Rust adoption growing, especially for infrastructure
11. **Hot Reload**: Fast frontend iteration with React Native/Flutter
12. **Separation of Concerns**: Clear boundaries between simulation and presentation

### Cons

1. **Learning Curve**: Rust has steep learning curve (borrow checker)
2. **Slower Initial Development**: Rust compilation can be slow
3. **Split Tech Stack**: Different languages for backend and frontend
4. **Smaller Talent Pool**: Fewer developers with Rust expertise
5. **Ecosystem Maturity**: Rust game/simulation libraries less mature than C++/C#
6. **Debugging Complexity**: Harder to debug across language boundaries
7. **Integration Overhead**: More work to integrate disparate technologies
8. **Build Complexity**: More complex CI/CD pipeline

### Best For

Teams prioritizing long-term performance, scalability, and operational costs, willing to invest in learning Rust.

---

## Option 4: Microservices with Polyglot Architecture

### Architecture Overview

**Backend Stack:**
- **Simulation Engine**: C++ or Rust for core simulation
- **Game Services**: Go or Java (Spring Boot) for business logic
- **API Gateway**: Kong or Envoy
- **Authentication**: Keycloak or Auth0
- **Databases**: PostgreSQL (game state), MongoDB (player data), Redis (sessions)
- **Event Streaming**: Apache Kafka for event sourcing
- **Service Mesh**: Istio or Linkerd (for large scale)

**Frontend Stack:**
- **Mobile**: Native (Swift for iOS, Kotlin for Android) or Flutter
- **Desktop**: Qt (C++) or Electron
- **Admin Dashboard**: React or Vue.js web app

### Toolchain

**Development:**
- Language-specific toolchains (CMake for C++, cargo for Rust, etc.)
- Docker and Docker Compose
- Kubernetes (Minikube or Kind) for local development
- gRPC for inter-service communication
- Protocol Buffers for data serialization

**Build & Deployment:**
- Jenkins X or Argo CD for GitOps
- Helm charts for Kubernetes deployment
- Service mesh for traffic management
- Prometheus and Grafana for monitoring
- ELK or Loki stack for logging
- Jaeger or Zipkin for distributed tracing

**Testing Infrastructure:**
- Service-specific unit tests (language-dependent)
- Contract testing with Pact
- Integration tests with Docker Compose
- E2E tests with custom test framework
- Chaos engineering with Chaos Mesh
- Performance testing with Gatling
- Postman or Newman for API testing

### Target Platforms

- **iOS**: Native Swift or Flutter (iOS 13+)
- **Android**: Native Kotlin or Flutter (API 21+)
- **Windows**: Qt or Electron (Windows 10+)
- **Linux**: Qt or native (Ubuntu 20.04+)
- **macOS**: Qt or Electron (macOS 10.15+)

### Pros

1. **Best Tool for Job**: Use optimal language/framework for each service
2. **Scalability**: Independent scaling of services
3. **Team Autonomy**: Teams can work independently on services
4. **Resilience**: Failure isolation between services
5. **Performance**: C++/Rust simulation engine for maximum performance
6. **Native Clients**: Optimal user experience on each platform
7. **Technology Evolution**: Easier to adopt new technologies incrementally
8. **Enterprise Grade**: Battle-tested patterns for large systems
9. **Organizational Scaling**: Supports multiple teams effectively
10. **Monitoring**: Rich observability with service mesh

### Cons

1. **Complexity**: Significantly more complex architecture and operations
2. **Infrastructure Overhead**: Requires Kubernetes, service mesh, monitoring
3. **Development Overhead**: More boilerplate and inter-service coordination
4. **Debugging Difficulty**: Distributed debugging is challenging
5. **Network Latency**: Inter-service communication adds latency
6. **Data Consistency**: Distributed data management is complex
7. **Operational Expertise**: Requires DevOps/SRE expertise
8. **Cost**: Higher infrastructure and operational costs
9. **Over-Engineering**: May be overkill for early stages
10. **Development Velocity**: Slower initial development
11. **Testing Complexity**: End-to-end testing is difficult
12. **Team Size**: Requires larger team to manage effectively

### Best For

Large organizations with multiple teams, expecting massive scale, and with significant DevOps expertise.

---

## Comparative Analysis

### Performance Comparison

| Aspect | Option 1 (Node.js) | Option 2 (Unity) | Option 3 (Rust/Go) | Option 4 (Microservices) |
|--------|-------------------|------------------|-------------------|--------------------------|
| Simulation Speed | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Memory Efficiency | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Network Performance | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Client Responsiveness | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Battery Life (Mobile) | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### Development Experience

| Aspect | Option 1 | Option 2 | Option 3 | Option 4 |
|--------|----------|----------|----------|----------|
| Learning Curve | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Development Speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Code Reusability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Debugging Ease | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Hot Reload | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

### Operational Characteristics

| Aspect | Option 1 | Option 2 | Option 3 | Option 4 |
|--------|----------|----------|----------|----------|
| Infrastructure Cost | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Operational Complexity | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| Scalability | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Monitoring/Observability | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### Team & Business Fit

| Aspect | Option 1 | Option 2 | Option 3 | Option 4 |
|--------|----------|----------|----------|----------|
| Hiring Difficulty | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Time to Market | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| License Costs | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Long-term Maintenance | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## Recommendation: Option 3 (Rust/Go Backend with React Native/Flutter)

### Why Option 3 is the Best Choice

After careful analysis, **Option 3** emerges as the optimal solution for SimCiv, balancing performance, development experience, and long-term sustainability.

#### Core Rationale

1. **Performance Requirements Are Critical**
   - SimCiv needs to simulate thousands to millions of individual humans continuously
   - The simulation runs 24/7 regardless of player presence
   - Rust's performance and memory safety make it ideal for this compute-intensive workload
   - Lower server costs due to higher efficiency directly impacts long-term viability

2. **Server-Client Separation is Natural**
   - The architecture naturally separates concerns: complex simulation on server, lightweight UI on client
   - React Native or Flutter provide excellent mobile-first experiences
   - No need to run game engine on server (unlike Unity)
   - Clear API boundaries between simulation and presentation

3. **Mobile-First Design**
   - React Native/Flutter are purpose-built for mobile
   - Native performance and look-and-feel on iOS and Android
   - Excellent developer experience with hot reload
   - Notifications and background tasks are first-class features

4. **Operational Efficiency**
   - Rust's low resource usage means fewer servers and lower AWS/cloud costs
   - This is crucial for a game that runs 24/7 with or without players
   - A single Rust server can handle what might require 5-10 Node.js servers
   - At scale, this represents significant cost savings

5. **Technical Risk Mitigation**
   - Memory safety eliminates entire bug classes (critical for 24/7 service)
   - Strong type systems (Rust + TypeScript/Dart) catch errors at compile time
   - No runtime surprises from garbage collection pauses
   - Excellent concurrency primitives for parallel simulation

6. **Ecosystem Maturity**
   - Rust backend: Actix-web, Tokio, SQLx are production-ready
   - React Native: Used by Facebook, Microsoft, Tesla
   - Flutter: Backed by Google, growing rapidly
   - Both frontend options have mature tooling and libraries

7. **Developer Experience Balance**
   - Frontend remains productive with modern web/mobile development
   - Rust learning curve is investment in long-term code quality
   - Go API layer (if used) provides gentle on-ramp for backend features
   - Team can scale skills gradually

#### Implementation Roadmap

**Phase 1: Foundation (Months 1-3)**
- Set up Rust simulation engine core
- Design data models and API contracts
- Create basic React Native or Flutter client
- Establish CI/CD pipeline
- Implement authentication and basic matchmaking

**Phase 2: Core Features (Months 4-6)**
- Implement citizen simulation and AI
- Build city growth and resource systems
- Add technology tree progression
- Create policy and decision-making UI
- Implement push notifications

**Phase 3: Multiplayer (Months 7-9)**
- Add multiple civilization support
- Implement real-time updates via WebSockets
- Build diplomacy and interaction systems
- Add combat mechanics
- Create leaderboards and achievements

**Phase 4: Polish & Scale (Months 10-12)**
- Performance optimization and profiling
- UI/UX refinement based on testing
- Load testing and horizontal scaling
- Desktop client development (Tauri)
- Beta testing with real users

#### Technology Decisions

**Backend:**
- **Simulation Core**: Rust with Tokio for async runtime
- **Web Framework**: Actix-web or Axum
- **Database**: PostgreSQL with Diesel or SQLx
- **Cache**: Redis for session management and real-time data
- **Message Queue**: NATS for event distribution between services
- **Search**: Elasticsearch for player/civilization search (optional)

**Frontend:**
- **Recommendation**: Start with React Native for code sharing with potential web version
- **Alternative**: Flutter if team prefers or needs specific performance characteristics
- **State Management**: Redux Toolkit with RTK Query for React Native
- **Navigation**: React Navigation or Flutter Navigator
- **UI Components**: React Native Paper or Flutter Material

**Infrastructure:**
- **Hosting**: AWS, GCP, or Digital Ocean
- **Container Orchestration**: Kubernetes or Docker Swarm
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Loki or ELK stack
- **APM**: Sentry for error tracking

#### Alternative Scenarios

**If Team Has Strong Unity Experience:**
Consider Option 2, but be prepared for higher server costs and complexity of running Unity headless servers at scale.

**If Time-to-Market is Critical (< 6 months to MVP):**
Consider Option 1 with Node.js, accepting that you'll likely need to rewrite the simulation engine later as you scale.

**If Building for Massive Scale from Day One (100K+ concurrent users):**
Consider Option 4, but only if you have dedicated DevOps team and significant infrastructure budget.

### Risks and Mitigations

#### Risk 1: Rust Learning Curve
**Mitigation:**
- Start with smaller Rust team, expand gradually
- Invest in training and pair programming
- Use Go for non-critical services to ease transition
- Leverage Rust consulting for initial architecture

#### Risk 2: Frontend Technology Choice (React Native vs Flutter)
**Mitigation:**
- Build proof-of-concept in both to evaluate
- Consider team background and preferences
- Both are viable; decision is less critical than backend choice
- Can switch frontend more easily than backend

#### Risk 3: Scaling WebSocket Connections
**Mitigation:**
- Design for horizontal scaling from start
- Use Redis for pub/sub across instances
- Implement connection pooling and rate limiting
- Consider using dedicated WebSocket gateway service

#### Risk 4: Cross-Platform Desktop Support
**Mitigation:**
- Focus on mobile first (80% of users expected)
- Use Tauri for lightweight desktop builds
- Desktop can be built later if needed
- Web version via React can serve desktop initially

### Success Metrics

**Technical Metrics:**
- Simulation handles 1M+ simulated humans per server
- 95th percentile API latency < 100ms
- Mobile app size < 50MB
- Client FPS > 60 on mid-range devices
- Server uptime > 99.9%

**Business Metrics:**
- Time to MVP: 6-8 months
- Server costs: < $0.10 per daily active user per month
- Development velocity: 2-week sprint cycles
- Bug rate: < 1 critical bug per 1000 lines of code
- Team growth: Add 1-2 engineers per quarter

### Conclusion

Option 3 represents the optimal balance of performance, developer experience, operational efficiency, and long-term sustainability for SimCiv. While it requires investment in learning Rust, the payoff in server efficiency, reliability, and scalability makes it the clear winner for a persistent, simulation-heavy multiplayer game.

The separation between a high-performance backend and modern mobile-first frontend aligns perfectly with SimCiv's requirements: continuous server-side simulation with short-burst client interactions. This architecture will scale from initial prototype through to millions of players while maintaining reasonable operational costs.

---

## Appendix: Technology Deep Dives

### A. Rust for Game Simulation

**Why Rust Excels for SimCiv:**

1. **Zero-Cost Abstractions**: Write high-level code that compiles to machine code as efficient as hand-written C
2. **Fearless Concurrency**: Process multiple civilizations in parallel without data races
3. **Memory Safety**: No null pointers, no buffer overflows, no use-after-free bugs
4. **Predictable Performance**: No garbage collection pauses interrupting simulation
5. **Modern Tooling**: Cargo, rustfmt, clippy provide excellent developer experience

**Relevant Rust Crates:**
- `tokio`: Async runtime for server
- `actix-web` or `axum`: Web framework
- `serde`: Serialization/deserialization
- `sqlx` or `diesel`: Database access
- `redis`: Redis client
- `specs` or `bevy_ecs`: Entity Component System for game logic
- `rayon`: Data parallelism for simulation
- `parking_lot`: High-performance synchronization primitives

### B. React Native vs Flutter Comparison

**React Native Advantages:**
- Larger ecosystem and community
- JavaScript/TypeScript familiar to web developers
- Easier to share code with potential web version
- Over-the-air updates with CodePush
- More third-party libraries available

**Flutter Advantages:**
- Better performance (compiled to native code)
- More consistent UI across platforms
- Excellent widget system
- Better animation capabilities
- Faster rendering (Skia engine)
- Single codebase for mobile, web, and desktop

**Recommendation for SimCiv:**
React Native if team has web development background or needs web version. Flutter if performance and consistent UI are top priorities.

### C. Database Architecture Considerations

**Recommended Approach:**

```
PostgreSQL (Primary Database):
- Player accounts and authentication
- Civilization state and configuration
- Historical game data
- Leaderboards and achievements

Redis (Cache & Real-time):
- Active game sessions
- Real-time simulation state
- WebSocket connection registry
- Rate limiting and locks

Optional: Time-Series Database (TimescaleDB or InfluxDB):
- Simulation metrics over time
- Player activity analytics
- Performance monitoring
```

### D. API Design Patterns

**REST API for CRUD Operations:**
- GET /civilizations/:id
- POST /civilizations/:id/policies
- GET /players/:id/notifications

**GraphQL for Complex Queries:**
- Flexible data fetching
- Reduced over-fetching
- Real-time subscriptions

**WebSocket for Real-time Updates:**
- Simulation state changes
- Multiplayer events
- Push notifications

**Recommendation:** Start with REST + WebSocket, add GraphQL if complex querying needs arise.

### E. Testing Strategy

**Unit Tests:**
- Rust: `cargo test` with property-based testing using `proptest`
- Frontend: Jest with React Testing Library

**Integration Tests:**
- API tests with `reqwest` in Rust
- Database tests with test containers
- End-to-end client tests with Detox (React Native) or Flutter Driver

**Performance Tests:**
- Benchmark simulation with `criterion` in Rust
- Load test APIs with k6
- Profile with `perf` and flamegraphs

**Chaos Testing:**
- Random service failures
- Network latency injection
- Database connection drops

---

*This document will be updated as the project evolves and implementation decisions are made.*
