# Pasar Karat Digital Marketplace

A local-only Next.js, TypeScript and Tailwind CSS marketplace catalogue. No database, checkout, accounts or hosting-provider configuration.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Next.js (normally http://127.0.0.1:3000).

```sh
npm run typecheck
npm run build
npm start
```

## Edit or add products

Edit `data/products.ts`. Add an object to `products` with a unique `id` and URL-safe `slug`, plus `name`, numeric `price` in MYR, `image`, `category`, `seller`, `description`, `externalUrl`, and boolean `featured`. Use a category from the `categories` array. The grid, search, category results, individual `/items/your-slug` page and related items update automatically. Rebuild after adding records when running a production build.

Example:

```ts
{ id: '13', slug: 'your-product', name: 'Your Product', price: 89,
  image: '/images/products/your-product.jpg', category: 'Vintage',
  seller: 'Actual seller name', description: 'Accurate product description.',
  externalUrl: 'https://your-seller.example/product', featured: false }
```

## Add images

- Hero: put your photograph at `public/images/hero/market.jpg`.
- Products: add files to `public/images/products/` and set each record's `image` to `/images/products/filename.jpg`.
- Future category images: `public/images/categories/` is ready; current categories use lightweight interface icons. Image-based categories would require updating `CategoryLinks` in `components/marketplace.tsx`.
- Missing or failed image requests display a clean fallback instead of a broken image. No generated or downloaded imagery is included. Refresh after adding a previously missing image.

## Seller and affiliate links

Change only `externalUrl` in the relevant product record. Use a complete trusted HTTPS URL. Seller links open in a new tab with `noopener noreferrer sponsored`. Affiliate URLs can be substituted directly; there is no affiliate API. All supplied example.com links are illustrative and are not real product destinations. Replace these plus example sellers, prices and descriptions before public launch. Remove/update the collection's example notices when all listings are real.

## Structure

- `app/`: homepage, collection/search, About, product pages and not-found page.
- `components/marketplace.tsx`: reusable header, footer, cards, image fallback, categories and filter controls.
- `app/globals.css`: design tokens, layouts and responsive styling.
- `data/products.ts`: editable collection.
- `public/images/`: local images.

Search matches names, categories, descriptions and sellers. Category and text filtering can be combined; no-match results include a reset action. Header search and category links also support direct URLs such as `/items?q=radio` and `/items?category=Vintage`.

Nothing has been deployed or configured for a hosting provider.

## Virtual Experience

Visit `/experience` using the main navigation. Its copy and layout are in `app/experience/page.tsx`; page-specific styles are in `app/experience/experience.css`.

All editable media paths and the itch.io destination are in `data/experience.ts`:

- Market screenshot: `public/images/experience/market-environment.jpg` → `/images/experience/market-environment.jpg`
- Heritage screenshot: `public/images/experience/heritage-interaction.jpg` → `/images/experience/heritage-interaction.jpg`
- Exploration screenshot: `public/images/experience/exploration.jpg` → `/images/experience/exploration.jpg`
- Optional video poster: add `public/images/experience/video-poster.jpg`, then set `poster` to `/images/experience/video-poster.jpg`.
- Gameplay video: add `public/videos/experience/gameplay.mp4`, then set `video` to `/videos/experience/gameplay.mp4`.

Screenshots appear automatically at the default filenames; for other filenames, update their `image` paths. Refresh after replacing missing media. The video component switches to a native player with controls when `video` is set. With no video, the preview shows a disabled play control and a coming-soon label. Failed videos return to an unavailable placeholder. No remote media is loaded.

## Responsive layouts

The shared header is in `components/header.tsx`. Below 900px it provides a sticky brand/menu row with a keyboard-accessible disclosure menu (Escape closes and restores focus), and a separate full-width search form. Desktop search remains removed as previously requested; the collection search is unchanged.

Responsive adjustments are isolated in `app/responsive.css`, with experience-specific rules in `app/experience/experience.css`. Main thresholds: 1100px for tablet grids and touch sizing, 900px for compact navigation and stacked details/experience hero, 600px for phone spacing/categories/gallery, and 379px for single-column products on narrow phones. Existing desktop rules are preserved.

## Malaysian Digital Archive

`/archive` is an educational catalogue separate from products and game discoveries. Edit `data/archive.ts` to add categories or entries. Each entry needs a unique `id` and URL-safe `slug`, a category from `archiveCategories`, a name, image path and short description. Optional `overview`, `origin`, `culturalSignificance`, `characteristics`, `facts` and `sources` populate the shared detail template; omitted or empty sections are hidden. Use reviewed sources when expanding the introductory content.

Put images in `public/images/archive/` and reference them as `/images/archive/filename.jpg`. Missing files use the existing image fallback. The browser filters by text and category, with pagination automatically shown above 12 matching entries. New records automatically receive `/archive/<slug>` pages; rebuild production after data changes.

`relatedArchiveIds` selects related educational entries, with same-category entries also considered. Optional `relatedHeritageIds` and `relatedProductIds` reserve future relationships only: Archive does not unlock discoveries, save products or display prices/sellers.

UI files: `components/archive.tsx`, `app/archive/page.tsx`, `app/archive/[slug]/page.tsx`, `app/archive/archive.css`. No changes to Netlify configuration are needed for these Next.js routes.
