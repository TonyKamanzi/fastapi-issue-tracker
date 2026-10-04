# IssueTrack Frontend

A Next.js dashboard for the FastAPI Issue Tracker API. Lists, filters, creates, edits and deletes issues, and derives counts and priority breakdowns from a single response.

## Requirements

- Node.js 20.9 or newer
- A running backend (see [`../backend`](../backend))

## Getting Started

```bash
npm install
cp .env.example .env.local
```

Then edit `.env.local` and point it at your backend:

```bash
API_BASE_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

The app will be available at http://localhost:3000.

## Environment Variables

| Variable         | Scope   | Required | Description                                        |
| ---------------- | ------- | -------- | -------------------------------------------------- |
| `API_BASE_URL`   | server  | yes      | Absolute URL of the backend, no trailing slash      |

`.env.local` is gitignored and must never be committed. `.env.example` is committed and lists the variables to set.

### Why this variable is not `NEXT_PUBLIC_`

`API_BASE_URL` is deliberately **not** prefixed with `NEXT_PUBLIC_`. Next.js inlines any `NEXT_PUBLIC_` variable into the JavaScript bundle at build time, which would publish the backend URL to every visitor via devtools. Keeping it server-only means the browser never learns where the backend lives.

## How the app talks to the backend

The browser **never** contacts the backend directly. `next.config.ts` reverse-proxies the API, so requests stay same-origin:

| Request path                     | Proxied to                       |
| -------------------------------- | -------------------------------- |
| `/api/v1/issues` and sub-paths    | `${API_BASE_URL}/api/v1/...`     |
| `/docs`                          | `${API_BASE_URL}/docs`           |
| `/openapi.json`                  | `${API_BASE_URL}/openapi.json`   |

`lib/api.ts` resolves the target per environment: Server Components fetch the absolute `API_BASE_URL`, while client components request relative paths such as `/api/v1/issues` and go through the proxy.

Two consequences worth knowing:

- The API's CORS policy is never exercised, because every browser request is same-origin. This is why the backend can safely deny all cross-origin traffic.
- `rewrites()` runs at **build time**, so `API_BASE_URL` must be present when the app is built. Changing the backend URL requires a rebuild, not just a restart.

## Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start the dev server               |
| `npm run build`     | Production build                   |
| `npm start`         | Serve the production build         |
| `npm run lint`      | Run ESLint                         |

There is no test suite. Verify changes with `npm run lint`, `npx tsc --noEmit` and `npm run build`.

## Deploying to Vercel

1. Push this repository to GitHub and import it into Vercel. Set the **Root Directory** to `frontend`; Vercel detects Next.js and fills in the build and install commands.
2. Add one environment variable under **Settings → Environment Variables**, for all environments:

   ```
   API_BASE_URL=https://your-backend.onrender.com
   ```

3. Deploy.

`API_BASE_URL` must be set at build time. Because `rewrites()` throws when it is missing, a build without it fails immediately with an actionable message rather than deploying a site that silently cannot reach the backend.

Once deployed, confirm the backend URL is not publicly visible:

```bash
curl -s https://your-app.vercel.app | grep -c 'onrender'  # expect 0
```

## Known Limitations

- **Cold starts.** A free Render instance sleeps when idle and takes roughly 10s to boot again. The first request after an idle period can be slow. The request timeout is set to 30s to absorb this, and the dashboard shows a retry button if it is exceeded. A paid Render instance removes the delay.
- **Ephemeral storage.** The backend stores issues in `data/issues.json` on Render's filesystem, which is wiped on every redeploy and restart. Issues created in production will not persist. This needs a real database.

## Security Notes

- The backend URL is a server-only variable and is absent from both the rendered HTML and the client bundle.
- The API has **no authentication**, so anyone who can reach it can read and modify issues. The reverse proxy hides the URL but is not an access-control mechanism; adding auth to the backend is the only real fix.