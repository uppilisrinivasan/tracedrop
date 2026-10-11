# TraceDrop: Quick Start Guide

**Get the app running locally in 15 minutes.**

---

## Step 1: Create .env (2 min)

```bash
cat > .env << 'EOF'
ANTHROPIC_API_KEY=sk-Bb_8rImnb79gX0u59rkaQA
LLM_RATE_LIMIT_RPS=10
LLM_RATE_LIMIT_TOKENS_PER_DAY=100000
GCP_PROJECT=tracedrop-project
FIRESTORE_EMULATOR_HOST=localhost:8080
NODE_ENV=development
EOF

# Verify not committed
grep ".env" .gitignore || echo ".env" >> .gitignore
```

## Step 2: Install Dependencies (5 min)

```bash
npm install
```

## Step 3: Start Services (8 min)

```bash
docker-compose up --build
```

**Wait for output**:
```
tracedrop-app is listening on port 8080
Firestore emulator started at localhost:8080
Neo4j started at localhost:7687
```

## Step 4: Access App

In new terminal:
```bash
cd frontend
npm run dev
```

Then visit:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080
- **Firestore**: http://localhost:8080

---

## That's It!

You now have:
- ✅ React app running
- ✅ Node.js backend running
- ✅ Firestore emulator running
- ✅ Neo4j running
- ✅ Local development environment ready

---

## Next: Read the Plan

1. Open `BUILD_PLAN.md` (this folder, root level)
2. Assign roles (30 min)
3. Start Phase 1 work

---

## Troubleshooting

**Docker not running?**
```bash
docker-compose up --build
```

**Port already in use?**
```bash
lsof -i :8080  # Check what's using it
kill -9 <PID>  # Kill the process
docker-compose up --build
```

**Dependencies not installed?**
```bash
npm install
npm run build
```

---

**Questions?** See `BUILD_PLAN.md` FAQ section.

