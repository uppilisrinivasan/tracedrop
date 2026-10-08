# TraceDrop Tech Stack: 10x Competition-Ready

**Document Purpose**: Define the technology stack for building TraceDrop as a Docker-deployable consumer platform.

**Status**: Reference for Build Execution

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CONSUMER LAYER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Web App (React/Vite) + Mobile (React Native/PWA)   │   │
│  │  - Home Dashboard, Health Trends, Deferral Flow     │   │
│  │  - Real-time updates via Firestore                  │   │
│  │  - Offline-first capabilities (PWA)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  ORCHESTRATION LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cloud Run: Agentic AI Services (Anthropic SDK)     │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │ Record      │  │ Navigator    │  │ Counsellor │  │   │
│  │  │ Builder     │  │ Agent (ADK)  │  │ Listener   │  │   │
│  │  │ (Multimodal)│  │              │  │            │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │   │
│  │                                                      │   │
│  │  MCP Servers:                                        │   │
│  │  - Maps & Location (facility lookup)                │   │
│  │  - Calendar & Booking (slot management)             │   │
│  │  - WhatsApp/SMS Gateway                             │   │
│  │  - ABHA Integration (future)                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                 │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────┐      │
│  │ Firestore    │  │ BigQuery    │  │ Knowledge      │      │
│  │ (Primary)    │  │ (Analytics) │  │ Graph/Neo4j    │      │
│  │              │  │             │  │ (Ontology)     │      │
│  │ - Donors     │  │ - Funnel    │  │ - Concepts     │      │
│  │ - Findings   │  │ - Metrics   │  │ - Relationships│      │
│  │ - Messages   │  │ - Dashboards│  │ - Embeddings   │      │
│  └──────────────┘  └─────────────┘  └────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Choices

### Frontend (Consumer App)

**Primary Stack**:
- **Framework**: React 19 (latest) with TypeScript
- **Build**: Vite (fast, ES modules)
- **UI Components**: Shadcn/ui or Material-UI v6
- **State**: TanStack Query + Zustand
- **PWA**: Service Worker + Workbox
- **Mobile**: React Native Web (same codebase for web + mobile)

**Why**:
- Next-gen UX that judges want to screenshot
- Real-time updates via Firestore listeners
- Works offline (PWA)
- Responsive design for judge demos

**Key Pages**:
1. Home Screen: Donation date, health status, impact badge
2. Health Dashboard: Trends, findings, care status
3. Deferral Flow: Finding → Explanation → Booking → Confirmation
4. Profile: Data sharing, preferences, reports

---

### Backend (Orchestration & AI)

**Primary Stack**:
- **Runtime**: Node.js 22 LTS (or Python 3.12 for ML-heavy ops)
- **Framework**: Express.js (lightweight) or FastAPI (Python async)
- **AI Integration**: Anthropic SDK + Claude 3.8 Opus/Sonnet
- **Agentic Framework**: Anthropic Agent Development Kit (ADK)
- **MCP Servers**: Custom MCP servers for tools
- **Authentication**: Firebase Auth + JWT
- **Containerization**: Docker + Cloud Run

**Anthropic Integration**:
```typescript
// agent.ts
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicSDK } from "@anthropic-ai/sdk/agents";

const agent = new AnthropicSDK.Agent({
  model: "claude-3-5-sonnet-20241022",
  tools: [
    readRecord,       // Read FHIR observations
    findFacility,    // Maps + AAM/eSanjeevani lookup
    bookSlot,        // Confirm appointment (requires doctor approval)
    scheduleFollowup,// Reminder scheduling
    requestCounselling, // No result disclosure
  ],
  maxTokens: 2048,
  temperature: 0.7,
  systemPrompt: `You are Arjun's health friend. Explain findings in {language}, 
    using his trend data and family history. Sound conversational, not medical. 
    Never say diagnosis words. Always offer "talk to a person".`,
});

// Knowledge graph context
const context = await knowledgeGraph.getContextFor(donor, finding);
agent.setContext(context);

// Rate limiting
const rateLimiter = new RateLimiter({
  key: "sk-Bb_8rImnb79gX0u59rkaQA",
  rpsLimit: 10,  // 10 requests per second
  dailyLimit: 100000,  // tokens per day
});
```

**MCP Servers** (Anthropic Model Context Protocol):
```typescript
// mcp/maps-server.ts
import { MCPServer } from "@anthropic-ai/sdk/mcp";

const server = new MCPServer({
  name: "maps-mcp",
  version: "1.0.0",
});

server.registerTool("find_facility", {
  input: { type: "object", properties: { 
    location: { type: "string" },
    serviceType: { type: "string" }, // "bp_check", "blood_test"
  }},
  handler: async (input) => {
    // Use Google Maps API to find nearest AAM/eSanjeevani
    return {
      facilities: [
        {
          name: "Ayushman Arogya Mandir",
          distance: "2km",
          availableSlots: ["Sat 10am", "Sun 3pm"],
        }
      ]
    };
  }
});

export default server;
```

