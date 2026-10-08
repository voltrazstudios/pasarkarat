# Pasar Karat Supabase setup

The marketplace now supports authenticated, moderated community product submissions.

## 1. Create a separate Supabase project

Use a dedicated Pasar Karat Supabase project. Do not use the SEN project.

## 2. Run migrations once, in order

Run these files in the Supabase SQL editor:

1. `supabase/migrations/202610070001_marketplace_auth.sql`
2. `supabase/migrations/202610070002_product_submissions.sql`
3. `supabase/migrations/202610070003_product_storage.sql`
4. `supabase/migrations/202610070004_more_marketplace_platforms.sql`
5. `supabase/migrations/202610070005_admin_delete_products.sql`
6. `supabase/migrations/202610070006_seller_storefronts.sql`
7. `supabase/migrations/202610070007_account_saved_items.sql`
8. `supabase/migrations/202610070008_profile_description.sql`
9. `supabase/migrations/202610070009_profile_details_and_media.sql`
10. `supabase/migrations/202610070010_store_customization.sql`
11. `supabase/migrations/202610070011_store_content_blocks.sql`
12. `supabase/migrations/202610070012_add_lazada.sql`
13. `supabase/migrations/202610070013_banner_position.sql`
14. `supabase/migrations/202610070014_seller_product_metrics.sql`
15. `supabase/migrations/202610070015_expand_store_sections.sql`
16. `supabase/migrations/202610070016_store_pro_and_billplz.sql`
17. `supabase/migrations/202610070017_fix_pro_payment_service_role.sql`
18. `supabase/migrations/202610080018_paid_promotions.sql`
19. `supabase/migrations/202610080019_product_price_ranges.sql`

## 3. Configure local environment

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
```

Never expose the Supabase service-role key to browser code. It is used only as a server-only secret for the Billplz callback route.

## 4. Configure Auth URLs

In Supabase Auth URL configuration, add:

`http://127.0.0.1:3000/auth/callback`

Also add the deployed Pasar Karat callback URL before production use.

## 5. Designate the admin account

Create/sign up the administrator through the website first. Find that user's UUID in Supabase Auth > Users, then run:

```sql
insert into public.marketplace_admins(user_id)
values ('YOUR-ADMIN-USER-UUID')
on conflict do nothing;
```

Admin membership cannot be self-granted from the browser.

## 6. Install and run

```
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

Useful routes:

- `/items` — Collection
- `/submit-product` — protected product submission
- `/my-submissions` — submission status
- `/admin` — admin-only moderation
- `/auth` — sign in
- `/promote` — seller Product Boosting and Featured Store Placement

## Security behavior

New submissions are always pending. Pending and rejected products are excluded by public RLS. Only an authenticated admin can approve or reject. The database refuses an admin approving their own product.

Uploaded PNG/JPG/WebP files are decoded with Sharp, checked against their declared MIME type and extension, resized when needed, stripped through WebP re-encoding, and stored in a private bucket. Approval performs a second decode/re-encode before the image is copied to the public approved-product bucket.

Seller and affiliate links must use HTTPS and match the selected platform's allowed domains. The database repeats those platform/domain checks so bypassing the form does not bypass validation.


## Pasar Karat Pro / Billplz

For Pro checkout, configure the server-only values shown in `.env.example`.

- `SUPABASE_SERVICE_ROLE_KEY` is used only by the Billplz callback route and must never be exposed to browser code.
- `BILLPLZ_CALLBACK_BASE_URL` must be a public HTTPS origin. Billplz cannot call a localhost callback.
- Use the Billplz sandbox base URL and sandbox credentials while testing.
- The current prototype plans are RM9.90 for 30 days and RM99.00 for 365 days.
- Paid seller promotions reuse the same Billplz configuration: RM1.00 for a 7-day product boost and RM3.90 for a 7-day featured store placement.
