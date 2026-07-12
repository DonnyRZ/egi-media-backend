CREATE TYPE "user_role" AS ENUM (
  'superadmin',
  'author',
  'member',
  'visitor'
);

CREATE TYPE "article_status" AS ENUM (
  'draft',
  'review',
  'scheduled',
  'published',
  'archived'
);

CREATE TYPE "notification_channel" AS ENUM (
  'in_app',
  'email'
);

CREATE TYPE "notification_status" AS ENUM (
  'pending',
  'sent',
  'read',
  'failed'
);

CREATE TYPE "subscription_status" AS ENUM (
  'active',
  'expired',
  'cancelled',
  'pending'
);

CREATE TYPE "newsletter_frequency" AS ENUM (
  'daily',
  'weekly',
  'monthly'
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "email" varchar(255) UNIQUE NOT NULL,
  "password_hash" text,
  "full_name" varchar(150),
  "role" user_role,
  "login_provider" varchar(25),
  "email_verified_at" timestamptz,
  "last_login_at" timestamptz,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  "deleted_at" timestamptz
);

CREATE TABLE "user_profiles" (
  "user_id" uuid PRIMARY KEY,
  "avatar_url" text,
  "bio" text,
  "industry" varchar(150),
  "job_title" varchar(150),
  "seniority" varchar(100),
  "company" varchar(150),
  "country" varchar(100),
  "created_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "author_followers" (
  "author_id" uuid,
  "follower_id" uuid,
  "created_at" timestamptz,
  PRIMARY KEY ("author_id", "follower_id")
);

CREATE TABLE "topic_followers" (
  "topic_id" uuid,
  "user_id" uuid,
  "created_at" timestamptz,
  PRIMARY KEY ("topic_id", "user_id")
);

CREATE TABLE "subscription_plans" (
  "id" uuid PRIMARY KEY,
  "name" varchar(100),
  "description" text,
  "price" decimal(12,2),
  "duration_days" int,
  "is_active" boolean,
  "created_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "user_subscriptions" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "subscription_plan_id" uuid,
  "started_at" timestamptz,
  "expired_at" timestamptz,
  "status" subscription_status,
  "payment_reference" varchar(255),
  "created_at" timestamptz
);

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY,
  "name" varchar(100),
  "slug" varchar(120),
  "description" text,
  "created_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "topics" (
  "id" uuid PRIMARY KEY,
  "name" varchar(100),
  "slug" varchar(120),
  "description" text,
  "created_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "tags" (
  "id" uuid PRIMARY KEY,
  "name" varchar(100),
  "slug" varchar(120),
  "created_at" timestamptz
);

CREATE TABLE "series" (
  "id" uuid PRIMARY KEY,
  "name" varchar(150),
  "slug" varchar(150),
  "description" text,
  "created_at" timestamptz
);

CREATE TABLE "articles" (
  "id" uuid PRIMARY KEY,
  "category_id" uuid,
  "series_id" uuid,
  "author_id" uuid,
  "title" varchar(255),
  "slug" varchar(255),
  "summary" text,
  "content" text,
  "featured_image" text,
  "status" article_status,
  "published_at" timestamptz,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  "deleted_at" timestamptz
);

CREATE TABLE "article_topics" (
  "article_id" uuid,
  "topic_id" uuid,
  PRIMARY KEY ("article_id", "topic_id")
);

CREATE TABLE "article_tags" (
  "article_id" uuid,
  "tag_id" uuid,
  PRIMARY KEY ("article_id", "tag_id")
);

CREATE TABLE "article_shares" (
  "id" uuid PRIMARY KEY,
  "article_id" uuid,
  "user_id" uuid,
  "platform" varchar(50),
  "shared_at" timestamptz
);

CREATE TABLE "article_views" (
  "id" uuid PRIMARY KEY,
  "article_id" uuid,
  "user_id" uuid,
  "ip_address" varchar(64),
  "viewed_at" timestamptz
);

CREATE TABLE "saved_articles" (
  "user_id" uuid,
  "article_id" uuid,
  "created_at" timestamptz,
  PRIMARY KEY ("user_id", "article_id")
);

CREATE TABLE "newsletters" (
  "id" uuid PRIMARY KEY,
  "name" varchar(150),
  "description" text,
  "frequency" newsletter_frequency,
  "is_active" boolean,
  "created_at" timestamptz
);

CREATE TABLE "newsletter_articles" (
  "newsletter_id" uuid,
  "article_id" uuid,
  "display_order" int,
  PRIMARY KEY ("newsletter_id", "article_id")
);

CREATE TABLE "newsletter_subscribers" (
  "newsletter_id" uuid,
  "user_id" uuid,
  "subscribed_at" timestamptz,
  PRIMARY KEY ("newsletter_id", "user_id")
);

CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "title" varchar(255),
  "message" text,
  "channel" notification_channel,
  "status" notification_status,
  "sent_at" timestamptz,
  "read_at" timestamptz,
  "created_at" timestamptz
);

CREATE TABLE "youtube_videos" (
  "id" uuid PRIMARY KEY,
  "title" varchar(255),
  "description" text,
  "url" text,
  "created_at" timestamptz
);

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "table_name" varchar(100),
  "record_id" uuid,
  "action" varchar(30),
  "old_data" json,
  "new_data" json,
  "ip_address" varchar(64),
  "user_agent" text,
  "created_at" timestamptz
);

ALTER TABLE "user_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "author_followers" ADD FOREIGN KEY ("author_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "author_followers" ADD FOREIGN KEY ("follower_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "topic_followers" ADD FOREIGN KEY ("topic_id") REFERENCES "topics" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "topic_followers" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_subscriptions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_subscriptions" ADD FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "articles" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "articles" ADD FOREIGN KEY ("author_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "articles" ADD FOREIGN KEY ("series_id") REFERENCES "series" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_topics" ADD FOREIGN KEY ("article_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_topics" ADD FOREIGN KEY ("topic_id") REFERENCES "topics" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_tags" ADD FOREIGN KEY ("article_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_tags" ADD FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_shares" ADD FOREIGN KEY ("article_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_shares" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_views" ADD FOREIGN KEY ("article_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "article_views" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "saved_articles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "saved_articles" ADD FOREIGN KEY ("article_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "newsletter_articles" ADD FOREIGN KEY ("newsletter_id") REFERENCES "newsletters" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "newsletter_articles" ADD FOREIGN KEY ("article_id") REFERENCES "articles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "newsletter_subscribers" ADD FOREIGN KEY ("newsletter_id") REFERENCES "newsletters" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "newsletter_subscribers" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;
