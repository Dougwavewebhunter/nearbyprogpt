# NearbyPro Service Marketplace

Clean Vite React PWA project for GitHub → Netlify deployment.

## Netlify settings

- Build command: `npm run build`
- Publish directory: `dist`
- Base directory: leave blank

## Supabase

The app reads these Vite environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Use the same Supabase project in Netlify environment variables. The included `.env` is for local/development convenience only. Never add a Supabase service-role secret to frontend code.

## Deploy

Upload the files to the root of your GitHub repository, then connect that repository to Netlify.
