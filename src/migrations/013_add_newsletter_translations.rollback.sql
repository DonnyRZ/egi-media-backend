-- Rollback: 013_add_newsletter_translations

ALTER TABLE newsletters
  DROP COLUMN IF EXISTS name_en,
  DROP COLUMN IF EXISTS description_en,
  DROP COLUMN IF EXISTS name_uz,
  DROP COLUMN IF EXISTS description_uz;
