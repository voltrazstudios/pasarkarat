# Deploying Pasar Karat to Netlify

This is the complete source project, not a static drag-and-drop website export.

1. Extract the ZIP. Its root contains package.json and netlify.toml.
2. Put the extracted files in a Git repository and connect that repository to Netlify.
3. Use the repository root as the base directory (or the actual project subdirectory if you place it inside a larger repository).
4. Build command: `npm run build`. Publish directory: `.next`.
5. Netlify automatically applies its Next.js/OpenNext adapter. Do not configure a static export, skip the adapter, or add a catch-all rewrite to index.html.

The included netlify.toml sets Node.js 22 and NEXT_BUILD_DIR=.next. No API keys, secrets, database, or manually supplied environment variables are required. Do not set NODE_ENV=development or omit development dependencies during the build; TypeScript and Tailwind are build dependencies.

Netlify's simple drag-and-drop deploy does not build this source ZIP. Use a connected repository/build workflow so the Next.js adapter can generate the required server functions. `/items` uses server-side query parameters, and the application must retain Next.js routing.

## Local production check

```sh
npm ci
npm run build
npm start
```

## Routes and browser storage

Product pages use `/items/<slug>` and heritage stories use `/heritage/<id>`. The data arrays generate the initial routes. The gallery remains within `/experience#heritage-gallery`.

Saved Items use `pasar-karat-saved-items`; discoveries use `pasar-karat-heritage-discoveries`. Only IDs are stored. Both are browser-local and survive refresh and restart when localStorage is available. They are separate from each other and require no backend.

Storage is scoped to the browser profile and site origin. Local preview discoveries and wishlists do not automatically transfer to your Netlify domain. Netlify preview URLs, the production Netlify URL and a custom domain each have separate storage. Unreal should open claims on the same production origin visitors use for the website.

## Unreal discovery URLs

After deployment, replace the local origin with your actual HTTPS production domain:

`https://YOUR-SITE.netlify.app/experience?discover=OBJECT_ID&key=CLAIM_KEY`

Use the IDs and claim keys in data/heritage.ts. No keys need changing for deployment. The client validates each claim, persists the ID, removes the claim parameters and scrolls to the gallery. Keys are intentionally part of a casual client-side prototype, not server secrets. Do not create redirects that discard query parameters.

## Included assets

The public folder includes the uploaded logo, homepage image, three experience screenshots and the original gameplay.mp4 (approximately 70.8 MB). Product and heritage photos still use their existing fallback placeholders. Nothing is downloaded from an external image service.

## Final live checks after you deploy

Open `/items/congkak`, `/heritage/labu-sayong`, `/saved` and `/experience` directly. Save a product, refresh, and confirm it persists. Open a valid discovery URL and confirm URL cleanup, progress and persistence. Repeat with a wrong key and confirm no unlock. Check video playback. Local production validation cannot verify a live Netlify deployment that has not yet occurred.

Official framework documentation: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
