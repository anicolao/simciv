# SimCiv Local Development Improvements Design
## Single Command Development Environment Setup

### Document Status
**Status:** Implemented  
**Last Updated:** 2025-12-17  
**Purpose:** Design specification for simplifying local development environment setup  
**Related Documents:** 
- [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) - Current development setup instructions
- [bin/e2e-setup](../bin/e2e-setup) - Existing E2E test setup script
- [bin/mongo](../bin/mongo) - MongoDB management script

---

## Executive Summary

This document specifies the design for a streamlined local development environment setup system that reduces the complexity of starting and managing multiple SimCiv services. The proposed solution introduces a single command interface that launches, monitors, and provides easy access to all required development servers using terminal multiplexing.

**Key Features:**
- Single command to start all development servers (MongoDB, Node.js server, Go engine, Vite)
- Individual terminal sessions for each service via tmux windows
- Easy inspection of logs via subcommand interface
- Graceful shutdown of all services
- Health checks and startup verification
- Clear status reporting

This design maintains compatibility with the existing Nix-based development environment while significantly improving developer experience.

---

## Problem Statement

### Current Pain Points

1. **Complex Startup Process**: Developers must remember and execute multiple commands in separate terminal windows to get a working development environment:
   - Start MongoDB: `mongo start`
   - Start Node.js server: `npm run dev`
   - Build and start Go engine: `cd simulation && go build -o engine main.go && ./engine`
   - Start Vite dev server: `npm run dev:client`

2. **Terminal Management Overhead**: Each service requires its own terminal window or tab, leading to:
   - Cluttered terminal workspace
   - Difficulty tracking which service is which
   - Hard to monitor all logs simultaneously
   - No easy way to check if all services are running

3. **Inconsistent State**: When stopping work, developers must:
   - Remember to stop all services
   - Hunt down processes if terminals were closed
   - Risk leaving zombie processes running

4. **Onboarding Friction**: New developers face a steep learning curve:
   - Must read extensive documentation to understand startup sequence
   - Unclear which services are required vs optional
   - No visibility into what's running or failing

5. **Development Interruptions**: Common scenarios that break flow:
   - Forgot to start MongoDB → cryptic connection errors
   - Engine not running → game functionality fails silently
   - Server not running → 404 errors
   - No clear way to check "is everything running?"

### Goals

The proposed solution aims to:

1. **Reduce startup to a single command** that handles all service initialization
2. **Provide transparent log access** through named terminal sessions
3. **Enable easy service inspection** via simple attach commands
4. **Implement health checking** to verify all services are operational
5. **Support graceful shutdown** that cleans up all processes
6. **Maintain debugging capabilities** by preserving individual service access
7. **Integrate seamlessly** with existing tooling (Nix, existing scripts)

---

## Proposed Solution

### Architecture Overview

The solution introduces a single unified script in the `bin/` directory:

**`dev`**: Single entry point with subcommands (similar to the existing `mongo` script):
1. **`dev start`**: Start all development services
2. **`dev stop`**: Graceful shutdown of all development services
3. **`dev status`**: Check status of all services
4. **`dev attach <service>`**: Attach to a specific service's session for log viewing

This follows the pattern established by the existing `bin/mongo` script, providing a consistent interface.

### Terminal Multiplexer Choice: tmux

**Selection Rationale:**

After evaluating available options:
- **tmux**: ✅ Widely available, powerful session management, excellent for our use case
- **screen**: Available but less intuitive for session management
- **dtach**: Lightweight but lacks built-in multiplexing (would need multiple dtach instances)

**Decision: Use tmux as the primary solution** because:
1. Already available in the development environment
2. Native support for multiple windows within a single session
3. Easy to list, attach, and detach from sessions
4. Excellent for organizing related services in one session
5. Well-documented and familiar to most developers
6. Supports both attached and detached modes
7. Can display multiple panes simultaneously if desired

### Session Organization Strategy

**Single tmux session with multiple windows approach:**

```
Session: simciv-dev
├── Window 0: mongodb    (runs MongoDB service)
├── Window 1: server     (runs Node.js/Express server)
├── Window 2: engine     (runs Go simulation engine)
└── Window 3: vite       (runs Vite dev server with HMR)
```

