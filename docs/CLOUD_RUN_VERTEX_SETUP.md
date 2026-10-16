# Cloud Run deployment through GitHub Actions

The workflow at `.github/workflows/deploy-cloud-run.yml` runs on every push to `main`, including a merged pull request. Pushes that change only Markdown, `docs/` or `.env.example` don't deploy. The workflow:

1. runs the backend tests;
2. type-checks and builds the frontend;
3. builds the container on GitHub's runner and pushes it to Artifact Registry;
4. deploys that exact commit to Cloud Run;
5. checks `/api/health`.

Feature branches don't deploy.

- **Project:** `project-6055aa98-bf59-48b5-a50`
- **Region:** `asia-south1` (Mumbai) for Cloud Run and Artifact Registry
- **Service:** `tracedrop`
- **Live URL:** https://tracedrop-25mgkruoeq-el.a.run.app

## What the deploy sets

The workflow deploys with these settings:

- 1 vCPU and 512 MiB;
- 0 minimum and 1 maximum instance, concurrency 1;
- a 180 s timeout;
- the runtime service account `tracedrop-run`;
- public access (the app itself requires Google sign-in or a guest session);
- these environment variables:

| Variable | Value |
|---|---|
| `GOOGLE_CLOUD_PROJECT` | the project ID |
| `VERTEX_LOCATION` | `global` |
| `LLM_MODEL` | `gemini-3.1-flash-lite` |
| `LLM_RATE_LIMIT_RPS` / `LLM_RATE_LIMIT_TOKENS_PER_DAY` / `LLM_MAX_CALLS_PER_DAY` | 2 / 50000 / 200 |
| `GOOGLE_CLIENT_ID` | GitHub Actions variable `GOOGLE_CLIENT_ID` |
| `SESSION_SECRET` | GitHub Actions secret `SESSION_SECRET` |

The container sets `NODE_ENV=production`, which also disables the local sign-in bypass.

## One-time Google Cloud setup (Cloud Shell)

Check the active project first:

```sh
gcloud config get-value project   # must print project-6055aa98-bf59-48b5-a50
```

Then run:

```sh
gcloud services enable run.googleapis.com artifactregistry.googleapis.com aiplatform.googleapis.com firestore.googleapis.com iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com calendar-json.googleapis.com gmail.googleapis.com
gcloud artifacts repositories create tracedrop --repository-format=docker --location=asia-south1 --description="TraceDrop application images"
gcloud firestore databases create --location=asia-south1
gcloud iam service-accounts create tracedrop-run --display-name="TraceDrop runtime"
gcloud iam service-accounts create tracedrop-deploy --display-name="GitHub Actions deployer"
gcloud projects add-iam-policy-binding project-6055aa98-bf59-48b5-a50 --member="serviceAccount:tracedrop-run@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com" --role="roles/aiplatform.user"
gcloud projects add-iam-policy-binding project-6055aa98-bf59-48b5-a50 --member="serviceAccount:tracedrop-run@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com" --role="roles/datastore.user"
gcloud projects add-iam-policy-binding project-6055aa98-bf59-48b5-a50 --member="serviceAccount:tracedrop-deploy@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com" --role="roles/run.admin"
gcloud artifacts repositories add-iam-policy-binding tracedrop --location=asia-south1 --member="serviceAccount:tracedrop-deploy@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com" --role="roles/artifactregistry.writer"
gcloud iam service-accounts add-iam-policy-binding tracedrop-run@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com --member="serviceAccount:tracedrop-deploy@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com" --role="roles/iam.serviceAccountUser"
gcloud iam workload-identity-pools create github-tracedrop --location=global --display-name="TraceDrop GitHub Actions"
gcloud iam workload-identity-pools describe github-tracedrop --location=global --format='value(name)'
```

The runtime needs Vertex AI User for Gemini, and Cloud Datastore User for Firestore, which holds accounts, sign-ins, preferences and bookings. If Firestore already exists in another location, skip the `databases create` line. The Firestore location is not promised to users: the privacy page names only the app server's region.

Copy the pool name from the last command. Its form is `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-tracedrop`. Put it in place of `POOL_NAME` below:

```sh
gcloud iam workload-identity-pools providers create-oidc github --location=global --workload-identity-pool=github-tracedrop --display-name="GitHub OIDC" --issuer-uri="https://token.actions.githubusercontent.com" --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" --attribute-condition="assertion.repository=='uppilisrinivasan/tracedrop' && assertion.ref=='refs/heads/main'"
gcloud iam service-accounts add-iam-policy-binding tracedrop-deploy@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com --member="principalSet://iam.googleapis.com/POOL_NAME/attribute.repository/uppilisrinivasan/tracedrop" --role="roles/iam.workloadIdentityUser"
gcloud iam workload-identity-pools providers describe github --location=global --workload-identity-pool=github-tracedrop --format='value(name)'
```

The provider accepts only `uppilisrinivasan/tracedrop` on `main`. No service-account key is downloaded or stored in GitHub.

## Google sign-in, Calendar and Gmail

In **Google Auth Platform** for the project:

1. Create an OAuth **Web client**. Add the Cloud Run URL (and `http://localhost:5173` for local testing) as an authorized JavaScript origin.
2. Add these scopes to the app:
   - `https://www.googleapis.com/auth/calendar.events.freebusy`
   - `https://www.googleapis.com/auth/calendar.events.owned`
   - `https://www.googleapis.com/auth/gmail.send`

   Calendar and Gmail scopes are sensitive: until Google verifies the app, only listed test users can complete that consent. Sign-in itself and guest mode work for anyone.
3. Set the consent screen's privacy policy and terms links to `<Cloud Run URL>/privacy` and `<Cloud Run URL>/terms`. Both pages are public.

## GitHub settings

In the repository, open **Settings → Secrets and variables → Actions**.

**Variables:**
- `GCP_WIF_PROVIDER`: the full provider name, ending in `/providers/github`
- `GCP_DEPLOY_SERVICE_ACCOUNT`: `tracedrop-deploy@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com`
- `GOOGLE_CLIENT_ID`: the OAuth web client ID

**Secrets:**
- `SESSION_SECRET`: a long random string. It signs session cookies and check-in codes, and the server refuses to sign sessions in production without it.

## Checking a deployment

1. Open the repository's **Actions** tab and watch **Deploy TraceDrop to Cloud Run**. It prints the URL after the health check passes.
2. Open the URL in a private window. Sign in with Google, or click **Continue as guest**.
3. Pick Arjun in **Viewing as**, then exercise:
   - Drop's chat ("How is my BP doing?");
   - **Add an outside lab report** with the sample report;
   - **+1 day** on the demo bar, which brings the Results Card.
4. Open `/#ai`. The AI console should say "Verified · gemini-3.1-flash-lite" and list the calls. `ai.live` in `/api/health` is true only after a successful model call.

## Costs and limits

- **Instances:** Cloud Run scales to zero; with at most one instance and concurrency 1, requests queue under load rather than scaling up.
- **AI limits:** the app's limits (50,000 tokens, 200 calls a day, 2 requests a second) are per process and reset on restart. They are brakes, not a project-wide spending cap.
- **Budget alerts:** set a Google Cloud budget with alerts. Alerts don't stop usage.
- **Who can spend:** anyone who signs in, or continues as a guest, can trigger model calls within those limits.
- **Images:** Artifact Registry keeps every image; set a cleanup policy.
