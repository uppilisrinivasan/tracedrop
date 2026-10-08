# Infrastructure Lead Perspective

**Role Summary**: Deploy production-ready, secure, scalable system on Docker + Cloud Run that judges can click and trust.

---

## Primary Goals

- Build **Docker multi-stage container** (separate build + runtime, optimized size)
- Achieve **0 security vulnerabilities** in the deployed image
- Deploy to **Google Cloud Run** with live URL judges can click
- Ensure **<100ms p90 latency** (responsive, not sluggish)
- Maintain **99.9% uptime** (SLA-grade reliability)

---

## Perspective on Solution

As Infrastructure Lead, I see the deployment as proof of production readiness:

**The Fragile Trap**: Other solutions:
- Require manual setup steps ("Run these 5 commands first")
- Have security issues ("We'll fix vulnerabilities after competition")
- Work locally but fail in production ("It works on my machine")
- Are optimized for demos, not scale ("Handles 10 users, not 1,000")

**Our Win**: Infrastructure disappears into background:
- **Single command**: `docker-compose up --build` (dev) and `gcloud run deploy` (prod)
- **No secrets in code**: Environment variables only
- **Automatic security scanning**: Trivy scans image for vulnerabilities pre-deploy
- **Load-tested**: Verified to handle 1,000 concurrent users
- **Observability**: Logs, metrics, errors visible and auditable

**Why It Matters for Winning**:
- Judges click the URL. If it's slow or down, -2 points.
- Judges check deployment. If it looks amateur (manual setup), -1 point.
- Judges ask: "How does this scale?" If you don't know, -0.5 points.
- Production-ready infrastructure = credibility on all other claims.

---

## Key Decisions They Make

1. **Docker Architecture (Multi-Stage Build)**
   - **Stage 1: Build**
     - Base: `node:20-alpine` (small, secure)
     - Copy package.json, install dependencies
     - Build React frontend (Vite)
     - Size: ~500MB (temporary)
   
   - **Stage 2: Runtime**
     - Base: `node:20-alpine` (minimal runtime)
     - Copy built artifacts + node_modules from stage 1
     - Copy .env (from Docker secrets or Cloud Run env vars, NOT in image)
     - Expose port 8080
     - Health check: `curl http://localhost:8080/health`
     - Size: ~180MB (optimized)
   
   - **Dockerfile Structure**:
     ```dockerfile
     FROM node:20-alpine AS build
     WORKDIR /app
     COPY package*.json ./
     RUN npm ci --omit=dev
     COPY . .
     RUN npm run build
     
     FROM node:20-alpine
     WORKDIR /app
     COPY --from=build /app/node_modules ./node_modules
     COPY --from=build /app/dist ./dist
     COPY server.js .
     EXPOSE 8080
     HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
       CMD curl -f http://localhost:8080/health || exit 1
     CMD ["node", "server.js"]
     ```

2. **Security Hardening**
   - **Image Scanning**: Trivy before push
     - Check for known vulnerabilities in base image + dependencies
     - Fail build if critical/high severity found
     - Fix: Update base image (latest Alpine) or dependency version
   
   - **Secrets Management**:
     - No secrets in code or Dockerfile
     - `.env` file (local dev only, Git-ignored)
     - Cloud Run env vars for production (via gcloud CLI)
     - Anthropic API key stored in Google Secret Manager
   
   - **Network Security**:
     - Firestore behind IAM (service account credentials)
     - No world-readable endpoints (except `/health`)
     - CORS restricted to frontend domain only
     - Rate limiting on API endpoints (10 RPS default)
   
   - **Runtime Hardening**:
     - Non-root user in container (USER node)
     - Read-only file system where possible
     - Drop unnecessary capabilities

3. **Google Cloud Run Deployment**
   - **Build & Deploy Pipeline**:
     ```bash
     # Build image
     docker build -t gcr.io/tracedrop-project/app:latest .
     
     # Push to Artifact Registry
     docker push gcr.io/tracedrop-project/app:latest
     
     # Deploy to Cloud Run
     gcloud run deploy tracedrop-app \
       --image gcr.io/tracedrop-project/app:latest \
       --platform managed \
       --region us-central1 \
       --memory 2Gi \
       --cpu 2 \
       --concurrency 100 \
       --set-env-vars \
         ANTHROPIC_API_KEY=sk-... \
         FIRESTORE_PROJECT=tracedrop-project \
         ENVIRONMENT=production
     ```
   
   - **Post-Deploy Verification**:
     - Check `/health` endpoint returns 200 OK
     - Log into app, verify home screen loads
     - Check BigQuery for successful events
     - Monitor Cloud Run logs for errors

