# Editorial media API and migration

The editorial release is additive. Run `node scripts/run-editorial-media-migration.js --expect-database=egi_media_prod` from the reviewed production checkout. The runner checks the actual database name, acquires a transaction lock and records version/checksum. Re-running matching SQL is a no-op; a checksum change aborts. Do not run seed SQL on production.

## Category editorial selection

`GET /api/v1/categories/:id/editorial?lang=id|en|uz` accepts a UUID or slug. The response data contains `category_id`, resolved `lead_id`, ordered `supporting_ids` (up to five), `editor_ids` (up to four), valid `curated` selections and localized `topics`. Resolved selections omit deleted, non-published, untranslated or moved stories and fall back to a pool of 20 published stories ordered by publication time and ID. Reading never updates placement records.

`PUT /api/v1/categories/:id/editorial` requires a superadmin. Body: `{lead_id:null|uuid,supporting_ids:uuid[],editor_ids:uuid[]}`. Empty choices clear pins and restore fallback. Lead/support IDs must be distinct and belong to the selected category. The write replaces slots atomically.

## Videos

The existing `/api/v1/youtube-videos` list and detail are public active/published only, even when a caller supplies `active=all`. Private list/detail use `/api/v1/cms/youtube-videos`; authors list their own videos, while superadmins can read all. Existing create/update/delete ownership and review/publish rules remain.

New optional fields: `format` (`horizontal` or `short`), `poster_landscape`, `poster_portrait`, `duration_seconds`, `category_id`, `program_id`, `episode_number`. Omitted update fields retain previous values. Explicit null clears optional metadata. New `/shorts/` URLs default to `short`; existing unambiguously recognized Shorts receive that format during migration. YouTube URL validation uses exact hostname and an 11-character video ID, supporting watch/query, short, embed and youtu.be URLs.

Public list filters: `format`, `category_id`, `program_id`, `collection_id`, `search`, `lang`, `page`, `limit` (1–100). Programs order episodes by episode number, then created time and ID; collection lists respect curated positions and omit unavailable or mismatched formats.

## Programs, collections and hero

`GET /api/v1/video-programs` and `GET /api/v1/video-collections` use the existing data/meta pagination envelope. Public catalogs contain active resources with published episodes/items. Detail accepts UUID or primary slug. Authenticated catalog/detail paths start with `/api/v1/cms/`; author/superadmin may read metadata. Only superadmin may POST or PUT public resource paths to curate the catalog. Deactivate a resource to remove it from public discovery without deleting data.

Shared write fields: `name`, unique `slug`, optional `description`, optional `translations` for `en`/`uz` (`name`, `description`), `is_active`, `sort_order`. Programs also accept `poster_url`. Collections require `format` and ordered `video_ids` (up to 100), all published and matching that format.

`GET /api/v1/video-hub/settings` returns `{hero_video_id:null|uuid}`. Superadmin PUT accepts the same body; selected videos must be published horizontal media. The frontend falls back when a formerly selected video becomes unavailable.

## Images and contextual opinion

Article and Column create/update accept optional `featured_image_alt` (500 characters), `featured_image_caption` (1000) and `featured_image_credit` (500). Omitted values preserve existing data. Public and CMS DTOs include these fields. Columns additionally accept optional `category_id`; the public list can filter by it. Public Column author data includes existing profile avatar/bio for editorial context. Series lists accept `topic_id`.

## Compatibility and recovery

Old client video writes continue to work and preserve added metadata. Private CMS video reads now use the authenticated endpoint; deploy the paired frontend/backend release together. Rolling application code back leaves schema additions and data intact. The SQL rollback file drops added data and is reserved for an isolated test database or a separately reviewed database recovery.

Local tests: create an isolated PostgreSQL database on `127.0.0.1:55436`, apply migrations, then set `EDITORIAL_TEST_DATABASE_URL` to `postgres://postgres:editorial-local@127.0.0.1:55436/egi_editorial_test` and run `node --test tests/editorial-media.test.cjs`. Browser fixture server `tests/local-editorial-server.cjs --reset` binds loopback port 5007 and targets only that database. Never run the fixture server against production.
