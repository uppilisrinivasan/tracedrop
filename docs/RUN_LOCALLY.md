# Run TraceDrop locally with Vertex AI

The app runs on your laptop. Gemini calls go to the same Vertex AI model as Cloud Run, in the same Google Cloud project. There is no Gemini API key. Cloud Run uses its service account. Your laptop uses Application Default Credentials from `gcloud`, which are a short-lived token stored outside this repo.

Sign-in stays off locally (`AUTH_DISABLED=true`), so you can open the app without the Google login page. That flag is ignored when `NODE_ENV=production`, which is what Cloud Run sets.

## What you need

- Node.js 20 or newer
- The `gcloud` CLI, signed in with your Google account email
- The `tracedrop` gcloud configuration, project `project-6055aa98-bf59-48b5-a50`

Vertex AI is already enabled on that project. Your account owns the project, so it can call the model.

## 1. Create local Google credentials

Sign in with your Google account email:

```sh
gcloud config configurations activate tracedrop
gcloud auth login <Add your Google email>
gcloud config set project project-6055aa98-bf59-48b5-a50
gcloud auth application-default login
gcloud auth application-default set-quota-project project-6055aa98-bf59-48b5-a50
```

`application-default login` opens a browser once. The quota-project command tells Vertex which project to bill. These credentials live under your home directory, not in the TraceDrop repo.

## 2. Point the app at that project

From the repo root, create `.env` if you do not already have one:

```sh
cp .env.example .env
```

These values turn Gemini on. `.env.example` already contains them:

```sh
GOOGLE_CLOUD_PROJECT=project-6055aa98-bf59-48b5-a50
VERTEX_LOCATION=global
LLM_MODEL=gemini-2.5-flash-lite
LLM_RATE_LIMIT_RPS=2
LLM_RATE_LIMIT_TOKENS_PER_DAY=50000
LLM_MAX_CALLS_PER_DAY=200
AUTH_DISABLED=true
NODE_ENV=development
```

Leave `GOOGLE_CLOUD_PROJECT` empty if you want the rule-based fallback instead of Vertex. Do not add an API key.

## 3. Start the app

```sh
./run.sh
```

Open http://localhost:5173. The API is at http://localhost:8080. Vite proxies `/api` to the API, so the page and the API stay on your machine.

The backend log should include:

```text
AI: gemini-2.5-flash-lite via aiplatform.googleapis.com (budget 50000 tokens/day, 2 req/s)
```

`AI offline` means `GOOGLE_CLOUD_PROJECT` is unset. The app still runs, and each AI feature uses its rule-based fallback.

## 4. Check that Vertex answered

Open the copilot and ask a question, or generate a care plan. The sidebar **AI console** shows the live call, the model name, and the token count.

A credentials problem shows up on that first call, in the backend log, as `[llm]`. The usual fixes:

- Run `gcloud auth application-default login` again if the message says credentials are unavailable.
- Run the quota-project command again if Vertex says a quota project is required.
- Confirm `gcloud config get-value project` prints `project-6055aa98-bf59-48b5-a50`.

## What this spends

Local Gemini calls bill the same free-trial project as the deployed app. The limits above stop the process after 50,000 tokens or 200 calls in a day. A full day at that cap is about ₹2. Firestore is not used while `AUTH_DISABLED=true`.

## Donation booking and Google Calendar

Booking asks for convenient days, time, travel distance, holidays, reminder timing and location. Location is optional. If you allow it, the browser coordinates are rounded to about one kilometre before they are saved.

Connecting Google Calendar is a separate consent from sign-in. TraceDrop asks only to read free/busy time, create events on calendars you own, and send the booking email through Gmail. The access token is held in the page until you reload it. It is not written to the database.

In Google Auth Platform, add these scopes to the app before the consent screen will grant them:

- `https://www.googleapis.com/auth/calendar.events.freebusy`
- `https://www.googleapis.com/auth/calendar.events.owned`
- `https://www.googleapis.com/auth/gmail.send`

Calendar and Gmail scopes are sensitive. Until Google verifies the app, only accounts listed as test users can complete that consent. A booked event emails a confirmation immediately and adds email and popup reminders at the time chosen in the chat.

Enable the APIs once on the project:

```sh
gcloud services enable calendar-json.googleapis.com gmail.googleapis.com --project project-6055aa98-bf59-48b5-a50
```

## Optional: Google sign-in on localhost

Skip this for normal local work. To try the login page against the real project:

1. Set `AUTH_DISABLED=false` in `.env`.
2. Set `GOOGLE_CLIENT_ID` to the web client ID and set `SESSION_SECRET` to any long random string.
3. In Google Auth Platform, on that OAuth client, add `http://localhost:5173` as an authorized JavaScript origin.
4. Restart `./run.sh`.

A successful sign-in writes your email to the same Firestore `users` and `accessEvents` collections as production. Your `gcloud` login must be allowed to write to Firestore.
