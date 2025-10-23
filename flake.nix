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
#   - MongoDB 7.0 for database (NixOS only, use Docker on macOS)
#   - Git for version control
#
# Note: MongoDB is excluded on macOS/Darwin due to build issues in nixpkgs.
# macOS users should use Docker to run MongoDB.
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
        # On Darwin, users should use Docker for MongoDB
        isDarwin = pkgs.stdenv.isDarwin;
        mongoPackage = if isDarwin then [ ] else [ pkgs.mongodb ];
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
            
            # Docker (optional, for containerized MongoDB)
            # Uncomment if you prefer Docker over local MongoDB
            # docker
            # docker-compose
          ] ++ mongoPackage;

          shellHook = ''
            echo "🎮 Welcome to SimCiv development environment!"
            echo ""
            echo "Available tools:"
            echo "  Node.js:  $(node --version)"
            echo "  npm:      $(npm --version)"
            echo "  Go:       $(go version | cut -d' ' -f3)"
            ${if isDarwin then ''
            echo ""
            echo "Note: MongoDB is not included on macOS due to build issues."
            echo "Please use Docker to run MongoDB:"
            echo "  docker run -d --name simciv-mongo -p 27017:27017 mongo:7.0"
            '' else ''
            echo "  MongoDB:  $(mongod --version | head -n1)"
            ''}
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
            ${if isDarwin then ''
            echo "MongoDB (Docker required on macOS):"
            '' else ''
            echo "MongoDB:"
            echo "  Local:  mongod --dbpath ./data/db (create data/db directory first)"
            ''}
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
