# Nix flake for SimCiv development environment
#
# This flake provides a reproducible development environment with all tools needed
# for SimCiv development on NixOS and macOS with nix-darwin.
#
# Usage:
#   nix develop          - Enter development shell
#   nix flake update     - Update all inputs to latest versions
#
# The flake provides:
#   - Node.js 20.x for server and client
#   - Go (latest stable) for simulation engine  
#   - MongoDB 7.0 for database (NixOS only, Colima + Docker on macOS)
#   - Git for version control
#   - Colima + Docker (macOS only) for containerized MongoDB
#
# Note: MongoDB is excluded on macOS/Darwin due to build issues in nixpkgs.
# macOS users get Colima and Docker installed to run MongoDB in a container.
#
# Environment variables are automatically set:
#   - MONGO_URI=mongodb://localhost:27017
#   - DB_NAME=simciv
#   - PORT=3000
#
{
  description = "SimCiv - A SimCity/Civilization Mashup";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
        
        # MongoDB has build issues on macOS/Darwin, so we make it optional
        # On Darwin, use Colima + Docker for MongoDB instead
        isDarwin = pkgs.stdenv.isDarwin;
        mongoPackage = if isDarwin then [ ] else [ pkgs.mongodb ];
        
        # Colima and Docker are only needed on macOS for running MongoDB
        colimaPackages = if isDarwin then [ pkgs.colima pkgs.docker pkgs.docker-compose ] else [ ];
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js ecosystem
            nodejs_20
            
            # Go for simulation engine (1.24 or later)
            # If go_1_24 is not available, use go_1_23 or go (latest stable)
            go
            
            # Development tools
            git
          ] ++ mongoPackage ++ colimaPackages;

          shellHook = ''
            echo "🎮 Welcome to SimCiv development environment!"
            echo ""
            echo "Available tools:"
            echo "  Node.js:  $(node --version)"
            echo "  npm:      $(npm --version)"
            echo "  Go:       $(go version | cut -d' ' -f3)"
            ${if isDarwin then ''
            echo "  Colima:   $(colima version 2>/dev/null || echo 'not running')"
            echo "  Docker:   $(docker --version 2>/dev/null || echo 'requires Colima')"
            '' else ''
            echo "  MongoDB:  $(mongod --version | head -n1)"
            ''}
            echo ""
            echo "MongoDB Management:"
            echo "  mongo start   - Start MongoDB container"
            echo "  mongo stop    - Stop MongoDB container"
            echo "  mongo status  - Check MongoDB status"
            echo "  mongo restart - Restart MongoDB container"
            echo ""
            echo "Quick start:"
            echo "  1. mongo start          - Start MongoDB"
            echo "  2. npm install          - Install Node.js dependencies"
            echo "  3. npm run build        - Build the application"
            echo "  4. npm run dev          - Start development server"
            echo "  5. cd simulation && go build -o simciv-sim main.go - Build simulation engine"
            echo ""
            echo "Testing:"
            echo "  npm test                - Run unit tests"
            echo "  npm run test:e2e        - Run E2E tests"
            echo "  cd simulation && go test ./... - Run Go tests"
            echo ""
          '';

          # Set up environment variables
          MONGO_URI = "mongodb://localhost:27017";
          DB_NAME = "simciv";
          PORT = "3000";
        };
      }
    );
}
