# Docker Setup Guide for TraceDrop Phase 1

This guide provides instructions for running TraceDrop in a containerized development environment using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 1.29 or higher)
- Node.js 22+ (optional, for local development without containers)

## Project Structure

```
tracedrop/
├── Dockerfile              # Multi-stage build configuration
├── docker-compose.yml      # Local development environment
├── .env.example            # Environment variables template
├── .dockerignore           # Files to exclude from Docker build
├── backend/
│   ├── package.json        # Backend dependencies
│   ├── src/
│   │   └── server.js       # Express server entry point
│   └── .gitignore
├── frontend/
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.js      # Vite configuration
│   ├── index.html          # HTML entry point
│   ├── src/
│   │   ├── main.jsx        # React entry point
│   │   ├── App.jsx         # Main App component
│   │   ├── App.css         # App styles
│   │   └── index.css       # Global styles
│   └── .gitignore
└── data/                   # (Optional) Data files
```

## Quick Start

### 1. Clone or Setup Repository

```bash
cd /path/to/tracedrop
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` to set your API keys and configuration:

```env
ANTHROPIC_API_KEY=your-api-key-here
NODE_ENV=development
PORT=8080
FIRESTORE_EMULATOR_HOST=firestore:8080
```

### 3. Start Services

```bash
docker-compose up --build
```

This command:
- Builds the multi-stage Docker image
- Starts three services:
  - **app**: TraceDrop backend and frontend
  - **firestore**: Firestore emulator for local testing
  - **neo4j**: Knowledge graph database (optional)

### 4. Access the Application

- **Web App**: http://localhost:8080
- **API Health Check**: http://localhost:8080/health
- **API Base**: http://localhost:8080/api
- **Firestore Emulator UI**: http://localhost:8080 (via emulator)
- **Neo4j Browser**: http://localhost:7474

## Services

### App Service

The main TraceDrop application running on port 8080.

**Configuration:**
- Base Image: `node:22-alpine`
- Working Directory: `/app`
- Port: 8080 (HTTP)
- Environment:
  - `NODE_ENV`: development or production
  - `PORT`: 8080
  - `FIRESTORE_EMULATOR_HOST`: firestore:8080
  - Other API keys and configuration

**Volumes (Development):**
- `./backend:/app/backend` - Backend code for hot reload
- `./frontend:/app/frontend` - Frontend code for hot reload

**Commands:**
```bash
# In development
npm run dev --prefix backend

# In production
node backend/src/server.js
```

### Firestore Service

Firebase Firestore emulator for local development without GCP credentials.

**Configuration:**
- Image: `oittaa/firestore-emulator:latest`
- Port: 8080 (HTTP)
- Environment: `FIRESTORE_EMULATOR_HOST=0.0.0.0:8080`

**Usage:**
- No authentication required
- Data is ephemeral (cleared on container restart)
- Perfect for development and testing

### Neo4j Service

Knowledge graph database (optional but preconfigured).

**Configuration:**
- Image: `neo4j:5-community`
- Ports:
  - 7687: Bolt protocol
  - 7474: Web UI
- Environment: `NEO4J_AUTH=none` (no authentication)

**Usage:**
- Access web UI: http://localhost:7474
- Connection: `neo4j://neo4j:7687`
- Data persists in volume: `neo4j_data`

## Docker Commands

### Start Services

```bash
# Build and start services
docker-compose up --build

# Start in background
docker-compose up -d

# Start specific service
docker-compose up app
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop app
```

### View Logs

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100
```

### Execute Commands

```bash
# Run command in app container
docker-compose exec app sh

# Run npm command in backend
docker-compose exec app npm run test --prefix backend

# Access Node REPL
docker-compose exec app node
```

### Rebuild

```bash
# Rebuild image after code changes
docker-compose build --no-cache

