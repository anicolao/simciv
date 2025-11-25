# Nix Tooling Friction - Playwright Browser Dependencies

## Issue

When running Playwright E2E tests inside the Nix environment, the browser fails to launch due to missing system library dependencies.

## Error Message

```
Error: browserType.launch: 
╔══════════════════════════════════════════════════════╗
║ Host system is missing dependencies to run browsers. ║
║ Missing libraries:                                   ║
║     libglib-2.0.so.0                                 ║
║     libgobject-2.0.so.0                              ║
║     libnspr4.so                                      ║
║     libnss3.so                                       ║
║     ... (many more)                                  ║
╚══════════════════════════════════════════════════════╝
```

## Root Cause

The Playwright browser executables (Chromium) look for system libraries in specific paths. When running inside the Nix shell environment, the library paths are modified to point to Nix store locations, but Playwright's browser binaries are not aware of these Nix-specific paths and cannot find the required libraries.

## Workaround

**Run Playwright E2E tests OUTSIDE the Nix environment:**

```bash
# Exit Nix environment first (cd out of project directory)
cd /tmp

# Return and run tests
cd /path/to/simciv
npm run test:e2e
```

The system-installed libraries (via `npx playwright install-deps chromium`) work correctly when running outside the Nix shell.

## What Works

- **Unit tests**: Work fine inside Nix environment
- **Integration tests**: Work fine inside Nix environment
- **Building**: Works fine with `npm run build` inside Nix
- **Server**: Works fine with `npm start` inside Nix

## What Doesn't Work

- **Playwright E2E tests**: Must run outside Nix environment

## Attempted Fixes (Unsuccessful)

1. Setting `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true` - didn't help
2. Running `npx playwright install-deps` inside nix shell - libraries installed but still not found
3. Installing additional Nix packages - browser still couldn't find libraries

## Recommendation

For now, use the workaround of running Playwright tests outside the Nix shell. This is documented in the test instructions and doesn't significantly impact the development workflow.

## Future Investigation

Potential solutions to explore:
1. Use `nixGL` or similar wrapper to provide OpenGL/graphics libraries
2. Configure `LD_LIBRARY_PATH` to include both Nix and system library paths
3. Use Playwright's Docker containers instead of local browsers
4. Build Playwright browsers from Nix packages with proper library dependencies

## Date

2025-10-24

## Related

- [NIX_BIN_SETUP.md](NIX_BIN_SETUP.md) - Nix setup instructions
