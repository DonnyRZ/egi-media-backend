-- Migration: 002_add_password_reset_tokens_table
-- Up

CREATE TABLE "password_reset_tokens" (
  "id"         uuid PRIMARY KEY,
  "user_id"    uuid NOT NULL,
  "token"      text UNIQUE NOT NULL,
  "type"       varchar(50) NOT NULL, -- 'email_verification' | 'password_reset'
  "expires_at" timestamptz NOT NULL,
  "used_at"    timestamptz,
  "created_at" timestamptz NOT NULL
);

CREATE INDEX "idx_password_reset_tokens_token" ON "password_reset_tokens" ("token");
CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id");

ALTER TABLE "password_reset_tokens"
  ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

-- Rollback:
-- DROP TABLE IF EXISTS "password_reset_tokens";
