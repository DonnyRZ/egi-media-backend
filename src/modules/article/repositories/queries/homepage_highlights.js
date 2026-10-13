// One statement gives both selections the same PostgreSQL snapshot. Only IDs
// enter the catalog CTE; reading content is loaded after the bounded selection.
const SQL = `
  WITH eligible AS (
    SELECT a.id, a.published_at,
           (COALESCE(c.slug = $1, false) OR COALESCE(a.placements @> $2::text[], false)) AS is_primary
    FROM articles a
    INNER JOIN users u ON u.id = a.author_id
    LEFT JOIN categories c ON c.id = a.category_id
    WHERE a.deleted_at IS NULL AND a.status = 'published'
      AND a.translation_status = 'ready'
      AND a.published_at IS NOT NULL AND a.published_at <= NOW()
      AND isfinite(a.published_at)
  ), primary_ids AS (
    SELECT id, published_at, 'primary'::text AS group_name FROM eligible
    WHERE is_primary ORDER BY published_at DESC, id ASC LIMIT $3
  ), supporting_ids AS (
    SELECT id, published_at, 'supporting'::text AS group_name FROM eligible
    WHERE NOT is_primary ORDER BY published_at DESC, id ASC LIMIT $4
  ), selected AS (
    SELECT id, published_at, group_name FROM primary_ids
    UNION ALL SELECT id, published_at, group_name FROM supporting_ids
  )
  SELECT s.group_name, a.id, a.title, a.slug, a.summary,
         a.title_en, a.slug_en, a.summary_en, a.title_uz, a.slug_uz, a.summary_uz,
         a.content AS reading_content, a.content_en AS reading_content_en,
         a.content_uz AS reading_content_uz,
         a.featured_image, a.featured_image_alt, a.featured_image_caption, a.featured_image_credit,
         a.status, a.translation_status, a.placements, a.headline_position,
         a.published_at, a.created_at, a.updated_at,
         u.id AS author_id, u.full_name AS author_full_name,
         c.id AS category_id, c.name AS category_name,
         c.name_en AS category_name_en, c.name_uz AS category_name_uz
  FROM selected s
  INNER JOIN articles a ON a.id = s.id
  INNER JOIN users u ON u.id = a.author_id
  LEFT JOIN categories c ON c.id = a.category_id
  ORDER BY s.group_name ASC, a.published_at DESC, a.id ASC
`;

module.exports = { SQL, VALUES: ['politics', ['trending'], 3, 9] };
