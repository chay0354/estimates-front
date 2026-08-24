# estimates-front

Vite + React UI for the estimate pipeline.

## Local

```bash
cp .env.example .env
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

## Vercel

1. Import [this repo](https://github.com/chay0354/estimates-front) into Vercel. Framework should be **Vite**.
2. Set this environment variable **before the first production build**:

| Name | Value |
| --- | --- |
| `VITE_API_URL` | `https://estimates-back.vercel.app/api` |

Use your real backend URL if Vercel assigned a different project name. Redeploy the frontend after changing this value (Vite inlines it at build time).

3. Deploy. Sign in with `admin@gmail.com` / `12345678`.
