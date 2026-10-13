# Homepage Utama / Pendamping

`GET /api/v1/articles/homepage-highlights?lang=id|en|uz` is public. Omitted language defaults to `id`; unknown language/parameters are rejected. The existing success envelope contains:

```json
{"success":true,"code":200,"message":"Your Request Has Been Processed","data":{"primary":[],"supporting":[]}}
```

Items use the existing localized article-list DTO, including full title, summary, media metadata, author/category and `reading_time_minutes`. Internal reading content and group classification are omitted. Missing translations fall back to ID while category labels follow the requested UI locale.

Primary: canonical category slug `politics` OR placement `trending`, maximum 3. Supporting: neither condition, maximum 9. Both order by `published_at DESC, id ASC`. All eligibility filters precede limits: published, translation ready, not deleted, finite non-null publication time no later than database NOW. Retagging Trending does not promote an old article ahead of newer publication dates. All Trending placements are excluded from Supporting, including those beyond the Primary limit.

One SQL statement selects both groups from a consistent snapshot, then loads detail/reading fields for at most 12 IDs. Empty eligible catalogs legitimately return two arrays. Database failures return an error response, never an empty catalog. `Cache-Control: no-store`; frontend query caching/invalidation uses the `homepage` key family. No migrations, new CMS settings or new placement values are required.

Local SQL regression command (isolated database only):

```powershell
$env:EDITORIAL_TEST_DATABASE_URL='postgres://postgres:editorial-local@127.0.0.1:55436/egi_editorial_test'
node --test tests/homepage-highlights.test.cjs tests/editorial-handlers.test.cjs
```

The selector tests shadow public tables with connection-local temporary tables; existing content and schema are preserved.
