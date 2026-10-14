-- Non-destructive rollback. Keep the additive schema and ad assets for forward recovery.
-- Roll back application code/build instead; legacy clients can ignore LATEST_VIDEOS.
SELECT 1;
