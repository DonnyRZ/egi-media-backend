const TABLES = { programs:'video_programs', collections:'video_collections' };
const COLUMNS = 'id,name,slug,description,translations,sort_order,is_active,created_at';
class Query {
  constructor(db) { this.db=db; }
  category(id) { return this.db.executeQuery('SELECT id FROM categories WHERE id::text=$1 OR slug=$1 LIMIT 1',[id]); }
  slots(id) { return this.db.executeQuery(`SELECT s.slot,s.position,s.article_id FROM category_editorial_slots s JOIN articles a ON a.id=s.article_id WHERE s.category_id=$1 AND a.category_id=$1 AND a.deleted_at IS NULL AND a.status='published' AND a.translation_status='ready' AND a.published_at IS NOT NULL AND a.published_at<=now() ORDER BY s.position`,[id]); }
  pool(id) { return this.db.executeQuery("SELECT id FROM articles WHERE category_id=$1 AND deleted_at IS NULL AND status='published' AND translation_status='ready' AND published_at IS NOT NULL AND published_at<=now() ORDER BY published_at DESC NULLS LAST,id DESC LIMIT 20",[id]); }
  validArticles(category,ids) { return this.db.executeQuery("SELECT id FROM articles WHERE category_id=$1 AND id=ANY($2::uuid[]) AND status='published' AND deleted_at IS NULL",[category,ids]); }
  topics(id) { return this.db.executeQuery('SELECT id,name,slug,name_en,slug_en,name_uz,slug_uz FROM topics WHERE category_id=$1 ORDER BY name,id',[id]); }
  async list(kind,{page,limit,privateRead=false}) {
    const table=TABLES[kind];
    const exists=kind==='programs' ? "EXISTS(SELECT 1 FROM youtube_videos v WHERE v.program_id=p.id AND v.is_active AND v.status='published')"
      : "EXISTS(SELECT 1 FROM video_collection_items i JOIN youtube_videos v ON v.id=i.video_id WHERE i.collection_id=p.id AND v.format=p.format AND v.is_active AND v.status='published')";
    const where=privateRead ? 'TRUE' : `p.is_active AND ${exists}`;
    const extra=kind==='programs' ? ',poster_url' : ',format';
    const [rows,count]=await Promise.all([
      this.db.executeQuery(`SELECT ${COLUMNS}${extra} FROM ${table} p WHERE ${where} ORDER BY sort_order,created_at DESC,id LIMIT $1 OFFSET $2`,[limit,(page-1)*limit]),
      this.db.executeQuery(`SELECT count(*)::int total FROM ${table} p WHERE ${where}`,[])
    ]);
    return {rows,count};
  }
  one(kind,id,privateRead=false) { return this.db.executeQuery(`SELECT ${COLUMNS}${kind==='programs' ? ',poster_url' : ',format'} FROM ${TABLES[kind]} WHERE (id::text=$1 OR slug=$1) ${privateRead ? '' : 'AND is_active'} LIMIT 1`,[id]); }
  items(id,privateRead=false) { return this.db.executeQuery(`SELECT i.video_id FROM video_collection_items i JOIN youtube_videos v ON v.id=i.video_id JOIN video_collections c ON c.id=i.collection_id WHERE i.collection_id=$1 ${privateRead?'':"AND v.is_active AND v.status='published' AND v.format=c.format"} ORDER BY i.position`,[id]); }
  videos(ids) { return this.db.executeQuery('SELECT id,format,is_active,status FROM youtube_videos WHERE id=ANY($1::uuid[])',[ids]); }
  hero() { return this.db.executeQuery('SELECT hero_video_id FROM video_hub_settings WHERE singleton=true',[]); }
}
module.exports=Query;
