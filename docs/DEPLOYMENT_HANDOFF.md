# TraceDrop: Cloud Run and Vertex AI handoff

Status checked on 11 October 2026. This is a working checklist, not a claim
that the app is deployed or that the hackathon submission is eligible.

## What exists now

- Google Cloud project ID: `project-6055aa98-bf59-48b5-a50`. The user
  confirmed that Cloud Shell's active project matches this ID.
- Local branch: `feature/cloud-run-vertex-ai` in
  `/Users/s.samant/Documents/ChatGPT/Tracedrop/tracedrop-feature`, based on
  `develop` commit `e055322`.
- The branch has changes that replace the Anthropic gateway with
  a preliminary Vertex AI Gemini adapter. It also has a setup guide at
  `docs/CLOUD_RUN_VERTEX_SETUP.md`.
- Syntax checks and the ten existing domain tests pass. There has been no
  live Vertex AI request, Cloud Run image build, or end-to-end deployment test.
- The branch is not on GitHub. A push was attempted and failed with
  `ssh: Could not resolve hostname github.com: -65563`.
- The local Google Cloud CLI was installed, but every `gcloud` invocation
  was rejected *before execution* by this managed environment's command
  policy, including a request with elevated permissions. This is not an IAM
  error, a missing login, or an error returned by Google Cloud. Cloud Shell in
  the user's browser does work.

## Gate 1: Hackathon eligibility

The user supplied a rule that submitted code and assets must be created during
the official hackathon timeline. The repository's earliest recorded commit is
8 October 2026 at 14:31 IST. Obtain the official start date and time, then
review the history and asset provenance against that rule. If any submitted
code or asset predates the permitted window, build a new submission repository
with only work created inside the window. Do not relabel or merely rebase
older work as new. Ask organisers about any explicit starter-code allowance if
the rules are unclear. Complete this check before treating the current branch
as a submission candidate.

## Gate 2: Finish and validate the Vertex implementation

1. Review the preliminary `backend/src/ai/llm.js` adapter against Vertex AI's
   current `generateContent` request format, including function declarations,
   function responses, thought signatures, JSON-shaped output, images, usage,
   and error handling. The current implementation has not been validated
   against the service.
2. Test copilot tool use, care-plan structured output, lab-image extraction,
   impact stories, and home insights with a real Gemini call. Confirm failures
   produce the expected rule-based fallback.
3. Reconcile `backend/package.json` and its lockfile. Anthropic remains in
   both because this environment blocked package installation and lockfile
   regeneration. Remove the unused dependency with `npm uninstall
   @anthropic-ai/sdk` in an environment where npm is allowed, then run
   `npm ci` and build both frontend and container.
4. Update any user-visible docs and demo scripts that claim unavailable
   infrastructure (ADK, Cloud Healthcare API, Firebase, BigQuery, Maps, voice
   support). The current deployed app should only claim features that are
   implemented and demonstrated.

## Gate 3: Publish the branch

From the local feature checkout, after Gate 2:

```sh
git status --short --branch
git add README.md run.sh backend/src/ai/llm.js backend/src/ai/agent.js backend/src/ai/carePlan.js backend/src/ai/copilot.js backend/src/server.js backend/package.json backend/package-lock.json docs/CLOUD_RUN_VERTEX_SETUP.md docs/DEPLOYMENT_HANDOFF.md
git commit -m "Use Vertex AI on Cloud Run"
git push --set-upstream origin feature/cloud-run-vertex-ai
```

If DNS is still failing locally, use an approved network path or transfer the
reviewed changes to an authorised GitHub-connected environment. Do not assume
the branch exists remotely until GitHub shows it.

## Gate 4: Protect the $300 trial credit

1. In Google Cloud Billing, confirm the account still says **Free trial**.
   Do not click **Activate** if the intention is to avoid pay-as-you-go charges.
2. Create a $200 budget scoped to this project, with email alerts at $50,
   $100, $150 and $200. An alert is not an automatic cutoff.
3. Start with one Cloud Run service, request-based billing, minimum instances
   zero, maximum instances one, 1 vCPU, and 512 MiB memory. Use the inexpensive
   Gemini Flash-Lite model only after verifying its availability and price.
4. Avoid provisioning Cloud SQL, GPUs, load balancers, or reserved model
   throughput for this disposable demo. Review Cloud Build, Artifact Registry,
   network and model charges in Billing after the first deployment and weekly.
5. The app's token and call counters are per process and reset on restart.
   They are a guardrail, not a project-wide spending cap.

## Gate 5: Set up automatic deployment

After Gates 1–4, follow the one-time Google Cloud and GitHub Actions setup in
`docs/CLOUD_RUN_VERTEX_SETUP.md`. The active Cloud Shell project has already
been confirmed as `project-6055aa98-bf59-48b5-a50`. A push to `main`,
including a merge, then runs the deployment workflow. The workflow uses public
access because the app has no sign-in and its data is synthetic. A public URL
can trigger model requests, so monitor usage or add app authentication before
wider sharing.

The service account must have Vertex AI User. Do not create a downloadable
service account key; Cloud Run uses its runtime identity.

## Gate 6: Verify the actual deployed prototype

- Capture the Cloud Run URL and load the app in a private browser window.
- Check `/api/health`; note that `ai.live` currently means configured, not
  that the model has successfully answered.
- Exercise each AI feature and inspect the AI console for a successful call
  and the tool trace. Check Cloud Run logs for errors and Billing Reports for
  real charges. Only then call the end-to-end prototype working.
- Remember that donations, appointments, uploaded results and plans are kept
  in server memory and disappear on restart; they are demo state only.

## Gate 7: Finish the submission

- Publish a **public** GitHub repository containing only eligible source and
  original assets.
- Record a live demonstration video **strictly under 3 minutes**.
- Prepare a deck that accurately shows the implemented architecture and
  business case, with the live URL, repository URL and video URL.
- Recheck each link in an incognito window and confirm the final code,
  demo and deck agree.

## What to provide next

The next essential input is the official hackathon start date and time (with
timezone), plus any organiser statement that allows pre-existing starter code.
No cloud resources should be described as deployed until a Cloud Run URL and
live checks exist.