**Benefits of this approach:**
- All services grouped under one logical session
- Easy to see all services: `tmux list-windows -t simciv-dev`
- Can attach to session and switch between windows
- Can view all simultaneously with tmux split panes
- Single session name to remember

**Alternative considered (rejected):** Separate tmux sessions per service
- **Rejected because:** Creates more clutter in `tmux ls` output, harder to manage as a unit, no benefit over windows within a single session

---

## Technical Design

### Script: `dev`

**Purpose:** Unified interface for managing all development services

**Signature:**
```bash
#!/usr/bin/env bash
# Usage: dev <command> [options]
# 
# Commands:
#   start     Start all development services
#   stop      Stop all development services
#   status    Show status of all services
#   attach    Attach to a service's logs
```

### Subcommand: `dev start`

**Purpose:** Start all development services in a managed tmux session

**Behavior:**

1. **Pre-flight Checks:**
   - Verify tmux is installed
   - Check if `simciv-dev` session already exists
   - If exists: prompt user to attach, restart, or abort
   - Verify required tools are available (node, npm, go, mongod/docker)

2. **MongoDB Initialization:**
   - Create window `mongodb` in session `simciv-dev`
   - Execute: `mongo start`
   - Wait for MongoDB to be ready (poll connection)
   - Display status: "✅ MongoDB ready on localhost:27017"

