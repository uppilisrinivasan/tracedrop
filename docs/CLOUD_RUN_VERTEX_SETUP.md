# Cloud Run deployment through GitHub Actions

The workflow at `.github/workflows/deploy-cloud-run.yml` runs whenever a
commit reaches `main`, including a completed pull request merge. It tests the
app, builds the container on GitHub's runner, pushes the image to Artifact
Registry, deploys that exact commit to Cloud Run, and checks `/api/health`.
The feature branch itself does not deploy.

Target Google Cloud project: `project-6055aa98-bf59-48b5-a50`.
Cloud Run and Artifact Registry region: `asia-south1` (Mumbai).

## Before enabling automatic deployment

The repository and demo assets must satisfy the hackathon's fresh-code rule.
See `DEPLOYMENT_HANDOFF.md`. The current repo began on 8 October 2026; the
official hackathon start time must be checked before submission.

In Google Cloud Billing, confirm the account is **Free trial**, and set a
$200 budget with notifications at $50, $100, $150 and $200. Budgets send alerts
but do not stop usage. Do not upgrade to pay-as-you-go if avoiding charges is
the priority.

## One-time Google Cloud setup in Cloud Shell

Cloud Shell has already displayed the expected project ID, but check it before
running write commands:

```sh
gcloud config get-value project
```

The result must be `project-6055aa98-bf59-48b5-a50`. Then run:

```sh
gcloud services enable run.googleapis.com artifactregistry.googleapis.com aiplatform.googleapis.com iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com
gcloud artifacts repositories create tracedrop --repository-format=docker --location=asia-south1 --description="TraceDrop application images"
gcloud iam service-accounts create tracedrop-run --display-name="TraceDrop runtime"
gcloud iam service-accounts create tracedrop-deploy --display-name="GitHub Actions deployer"
gcloud projects add-iam-policy-binding project-6055aa98-bf59-48b5-a50 --member="serviceAccount:tracedrop-run@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com" --role="roles/aiplatform.user"
gcloud projects add-iam-policy-binding project-6055aa98-bf59-48b5-a50 --member="serviceAccount:tracedrop-deploy@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com" --role="roles/run.admin"
gcloud artifacts repositories add-iam-policy-binding tracedrop --location=asia-south1 --member="serviceAccount:tracedrop-deploy@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com" --role="roles/artifactregistry.writer"
gcloud iam service-accounts add-iam-policy-binding tracedrop-run@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com --member="serviceAccount:tracedrop-deploy@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com" --role="roles/iam.serviceAccountUser"
gcloud iam workload-identity-pools create github-tracedrop --location=global --display-name="TraceDrop GitHub Actions"
gcloud iam workload-identity-pools describe github-tracedrop --location=global --format='value(name)'
```

Copy the pool name returned by the last command. Its form is
`projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-tracedrop`.
Use it in the next command, replacing `POOL_NAME` with that exact value:

```sh
gcloud iam workload-identity-pools providers create-oidc github --location=global --workload-identity-pool=github-tracedrop --display-name="GitHub OIDC" --issuer-uri="https://token.actions.githubusercontent.com" --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" --attribute-condition="assertion.repository=='uppilisrinivasan/tracedrop' && assertion.ref=='refs/heads/main'"
gcloud iam service-accounts add-iam-policy-binding tracedrop-deploy@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com --member="principalSet://iam.googleapis.com/POOL_NAME/attribute.repository/uppilisrinivasan/tracedrop" --role="roles/iam.workloadIdentityUser"
gcloud iam workload-identity-pools providers describe github --location=global --workload-identity-pool=github-tracedrop --format='value(name)'
```

Copy the provider name from the last command. In the GitHub repository, open
**Settings → Secrets and variables → Actions → Variables** and create:

- `GCP_WIF_PROVIDER` = the full provider name, ending in `/providers/github`
- `GCP_DEPLOY_SERVICE_ACCOUNT` =
  `tracedrop-deploy@project-6055aa98-bf59-48b5-a50.iam.gserviceaccount.com`

The provider is restricted to `uppilisrinivasan/tracedrop` on `main`.
No service-account key is downloaded or placed in GitHub.

## First deployment

Merge the reviewed feature branch into `main`. Open the repository's
**Actions** tab and watch **Deploy TraceDrop to Cloud Run**. The workflow
prints the deployed URL after a successful health check. Open the app in a
private browser window; exercise the copilot, care plan, lab report reader,
impact story and home insight. Check the AI console for successful calls.
The health endpoint's `ai.live` value indicates configuration; it does not
prove Vertex AI access by itself.

The app has no sign-in and its data is synthetic, so the workflow exposes the
Cloud Run URL publicly for team use. Anyone who reaches the URL can send AI
requests. Cloud Run uses zero minimum instances and one maximum instance.
The app's 50k-token and 200-call limits are per process and reset on restart,
so they are usage brakes, not a project-wide monetary cap. Review Billing
Reports after the first AI calls and weekly. Artifact Registry retains image
versions until cleaned up; set a cleanup policy after the initial deployment.
