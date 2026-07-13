-- Rollback Migration: 004_user_indexes

DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_deleted_at;
DROP INDEX IF EXISTS idx_users_full_name;
DROP INDEX IF EXISTS idx_author_followers_author_id;
DROP INDEX IF EXISTS idx_author_followers_follower_id;
