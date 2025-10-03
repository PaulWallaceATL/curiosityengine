## sales-curiosity monorepo

This repository contains two applications:

- apps/sales-curiosity-web — Next.js app (API + admin dashboard)
- apps/sales-curiosity-extension — Chrome extension

### Install

```bash
npm install
```

### Run web app (dev)

```bash
npm run dev
```

Then open `http://localhost:3000`.

### Chrome extension

Build the extension bundle:

```bash
npm run build -w @sales-curiosity/extension && node apps/sales-curiosity-extension/scripts/copy-manifest.mjs
```

Load `apps/sales-curiosity-extension/dist` as an unpacked extension in Chrome (`chrome://extensions`).

### API endpoints

- `GET /api/health` — simple health check
- `GET /api/echo?message=...` — echoes message with CORS headers
