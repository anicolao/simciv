# Persistent Nix Shell

## Overview

The `nix-shell-persistent` tool maintains a long-running shell session with the Nix environment already loaded. This eliminates the overhead of repeatedly loading direnv for each command, which can take 1-2 minutes on first load.

## Why Use This?

When working with the Nix environment through direnv, each new shell session needs to:
1. Initialize direnv
2. Download or build Nix packages (on first run)
3. Export hundreds of environment variables

This can take 1-2 minutes for the first initialization, and several seconds for subsequent loads. With `nix-shell-persistent`, you initialize once and then run commands instantly.

## Requirements

- GNU Screen (installed automatically by `SETUP_NIX_BIN.sh`)
- Nix with direnv configured (run `SETUP_NIX_BIN.sh` first)
- User must be in the `nix-users` group

## Usage

### Initialize Once

```bash
nix-shell-persistent init
```

This starts a persistent shell session in the background with the Nix environment loaded. The first initialization may take 1-2 minutes while direnv downloads packages.

### Execute Commands

```bash
nix-shell-persistent exec <command>
```

Commands execute immediately in the persistent shell (no direnv reload overhead).

Examples:
```bash
# Check Go version (Nix's version)
nix-shell-persistent exec which go
nix-shell-persistent exec go version

# Run npm commands
nix-shell-persistent exec npm install
nix-shell-persistent exec npm run build

# Any command in the Nix environment
nix-shell-persistent exec e2e-setup
```

### Check Status

```bash
nix-shell-persistent status
```

Shows whether the persistent shell is running.

### Interactive Mode

```bash
nix-shell-persistent attach
```

Attaches to the persistent shell interactively. Use `Ctrl-A` then `d` to detach (leave it running).

### Cleanup

```bash
nix-shell-persistent cleanup
```

Terminates the persistent shell session.

## Complete Workflow Example

```bash
# One-time setup
./SETUP_NIX_BIN.sh
# Log out and log back in

# Initialize persistent shell (once per work session)
nix-shell-persistent init

# Run commands efficiently (no overhead)
nix-shell-persistent exec which go
nix-shell-persistent exec npm install
nix-shell-persistent exec npm run build
nix-shell-persistent exec npm test

# When done for the day
nix-shell-persistent cleanup
```

## Performance Comparison

**Without persistent shell:**
```bash
$ time (sg nix-users bash -c 'cd /path/to/simciv && eval "$(direnv hook bash)" && direnv export bash && which go')
# ~60-120 seconds first time
# ~5-10 seconds subsequent times
```

**With persistent shell:**
```bash
$ nix-shell-persistent init  # Once: 60-120 seconds
$ time nix-shell-persistent exec which go
# ~0.5 seconds every time!
```

## Technical Details

### How It Works

1. Uses GNU Screen to create a detached terminal session
2. Runs the session with `sg nix-users` to have proper group membership
3. Initializes direnv once in that session
4. Keeps the session alive in the background
5. Sends commands to the session via screen's command interface
6. Captures output through temporary files

### Session Management

- Session name: `simciv-nix-shell`
- Commands are sent via `screen -X stuff`
- Output is redirected to temporary files in `/tmp`
- Completion is tracked with unique markers

### Troubleshooting

**Session not starting:**
- Ensure you're in the `nix-users` group: `groups | grep nix-users`
- If not, run the setup script again and log out/in

**Commands timeout:**
- The persistent shell may have died
- Run `nix-shell-persistent cleanup` then `nix-shell-persistent init`

**Environment not loaded:**
- Check that `.envrc` is allowed: `direnv allow`
- Verify direnv works: `eval "$(direnv hook bash)" && direnv export bash`

**Screen not found:**
- Install screen: `sudo apt-get install screen`

## Integration with Existing Tools

The persistent shell works seamlessly with all existing project scripts:

```bash
# These all work in the persistent shell
nix-shell-persistent exec e2e-setup
nix-shell-persistent exec mongo start
nix-shell-persistent exec npm run test:e2e
```

## Comparison with Alternatives

| Method | Init Time | Command Time | Complexity |
|--------|-----------|--------------|------------|
| Direct `nix develop` | 60-120s | Each command | Low |
| direnv | 60-120s first, 5-10s after | Each command | Medium |
| **Persistent shell** | **60-120s once** | **~0.5s** | **Low** |

## Best Practices

1. **Initialize at start of work session**: Run `init` when you start working
2. **Cleanup when done**: Run `cleanup` when you're done for the day
3. **Check status if uncertain**: Use `status` to verify the shell is running
4. **Use for repetitive tasks**: Especially useful for CI-like workflows with many commands
5. **Attach for debugging**: Use `attach` if you need to debug environment issues

## See Also

- [NIX_BIN_SETUP.md](NIX_BIN_SETUP.md) - Setting up nix-bin with direnv
- [DEVELOPMENT.md](DEVELOPMENT.md) - General development guide
- [../bin/nix-shell-persistent](../bin/nix-shell-persistent) - The script source code
