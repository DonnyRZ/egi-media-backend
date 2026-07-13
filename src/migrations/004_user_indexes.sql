-- Migration: 004_user_indexes
-- Add indexes to improve query performance for user-related filters

-- Index untuk filter by role dan soft delete
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

-- Index untuk pencarian full_name
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users (full_name);

-- Index untuk author_followers
CREATE INDEX IF NOT EXISTS idx_author_followers_author_id ON author_followers (author_id);
CREATE INDEX IF NOT EXISTS idx_author_followers_follower_id ON author_followers (follower_id);
