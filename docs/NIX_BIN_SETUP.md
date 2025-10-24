# Setting Up SimCiv with nix-bin and direnv

This guide explains how to set up SimCiv development environment using `nix-bin` (from Ubuntu's apt repositories) and `direnv` for automatic environment activation.

## Prerequisites

- Ubuntu 24.04 or later (or other Debian-based distribution)
- sudo/root access for initial setup
- Active internet connection for downloading Nix packages

## Why nix-bin with direnv?

While it's generally recommended to use the full Nix installation from nixos.org, the `nix-bin` package from apt repositories provides a lighter-weight alternative that:
- Integrates with system package management (apt)
- Requires less disk space
- Uses the system's Nix daemon
- Works seamlessly with direnv for automatic environment activation

## Installation Steps

### 1. Install nix-bin and direnv

```bash
sudo apt-get update
sudo apt-get install -y nix-bin direnv
```

### 2. Configure Nix to enable flakes

Edit `/etc/nix/nix.conf` to enable flakes support:

```bash
sudo bash -c 'cat > /etc/nix/nix.conf << EOF
# see https://nixos.org/manual/nix/stable/command-ref/conf-file

sandbox = true
experimental-features = nix-command flakes
EOF'
```

### 3. Add your user to the nix-users group

```bash
sudo usermod -aG nix-users $USER
```

**Important:** You'll need to log out and log back in for the group membership to take effect.

### 4. Set up direnv hook

Add the direnv hook to your shell configuration:

**For bash:**
```bash
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
source ~/.bashrc
```

**For zsh:**
```bash
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
source ~/.zshrc
```

## Using the Development Environment

### 1. Navigate to the project directory

```bash
cd /path/to/simciv
```

### 2. Allow direnv to load the environment

On your first visit to the project directory, direnv will ask for permission:

```bash
direnv allow
```

This will automatically:
- Load the Nix flake defined in `flake.nix`
- Install all required development tools (Node.js, Go, MongoDB, etc.)
- Set up environment variables (MONGO_URI, DB_NAME, PORT)
- Add the `bin` directory to your PATH

### 3. Verify the environment

Once direnv loads the environment, you should see welcome messages. Verify the tools are available:

```bash
node --version
go version
mongod --version  # or docker --version on macOS
```

### 4. Run e2e-setup and tests

With the environment active, you can now run:

```bash
e2e-setup           # Set up E2E test environment
npm run test:e2e    # Run E2E tests
```

## Troubleshooting

### Permission denied on daemon socket

If you get an error about `/nix/var/nix/daemon-socket/socket`:
1. Ensure you're in the `nix-users` group: `groups | grep nix-users`
2. If not, run: `sudo usermod -aG nix-users $USER`
3. Log out and log back in

### Nix cache download issues

If you experience network issues downloading from cache.nixos.org:
- This is expected in some network environments (e.g., GitHub Actions runners)
- Nix will build packages locally if it cannot download from cache
- Builds may take longer but will still work correctly

### direnv not loading automatically

If direnv doesn't activate when entering the directory:
1. Check that the hook is in your shell config: `grep direnv ~/.bashrc`
2. Ensure you've sourced the config: `source ~/.bashrc`
3. Verify direnv is installed: `which direnv`

### Flake evaluation takes a long time

The first time you load the environment, Nix needs to:
- Download and evaluate the flake
- Download or build all required packages
- Set up the development shell

This can take several minutes. Subsequent loads will be much faster as packages are cached.

## Differences from Full Nix Installation

The `nix-bin` package from apt has some differences compared to the full Nix installation:

1. **Uses system daemon**: Relies on `nix-daemon.service` managed by systemd
2. **Multi-user by default**: Always uses multi-user mode with the daemon
3. **System integration**: Integrates with apt package management
4. **Limited configurability**: Some advanced Nix features may behave differently

## Next Steps

Once your environment is set up:
1. Review [DEVELOPMENT.md](DEVELOPMENT.md) for development workflows
2. Check [AUTHENTICATION.md](AUTHENTICATION.md) for authentication system details
3. See [GAME_CREATION.md](GAME_CREATION.md) for game creation system documentation

## References

- [Nix Manual](https://nixos.org/manual/nix/stable/)
- [direnv Documentation](https://direnv.net/)
- [Nix Flakes](https://nixos.wiki/wiki/Flakes)
