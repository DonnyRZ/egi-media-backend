-- Rollback: 024_create_ads

DROP INDEX IF EXISTS idx_ads_active;
DROP INDEX IF EXISTS idx_ads_placement_active;
DROP TABLE IF EXISTS ads;
