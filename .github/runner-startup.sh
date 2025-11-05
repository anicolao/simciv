#!/usr/bin/env bash
# Quick startup script for GitHub Copilot cloud runner
# This provides immediate environment and test status

set -e

echo "🎮 SimCiv Development Environment Status"
echo "========================================"
echo ""

# Check Nix environment
echo "📦 Environment:"
if command -v nix &>/dev/null; then
    echo "  ✅ Nix: $(nix --version | head -n1)"
else
    echo "  ❌ Nix: Not installed"
fi

if command -v direnv &>/dev/null; then
    echo "  ✅ direnv: $(direnv --version)"
else
    echo "  ❌ direnv: Not installed"
fi

# Load Nix environment if available
if [ -f .envrc ]; then
    eval "$(direnv export bash)" 2>/dev/null || true
fi

echo ""
echo "🛠️  Tools:"
if command -v node &>/dev/null; then
    echo "  ✅ Node.js: $(node --version)"
else
    echo "  ❌ Node.js: Not available"
fi

if command -v npm &>/dev/null; then
    echo "  ✅ npm: $(npm --version)"
else
    echo "  ❌ npm: Not available"
fi

if command -v go &>/dev/null; then
    echo "  ✅ Go: $(go version | cut -d' ' -f3)"
else
    echo "  ❌ Go: Not available"
fi

echo ""
echo "🗄️  Services:"
if bin/mongo status &>/dev/null; then
    echo "  ✅ MongoDB: Running"
else
    echo "  ⚠️  MongoDB: Not running (use: bin/mongo start)"
fi

if lsof -ti:3000 &>/dev/null 2>&1; then
    echo "  ✅ Server: Running on port 3000"
else
    echo "  ⚠️  Server: Not running on port 3000"
fi

if pgrep -f "./engine" >/dev/null 2>&1; then
    echo "  ✅ Game Engine: Running"
else
    echo "  ⚠️  Game Engine: Not running"
fi

echo ""
echo "📊 Last Test Results:"

# Check for recent test artifacts
if [ -f unit-test-output.txt ]; then
    if grep -q "All tests passed" unit-test-output.txt || grep -q "Test Files.*[0-9]* passed" unit-test-output.txt; then
        echo "  ✅ Unit Tests: PASSED"
    else
        echo "  ❌ Unit Tests: FAILED (see unit-test-output.txt)"
    fi
else
    echo "  ⚠️  Unit Tests: No results available (run: npm test)"
fi

if [ -f e2e-test-output.txt ]; then
    if grep -q "passed" e2e-test-output.txt && ! grep -q "failed" e2e-test-output.txt; then
        echo "  ✅ E2E Tests: PASSED"
    else
        echo "  ❌ E2E Tests: FAILED (see e2e-test-output.txt)"
    fi
else
    echo "  ⚠️  E2E Tests: No results available (run: npm run test:e2e)"
fi

echo ""
echo "🚀 Quick Commands:"
echo "  direnv allow                  - Enable Nix environment"
echo '  eval "$(direnv export bash)"  - Load Nix environment'
echo "  bin/mongo start               - Start MongoDB"
echo "  npm install                   - Install dependencies"
echo "  npm run build                 - Build application"
echo "  npm test                      - Run unit tests"
echo "  bin/e2e-setup                 - Setup E2E environment"
echo "  npm run test:e2e              - Run E2E tests"
echo ""
