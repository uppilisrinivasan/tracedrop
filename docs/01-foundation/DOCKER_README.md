# TraceDrop Docker Setup - Quick Reference

Complete Docker setup for TraceDrop Phase 1 development environment with multi-stage build, Firestore emulator, and Neo4j knowledge graph.

## Quick Start (30 seconds)

```bash
# 1. Configure environment
cp .env.example .env

# 2. Start services
docker-compose up --build

# 3. Access application
open http://localhost:8080
```

## Services

| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| App | http://localhost:8080 | 8080 | TraceDrop frontend + backend |
| Firestore Emulator | http://firestore:8080 | 8081 | Local database (no GCP needed) |
| Neo4j Browser | http://localhost:7474 | 7474 | Knowledge graph UI |
| Neo4j Bolt | neo4j://localhost:7687 | 7687 | Graph database protocol |

## Health Checks

```bash
# App health
curl http://localhost:8080/api/health

# Expected: {"message": "API is healthy", "version": "1.0.0", ...}
```

## Common Commands

### Start & Stop

```bash
docker-compose up --build        # Start with rebuild
docker-compose up -d             # Start in background
docker-compose down              # Stop all services
docker-compose down -v           # Stop and remove volumes
```

### View Logs

```bash
docker-compose logs -f           # All services
docker-compose logs -f app       # App only
docker-compose logs --tail=100   # Last 100 lines
```

### Development

```bash
# Backend changes auto-reload (nodemon)
docker-compose exec app npm install --prefix backend

# Frontend changes auto-rebuild (Vite)
# Edit backend/src/* or frontend/src/* and see changes live
```

### Execute Commands

```bash
docker-compose exec app sh                    # App shell
docker-compose exec app npm test --prefix backend  # Run tests
docker-compose exec firestore sh              # Firestore shell
```

## Docker Architecture

### Multi-Stage Build

1. **Frontend Builder**: Compiles React with Vite → `dist/`
2. **Backend Builder**: Installs production dependencies only
3. **Runtime**: Alpine base + frontend dist + backend code

**Result**: Minimal, secure image (~200MB)

### Services

```
tracedrop-app (port 8080)
├── Serves frontend from /dist
├── Runs backend on /api/*
├── Connects to firestore:8080
└── Connects to neo4j:7687

firestore (port 8081)
├── Emulator for local testing
├── No authentication needed
└── Data cleared on restart

neo4j (ports 7687, 7474)
├── Knowledge graph database
├── Browser UI on port 7474
└── Persistent volume (neo4j_data)
```

## Environment Variables

**Required:**
- `ANTHROPIC_API_KEY`: Your Anthropic API key

**Optional (with defaults):**
- `NODE_ENV`: `development` (hot reload) or `production`
- `PORT`: `8080`
- `FIRESTORE_EMULATOR_HOST`: `firestore:8080`
- `LLM_RATE_LIMIT_RPS`: `10`
- `LLM_RATE_LIMIT_TOKENS_PER_DAY`: `100000`

See `.env.example` for full list.

## Troubleshooting

### Port Conflict
```bash
# Check what's using port 8080
lsof -i :8080

# Use different port
PORT=3000 docker-compose up
```

### Container Won't Start
```bash
# Full rebuild
docker-compose build --no-cache

# Check logs
docker-compose logs app
```

### Firestore Issues
```bash
# Restart emulator
docker-compose restart firestore

# Clear all data
docker-compose down -v
docker-compose up
```

## File Structure

```
tracedrop/
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Services orchestration
├── .env.example            # Environment template
├── .dockerignore           # Build exclusions
├── backend/
│   ├── package.json        # Dependencies
│   ├── src/
│   │   ├── server.js       # Entry point
│   │   └── ...
│   └── .gitignore
├── frontend/
│   ├── package.json        # React dependencies
│   ├── vite.config.js      # Build config
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   └── ...
│   └── .gitignore
├── data/                   # Shared data
├── docs/
│   └── DOCKER-SETUP.md     # Detailed guide
└── DOCKER_README.md        # This file
```

## Production Deployment

### Build Image
```bash
docker build -t tracedrop:latest .
docker tag tracedrop:latest myregistry/tracedrop:1.0.0
docker push myregistry/tracedrop:1.0.0
```

### Run Container
```bash
docker run -p 8080:8080 \
  -e ANTHROPIC_API_KEY=your-key \
  -e NODE_ENV=production \
  tracedrop:latest
```

## Security

### Development
- Firestore has no authentication
- Neo4j has no authentication
- Good for local testing

### Production
- Use production Firebase
- Enable authentication
- Use environment secret management
- Add HTTPS/TLS
- Implement rate limiting

## Performance

### Current Image Size
- Frontend builder: ~500MB (discarded)
- Backend builder: ~400MB (discarded)  
- **Final image: ~200MB** ✓ (multi-stage benefit)

### Optimization Tips
- Use Alpine base (minimal OS)
- Production dependencies only
- Layer caching for rebuilds
- Health checks for auto-restart

## Key Features

✓ **Multi-stage build** - Minimal final image
✓ **Development volumes** - Hot reload on code changes
✓ **Health checks** - Auto-restart on failure
✓ **Non-root user** - Security best practice
✓ **Signal handling** - Graceful shutdown with dumb-init
✓ **Network isolation** - Services via bridge network
✓ **Persistent volumes** - Neo4j data survives restart

## Next Steps

1. Copy `.env.example` → `.env` and add your API keys
2. Run `docker-compose up --build`
3. Visit http://localhost:8080
4. See `docs/DOCKER-SETUP.md` for detailed guide

---

For detailed documentation, see [DOCKER-SETUP.md](./docs/DOCKER-SETUP.md)