# Rebuild and restart
docker-compose up --build --force-recreate
```

## Multi-Stage Build Explanation

The `Dockerfile` uses three build stages for optimal image size and security:

### Stage 1: Frontend Builder
- Base: `node:22-alpine`
- Installs frontend dependencies
- Builds React app to `dist/` folder
- Output: Compiled static assets

### Stage 2: Backend Builder
- Base: `node:22-alpine`
- Installs production dependencies only
- Output: Optimized `node_modules/`

### Stage 3: Runtime
- Base: `node:22-alpine`
- Copies frontend `dist/` to public serving directory
- Copies backend code
- Copies backend production dependencies
- Sets up health checks
- Uses `dumb-init` for proper signal handling
- Minimal final image size

**Benefits:**
- Frontend build artifacts don't bloat final image
- Only production dependencies in final image
- No build tools in production
- Efficient layer caching

## Environment Variables

### Required

- `ANTHROPIC_API_KEY`: Your Anthropic API key for LLM features

### Optional (with Defaults)

- `NODE_ENV`: `development` (for hot reload) or `production`
- `PORT`: `8080`
- `FIRESTORE_EMULATOR_HOST`: `localhost:8080` (for local Firestore)
- `LLM_RATE_LIMIT_RPS`: `10` (requests per second)
- `LLM_RATE_LIMIT_TOKENS_PER_DAY`: `100000`
- `NEO4J_AUTH`: `none` (no authentication for local development)

## Health Checks

All services include health checks:

```bash
# Check app health
curl http://localhost:8080/health

# Expected response
{
  "status": "ok",
  "timestamp": "2024-10-08T12:00:00.000Z",
  "environment": "development"
}

# Check API health
curl http://localhost:8080/api/health

# Expected response
{
  "message": "API is healthy",
  "version": "1.0.0",
  "timestamp": "2024-10-08T12:00:00.000Z"
}
```

## Development Workflow

### 1. Code Changes

Edit files in `backend/src/` or `frontend/src/`. Changes are reflected immediately due to volume mounts.

### 2. Backend Development

```bash
# The app runs with nodemon for auto-reload on changes
docker-compose logs -f app

# Or install backend dependencies
docker-compose exec app npm install --prefix backend
```

### 3. Frontend Development

```bash
# Frontend rebuilds automatically with Vite
# Changes visible after browser refresh

# Or access dev server directly (if enabled)
# http://localhost:5173
```

### 4. Testing

```bash
# Run backend tests
docker-compose exec app npm test --prefix backend

# Access container shell
docker-compose exec app sh
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Use different port
PORT=3000 docker-compose up
```

### Services Not Starting

```bash
# Check logs
docker-compose logs

# Rebuild without cache
docker-compose build --no-cache

# Remove dangling images
docker image prune
```

### Firestore Emulator Issues

```bash
# Restart emulator
docker-compose restart firestore

# Clear emulator data
docker-compose down -v
docker-compose up
```

### Neo4j Issues

```bash
# Check Neo4j logs
docker-compose logs neo4j

# Restart service
docker-compose restart neo4j

# Clear data and restart
docker-compose down -v
docker-compose up neo4j
```

### Build Failures

```bash
# Check build logs
docker-compose build --no-cache --progress=plain

# Verify files exist
ls -la backend/package.json
ls -la frontend/package.json
```

## Production Deployment

### Build Image Manually

```bash
docker build -t tracedrop:latest .
```

### Run Container

```bash
docker run -p 8080:8080 \
  -e ANTHROPIC_API_KEY=your-key \
  -e NODE_ENV=production \
  -e FIRESTORE_EMULATOR_HOST=firestore:8080 \
  tracedrop:latest
```

### Push to Registry

```bash
docker tag tracedrop:latest myregistry/tracedrop:latest
docker push myregistry/tracedrop:latest
```

## Performance Optimization

### Image Size

Current image size with multi-stage build:
- Frontend builder: ~500MB (discarded)
- Backend builder: ~400MB (discarded)
- Final image: ~200MB (approximately)

### Build Cache

- Leverage Docker layer caching
- Copy `package.json` before source code
- Rebuild only changed layers

### Runtime Performance

- Use Alpine Linux for minimal base image
- Production dependencies only
- Health checks for orchestration

## Networking

### Docker Compose Network

All services connected via `tracedrop-network` bridge:

```
app (8080) <-> firestore (8080) <-> neo4j (7687, 7474)
```

### Service Discovery

Services can reference each other by name:
- `http://firestore:8080` (from app)
- `neo4j://neo4j:7687` (from app)

## Security Considerations

### Development

- Firestore emulator has no authentication
- Neo4j has no authentication
- Environment variables should not include real API keys in `.env`

### Production

- Use environment variable management system
- Never commit `.env` file
- Use production Firebase/Firestore
- Enable Neo4j authentication
- Use HTTPS
- Implement rate limiting
- Add API authentication

## Maintenance

### Update Dependencies

```bash
# Backend
docker-compose exec app npm update --prefix backend

# Frontend
docker-compose exec app npm update --prefix frontend
```

### Clean Up

```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Complete cleanup
docker-compose down -v
docker system prune -a --volumes
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Alpine Image](https://hub.docker.com/_/node)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Docker and service logs
3. Verify environment configuration
4. Check file structure matches documentation