3. **Node.js Server Initialization:**
   - Create window `server` in session `simciv-dev`
   - Ensure dependencies installed: check for `node_modules/`
   - If missing, run `npm install` with visible output
   - Build TypeScript: `npm run build`
   - Execute: `npm run dev`
   - Wait for server to be ready (poll http://localhost:3000)
   - Display status: "✅ Server ready on http://localhost:3000"

4. **Go Engine Initialization:**
   - Create window `engine` in session `simciv-dev`
   - Change to simulation directory
   - Check if engine binary exists and is up-to-date
   - If needed, build: `go build -o engine main.go`
   - Set environment variables (MONGO_URI, DB_NAME)
   - Execute: `./engine`
   - Wait for engine to be ready (check process and logs)
   - Display status: "✅ Game engine running"

5. **Vite Dev Server:**
   - Create window `vite` in session `simciv-dev`
   - Execute: `npm run dev:client`
   - Wait for Vite to be ready (poll http://localhost:5173)
   - Display status: "✅ Vite dev server ready on http://localhost:5173"

6. **Final Status Report:**
   ```
   🎮 SimCiv development environment is ready!
   
   Services running:
   ✅ MongoDB       - localhost:27017
   ✅ Server        - http://localhost:3000
   ✅ Game Engine   - Running
   ✅ Vite          - http://localhost:5173
   
   To view logs:
     dev attach mongodb   - View MongoDB logs
     dev attach server    - View server logs
     dev attach engine    - View engine logs
     dev attach vite      - View Vite logs
   
   To view all services:
     tmux attach -t simciv-dev
   
   To stop all services:
     dev stop
   
   To check status:
     dev status
   ```

**Error Handling:**

- If any service fails to start within timeout:
  - Display clear error message with service name
  - Show relevant logs from that service
  - Offer to attach to the failing service for debugging
  - Clean up successfully started services
  - Exit with non-zero code

- If port conflicts detected:
  - Report which port is in use and by what process
  - Suggest solutions (stop conflicting process or use dev-stop)
  - Exit without making changes

**Implementation Details:**

```bash
# Pseudo-code structure
check_prerequisites() {
    # Verify tmux, node, npm, go available
    # Check for port conflicts
}

check_existing_session() {
    # If simciv-dev exists, prompt user
}

start_mongodb() {
    tmux new-session -d -s simciv-dev -n mongodb
    tmux send-keys -t simciv-dev:mongodb "mongo start" C-m
    wait_for_mongodb
}

start_server() {
    tmux new-window -t simciv-dev -n server
    tmux send-keys -t simciv-dev:server "npm run dev" C-m
    wait_for_server
}

start_engine() {
    tmux new-window -t simciv-dev -n engine
    tmux send-keys -t simciv-dev:engine "cd simulation && ./engine" C-m
    wait_for_engine
}

wait_for_mongodb() {
    # Poll mongo connection with timeout
}

wait_for_server() {
    # Poll http://localhost:3000 with timeout
}

wait_for_engine() {
    # Check process running and healthy
}
```

---

### Subcommand: `dev stop`

**Purpose:** Gracefully stop all development services

**Behavior:**

1. **Check Session Exists:**
   - Verify `simciv-dev` session exists
   - If not: report "No development services running" and exit

2. **Graceful Shutdown Sequence:**
   - Send Ctrl+C to each window in reverse startup order:
     - vite: `tmux send-keys -t simciv-dev:vite C-c`
     - engine: `tmux send-keys -t simciv-dev:engine C-c`
     - server: `tmux send-keys -t simciv-dev:server C-c`
   - Wait 2 seconds for graceful shutdown
   - Stop MongoDB: `tmux send-keys -t simciv-dev:mongodb C-c`

3. **Verify Shutdown:**
   - Wait 5 seconds for all processes to exit
   - Check if ports 3000, 27017, 5173 are released
   - If processes still running:
     - Report which services didn't stop
     - Suggest manual cleanup if needed

4. **Cleanup:**
   - Kill tmux session: `tmux kill-session -t simciv-dev`
   - Report: "✅ All development services stopped"

**Error Handling:**

- If session doesn't exist: inform user, exit 0 (not an error)
- If graceful shutdown fails: provide instructions for manual cleanup

---

### Subcommand: `dev status`

**Purpose:** Display status of all development services

**Behavior:**

1. **Check Session Status:**
   - Check if `simciv-dev` session exists
   - If not: report "Development services not running" and exit

2. **Check Individual Services:**
   ```
   SimCiv Development Status
   =========================
   
   Session: simciv-dev
   ✅ Active (4 windows)
   
   Services:
   ✅ MongoDB      - Running on localhost:27017 (PID: 12345)
   ✅ Server       - Running on http://localhost:3000 (PID: 12346)
   ✅ Game Engine  - Running (PID: 12347)
   ✅ Vite         - Running on http://localhost:5173 (PID: 12348)
   
   To view logs: dev attach <service-name>
   To stop all:  dev stop
   ```

3. **Health Checks:**
   - MongoDB: Try connection
   - Server: HTTP GET to localhost:3000
   - Engine: Process running check
   - Vite: HTTP GET to localhost:5173 (if started with --full)

4. **Report Issues:**
   - If session exists but service not responding:
     - Mark as "⚠️ Not responding (process exists but unhealthy)"
   - If window exists but no process:
     - Mark as "❌ Failed to start (check logs)"

---

### Subcommand: `dev attach`

**Purpose:** Attach to a specific service's tmux window to view logs

**Arguments:**
- `service`: Name of service to attach to (mongodb|server|engine|vite)

**Behavior:**

1. **Validate Arguments:**
   - Require service name argument
   - Validate service name is one of: mongodb, server, engine, vite
   - Check if `simciv-dev` session exists
   - Check if requested service window exists

2. **Attach to Window:**
   - Execute: `tmux attach -t simciv-dev:$service`
   - Display help message before attaching:
     ```
     Attaching to $service logs...
     
     Tip: Press Ctrl+B then D to detach (service keeps running)
          Press Ctrl+C to stop the service
     ```

3. **Error Handling:**
   - If session doesn't exist: "Development services not running. Use 'dev start' first."
   - If service window doesn't exist: "Service '$service' not running. Available: [list]"
   - If invalid service name: "Unknown service '$service'. Available: mongodb, server, engine, vite"

---

## Directory Structure Changes

The implementation adds a single unified script in the existing `bin/` directory:

```
bin/
├── mongo              # Existing: MongoDB management
├── e2e-setup          # Existing: E2E test setup
└── dev                # New: Unified development environment manager
```

---

## Integration with Existing Tools

### Compatibility with `bin/mongo`

The `dev-start` script will use the existing `bin/mongo` script for MongoDB management:
- Calls `mongo start` in the MongoDB tmux window
- Calls `mongo stop` during shutdown
- Inherits all MongoDB platform logic (native vs Docker, macOS Colima handling)

### Compatibility with `bin/e2e-setup`

The E2E setup script will remain unchanged and independent:
- `dev start` is for human developers in interactive mode
- `e2e-setup` is for automated CI/CD and E2E test preparation
- Both can coexist; `e2e-setup` will detect if services already running

### Integration with Nix Environment

All scripts assume execution within the Nix development environment:
- Scripts check for required tools (tmux, node, go)
- If direnv is active, `bin/` directory already in PATH
- Scripts provide helpful error messages if tools missing
- No Nix-specific code needed; scripts are standard Bash

---

## Developer Workflow Examples

### First Time Setup

```bash
# Clone repository
git clone https://github.com/anicolao/simciv.git
cd simciv

# Allow direnv (loads Nix environment)
direnv allow

# Start development environment
dev start

# That's it! All services are running.
# Open http://localhost:3000 in browser
```

### Daily Development

```bash
# Morning: start working
cd simciv
dev start

# Check everything is running
dev status

# View server logs
dev attach server
# (Press Ctrl+B, D to detach)

# Make some changes, server auto-reloads with nodemon

# End of day: clean shutdown
dev stop
```

### Debugging a Service

```bash
# Start environment
dev start

# Something not working, check status
dev status

# Game engine shows as unhealthy, view logs
dev attach engine

# See error, need to stop and manually debug
dev stop

# Run engine manually in foreground
cd simulation
./engine

# Fix issue, restart managed environment
cd ..
dev start
```

### Frontend Development with HMR

```bash
# Start all services including Vite for hot reload
dev start

# Now can develop client with instant feedback
# Vite on :5173 proxies API calls to :3000
```

---

## Error Handling Strategy

### Port Conflicts

**Scenario:** Port 3000 already in use

**Detection:** Before starting server, check with `lsof -ti:3000`

**Response:**
```
❌ Error: Port 3000 is already in use

The following process is using port 3000:
  PID:     12345
  Command: node /some/other/app.js
  
Suggestions:
  1. Stop the conflicting process
  2. Run 'dev stop' if it's a previous SimCiv session
  3. Change PORT in .env and restart

Aborting startup to prevent conflicts.
```

### Service Startup Timeout

**Scenario:** MongoDB fails to start within 30 seconds

**Response:**
```
❌ Error: MongoDB failed to start

Waited 30 seconds, but MongoDB is not accepting connections.

Checking logs:
[Last 20 lines of MongoDB logs]

To debug manually:
  dev attach mongodb

Services started before failure have been stopped.
```

### Missing Dependencies

**Scenario:** `node_modules/` doesn't exist

**Response:**
```
⚠️  Warning: Node.js dependencies not installed

Installing dependencies (this may take a moment)...
npm install

[Shows npm install output]

✅ Dependencies installed, continuing startup...
```

### Stale Session Detection

**Scenario:** User runs `dev start` but session already exists

**Response:**
```
⚠️  Development session already exists

Options:
  1. Attach to existing session:  tmux attach -t simciv-dev
  2. Check status:                dev status
  3. Stop and restart:            dev stop && dev start

What would you like to do? (1-3): _
```

---

## Testing Strategy

Since this is a design document for scripts that haven't been implemented yet, we won't create tests. However, the implementation should include:

### Manual Testing Checklist

When implementing the scripts, verify:

1. **Fresh Environment:**
   - [ ] `dev-start` works on clean checkout
   - [ ] All services start successfully
   - [ ] Status reports are accurate
   - [ ] Can access all services

2. **Restart Scenarios:**
   - [ ] `dev stop` cleanly shuts down all services
   - [ ] Can restart after stop
   - [ ] Handles Ctrl+C during startup gracefully

3. **Error Cases:**
   - [ ] Port conflicts detected and reported
   - [ ] Missing dependencies handled
   - [ ] Timeout scenarios work correctly
   - [ ] Stale sessions detected

4. **Session Management:**
   - [ ] `dev attach` works for all services
   - [ ] Can detach without stopping services
   - [ ] Multiple attach/detach cycles work

5. **Platform Compatibility:**
   - [ ] Works on Linux with native MongoDB
   - [ ] Works on Linux with Docker MongoDB
   - [ ] Works on macOS with Colima

---

## Future Enhancements

### Phase 2: Advanced Features

1. **Service-Specific Commands:**
   ```bash
   dev restart server   # Restart just the server
   dev restart engine   # Restart just the engine
   dev logs --follow    # Follow all logs in split-pane view
   ```

2. **Development Profiles:**
   ```bash
   dev start --minimal    # Just MongoDB and server (no engine, no Vite)
   dev start --frontend   # Server + Vite only
   dev start --backend    # Server + Engine only
   ```

3. **Interactive Dashboard:**
   - Use tmux panes to show all services at once
   - Real-time status updates
   - Color-coded health indicators
   - Single command: `dev dashboard`

4. **Automatic Restart on Crash:**
   - Monitor processes within tmux
   - Auto-restart if service crashes
   - Notify developer of restarts
   - Configurable retry limits

5. **Log Aggregation:**
   ```bash
   dev logs --search "error"     # Search across all logs
   dev logs --since "5m ago"     # Recent logs
   dev logs --service server     # Filter by service
   ```

6. **Integration with Test Runners:**
   ```bash
   dev test unit          # Run unit tests (keep services running)
   dev test e2e           # Run E2E tests (manage services automatically)
   dev test watch         # Watch mode for tests
   ```

### Phase 3: Developer Experience

1. **Status Bar Integration:**
   - Show dev environment status in terminal prompt
   - Integration with starship/powerlevel10k
   - Visual indicator of service health

2. **Notification System:**
   - Desktop notifications for service crashes
   - Alert when build fails
   - Notify when server ready after changes

3. **Performance Monitoring:**
   - Track CPU/memory usage per service
   - Alert on resource issues
   - Historical metrics

4. **Docker/Podman Support:**
   - Optional containerized development
   - Pre-built images for faster startup
   - Consistent cross-platform environment

---

## Migration Path

### For Existing Developers

Existing workflows continue to work unchanged:
- Direct `mongo start`, `npm run dev`, etc. still function
- `bin/e2e-setup` unchanged
- No breaking changes to existing scripts

New workflows are additive:
- Can gradually adopt `dev start` at own pace
- Both approaches can coexist
- Documentation updated to show both options

### Documentation Updates

Update `docs/DEVELOPMENT.md` to:
1. Feature `dev start` as recommended quick-start
2. Keep detailed manual setup for understanding
3. Add troubleshooting section for `dev` commands
4. Include tmux basics for developers unfamiliar

Update README.md to:
1. Add `dev start` to Getting Started section
2. Simplify quick-start instructions
3. Link to detailed development docs

---

## Security Considerations

### Process Isolation

- All services run under developer's user account
- No privilege escalation required
- MongoDB uses standard local connection
- No network exposure beyond localhost

### Secret Management

- Scripts don't handle secrets
- Environment variables from `.env` still used
- No secrets logged to tmux buffers
- Standard Nix environment security model

### Session Access

- tmux sessions owned by user
- Standard Unix permissions apply
- Sessions not accessible by other users
- No remote tmux access configured

---

## Success Metrics

After implementation, success measured by:

1. **Startup Time:** From `dev start` to all services ready < 60 seconds
2. **Reliability:** Services start successfully on first try > 95% of time
3. **Developer Satisfaction:** Subjective feedback from team
4. **Documentation Quality:** New developers can start without help
5. **Error Recovery:** Clear error messages lead to self-service resolution

---

## Alternatives Considered

### Alternative 1: Docker Compose

**Approach:** Use Docker Compose to orchestrate all services

**Pros:**
- Standardized orchestration tool
- Cross-platform consistency
- Easy to add more services
- Built-in health checks

**Cons:**
- Adds Docker as hard dependency
- Slower startup (container overhead)
- More complex log access
- Harder to debug Node.js/Go in containers
- Nix already provides environment consistency
- **REJECTED:** Adds unnecessary complexity for local development

### Alternative 2: Process Manager (PM2, foreman)

**Approach:** Use PM2 or foreman to manage processes

**Pros:**
- Purpose-built for process management
- Built-in monitoring and restart
- Log aggregation
- Cross-platform

**Cons:**
- Adds new dependency (not in Nix environment)
- PM2 requires Node.js (circular dependency)
- Less flexible than direct tmux access
- Another tool to learn
- **REJECTED:** tmux more universal and flexible, single `dev` script simpler

### Alternative 3: Custom Shell Script with Background Jobs

**Approach:** Shell script that backgrounds all processes

**Pros:**
- No additional dependencies
- Simple implementation
- Direct control

**Cons:**
- No easy log access
- Hard to manage lifecycle
- PID tracking fragile
- No way to interact with services
- **REJECTED:** Poor developer experience for debugging

### Alternative 4: Makefile Targets

**Approach:** Add Make targets for dev commands

**Pros:**
- Familiar to many developers
- Already have Makefile (could create one)
- Simple syntax

**Cons:**
- Make not great for long-running processes
- No built-in session management
- Would still need tmux underneath
- **REJECTED:** Make better for build tasks, not process management

---

## Conclusion

The implemented `dev` script with its `start`, `stop`, `status`, and `attach` subcommands provides a significant improvement to the SimCiv developer experience by:

1. Reducing cognitive load (single command vs. multiple)
2. Preventing common mistakes (forgot to start a service)
3. Enabling easy debugging (attach to logs)
4. Maintaining flexibility (can still run services manually)
5. Leveraging existing tools (tmux, bash, existing scripts)

The tmux-based approach is lightweight, doesn't add new dependencies, and provides excellent developer ergonomics for local development. The script integrates cleanly with the existing Nix environment and respects the database-centric architecture of SimCiv.

All four services (MongoDB, Node.js server, Go engine, and Vite) are now started automatically, providing a complete development environment with a single command.

**Implementation Status: Complete**  
This improvement directly addresses pain points experienced daily by all developers and significantly lowers the barrier to entry for new contributors.

---

## Appendix A: tmux Quick Reference for Developers

For developers new to tmux, these commands will be helpful:

### Basic Commands

```bash
# Attach to simciv-dev session
tmux attach -t simciv-dev

# List all windows in session
tmux list-windows -t simciv-dev

# Kill the session (stops all windows)
tmux kill-session -t simciv-dev
```

### While Attached

- **Ctrl+B D** - Detach from session (keeps running)
- **Ctrl+B C** - Create new window
- **Ctrl+B N** - Next window
- **Ctrl+B P** - Previous window
- **Ctrl+B 0-9** - Switch to window N
- **Ctrl+B ,** - Rename current window
- **Ctrl+B [** - Enter scroll mode (use arrow keys, 'q' to exit)

### Helpful Resources

- [tmux Cheat Sheet](https://tmuxcheatsheet.com/)
- [A Gentle Introduction to tmux](https://medium.com/hackernoon/a-gentle-introduction-to-tmux-8d784c404340)

---

## Appendix B: Implementation Checklist

Implementation completed:

- [x] Create `bin/dev` script
  - [x] Implement pre-flight checks
  - [x] Implement session creation
  - [x] Implement MongoDB startup
  - [x] Implement server startup
  - [x] Implement engine startup
  - [x] Implement Vite startup
  - [x] Implement health checks
  - [x] Implement error handling
  - [x] Add comprehensive comments

- [x] Implement `dev stop` subcommand
  - [x] Implement session check
  - [x] Implement graceful shutdown
  - [x] Implement cleanup
  - [x] Add comprehensive comments

- [x] Implement `dev status` subcommand
  - [x] Implement session status check
  - [x] Implement service health checks
  - [x] Implement status reporting
  - [x] Add comprehensive comments

- [x] Implement `dev attach` subcommand
  - [x] Implement argument validation
  - [x] Implement session/window checks
  - [x] Implement attach logic
  - [x] Add help messages
  - [x] Add comprehensive comments

- [x] Fix `bin/mongo` Colima check
  - [x] Check return code before grepping output
  - [x] Avoid false positives from error messages

- [ ] Update documentation
  - [ ] Update `docs/DEVELOPMENT.md`
  - [ ] Update `README.md`
  - [ ] Add tmux quick reference
  - [ ] Add troubleshooting section

- [ ] Testing
  - [ ] Manual test on Linux with native MongoDB
  - [ ] Manual test on Linux with Docker MongoDB
  - [ ] Manual test on macOS with Colima
  - [ ] Test all error scenarios
  - [ ] Test with existing workflows

- [ ] Update `.envrc` if needed
  - [ ] Consider adding helpful aliases
  - [ ] Consider showing dev start hint on cd

---

*This design has been implemented as a single unified `dev` script in `bin/dev`, providing significantly improved local development experience while maintaining full compatibility with existing workflows and tools.*
