# Mearva Seafood — chat backend (Cloudflare Worker)

Secure backend for the **Ask Mearva** website assistant. The Anthropic API
key lives only in the Worker's environment — never in `index.html`,
`widget.js`, or this repository.

```
Visitor → widget.js (index.html)
        → POST /api/chat  (this Worker)
        → Anthropic Messages API (claude-sonnet-4-6)
        → reply → widget
```

## Files

```
worker.js          # request handling, CORS, rate limiting, Anthropic call
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
