-- Rollback: 021_create_social_media_links

DROP INDEX IF EXISTS idx_social_media_links_sort_order;
DROP INDEX IF EXISTS idx_social_media_links_active_sort;
DROP TABLE IF EXISTS social_media_links;
