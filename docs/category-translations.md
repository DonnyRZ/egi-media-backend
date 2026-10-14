# Category translations

Category names are required in Indonesian. Descriptions and English/Uzbek fields are optional. Empty localized fields are translated asynchronously through the same configured AI provider and BullMQ/Redis infrastructure as article translations. Editor-entered values are retained as manual fields; AI updates only AI-owned fields when their Indonesian source changes.

Superadmins can inspect translation fields and status with `GET /api/v1/categories/:id/translations`. Retry a failed locale with `POST /api/v1/categories/:id/translations/retry` and `{ "locale": "en" }` or `{ "locale": "uz" }`. Public category responses continue to fall back to Indonesian until a localized name is ready.

Apply the additive schema change only to the intended database:

```sh
node scripts/run-category-ai-translations-migration.js --expect-database=<exact database name>
```

The runner checks the target database and stores a checksum in `editorial_schema_migrations`; it refuses to reapply a changed migration under the same version. The migration must run as a database role that can create objects in `public`; production applies it as the PostgreSQL administrator and grants the new tables to `egi_cms_app`.
