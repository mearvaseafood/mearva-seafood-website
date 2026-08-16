# Mearva Seafood — website

Single-page B2B website for Mearva Seafood (Norwegian seafood export).
Trilingual: English · العربية · Norsk. Pure HTML + CSS + vanilla JS, no build step.

## Files

```
index.html        # the whole site (markup, styles, translations, scripts)
widget.js         # "Ask Mearva" chat widget (frontend, loaded by index.html)
worker/           # secure chat backend (Cloudflare Worker) — see worker/README.md
images/           # product & about photos (salmon, cod, shellfish, about)
.nojekyll         # tells GitHub Pages to serve files as-is
```

## Ask Mearva chat assistant

The site includes a trilingual AI chat widget. The Anthropic API key stays
server-side in a Cloudflare Worker (`worker/`) and never appears in any file
served to the browser. To enable it, deploy the Worker and set
`window.MEARVA_CHAT_API_URL` in `index.html` — full steps in
[`worker/README.md`](worker/README.md).

## Edit

- **Text (3 languages):** the `I18N` object near the bottom of `index.html` (`en`, `ar`, `no`).
- **Colors:** the `:root` block at the top (`--navy`, `--teal`, …).
- **Photos:** replace a file in `images/` with the same name.
- **Contact details:** search `index.html` for `sales@mearvaseafood.com`, `+47 94446668`.

## Make the contact form deliver email

The form uses [Web3Forms](https://web3forms.com) (free, no server needed):

1. Go to https://web3forms.com and enter **sales@mearvaseafood.com** to get a free access key (arrives by email).
2. In `index.html`, replace `YOUR_WEB3FORMS_ACCESS_KEY` with that key.
3. Commit and push. Submissions now arrive at that inbox.

## Deploy on GitHub Pages

1. Create a new repository on GitHub (e.g. `mearva-seafood`).
2. Push this folder (see commands below).
3. Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main** / **/(root)** → Save.
4. Site goes live at `https://<username>.github.io/mearva-seafood/` in a minute or two.
