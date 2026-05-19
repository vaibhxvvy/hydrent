#!/usr/bin/env bash
# HydRent Git Repository Initialization & Push Script
# Usage: bash scripts/init-and-push.sh

set -e

echo "=================================="
echo "HydRent Git Repository Setup"
echo "=================================="

# Check if git is initialized
if [ ! -d .git ]; then
  echo "Initializing Git repository..."
  git init
else
  echo "Git repository already initialized."
fi

# Add all files
echo "Adding files to Git..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  echo "Committing files..."
  git commit -m "feat: initial HydRent platform commit
- Trust-first rent intelligence platform for Hyderabad
- Weighted median aggregation with anomaly resistance
- Programmatic SEO pages for localities, buildings, comparisons
- Community moderation and verification architecture
- Statistical rent analysis (Z-score, IQR, MAD)
- Mobile-first, data-centric design"
fi

# Check if remote origin exists
if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote 'origin' already set."
else
  echo ""
  echo "Please create a new repository on GitHub first."
  echo "Then run: git remote add origin https://github.com/YOUR_USERNAME/hydrent.git"
  echo ""
  exit 1
fi

# Push to main branch
echo "Pushing to origin/main..."
git branch -M main
git push -u origin main

echo ""
echo "=================================="
echo "Push complete!"
echo "View at: $(git remote get-url origin)"
echo "=================================="