---

### Data Layer

**Primary Data (Firestore)**:
- Google Cloud Firestore (real-time, scalable)
- Collections: `donors`, `findings`, `communications`, `care_plans`, etc.
- Indexes: Composite indexes for funnel queries
- Real-time listeners for UI updates

**Analytics (BigQuery)**:
- Real-time export from Firestore (via Data Flow)
- Pre-computed funnel metrics
- Dashboard queries (SQL)

**Knowledge Graph (Neo4j or Firestore)**:
- Neo4j for complex relationships (preferred for RAG)
- OR Firestore sub-collections if simpler
- Stores: Concepts, relationships, embeddings

**FHIR Store (Healthcare API)**:
- Google Cloud Healthcare API (for production)
- Emulated in prototype via Firestore
- FHIR Observations, DiagnosticReports, CarePlans

---

### LLM Integration & Rate Limiting

**API Key Management**:
```env
# .env (NOT committed to git)
ANTHROPIC_API_KEY=sk-Bb_8rImnb79gX0u59rkaQA
LLM_RATE_LIMIT_RPS=10
LLM_RATE_LIMIT_TOKENS_PER_DAY=100000
LLM_MODEL=claude-3-5-sonnet-20241022
LLM_TEMPERATURE=0.7
```

**Token Usage Tracking**:
```typescript
// llm/usage-tracker.ts
class UsageTracker {
  async trackCall(donor_id, tokens_used, finding_category) {
    // Log to Firestore + BigQuery
    await db.collection("llm_usage").add({
      donor_id,
      tokens_used,
      finding_category,
      timestamp: new Date(),
      model: "claude-3-5-sonnet",
    });
    
    // Check against daily limit
    const today = await this.getTodayUsage();
    if (today >= DAILY_LIMIT) {
      throw new Error("Daily token limit reached. Use RAG fallback.");
    }
  }
}
```

---

### Ontology & Knowledge Graph

**Graph Structure** (Neo4j):
```
(Donor:Patient) -[HAS]-> (Observation:BP) 
  -[CLASSIFIED_AS]-> (Concept:Hypertension)
  -[MAPPED_TO]-> (Protocol:BP-G1)
  -[LEADS_TO]-> (Action:AAMVisit)
  
(Concept:Hypertension) -[ALIGNS_WITH]-> (ICMR_Guideline)
(Concept:Hypertension) -[HAS_SYMPTOM]-> (Symptom:Headache)
(Concept:Hypertension) -[REQUIRES_TREATMENT]-> (Treatment:Monitoring)
```

**Embeddings** (for RAG):
- Embed all medical concepts, protocols, messages
- Use Anthropic embeddings API or open-source (e.g., sentence-transformers)
- Store in Pinecone or Firestore vectors

**RAG Fallback**:
```typescript
// llm/rag-fallback.ts
async function generateMessageWithRAG(donor, finding) {
  // If LLM unavailable or rate-limited:
  
  // 1. Get similar past messages via embedding
  const similar = await knowledgeGraph.searchSimilar(
    finding.category,
    donor.language,
    topK: 3
  );
  
  // 2. Get protocol rules
  const protocol = await protocolDB.get(finding.protocolApplied);
  
  // 3. Render template + context
  const message = renderTemplate(
    protocol.messageTemplate[donor.language],
    {
      trendData: donor.trends,
      familyHistory: donor.familyHistory,
      exampleMessages: similar,
    }
  );
  
  return message;
}
```

---

### Docker & Deployment

**Dockerfile**:
```dockerfile
# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY package*.json ./
RUN npm install --production
COPY . .

# Stage 3: Runtime
FROM node:22-alpine
WORKDIR /app

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./public

# Copy backend
COPY --from=backend-builder /app/backend ./

# Copy data folder
COPY data/ ./data/

# Environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.js"]
```

**Cloud Run Deployment**:
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/tracedrop-project/app:latest
gcloud run deploy tracedrop-app \
  --image gcr.io/tracedrop-project/app:latest \
  --platform managed \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars ANTHROPIC_API_KEY=${API_KEY},PROJECT_ID=${PROJECT_ID}
