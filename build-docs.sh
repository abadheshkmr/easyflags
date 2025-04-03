#!/bin/bash

# Set up Python virtual environment if it doesn't exist
if [ ! -d "docs-venv" ]; then
  echo "Setting up virtual environment..."
  python3 -m venv docs-venv
fi

# Activate virtual environment
source docs-venv/bin/activate

# Install required packages
echo "Installing required packages..."
pip install mkdocs mkdocs-material

# Build the documentation
echo "Building documentation..."
cd docs
mkdocs build

# Serve the documentation (optional)
echo "Documentation built successfully!"
echo "To serve the documentation, run:"
echo "cd docs && mkdocs serve"

# GitHub Pages deployment (optional)
echo ""
echo "To deploy to GitHub Pages, run:"
echo "cd docs && mkdocs gh-deploy" 