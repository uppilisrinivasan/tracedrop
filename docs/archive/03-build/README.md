# Architecture & Build Documentation

Technical architecture and implementation guides for all phases.

## Architecture

### [ARCHITECTURE.md](ARCHITECTURE.md)
Complete system architecture covering:
- 3-layer architecture (Consumer, Orchestration, Data)
- Component breakdown by tier
- Technology stack
- Integration patterns
- Scalability design

## Phase-Specific Implementation Guides

### [PHASE_2_CONSUMER_APP.md](PHASE_2_CONSUMER_APP.md)
React consumer app architecture and components.
- Page structure (Home, Dashboard, Deferral)
- Component design (TrendChart, FindingCard, etc.)
- Hooks & services (Firestore integration)
- Multi-language support
- Styling with TailwindCSS
- Performance optimization

### [PHASE_3_AI_AGENTS.md](PHASE_3_AI_AGENTS.md)
AI agents and Anthropic ADK integration.
- Navigator agent (decision making)
- Message generator (personalized messaging)
- Record builder (multimodal input)
- Rate limiting & budget management
- Protocol engine (11 clinical protocols)
- LLM integration with Claude 3.5 Sonnet
- Fallback system (templates + ontology)
- API endpoints with authentication

### [PHASE_4_INTEGRATION.md](PHASE_4_INTEGRATION.md)
Integration system and dashboards.
- Booking service (care partner search & scheduling)
- Follow-up tracking (90-day outcomes)
- Counsellor queue management (confidential)
- Doctor console (care plan management)
- Funnel analytics (proving 2.8x improvement)
- Multi-role access control
- Report generation

### [PHASE_5_DEPLOYMENT.md](PHASE_5_DEPLOYMENT.md)
Testing, security, and deployment.
- Unit testing strategy (85%+ coverage)
- Integration testing flows
- Security audit & GDPR compliance
- Performance testing results
- Cloud Run deployment
- Production checklist
- Demo preparation

---

## 📚 Technical References

**Frontend:**
- React 19 + Vite 5 + TypeScript 5
- TailwindCSS for styling
- Zustand for state management
- Recharts for data visualization
- React Query for data fetching

**Backend:**
- Node.js 20 + Express
- Firebase Admin SDK (Firestore)
- Anthropic SDK (Claude API)
- Bottleneck (rate limiting)
- Jest for testing

**Database:**
- Firestore (real-time primary database)
- BigQuery (analytics)
- Neo4j (optional knowledge graph)
- Redis (caching, optional)

**Deployment:**
- Docker containerization
- Cloud Run hosting
- CI/CD ready

---

## 🔍 Code Organization

```
backend/src/
├── agents/                  # AI agents (Navigator, MessageGen, RecordBuilder)
├── llm/                     # LLM integration (rate limiting, client, templates)
├── services/                # Business logic (booking, follow-ups, ontology)
├── routes/                  # API endpoints
├── middleware/              # Auth, error handling
├── database/                # Firestore schema + knowledge graph
├── types/                   # TypeScript interfaces
└── utils/                   # Protocols, formatting, helpers

frontend/src/
├── pages/                   # Home, Dashboard, Deferral, Admin, Doctor, Counsellor
├── components/              # Reusable UI components
├── hooks/                   # Custom React hooks
├── services/                # API clients
├── types/                   # TypeScript interfaces
└── styles/                  # Theme, global styles
```

---

**Next**: Choose your path:
- [Judge evaluation?](../04-guide/HOW_TO_EVALUATE.md)
- [Demo walkthrough?](../04-guide/DEMO_SCRIPT.md)
- [Deployment guide?](../04-guide/PRODUCTION_CHECKLIST.md)
