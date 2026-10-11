#!/bin/bash
set -e

echo "=========================================="
echo "  TraceDrop Environment Setup Verification"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_success() {
  echo -e "${GREEN}✓${NC} $1"
}

check_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

check_error() {
  echo -e "${RED}❌${NC} $1"
}

# Check Node.js
echo "Checking prerequisites..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  check_success "Node.js installed: $NODE_VERSION"
else
  check_error "Node.js not installed"
  exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version)
  check_success "Docker installed: $DOCKER_VERSION"
else
  check_error "Docker not installed"
fi

echo ""
echo "Checking configuration files..."

# Check .env
if [ -f .env ]; then
  check_success ".env exists"
else
  if [ -f .env.example ]; then
    check_warning ".env not found (run: cp .env.example .env)"
  else
    check_error ".env.example not found"
  fi
fi

echo ""
echo "Checking directory structure..."

# Check folders
REQUIRED_DIRS=(
  "backend/src"
  "backend/src/agents"
  "backend/src/database"
  "backend/src/llm"
  "backend/src/services"
  "backend/src/routes"
  "backend/src/middleware"
  "frontend/src"
  "frontend/src/pages"
  "frontend/src/components"
  "frontend/src/hooks"
  "frontend/src/services"
  "frontend/src/types"
  "frontend/public"
  "data/synthetic"
  "data/ontology"
  "data/protocols"
  "data/templates"
  "docs"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    check_success "$dir exists"
  else
    check_error "$dir not found"
  fi
done

echo ""
echo "Checking key files..."

REQUIRED_FILES=(
  "backend/package.json"
  "backend/src/server.js"
  "backend/tsconfig.json"
  "frontend/package.json"
  "frontend/vite.config.ts"
  "frontend/tsconfig.json"
  "docker-compose.yml"
  "Dockerfile"
  ".env.example"
  ".gitignore"
  "README.md"
  "BUILD_START.md"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    check_success "$file exists"
  else
    check_error "$file not found"
  fi
done

echo ""
echo "=========================================="
echo "  Setup Verification Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env: cp .env.example .env"
echo "  2. Add your ANTHROPIC_API_KEY to .env"
echo "  3. Install dependencies:"
echo "     - cd backend && npm install"
echo "     - cd ../frontend && npm install"
echo "  4. Start with Docker: docker-compose up --build"
echo "  5. Access at http://localhost:8080"
echo ""
