-- Migration: 023_create_team_members
-- CMS-managed EGI Media team roster for the public About page.

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY,
  name varchar(150) NOT NULL,
  role varchar(200) NOT NULL,
  bio text,
  photo_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT TRUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_active_sort
  ON team_members (is_active, sort_order ASC, name ASC);

CREATE INDEX IF NOT EXISTS idx_team_members_sort_order
  ON team_members (sort_order ASC);
