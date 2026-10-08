# TraceDrop Phase 1 Environment Setup Guide

Complete setup completed for TraceDrop Phase 1 development. This guide walks through getting started.

## ✅ What's Been Created

### Configuration Files (Root)
- **.env.example** - Environment template with all required variables
- **.gitignore** - Git ignore rules for dependencies, logs, OS files
- **Dockerfile** - Multi-stage Docker build (backend + frontend)
- **docker-compose.yml** - Local development services (backend, frontend, Firestore)
- **setup-verify.sh** - Verification script to check setup

### Backend (`backend/`)
```
backend/
├── package.json         - Node.js dependencies
├── tsconfig.json        - TypeScript configuration
└── src/
    ├── server.js        - Express server skeleton
    ├── agents/          - Anthropic ADK agents (empty)
    ├── database/        - Firestore & knowledge graph
    ├── llm/             - LLM client & rate limiting
    ├── services/        - Business logic (empty)
    ├── routes/          - API endpoints (empty)
    └── middleware/      - Express middleware (empty)
```

### Frontend (`frontend/`)
```
frontend/
├── package.json         - React dependencies (React 19, Vite)
├── vite.config.ts       - Vite build configuration
├── tsconfig.json        - TypeScript configuration
├── index.html           - HTML entry point
└── src/
    ├── App.tsx          - Main React component
    ├── main.tsx         - React entry point
    ├── App.css          - App styles
    ├── index.css        - Global styles
    ├── pages/           - Route pages (empty)
    ├── components/      - Reusable UI components (empty)
    ├── hooks/           - React hooks (empty)
    ├── services/        - API client (empty)
    ├── types/           - TypeScript types (empty)
    └── public/          - Static assets (empty)
```

### Data (`data/`)
```
data/
├── synthetic/           - Generated FHIR bundles (pre-populated)
├── ontology/           - Medical ontology (empty)
├── protocols/          - Protocol rules (empty)
├── templates/          - Message templates (empty)
├── generate.py         - Data generation script
└── load.py             - Firestore loader
```

### Documentation
- **README.md** - Updated with setup and project structure
- **BUILD_START.md** - Team orientation guide (pre-existing)
- **docs/** - Comprehensive documentation structure

---

## 🚀 Getting Started

### Step 1: Copy Environment File
```bash
cp .env.example .env
```

### Step 2: Add Your API Key
```bash
# Edit .env and add your Anthropic API key
# ANTHROPIC_API_KEY=sk-your-actual-key-here
```

### Step 3: Verify Setup
```bash
bash setup-verify.sh
```

Expected output: All checks should pass (✓), except `.env` warning which is expected.

### Step 4a: Run with Docker (Recommended)
```bash
docker-compose up --build
```

This starts:
- Backend API on http://localhost:8080
- Frontend on http://localhost:5173 (dev mode)
- Firestore emulator on localhost:8081

### Step 4b: Run Locally (without Docker)

**Backend:**
```bash
cd backend
npm install
npm run dev
```
Runs on http://localhost:8080

**Frontend (in another terminal):**
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173

### Step 5: Access the Application
- **Frontend:** http://localhost:8080 (production) or http://localhost:5173 (dev)
- **API Health Check:** http://localhost:8080/api/health
- **Backend API:** http://localhost:8080/api

---

## 📝 Environment Variables

See `.env.example` for template. Key variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | Claude API key (REQUIRED) | - |
| `LLM_MODEL` | Model to use | claude-3-5-sonnet-20241022 |
| `LLM_RATE_LIMIT_RPS` | Requests per second | 10 |
| `LLM_RATE_LIMIT_TOKENS_PER_DAY` | Daily token limit | 100000 |
| `NODE_ENV` | Environment | development |
| `PORT` | Backend port | 8080 |
| `DEBUG` | Debug logging | false |
| `GCP_PROJECT` | GCP project ID | tracedrop-project |
| `FIRESTORE_EMULATOR_HOST` | Firestore emulator | localhost:8080 |

---

## 🎯 Development Workflow

### Adding Dependencies

**Backend:**
```bash
cd backend
npm install express-new-package
```

**Frontend:**
```bash
cd frontend
npm install react-new-hook
```

### Running Tests
```bash
cd backend
npm test

cd frontend
npm test  # When configured
```

### Linting & Type Checking
```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run type-check
```

### Building for Production
```bash
# Backend (Node.js runs JS directly)
cd backend
npm start

# Frontend
cd frontend
npm run build
# Output in frontend/dist/
```

---

## 🔍 Troubleshooting

### Docker Issues
```bash
# Clean rebuild
docker-compose down -v
docker-compose up --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Port Already in Use
```bash
# Find process on port 8080
lsof -i :8080

# Or use different port in .env
PORT=8081
```

### Node Modules Issues
```bash
# Clear and reinstall
rm -rf backend/node_modules frontend/node_modules
npm install --prefix backend
npm install --prefix frontend
```

### Firestore Emulator Connection
- Check `FIRESTORE_EMULATOR_HOST` is set correctly in `.env`
- Docker Compose should handle this automatically
- For local development, start emulator separately if needed

---

## 📚 Next Steps

1. **Understand the architecture:** Review `/docs/03-build/architecture.md`
2. **Review team roles:** Read `BUILD_START.md` for task assignments
3. **Start building:**
   - **Days 1-2:** Foundation (data schema, models)
   - **Days 3-4:** Consumer app (React UI)
   - **Days 5-6:** AI agents (Navigator, messages)
   - **Days 7-8:** Integration (workflows)
   - **Days 9-10:** Testing & deployment

---

## 🔗 Key Resources

- **Project Status:** `/docs/00-project-status/README.md`
- **Build Timeline:** `/docs/03-build/prototype-spec.md`
- **Architecture:** `/docs/03-build/architecture.md`
- **User Perspectives:** `/docs/PERSPECTIVES_MASTER_GUIDE.md`
- **Team Orientation:** `/BUILD_START.md`

---

## ✨ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Vite + TypeScript | Consumer UI |
| **Backend** | Node.js/Express + TypeScript | API server |
| **AI** | Anthropic Claude ADK | Agent orchestration |
| **Database** | Firestore (emulator for dev) | Data persistence |
| **Build** | Docker + Docker Compose | Local development |

---

**Status:** Environment setup complete. Team ready to build Day 1.  
**Deadline:** October 18, 2026