4. **Performance Optimization**
   - **Frontend**:
     - Vite with production build (tree-shaking, minification)
     - Images optimized + served from CDN
     - Service Worker caching (app shell + static assets)
     - Lazy loading (code splitting by route)
   
   - **Backend**:
     - Node cluster mode (multi-process, use all CPU cores)
     - Connection pooling (Firestore SDK + BigQuery)
     - Response caching (HTTP headers for browser cache)
     - Gzip compression on all responses
   
   - **Database**:
     - Firestore indexes on critical queries (created at deploy)
     - BigQuery partitioning (query only recent data)
     - Connection limits respected (not overwhelm services)

5. **Monitoring & Alerting**
   - **Logs** (Cloud Logging):
     - All requests logged (method, path, latency, status)
     - Errors logged with stack traces
     - LLM calls logged for audit
     - Retention: 90 days for debuggability
   
   - **Metrics** (Cloud Monitoring):
     - p50/p90/p99 latency (should see <100ms p90)
     - Error rate (should be <0.1%)
     - CPU/memory usage (alerts if >80%)
     - Concurrency (alerts if >80% of limit)
   
   - **Alerts** (Configured):
     - Error rate >1% → PagerDuty notification
     - Latency p90 >500ms → investigate
     - Service down (health check fails) → immediate alert
     - Daily digest (errors, top slow endpoints)

6. **Scaling & Load Testing**
   - **Horizontal Scaling**: Cloud Run auto-scales
     - 1 instance baseline
     - Auto-scales to 10 instances under load
     - Each instance handles 100 concurrent requests
   
   - **Load Test** (Locust):
     - Simulate 1,000 concurrent users
     - Ramp up over 5 minutes
     - Run for 15 minutes
     - Verify p90 <100ms throughout
     - Verify 0 failed requests
   
   - **Failure Modes Tested**:
     - Firestore down → graceful degradation + fallback
     - LLM rate-limited → queue + retry
     - Network latency spike → timeouts handled
     - Memory pressure → container restarts (no OOM)

7. **Disaster Recovery & Backup**
   - **Data Backup**:
     - Firestore automated backups (Google manages)
     - BigQuery tables versioned (snapshots daily)
     - Code backed up in Git (all versions recoverable)
   
   - **Rollback Strategy**:
     - Keep previous image in Artifact Registry
     - Can rollback in 2 minutes (redeploy old image)
     - Blue-green deployment (new version runs, old still live)
   
   - **Failover**:
     - If instance crashes, Cloud Run auto-restarts
     - If region down (unlikely), manual failover to backup region
     - SLA: 99.9% uptime target (43 minutes/month max downtime)

---

## Concerns They Have

### Security Vulnerabilities
**What if the image has a high-severity vulnerability?** Security score drops, judges unimpressed.
- *Mitigation*: 
  - Trivy scans pre-deploy
  - Weekly dependency updates (npm audit)
  - Base image kept current
  - Pre-deployment security review

