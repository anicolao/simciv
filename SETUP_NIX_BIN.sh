#!/usr/bin/env bash
# Quick setup script for nix-bin with direnv
# Run this script to set up your development environment
#
# This script:
# 1. Installs nix-bin and direnv from apt
# 2. Configures Nix to enable flakes
# 3. Adds your user to the nix-users group
# 4. Sets up direnv hook in your shell
#
# After running this script, you'll need to log out and log back in
# for the group membership to take effect.

set -e

echo "🚀 Setting up SimCiv development environment with nix-bin and direnv"
echo ""

# Check if running on a Debian-based system
if ! command -v apt-get &>/dev/null; then
    echo "❌ This script requires apt-get (Debian/Ubuntu-based system)"
    exit 1
fi

# Check if running with appropriate permissions
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Do not run this script as root. Run it as your regular user."
    echo "   The script will prompt for sudo when needed."
    exit 1
fi

echo "📦 Step 1: Installing nix-bin and direnv..."
sudo apt-get update
sudo apt-get install -y nix-bin direnv

echo ""
echo "⚙️  Step 2: Configuring Nix to enable flakes..."
sudo bash -c 'cat > /etc/nix/nix.conf << EOF
# see https://nixos.org/manual/nix/stable/command-ref/conf-file

sandbox = true
experimental-features = nix-command flakes

# Reduce timeout and retries for better performance in restricted environments
connect-timeout = 5
stalled-download-timeout = 10
max-substitution-jobs = 1

# Fall back to building if downloads fail
fallback = true
EOF'

echo ""
echo "👤 Step 3: Adding your user to the nix-users group..."
sudo usermod -aG nix-users "$USER"

echo ""
echo "🐚 Step 4: Setting up direnv hook..."

# Detect shell
SHELL_NAME=$(basename "$SHELL")
case "$SHELL_NAME" in
    bash)
        RC_FILE="$HOME/.bashrc"
        HOOK_LINE='eval "$(direnv hook bash)"'
        ;;
    zsh)
        RC_FILE="$HOME/.zshrc"
        HOOK_LINE='eval "$(direnv hook zsh)"'
        ;;
    *)
        echo "⚠️  Unsupported shell: $SHELL_NAME"
        echo "   Please manually add the direnv hook to your shell configuration"
        echo "   See: https://direnv.net/docs/hook.html"
        RC_FILE=""
        ;;
esac

if [ -n "$RC_FILE" ]; then
    if grep -q "direnv hook" "$RC_FILE" 2>/dev/null; then
        echo "✅ direnv hook already configured in $RC_FILE"
    else
        echo "$HOOK_LINE" >> "$RC_FILE"
        echo "✅ Added direnv hook to $RC_FILE"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "⚠️  IMPORTANT: You must log out and log back in for the group membership to take effect."
echo ""
echo "After logging back in, run these commands to start developing:"
echo ""
echo "  cd $(pwd)"
echo "  direnv allow"
echo "  e2e-setup"
echo "  npm run test:e2e"
echo ""
echo "For more details, see: docs/NIX_BIN_SETUP.md"
