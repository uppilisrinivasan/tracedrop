# TraceDrop: Your Health. Your Blood. Your Data.

**Consumer-centric health platform powered by the donation cycle**

Every blood donation is a health check. TraceDrop makes sure every finding matters by putting the donor in control.

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Anthropic API key

### Setup
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Add your API key to .env
# Edit .env and set ANTHROPIC_API_KEY=sk-your-key

# 3. Verify setup
bash setup-verify.sh

# 4. Start development
docker-compose up --build

# 5. Access
- Frontend: http://localhost:8080
- API: http://localhost:8080/api/health
- Frontend dev: http://localhost:5173 (Vite)
```

### Local Installation (without Docker)
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
tracedrop/
├── backend/                 # Node.js/Express + Anthropic ADK
│   ├── src/
│   │   ├── agents/         # AI agent implementations
│   │   ├── database/       # Firestore & knowledge graph
│   │   ├── llm/            # LLM client & rate limiting
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Express middleware
│   │   └── server.js       # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                # React 19 + Vite
│   ├── src/
│   │   ├── pages/          # Route pages
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # React hooks
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── data/                    # Data layer
│   ├── synthetic/          # Generated FHIR bundles
│   ├── ontology/           # Medical ontology
│   ├── protocols/          # Protocol rules
│   ├── templates/          # Message templates
│   ├── generate.py         # Data generator
│   └── load.py             # Load to Firestore
│
├── docs/                    # Project documentation
│   ├── 00-project-status/  # Project overview
│   ├── 01-team-perspectives/
│   ├── 02-user-perspectives/
│   ├── 03-build/
│   ├── 04-components/
│   ├── 05-features/
│   └── PERSPECTIVES_MASTER_GUIDE.md
│
├── docker-compose.yml      # Multi-service compose
├── Dockerfile              # Multi-stage build
├── .env.example            # Environment template
├── .gitignore
├── BUILD_START.md          # Team orientation guide
└── README.md               # This file
```

---

## 📖 Documentation Structure

**All project documentation is organized in `/docs/`:**

- **[/docs/00-project-status/](docs/00-project-status/)** ← Start here for project overview
  - Strategy status, timelines, folder organization
  
- **[/docs/01-problem-brief.md](docs/01-problem-brief.md)** - Problem analysis & market size
  
- **[/docs/02-pitch/](docs/02-pitch/)** - Pitch deck & narrative
  - Consumer-centric slides with ecosystem diagram
  
- **[/docs/03-build/](docs/03-build/)** - Build specifications
  - Prototype spec & architecture (consumer-first design)
  
- **[/docs/BUILD_START.md](BUILD_START.md)** - Team roles and entry points

---

## 🛠 Development Commands

### Backend
```bash
cd backend

# Development
npm run dev

# Production
npm start

# Testing
npm test

# Linting
npm run lint
```

### Frontend
```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build

# Preview build
npm run preview

# Type checking
npm run type-check
```

---

## 🎯 Build Timeline (Days 1-10)

| Days | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | Foundation | Data schema, Firestore, Docker setup |
| 3-4 | Consumer App | React UI, dashboard, deferral flow |
| 5-6 | AI Agents | Navigator agent, message generation |
| 7-8 | Integration | Care booking, follow-up workflows |
| 9-10 | Testing & Deploy | E2E tests, production deployment |

See [BUILD_START.md](BUILD_START.md) for team roles and specific entry points.

---

## 🎯 The 10x Insight

**Donors at center, not margin.**

The ecosystem shows:
- **Donor in center** (blue circle)
- **Direct benefits flow to donors** (control over health data)
- **Institutional benefits flow from donor success** (supply, trust)
- **Result: All win when donor wins**

This consumer-centric positioning is the differentiator for the competition.

---

## 📝 Environment Variables

See `.env.example` for all configuration options. Key variables:

- `ANTHROPIC_API_KEY` - Claude API key (required)
- `LLM_MODEL` - Model to use (default: claude-3-5-sonnet-20241022)
- `LLM_RATE_LIMIT_RPS` - Rate limit in requests/second
- `NODE_ENV` - Environment (development/production)
- `PORT` - Backend port (default: 8080)

---

## 🔗 Key Links

- **Strategy:** [Consumer-Centric 10x Vision](memory/consumer-centric-10x-vision.md)
- **Build Guide:** [BUILD_START.md](BUILD_START.md)
- **User Perspectives:** [PERSPECTIVES_MASTER_GUIDE.md](docs/PERSPECTIVES_MASTER_GUIDE.md)

---

**Status:** Phase 1 environment scaffolding complete. Ready to build.  
**Deadline:** October 18, 2026  
**Next:** Follow BUILD_START.md for team role assignments and building Day 1.
