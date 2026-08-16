# Mearva Seafood — chat backend (Cloudflare Worker)

Secure backend for the **Ask Mearva** website assistant. Secrets live only in
the Worker's environment — never in `index.html`, `widget.js`, or this repo.

```
Visitor → widget.js (index.html)
        → POST /api/chat  (this Worker) → Anthropic Messages API → reply
        → POST /api/lead  (this Worker) → Web3Forms → sales@mearvaseafood.com
```

`/api/lead` validates + sanitizes the structured enquiry server-side, rate-
limits it (5 / IP / hour), and forwards it to the same Web3Forms destination
the website quote form already uses. It returns `{ ok: true }` only when
Web3Forms confirms delivery, so the widget never claims "sent" prematurely.

## Secrets (set once, never committed)

```bash
npx wrangler secret put ANTHROPIC_API_KEY   # Anthropic key
npx wrangler secret put WEB3FORMS_KEY        # Web3Forms access key for /api/lead
```

`WEB3FORMS_KEY` is the same access key the website form uses (the value in
`index.html`'s `access_key` field). Setting it here lets the Worker submit
leads server-side with validation and rate-limiting.

## Files

```
worker.js          # routing, CORS, rate limiting, Anthropic call, lead submit
system-prompt.js   # the Mearva persona + rules (embedded, server-side)
knowledge-base.js  # approved facts the assistant may use (server-side)
wrangler.toml      # Cloudflare deploy config (no secrets)
```

## Deploy

1. **Install Wrangler** (once):

   ```bash
   npm install -g wrangler
   ```

2. **Log in** to your Cloudflare account:

   ```bash
   wrangler login
   ```

3. **Create the rate-limit KV namespace** and paste its `id` into
   `wrangler.toml` (`REPLACE_WITH_YOUR_KV_NAMESPACE_ID`):

   ```bash
   wrangler kv namespace create RATE_LIMIT
   ```

4. **Add the Anthropic API key as a secret** (it is prompted for, never
   written to disk or the repo):

   ```bash
   wrangler secret put ANTHROPIC_API_KEY
   ```

5. **Deploy** from this `worker/` folder:

   ```bash
   wrangler deploy
   ```

   Wrangler prints the Worker URL, e.g.
   `https://mearva-chat.<your-subdomain>.workers.dev`.

6. **Connect the widget.** In `index.html`, set the API URL to that Worker
   plus `/api/chat`:

   ```html
   <script>
     window.MEARVA_CHAT_API_URL =
       "https://mearva-chat.<your-subdomain>.workers.dev/api/chat";
   </script>
   ```

   Commit and push so GitHub Pages serves the updated page.

## Configuration

| Where | Setting | Default |
|-------|---------|---------|
| `worker.js` | `ALLOWED_ORIGINS` — sites allowed to call the API | `mearvaseafood.com`, `www.mearvaseafood.com` |
| `worker.js` | `RATE_LIMIT_MAX` / window | 20 requests / IP / hour |
| `wrangler.toml` `[vars]` | `MODEL` | `claude-sonnet-4-6` |
| secret | `ANTHROPIC_API_KEY` | (set via `wrangler secret put`) |

## Notes

- **CORS** is restricted to the origins in `ALLOWED_ORIGINS`. Add a staging
  domain there if you test from elsewhere.
- **Rate limiting** uses the `RATE_LIMIT` KV namespace. If the binding is
  missing, the Worker still runs but rate limiting is skipped — bind KV in
  production.
- The system prompt + knowledge base are sent as a cached prefix (Anthropic
  prompt caching) to keep repeat requests fast and cheaper.
- The Worker keeps only the last 20 messages of history and caps each
  message's length, so a client cannot send an unbounded payload.

## Local test

```bash
wrangler dev
```

Then POST to `http://localhost:8787/api/chat`:

```bash
curl -s http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"language":"en","messages":[{"role":"user","content":"Why Norwegian salmon?"}]}'
```
