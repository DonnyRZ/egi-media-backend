const {randomUUID}=require('crypto');
const TABLES={programs:'video_programs',collections:'video_collections'};
class Command {
  constructor(db) { this.db=db; }
  slots(category,slots) {
    const queries=[{query:'SELECT id FROM categories WHERE id=$1 FOR UPDATE',values:[category]},{query:'DELETE FROM category_editorial_slots WHERE category_id=$1',values:[category]}];
    for(const [slot,ids] of Object.entries(slots)) ids.forEach((id,i)=>queries.push({
      query:'INSERT INTO category_editorial_slots(category_id,slot,position,article_id) VALUES($1,$2,$3,$4)',values:[category,slot,i+1,id]
    }));
    return this.db.executeTransaction(queries);
  }
  save(kind,id,payload) {
    const keys=['name','slug','description','translations','sort_order','is_active',kind==='programs'?'poster_url':'format'];
    const values=keys.map(key=>key==='translations'?JSON.stringify(payload[key]||{}):payload[key] ?? null);
    const set=keys.map((key,i)=>key+'=$'+(i+1)).join(',');
    const itemId=id || randomUUID();
    values.push(itemId);
    const query=id ? `UPDATE ${TABLES[kind]} SET ${set} WHERE id=$${values.length} RETURNING id`
      : `INSERT INTO ${TABLES[kind]}(${keys.join(',')},id) VALUES(${values.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING id`;
    const queries=[{query,values}];
    if(kind==='collections') {
      queries.push({query:'DELETE FROM video_collection_items WHERE collection_id=$1',values:[itemId]});
      payload.video_ids.forEach((videoId,i)=>queries.push({query:'INSERT INTO video_collection_items(collection_id,video_id,position) VALUES($1,$2,$3)',values:[itemId,videoId,i+1]}));
    }
    return this.db.executeTransaction(queries);
  }
  hero(id) { return this.db.executeQuery('UPDATE video_hub_settings SET hero_video_id=$1 WHERE singleton=true RETURNING hero_video_id',[id]); }
}
module.exports=Command;
