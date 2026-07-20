-- Series image fixture (migration 011_add_series_image)
-- One shared image for all locales (id/en/uz).

UPDATE series
SET image = 'https://example.com/series-ai-for-business.png'
WHERE id = '00000000-0000-4000-8000-000000000301';