```

**Docker Compose (Local Dev)**:
```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - FIRESTORE_EMULATOR_HOST=firestore:8080
  firestore:
    image: oittaa/firestore-emulator:latest
    ports:
      - "8080:8080"
  neo4j:
    image: neo4j:5-community
    ports:
      - "7687:7687"
      - "7474:7474"
    environment:
      - NEO4J_AUTH=none
```

---

### Dev & Testing Stack

**Testing**:
- **Unit**: Jest + React Testing Library
- **Integration**: Vitest + Firestore Emulator
- **E2E**: Playwright
- **LLM Testing**: Anthropic's prompt testing framework

**Monitoring & Observability**:
- **Logging**: Cloud Logging (GCP)
- **Tracing**: Cloud Trace
- **Metrics**: Cloud Monitoring
- **Error Tracking**: Sentry (optional)

---

## Project Structure (Git-Ready)

```
tracedrop/
├── .env.example           # Template, not committed
├── .env                   # Actual secrets (NOT in git)
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
│
├── frontend/              # React app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── DeferralFlow.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   └── vite.config.ts
│
├── backend/               # Node/Express agent services
│   ├── src/
│   │   ├── agents/
│   │   │   ├── navigator-agent.ts
│   │   │   ├── record-builder.ts
│   │   │   └── counsellor-listener.ts
│   │   ├── mcp/
│   │   │   ├── maps-server.ts
│   │   │   ├── booking-server.ts
│   │   │   └── messaging-server.ts
│   │   ├── database/
│   │   │   ├── firestore.ts
│   │   │   ├── knowledge-graph.ts
│   │   │   └── bigquery.ts
│   │   ├── llm/
│   │   │   ├── client.ts
│   │   │   ├── rate-limiter.ts
│   │   │   ├── usage-tracker.ts
│   │   │   └── rag-fallback.ts
│   │   ├── services/
│   │   │   ├── finding-service.ts
│   │   │   ├── booking-service.ts
│   │   │   └── messaging-service.ts
│   │   ├── routes/
│   │   └── server.ts
│   └── package.json
│
├── data/                  # Synthetic data (git-tracked)
│   ├── synthetic/
│   │   ├── fhir-bundles.jsonl.gz  (~5 MB)
│   │   ├── lab-reports/           (redacted PDFs)
│   │   └── README.md
│   ├── protocols/
│   │   └── protocol-rules.json
│   ├── templates/
│   │   ├── messages-hindi.json
│   │   ├── messages-kannada.json
│   │   └── messages-english.json
│   ├── generate.py        # Synthetic data generation
│   ├── render_reports.py  # Lab report rendering
│   └── load.py            # Load to Firestore
│
├── docs/                  # Already exists
│   ├── 03-build/
│   │   ├── architecture.md
│   │   ├── prototype-spec.md
│   │   ├── synthetic-data.md
│   │   ├── protocol-rules.md
│   │   └── [NEW] tech-stack.md
│   │   └── [NEW] data-schema-fhir.md
│   │   └── [NEW] implementation-plan.md
│   └── ...
│
├── .claude/               # Claude Code config
│   └── settings.json
│
└── README.md              # Updated with Docker instructions
```

---

## Build Sequence

### Phase 1: Foundation (Days 1-2)
- [ ] Synthetic data generation & FHIR bundles
- [ ] Firestore schema & collections
- [ ] Knowledge graph seed data
- [ ] Docker setup & local dev env

### Phase 2: Consumer App (Days 3-4)
- [ ] Home screen, health dashboard
- [ ] Deferral flow UI
- [ ] Real-time data binding
- [ ] Mobile-responsive design

### Phase 3: AI Agents (Days 5-6)
- [ ] Record builder (Gemini multimodal)
- [ ] Navigator agent with tools
- [ ] Message generation with ontology
- [ ] Rate limiting & usage tracking

### Phase 4: Integration (Days 7-8)
- [ ] Care booking flow (doctor approval)
- [ ] Follow-up scheduling
- [ ] Counsellor queue & messaging
- [ ] Dashboard & funnel metrics

### Phase 5: Polish & Deployment (Days 9-10)
- [ ] Evaluation harness & testing
- [ ] Security & privacy review
- [ ] Docker build & Cloud Run deploy
- [ ] Demo preparation

---

## Competition Scoring Alignment

✅ **Consumer-Centric**: React UI built for judges to demo  
✅ **Measurable 10x**: BigQuery dashboard with real funnel metrics  
✅ **Gen AI Excellence**: Anthropic ADK + MCP for agentic experience  
✅ **Privacy First**: Deterministic rules, no LLM on sensitive data  
✅ **Extensible**: FHIR + ontology ready for RAG and integration  
✅ **Production-Ready**: Docker, Cloud Run, scalable architecture  

