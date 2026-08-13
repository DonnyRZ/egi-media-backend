-- Rollback: 029_lock_ads_to_fixed_slots

DROP INDEX IF EXISTS idx_ads_placement_unique;
