#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting production build..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile

# Run linter
echo "🔍 Running linter..."
yarn lint

# Run tests
echo "🧪 Running tests..."
yarn test

# Build the project
echo "🏗️ Building project..."
yarn build

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p dist/screenshots
mkdir -p dist/logs

echo "✅ Build completed successfully!"