### Performance Degradation Under Load
**What if 1,000 concurrent users hit the app and it gets slow?** Judges notice slowness.
- *Mitigation*:
  - Load test to 1,000 concurrent, verify <100ms p90
  - Cache aggressively (browser cache + server-side)
  - Connection pooling (don't exhaust DB connections)
  - Circuit breaker (fail fast if backend down)

### Cloud Run Deployment Failure
**What if `gcloud run deploy` fails 2 hours before demo?** Panic.
- *Mitigation*:
  - Dry-run deployment 1 week before demo
  - Keep rollback plan ready
  - Test all environment variables in staging
  - Have backup Cloud Run service on standby

### Cold Start Latency
**What if the instance takes 5 seconds to warm up?** Judges see slow first request.
- *Mitigation*:
  - Keep 1 instance always warm (minimum concurrency = 1)
  - Optimize Node startup (no heavy initialization)
  - Preload critical data (cache warm on startup)

### Data Privacy Breach
**What if API logs expose real donor data?** Compliance + credibility failure.
- *Mitigation*:
  - Log only metadata (finding_id, not finding content)
  - Redact sensitive fields (never log names, addresses)
  - Audit logs weekly (grep for PII)
  - Encryption at rest + in transit (TLS)

### Cost Overrun
**What if infrastructure costs $500+ during competition?** Budget exceeded.
- *Mitigation*:
  - Cloud Run pricing: pay-per-request + memory (cheap)
  - Estimate: <$50 for entire competition if demo traffic only
  - Set budget alerts in GCP console ($100 max)
  - Firestore: read/write ops cost pennies at demo scale

---

## Success Metrics

### Zero Security Vulnerabilities
- **Target**: Trivy scan shows 0 high/critical issues
- **Evidence**: Trivy report before deployment
- **Judgment**: Security = trust

### Response Latency
- **Target**: p90 <100ms under production load
- **Tested**: Locust load test with 1,000 concurrent users
- **Tracked**: Cloud Monitoring dashboard (live latency visible)
- **Judgment**: Responsiveness = professional execution

### Uptime
- **Target**: 99.9% uptime (43 min/month max downtime)
- **Tracked**: Cloud Run health checks + error rates
- **Judgment**: Reliability = enterprise-grade

### Deployment Time
- **Target**: Deploy takes <5 minutes end-to-end
- **Tested**: Time from code commit to live URL
- **Judgment**: Fast deploy = agility + iteration speed

### Security Audit Pass
- **Target**: Pre-deployment security review finds 0 issues
- **Checks**:
  - No secrets in code/image
  - No unnecessary permissions
  - Network security (rate limiting, CORS)
  - Data encryption (TLS in transit)
- **Judgment**: Production-ready mindset

### Cost Management
- **Target**: Total infrastructure cost <$100 for competition
- **Tracked**: GCP billing dashboard
- **Judgment**: Efficient resource use

---

## Feature Priority Lens

### Tier 1 (Must Have by Day 8)
1. **Docker Build**
   - Multi-stage build (separate build + runtime)
   - Size <200MB
   - Builds in <2 minutes

2. **Cloud Run Deployment**
   - Live URL ready
   - Health checks passing
   - Environment variables configured

3. **Basic Monitoring**
   - Logs visible in Cloud Logging
   - Error rate tracked
   - Uptime visible

### Tier 2 (Nice to Have by Day 8, Must by Day 9)
1. **Security Hardening**
   - Trivy scan with 0 vulnerabilities
   - Non-root user in container
   - Secrets in Secret Manager

2. **Performance Optimization**
   - p90 latency <100ms
   - CDN for static assets
   - Firestore indexes created

3. **Load Testing**
   - Verified to handle 1,000 concurrent users
   - No errors under load
   - Cost estimate confirmed

### Tier 3 (Not for Competition)
- Blue-green deployment
- Multi-region failover
- Auto-scaling fine-tuning
- Advanced observability (distributed tracing)

---

## Trade-offs

### If Timeline Gets Tight
1. **Sacrifice**: Advanced monitoring dashboards
   - **Keep**: Basic logs + error alerts
   - **Why**: Logs sufficient for debugging

2. **Sacrifice**: Load testing to 10,000 concurrent
   - **Keep**: Load test to 1,000 concurrent
   - **Why**: 1,000 sufficient to prove scalability

3. **Sacrifice**: Multi-region failover
   - **Keep**: Single region deployment
   - **Why**: Demo is short duration, downtime unlikely

4. **Sacrifice**: Cost optimization
   - **Keep**: Working deployment (even if not optimal)
   - **Why**: Demo cost is small vs. fixing issues

5. **Sacrifice**: Blue-green deployment
   - **Keep**: Simple redeploy (5 min downtime acceptable)
   - **Why**: Not needed for single demo

---

## Collaboration Points

### With Consumer UX Lead
- **Frontend assets**: Vite build output location?
- **Service Worker**: Should we cache offline?
- **Performance**: What's acceptable first load time? (2s?)

### With AI/LLM Lead
- **Rate limiting**: RPS + token budget enforced in container?
- **LLM endpoint**: Retry logic + backoff configured?
- **Logging**: Every LLM call logged for audit?

### With Data Lead
- **Firestore indexes**: Created at deploy time?
- **BigQuery pipeline**: Real-time or batch writes?
- **Backup strategy**: How do we recover from data loss?

### With Product/Demo Lead
- **Demo environment**: Separate staging instance?
- **Pre-demo checklist**: What to verify before demo starts?
- **Demo URL**: Live or cached/recorded?

---

## Decision Template

**When Adding Infrastructure**:
1. Does it improve reliability? (Yes = do it)
2. Does it reduce latency? (Yes = do it)
3. Does it improve security? (Yes = do it)
4. Can it ship in 2 days? (No = defer)
5. Does it cost <$50? (Yes = do it, No = question cost)

**Red Flags**:
- "We'll optimize later" → We don't have later for infrastructure
- "Manual deployment is fine" → Automated deployments are faster + safer
- "Monitoring is nice-to-have" → You can't fix what you can't see
- "We'll handle security after demo" → Vulnerabilities are permanent damage

---

**Created**: October 8, 2026 | **Role**: Infrastructure Lead | **Status**: READY FOR DEPLOYMENT
