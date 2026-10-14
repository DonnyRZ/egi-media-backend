# Homepage advertisement contract

Migration: `034_homepage_ad_slots`, run with `node scripts/run-homepage-ad-slots-migration.js --expect-database=<exact database>`. The runner uses a transaction, advisory lock, checksum and `editorial_schema_migrations`. Existing IDs, images, target URLs and statistics remain intact. Missing homepage rows are inserted empty/inactive. The Sidebar row remains available as legacy data. Application rollback retains this additive schema and its new records.

Supported homepage keys: `LEADERBOARD`, `IN_FEED`, `LATEST_VIDEOS`. Authenticated CMS listing defaults to these three; explicit legacy Sidebar queries remain accepted for compatibility.

- `GET /api/v1/ads`, `GET/PUT /api/v1/ads/:id`: existing superadmin authentication/envelope. PUT additionally accepts optional `image_receipt`. A changed nonempty image requires a valid upload receipt bound to its URL and dimensions. Slot placement cannot be changed by PUT. Empty image/target URLs are accepted when inactive. Existing unchanged legacy creatives remain editable.
- Authenticated rows additionally include nullable `image_width`, `image_height`, `image_receipt`. Public active rows include dimensions, never the receipt.
- `POST /api/v1/uploads?purpose=ad&placement=LEADERBOARD|IN_FEED|LATEST_VIDEOS`: superadmin only; multipart file is stored unchanged, up to 5 MiB. Binary dimensions are inspected using image-size, including JPEG EXIF orientation. Formats: PNG, JPEG, WebP, AVIF. Ratios: 1920:367 or 16:9; maximum relative deviation 0.005; maximum 40 million pixels. The response adds `width`, `height`, `image_receipt` to `{url}`. The receipt is an HMAC with a distinct `egi-ad-image` domain using the existing configured signing secret.
- Uploads without `purpose=ad` preserve their original behavior and response.
- Click/impression endpoints remain compatible and maintain counters per slot.

Tests: `node --test tests/homepage-ads.test.cjs tests/upload.test.cjs`. The ad suite uses isolated in-memory PostgreSQL via the dev dependency PGlite and real HTTP handlers; no production database is accessed.
