# SimCiv Design Options

## Executive Summary

This document evaluates four distinct implementation strategies for SimCiv, a grand strategy game that combines city-building simulation with competitive Civilization-style gameplay. Each option is analyzed across toolchains, target platforms, testing infrastructure, and their respective trade-offs.

**Recommendation**: Option 2 (Unity with C# + ECS) provides the best balance of development velocity, performance, and platform reach for SimCiv's ambitious simulation requirements.

---

## Option 1: Native C++ with Custom Engine

### Overview
Build SimCiv from scratch using C++ with custom rendering and simulation engines, leveraging industry-standard libraries for specific components.

### Toolchain
- **Language**: C++ (C++20 or later)
- **Graphics**: Vulkan or DirectX 12 (with fallback to OpenGL/DirectX 11)
- **Audio**: OpenAL or FMOD
- **Physics**: Custom lightweight simulation
- **UI**: Dear ImGui or custom solution
- **Networking**: Boost.Asio or custom UDP implementation
- **Build System**: CMake with vcpkg or Conan for dependencies
- **Version Control**: Git with Git LFS for binary assets

### Target Platforms
- **Primary**: Windows (x64), Linux (x64)
- **Secondary**: macOS (with significant additional effort)
- **Future**: Consoles (Xbox, PlayStation) with porting work

### Testing Infrastructure
- **Unit Testing**: Google Test (gtest) or Catch2
- **Performance Testing**: Google Benchmark
- **Integration Testing**: Custom test harness
- **CI/CD**: GitHub Actions for multi-platform builds
- **Memory Safety**: Valgrind (Linux), AddressSanitizer, Static analyzers (clang-tidy, cppcheck)
- **Profiling**: Tracy, Optick, or custom profiler integration

### Pros
1. **Maximum Performance**: Direct control over memory layout, CPU cache optimization, and SIMD operations critical for simulating millions of agents
2. **No Runtime Overhead**: Compiled to native machine code with zero garbage collection pauses
3. **Memory Efficiency**: Fine-grained control over memory allocation patterns for large-scale simulation
4. **Professional Standard**: AAA studios use C++ for performance-critical simulation games
5. **Long-term Viability**: No dependency on third-party engine licensing or sunset risks
6. **Deep Optimization**: Can optimize hot paths for specific CPU architectures
7. **Engine Understanding**: Complete control and understanding of all systems

### Cons
1. **Development Time**: 2-3x longer development cycle for basic features compared to engines
2. **Team Size Requirements**: Requires experienced C++ engineers; steep learning curve for contributors
3. **Platform Complexity**: Manual handling of platform-specific code, input, window management
4. **Tool Development**: Must build editor, asset pipeline, debugging tools from scratch
5. **Graphics Complexity**: Modern rendering requires significant expertise; fallback paths needed
6. **Initial Investment**: 6-12 months before a playable prototype
7. **Bug Surface Area**: More code means more potential for memory leaks, crashes, undefined behavior
8. **Limited Asset Ecosystem**: Can't leverage engine asset stores or community tools
9. **Multiplayer Complexity**: Networking, serialization, and anti-cheat require significant effort

### Estimated Timeline
- **Prototype**: 12-18 months (basic simulation + rendering)
- **Alpha**: 24-30 months (core gameplay features)
- **Beta**: 36-48 months (polish + multiplayer)

---

## Option 2: Unity with C# + Entity Component System (ECS)

### Overview
Use Unity game engine with its Data-Oriented Technology Stack (DOTS), including the Entity Component System (ECS), for high-performance simulation at scale.

### Toolchain
- **Engine**: Unity 2022 LTS or later
- **Language**: C# with Unity's ECS (DOTS)
- **Graphics**: Unity's Universal Render Pipeline (URP) or High Definition Render Pipeline (HDRP)
- **Physics**: Unity DOTS Physics
- **Networking**: Unity Netcode for Entities or Mirror
- **Build System**: Unity Cloud Build or local build pipeline
- **IDE**: Visual Studio, Visual Studio Code, or JetBrains Rider
- **Asset Management**: Unity Asset Database with version control integration

### Target Platforms
- **Primary**: Windows, macOS, Linux
- **Secondary**: iOS, Android (touch UI required)
- **Potential**: WebGL (browser-based), Consoles (Switch, Xbox, PlayStation)
- **Cloud**: Streaming via Unity Gaming Services

### Testing Infrastructure
- **Unit Testing**: Unity Test Framework (UTF) with NUnit
- **Performance Testing**: Unity Profiler, Memory Profiler, Frame Debugger
- **Play Mode Testing**: Automated play testing via UTF
- **CI/CD**: Unity Cloud Build, GitHub Actions with Unity
- **Code Coverage**: OpenCover or dotCover
- **Static Analysis**: Roslyn analyzers, SonarQube
- **Load Testing**: Custom tools for multiplayer stress testing

### Pros
1. **Proven Scalability**: Unity's ECS designed for millions of entities (demonstrated in various simulations)
2. **Rapid Prototyping**: Visual editor and prefab system accelerate iteration
3. **Rich Asset Store**: Thousands of tools, assets, and plugins available
4. **Platform Coverage**: Deploy to 20+ platforms with minimal code changes
5. **Established Pipeline**: Mature build, asset, and packaging systems
6. **Strong Documentation**: Extensive tutorials, documentation, and community resources
7. **Visual Debugging**: Inspector, Scene view, and profiling tools built-in
8. **Networking Solutions**: Multiple battle-tested networking frameworks
9. **Talent Pool**: Large community of Unity developers for hiring/contributions
10. **Modding Support**: Unity's architecture supports modding with AssetBundles and scripting
11. **ECS Performance**: DOTS provides near-native performance for simulation code
12. **Burst Compiler**: Generates highly optimized native code from C#

### Cons
1. **License Costs**: Runtime fees for games exceeding revenue thresholds (Unity Personal is free up to limits)
2. **Engine Overhead**: Some overhead compared to custom engines, though ECS mitigates this
3. **ECS Learning Curve**: Different paradigm from traditional Unity development
4. **DOTS Maturity**: Some DOTS systems still evolving; documentation gaps
5. **Black Box**: Limited access to engine source (though some is available)
6. **Update Risk**: Engine updates can introduce breaking changes
7. **Build Sizes**: Unity runtime adds baseline size to builds
8. **C# Limitations**: Garbage collection (though minimal in ECS/Burst code)

### Estimated Timeline
- **Prototype**: 3-6 months (basic simulation + UI)
- **Alpha**: 12-15 months (core features + multiplayer)
- **Beta**: 18-24 months (polish + all platforms)

---

## Option 3: Unreal Engine 5 with C++ and Mass Entity System

### Overview
Leverage Unreal Engine 5's Mass Entity framework for large-scale agent simulation, combined with Unreal's world-class rendering capabilities.

### Toolchain
- **Engine**: Unreal Engine 5.3 or later
- **Language**: C++ (Unreal flavor) with Blueprint visual scripting
- **Graphics**: Unreal's rendering engine (Lumen, Nanite)
- **Networking**: Unreal's replication system or custom solution
- **Mass Entity**: Built-in ECS-like system for large simulations
- **Build System**: Unreal Build Tool (UBT)
- **IDE**: Visual Studio, Visual Studio Code, or Rider
- **Source Control**: Perforce (recommended) or Git with LFS

### Target Platforms
- **Primary**: Windows, macOS, Linux
- **Secondary**: Consoles (PlayStation 5, Xbox Series X/S)
- **Potential**: iOS, Android (with optimization work)
- **Cloud**: Pixel Streaming for browser access

### Testing Infrastructure
- **Unit Testing**: Unreal's Automation Testing framework
- **Functional Testing**: Gauntlet testing framework
- **Performance Testing**: Unreal Insights, GPU profilers
- **CI/CD**: Jenkins, GitHub Actions with Unreal integration
- **Blueprint Testing**: Visual script unit tests
- **Network Testing**: Unreal's network profiler and simulation
- **Static Analysis**: Unreal's static analyzers, PVS-Studio

### Pros
1. **Visual Excellence**: Industry-leading graphics and rendering capabilities
2. **Mass Entity Framework**: Specifically designed for large-scale agent simulation
3. **Blueprint System**: Visual scripting enables rapid prototyping and designer autonomy
4. **Free Until Revenue**: 5% royalty only after $1M in revenue
5. **Source Access**: Full engine source code available
6. **Marketplace**: Large asset and plugin ecosystem
7. **Professional Tools**: Mature editor, debugging, and profiling tools
8. **Console Ready**: Excellent console support with platform-specific optimizations
9. **Community**: Large, professional community and extensive documentation
10. **Multiplayer Framework**: Robust replication and networking built-in

### Cons
1. **Complexity**: Unreal is massive and complex; steep learning curve
2. **Compilation Times**: C++ compilation in Unreal can be very slow (minutes for full rebuilds)
3. **Build Sizes**: Large engine results in large game builds (several GB baseline)
4. **Memory Requirements**: Development requires high-end hardware
5. **Overkill for 2D/Simple**: If SimCiv uses simpler graphics, Unreal's capabilities are wasted
6. **Blueprint Performance**: Visual scripts slower than C++ for performance-critical code
7. **Royalty Model**: 5% revenue share can become significant at scale
8. **Mobile Challenges**: More difficult to optimize for mobile platforms
9. **Update Frequency**: Major engine updates require careful migration planning

### Estimated Timeline
- **Prototype**: 6-9 months (learning curve + basic features)
- **Alpha**: 15-18 months (core systems + multiplayer)
- **Beta**: 24-30 months (full polish + optimization)

---

## Option 4: Web-First with Rust + WebAssembly + Three.js

### Overview
Build a modern web-first game using Rust compiled to WebAssembly for simulation logic, with Three.js for 3D rendering, enabling browser-based play with optional native builds.

### Toolchain
- **Core Language**: Rust (stable)
- **Simulation**: Rust with specs or bevy_ecs for entity component system
- **Graphics**: Three.js (JavaScript/TypeScript) or Babylon.js
- **Wasm Integration**: wasm-bindgen, wasm-pack
- **Frontend**: TypeScript/JavaScript with React or Svelte
- **Networking**: WebRTC for P2P, or WebSocket for client-server
- **Build System**: Cargo (Rust) + npm/pnpm (JavaScript)
- **Native Builds**: Tauri or Electron for desktop packaging

### Target Platforms
- **Primary**: Web browsers (Chrome, Firefox, Safari, Edge)
- **Secondary**: Desktop (Windows, macOS, Linux via Tauri)
- **Potential**: Mobile web browsers
- **Progressive**: PWA for installable web app

### Testing Infrastructure
- **Unit Testing**: Cargo test (Rust), Jest/Vitest (JavaScript)
- **Integration Testing**: wasm-bindgen-test for Wasm
- **Browser Testing**: Playwright or Cypress for E2E tests
- **Performance Testing**: Web performance APIs, custom benchmarks
- **CI/CD**: GitHub Actions with cross-browser testing
- **Code Quality**: Clippy (Rust linter), ESLint (JavaScript)
- **Type Safety**: TypeScript for frontend code
- **Memory Safety**: Rust's ownership system eliminates many bugs by design

### Pros
1. **Universal Access**: Play instantly in any modern browser, no installation
2. **Cross-Platform**: One codebase runs everywhere with web standards
3. **Rust Safety**: Memory safety and concurrency without garbage collection
4. **Fast Development**: Hot reload for rapid iteration
5. **Distribution**: Updates deployed instantly; no app store approval needed
6. **Cost Effective**: Static hosting is cheap (CDN + serverless functions)
7. **Web Integration**: Easy integration with web services, authentication, social features
8. **Modding Friendly**: JavaScript/Wasm modding with sandboxing
9. **Lower Barrier**: Web accessibility increases potential player base
10. **Modern Stack**: Cutting-edge technology with growing community
11. **Performance**: WebAssembly provides near-native performance
12. **Open Standards**: Built on open web standards, no vendor lock-in

### Cons
1. **Performance Ceiling**: Not as fast as native C++ for maximum complexity
2. **Browser Limitations**: Memory constraints, no direct GPU control, security restrictions
3. **Graphics Constraints**: Three.js less powerful than Unreal/Unity for advanced effects
4. **Offline Limitations**: Requires offline-first architecture for non-web play
5. **Wasm Maturity**: Some Rust libraries don't compile to Wasm yet
6. **Debugging Complexity**: Debugging across Rust/Wasm/JS boundaries can be tricky
7. **Mobile Performance**: Web performance on mobile browsers varies significantly
8. **Large Initial Load**: Wasm + assets require large initial download
9. **Limited Native Features**: Can't access some native APIs without wrapper
10. **Rust Learning Curve**: Steep learning curve for developers new to Rust
11. **Less Established**: Fewer examples of AAA-scale games using this stack
12. **Console Support**: Essentially impossible without major rearchitecture

### Estimated Timeline
- **Prototype**: 4-8 months (Rust + Web pipeline + basic sim)
- **Alpha**: 12-18 months (full features + multiplayer)
- **Beta**: 20-26 months (optimization + polish)

---

## Comparative Analysis

### Performance Comparison
| Option | Simulation Performance | Graphics Performance | Memory Efficiency | Scalability |
|--------|----------------------|---------------------|------------------|-------------|
| Option 1 (C++) | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent |
| Option 2 (Unity ECS) | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐⭐ Excellent |
| Option 3 (Unreal) | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Very Good |
| Option 4 (Rust+Wasm) | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐ Good |

### Development Velocity
| Option | Time to Prototype | Time to Alpha | Team Size | Contributor Accessibility |
|--------|------------------|---------------|-----------|-------------------------|
| Option 1 (C++) | 12-18 months | 24-30 months | 5-8 engineers | Low (C++ expertise) |
| Option 2 (Unity ECS) | 3-6 months | 12-15 months | 3-5 developers | High (C# common) |
| Option 3 (Unreal) | 6-9 months | 15-18 months | 4-6 developers | Medium (Unreal experience) |
| Option 4 (Rust+Wasm) | 4-8 months | 12-18 months | 3-5 developers | Medium (Rust learning curve) |

### Platform Support
| Option | Desktop | Mobile | Web | Consoles | Cloud Streaming |
|--------|---------|--------|-----|----------|----------------|
| Option 1 (C++) | ✅ Excellent | ❌ Major work | ❌ Not feasible | ⚠️ Possible with porting | ⚠️ Requires setup |
| Option 2 (Unity ECS) | ✅ Excellent | ✅ Good | ⚠️ Limited | ✅ Good | ✅ Unity services |
| Option 3 (Unreal) | ✅ Excellent | ⚠️ Challenging | ⚠️ Pixel streaming | ✅ Excellent | ✅ Built-in |
| Option 4 (Rust+Wasm) | ✅ Good (Tauri) | ⚠️ Web only | ✅ Excellent | ❌ Not feasible | ✅ Natural fit |

### Cost Analysis
| Option | Upfront Cost | Runtime Cost | Licensing | Infrastructure |
|--------|-------------|--------------|-----------|----------------|
| Option 1 (C++) | Low (open source) | None | None | Self-hosted |
| Option 2 (Unity ECS) | Low (free tier) | Revenue share | Per-install/revenue | Unity services optional |
| Option 3 (Unreal) | Free | 5% after $1M | Revenue share | Self-hosted |
| Option 4 (Rust+Wasm) | Low (open source) | None | None | CDN + serverless |

---

## Detailed Recommendation: Option 2 (Unity with ECS)

### Why Unity + ECS is the Best Choice

For SimCiv's specific requirements, **Unity with Entity Component System (DOTS)** provides the optimal balance across all critical factors:

#### 1. Performance Meets Requirements
- **Mass Simulation**: Unity's DOTS is specifically designed to handle millions of entities, which aligns perfectly with SimCiv's need to simulate thousands to millions of individual humans
- **Burst Compiler**: Generates highly optimized native code that rivals hand-tuned C++ for CPU-intensive simulation tasks
- **Job System**: Provides easy multithreading for parallel simulation of independent agents
- **Data-Oriented Design**: Memory layout optimizations for cache efficiency

#### 2. Development Velocity Critical for Success
- **Rapid Iteration**: 3-6 month prototype vs. 12-18 months in C++ means faster validation of core gameplay
- **Visual Tools**: Unity editor accelerates development of UI, map editing, and scenario creation
- **Asset Pipeline**: Built-in asset management and pipeline for art and audio integration
- **Quick Pivots**: Faster to experiment with different simulation approaches and gameplay mechanics

#### 3. Platform Flexibility Future-Proofs the Project
- **Start Desktop, Expand Anywhere**: Begin with PC, easily port to consoles, mobile, or cloud later
- **Market Adaptation**: Can respond to market opportunities (e.g., Switch port, mobile version)
- **WebGL Option**: Potential for browser-based demo or free version

#### 4. Team and Community Advantages
- **Accessibility**: Large pool of C# developers can contribute vs. specialized C++ engineers
- **Learning Resources**: Extensive documentation, tutorials, and Stack Overflow support
- **Faster Onboarding**: New team members can be productive within weeks
- **Open Source Contributors**: Lower barrier for community contributions

#### 5. Cost-Effectiveness
- **Free Development**: Unity Personal is free for small teams and projects under revenue threshold
- **Predictable Costs**: Clear licensing terms with free tier for early development
- **Shorter Timeline**: 18-24 months to beta vs. 36-48 months means lower burn rate
- **Less Infrastructure**: Built-in services reduce need for custom tools and infrastructure

#### 6. Proven Track Record for Similar Games
- **Cities: Skylines II**: Large-scale city simulation (though not using full DOTS yet)
- **Megacity Demo**: Unity's tech demo showing 5 million entities with DOTS
- **Beat Saber**: Shows Unity's capability for polished, successful games
- **RimWorld Console**: Complex simulation successfully ported across platforms

### Implementation Strategy with Unity

#### Phase 1: Foundation (Months 1-6)
1. **Prototype Core Simulation**
   - Implement basic agent behavior using DOTS
   - Create simple resource and decision-making systems
   - Test scalability with 10k+ agents
   - Validate performance targets

2. **Basic Rendering & UI**
   - Strategic map view with zoom
   - Simple 2D or 3D representation of cities
   - Basic policy UI
   - Data visualization overlays

3. **Tech Tree Prototype**
   - Design and implement basic technology progression
   - Link technologies to agent capabilities
   - Test tech unlock gameplay loop

#### Phase 2: Depth (Months 7-15)
1. **Enhanced AI Systems**
   - Advanced agent decision-making
   - City growth algorithms
   - Trade route formation
   - Military organization

2. **Competitive Mechanics**
   - Multiple AI civilizations
   - Basic combat system
   - Territory control
   - Victory conditions

3. **Multiplayer Foundation**
   - Client-server architecture
   - Synchronization strategy
   - Basic networking with Unity Netcode

#### Phase 3: Polish (Months 16-24)
1. **Visual & Audio Polish**
   - Improved graphics and animations
   - Audio design and music
   - UI/UX refinement
   - Accessibility features

2. **Performance Optimization**
   - Profile and optimize hot paths
   - LOD systems for distant elements
   - Memory optimization
   - Target 60 FPS with 100k+ agents

3. **Testing & Balance**
   - Automated testing suite
   - Balance gameplay across strategies
   - Bug fixing and stability
   - Multiplayer stress testing

### Risk Mitigation

#### ECS Learning Curve
- **Mitigation**: Start with Unity's tutorials and sample projects; prototype in traditional Unity first if needed, then migrate to ECS for performance-critical systems
- **Fallback**: Hybrid approach using traditional GameObject for UI/non-critical systems, ECS for simulation core

#### Unity Licensing Changes
- **Mitigation**: Monitor Unity's business model; engine is open-source enough to fork if necessary
- **Fallback**: If licensing becomes untenable, can port to Godot (C#/.NET support) or custom engine

#### DOTS Maturity
- **Mitigation**: Use Unity LTS versions; only adopt DOTS features that are production-ready
- **Fallback**: Traditional GameObject approach can handle smaller-scale simulation if DOTS has issues

#### Performance Targets
- **Mitigation**: Early performance testing and profiling; establish clear performance budgets
- **Fallback**: If targets can't be met, reduce scope (fewer simultaneous agents, smaller maps) or consider Option 1 (C++)

### Success Criteria for Unity Choice

Unity + ECS should be confirmed as the right choice if:
- ✅ Prototype achieves 50k+ simulated agents at 30+ FPS within 6 months
- ✅ Core gameplay loop feels engaging in prototype
- ✅ Team can develop comfortably with Unity and ECS
- ✅ Asset pipeline and tooling accelerate development
- ✅ No major licensing or business model concerns

If these criteria are not met, consider pivoting to Option 1 (C++) for maximum performance or Option 4 (Rust+Wasm) for maximum accessibility.

---

## Alternative Recommendations by Priority

### If Performance is Absolutely Critical
**Choose Option 1 (C++)** if profiling shows Unity cannot achieve performance targets:
- Simulation of 500k+ agents simultaneously
- Sub-10ms frame times with maximum simulation density
- Memory footprint must be under 2GB for entire game state

### If Accessibility and Distribution are Top Priority
**Choose Option 4 (Rust+Wasm)** if the goal is maximum player reach:
- Instant browser-based play without installation
- Zero-friction onboarding
- Global accessibility without platform restrictions
- Lower barrier to try the game

### If Visual Fidelity is the Primary Differentiator
**Choose Option 3 (Unreal)** if SimCiv's success depends on cutting-edge graphics:
- Photo-realistic city visuals
- Advanced lighting and effects
- Next-gen console target from day one
- Marketing heavily emphasizes visual spectacle

---

## Conclusion

Unity with Entity Component System (DOTS) represents the optimal choice for SimCiv because it:

1. **Meets performance requirements** for large-scale simulation
2. **Minimizes time-to-market** with 18-24 month timeline to beta
3. **Maximizes platform reach** for future growth
4. **Reduces team complexity** with accessible C# development
5. **Provides proven tooling** for rapid iteration
6. **Offers cost-effective licensing** during early development
7. **Supports modding and extensibility** naturally
8. **Balances technical risk** with established technology

The simulation-first nature of SimCiv requires high performance, but not at the cost of development velocity. Unity's DOTS provides both, making it the pragmatic choice for a team building an ambitious strategy game in a reasonable timeframe.

Start with Unity, validate the core simulation and gameplay, and be prepared to pivot if specific requirements emerge that Unity cannot satisfy. The flexibility of this approach, combined with Unity's proven capabilities, makes it the recommended path forward for SimCiv.

---

*Document Version: 1.0*
*Last Updated: October 2025*
