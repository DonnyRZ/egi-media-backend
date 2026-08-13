-- Rollback: 023_create_team_members

DROP INDEX IF EXISTS idx_team_members_sort_order;
DROP INDEX IF EXISTS idx_team_members_active_sort;
DROP TABLE IF EXISTS team_members;
