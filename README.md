# InfraKit Visual Editor

Web tool to drag-and-drop InfraKit packages onto a canvas, wire them into a
request-flow order, configure each one in a Figma-style property panel, and
export ready-to-drop files into any Node.js repo. Built per
`infrakit-visual-editor-spec.md`.

## Run it

```bash
# backend
cd backend
cp .env.example .env
# fill in PLATFORM_JWT_SECRET and SECRET_ENCRYPTION_KEY (see below)
npm install
npm run dev        # http://localhost:4000

# frontend, in a second terminal
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Generate the two secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # SECRET_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"  # PLATFORM_JWT_SECRET
```

## Where the data comes from

`backend/src/export/packageCatalog.js` is now sourced from your real repo
(uploaded `packages.zip` + `_env.example`), not placeholders — every default
is copied from an actual `example.config.js` or a real code fallback, every
`configKey` is confirmed against what each package's `index.js` reads from
`core.config()`, every env var is confirmed against your `_env.example`, and
every wiring call in `setup-infrakit.js` matches each package's real
exported function (checked against `demo-app/app.js`, which you also
uploaded) rather than a generic `app.use(pkg())` guess.

Three real discoveries worth knowing about, all reflected in the generated
output and explained further in `README-infrakit.md`'s per-project output:

1. **`@infrakit/dashboard`'s auth isn't a pluggable secret** — it's a
   built-in username/password session login (`DASHBOARD_USERNAME` /
   `DASHBOARD_PASSWORD`, read inside `infrakit.config.js`). The spec's
   signed-JWT middleware still works as an *outer* platform-ownership gate,
   but it's now a second layer on top of dashboard's own login, not a
   replacement for it. Export generates both credentials, shown once.
2. **`smart-stick-loadbalancer` isn't Express middleware** — it's a
   standalone reverse-proxy process with its own port. It's excluded from
   `setup-infrakit.js`'s `app.use()` chain and gets its own commented
   snippet instead.
3. **`loadBalancer.email.auth.pass` and `cache.encryptionKey` are never
   exposed as typeable panel fields** — both are real secrets (the repo's
   own history includes a hardcoded Gmail app password that had to be
   rotated). The generator always emits an env-var reference for these,
   regardless of what's stored for the node.

## What's still a genuine gap (not fixable from a directory listing or file contents alone)

`@infrakit/health`'s `checks` field takes real JS functions
(`createHttpCheck(...)`), which can't be expressed as form-field data or
generated JSON — the property panel doesn't offer it, and the generated
config has a `// TODO` for it. This is a property of the package's design,
not something more file content would resolve.

## A spec ambiguity I resolved, worth knowing about

The spec says the per-project dashboard secret should be "stored hashed,
same treatment as a password" — but also says the platform re-signs a JWT
with that *same* secret at `/auth/verify` time (local verification, option
a). Those two requirements conflict: a one-way password hash can't be used
to re-sign anything. I implemented it as **reversible AES-256-GCM
encryption** instead (`backend/src/export/secretCrypto.js`) — the plaintext
is still never returned by any API response after the one-time export
screen, but the platform can decrypt it server-side to sign tokens. If
you'd rather go with spec option (b) (server-to-server `/auth/verify-token`
call, no local secret needed at all), that endpoint already exists in
`dashboardAuth.js` — swap `generateDashboardAuth.js` to call it instead of
verifying locally, and you can drop the encryption entirely in favor of a
true one-way hash.

## Out of scope (per spec, v1)

Google OAuth, instant remote token revocation, AI-assisted anything, real
Docker export, auto-wiring edges into runtime event/listener logic.

## Provider skins (AWS / GCP / Azure)

The editor header has a Generic/AWS/GCP/Azure switch (`ProviderSelector`,
`frontend/src/providerSkins.js`). Switching it relabels every palette item
and canvas node with that provider's real service name (e.g. `rate-limiter`
→ "API Gateway" on AWS, "Apigee Gateway" on GCP, "API Management" on Azure)
and recolors the node/palette icons with that provider's brand color. The
choice is saved with the project (`graph.settings.provider`).

Deliberately **not** using AWS/GCP/Azure's actual service icon assets —
those are trademarked. Every icon is a generic Lucide icon
(`lucide-react`), just relabeled and recolored per provider — same
relatable effect, no IP risk. One honest gap: `breaker` doesn't map to a
real standalone managed service on any of the three providers (circuit
breaking is usually a mesh/library concern), so its label says so instead
of inventing a service name.

**New frontend dependency:** `lucide-react` was added for the icons — if
you already ran `npm install` in `frontend/` before this update, run it
again there (backend is unaffected).
