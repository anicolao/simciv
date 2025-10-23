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
#   - MongoDB 7.0 for database
#   - Git for version control
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
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js ecosystem
            nodejs_20
            
            # Go for simulation engine (1.24 or later)
            # If go_1_24 is not available, use go_1_23 or go (latest stable)
            go
            
            # MongoDB
            mongodb
            
            # Development tools
            git
            
            # Docker (optional, for containerized MongoDB)
            # Uncomment if you prefer Docker over local MongoDB
            # docker
            # docker-compose
          ];

          shellHook = ''
            echo "🎮 Welcome to SimCiv development environment!"
            echo ""
            echo "Available tools:"
            echo "  Node.js:  $(node --version)"
            echo "  npm:      $(npm --version)"
            echo "  Go:       $(go version | cut -d' ' -f3)"
            echo "  MongoDB:  $(mongod --version | head -n1)"
            echo ""
            echo "Quick start:"
            echo "  1. npm install          - Install Node.js dependencies"
            echo "  2. npm run build        - Build the application"
            echo "  3. npm run dev          - Start development server"
            echo "  4. cd simulation && go build -o simciv-sim main.go - Build simulation engine"
            echo ""
            echo "Testing:"
            echo "  npm test                - Run unit tests"
            echo "  npm run test:e2e        - Run E2E tests"
            echo "  cd simulation && go test ./... - Run Go tests"
            echo ""
            echo "MongoDB:"
            echo "  Local:  mongod --dbpath ./data/db (create data/db directory first)"
            echo "  Docker: docker run -d --name simciv-mongo -p 27017:27017 mongo:7.0"
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
