const META = ['format','poster_landscape','poster_portrait','duration_seconds','category_id','program_id','episode_number'];
const TRANSLATIONS = ['title_en','description_en','title_uz','description_uz'];
const COLUMNS = ['id','title','description','url','is_active','author_id','status','created_at',...TRANSLATIONS,...META];
class YoutubeCommand {
  constructor(db) { this.db = db; }
  insertOne(payload) {
    const values = COLUMNS.map(key => META.includes(key) ? payload.metadata?.[key] ?? null : payload[key] ?? null);
    return this.db.executeQuery(`INSERT INTO youtube_videos (${COLUMNS.join(',')}) VALUES (${COLUMNS.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING ${COLUMNS.join(',')}`, values);
  }
  updateOne(payload) {
    const columns = ['title','description','url','is_active','status',
      ...TRANSLATIONS.filter(key=>payload.updatedTranslationFields.includes(key)),
      ...META.filter(key=>payload.metadata?.[key] !== undefined)];
    const values = columns.map(key => TRANSLATIONS.includes(key) ? payload.translationValues[key]
      : META.includes(key) ? payload.metadata[key] || null : payload[key]);
    values.push(payload.id);
    return this.db.executeQuery(`UPDATE youtube_videos SET ${columns.map((key,i)=>key+'=$'+(i+1)).join(',')} WHERE id=$${values.length} RETURNING ${COLUMNS.join(',')}`,values);
  }
  deleteOne(id) { return this.db.executeQuery(`DELETE FROM youtube_videos WHERE id=$1 RETURNING ${COLUMNS.join(',')}`,[id]); }
}
module.exports = YoutubeCommand;
