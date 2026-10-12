const COLUMNS = `v.id,v.title,v.description,v.url,v.is_active,v.author_id,v.status,
  v.title_en,v.description_en,v.title_uz,v.description_uz,v.created_at,
  v.format,v.poster_landscape,v.poster_portrait,v.duration_seconds,v.category_id,v.program_id,v.episode_number`;
class YoutubeQuery {
  constructor(db) { this.db=db; }
  async findMany({page,limit,search,active,publicOnly=true,actorRole,actorId,format,category_id,program_id,collection_id}) {
    const filters=['($1::text IS NULL OR v.title ILIKE $1 OR v.description ILIKE $1 OR v.title_en ILIKE $1 OR v.title_uz ILIKE $1)'];
    const values=[search ? `%${search}%` : null];
    if(publicOnly) filters.push("v.is_active AND v.status='published'");
    else {
      if(actorRole !== 'superadmin') {values.push(actorId);filters.push(`v.author_id=$${values.length}`);}
      if(active !== 'all') {values.push(active !== false && active !== 'false');filters.push(`v.is_active=$${values.length}`);}
    }
    for(const [key,value] of Object.entries({format,category_id,program_id})) {
      if(value) {values.push(value);filters.push(`v.${key}=$${values.length}`);}
    }
    if(collection_id) {values.push(collection_id);filters.push(`EXISTS(SELECT 1 FROM video_collection_items i JOIN video_collections c ON c.id=i.collection_id WHERE i.video_id=v.id AND v.format=c.format AND c.is_active AND i.collection_id=$${values.length})`);}
    const where=filters.join(' AND ');
    const countValues=[...values];
    values.push(limit,(page-1)*limit);
    const order = collection_id ? '(SELECT i.position FROM video_collection_items i WHERE i.video_id=v.id AND i.collection_id=$'+countValues.length+'),' : '';
    const [rows,count]=await Promise.all([
      this.db.executeQuery(`SELECT ${COLUMNS} FROM youtube_videos v WHERE ${where} ORDER BY ${order}${program_id ? 'v.episode_number ASC NULLS LAST,' : ''}v.created_at DESC,v.id DESC LIMIT $${values.length-1} OFFSET $${values.length}`,values),
      this.db.executeQuery(`SELECT count(*)::int total FROM youtube_videos v WHERE ${where}`,countValues)
    ]);
    return {rows,count};
  }
  findOneById(id, publicOnly=false) {
    return this.db.executeQuery(`SELECT ${COLUMNS} FROM youtube_videos v WHERE v.id=$1 ${publicOnly ? "AND v.is_active AND v.status='published'" : ''} LIMIT 1`,[id]);
  }
}
module.exports=YoutubeQuery;
