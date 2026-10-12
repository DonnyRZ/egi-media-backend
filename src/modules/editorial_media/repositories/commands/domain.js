const Query=require('../queries/query');
const {insertAuditLog}=require('../../../../helpers/utils/audit_log');
const Command=require('./command');
const wrapper=require('../../../../helpers/utils/wrapper');
const {BadRequestError,InternalServerError,NotFoundError}=require('../../../../helpers/errors');
class Domain {
  constructor(db){this.db=db;this.query=new Query(db);this.command=new Command(db);}
  async audit(table,record,payload) {
    if(!payload.actor_id)return;
    const {actor_id,ip_address,user_agent,...data}=payload;
    await insertAuditLog(this.db,{user_id:actor_id,table_name:table,record_id:record,action:'UPDATE',new_data:data,ip_address,user_agent});
  }
  async slots(id,payload) {
    const found=await this.query.category(id);
    if(!found) return wrapper.error(new InternalServerError('Unable to load category'));
    if(!found.rows.length) return wrapper.error(new NotFoundError('Category not found'));
    const category=found.rows[0].id;
    const opening=[...(payload.lead_id?[payload.lead_id]:[]),...payload.supporting_ids];
    if(new Set(opening).size!==opening.length) return wrapper.error(new BadRequestError('Opening stories must be unique'));
    const ids=[...new Set([...opening,...payload.editor_ids])];
    const valid=await this.query.validArticles(category,ids);
    if(!valid) return wrapper.error(new InternalServerError('Unable to validate articles'));
    if(valid.rows.length!==ids.length) return wrapper.error(new BadRequestError('Choose published articles from this category'));
    const result=await this.command.slots(category,{lead:payload.lead_id?[payload.lead_id]:[],supporting:payload.supporting_ids,editors:payload.editor_ids});
    if(result)await this.audit('category_editorial_slots',category,payload);
    return result?wrapper.data(payload):wrapper.error(new InternalServerError('Unable to save category layout'));
  }
  async save(kind,id,payload) {
    if(id) {const existing=await this.query.one(kind,id,true);if(!existing) return wrapper.error(new InternalServerError('Unable to load media'));if(!existing.rows.length)return wrapper.error(new NotFoundError('Media not found'));}
    if(kind==='collections') {
      const valid=await this.query.videos(payload.video_ids);
      if(!valid) return wrapper.error(new InternalServerError('Unable to validate collection'));
      if(valid.rows.length!==payload.video_ids.length||valid.rows.some(v=>v.format!==payload.format||!v.is_active||v.status!=='published')) return wrapper.error(new BadRequestError('Choose published videos of the collection format'));
    }
    const result=await this.command.save(kind,id,payload);
    if(result)await this.audit(kind==='programs'?'video_programs':'video_collections',result[0].rows[0].id,payload);
    return result?wrapper.data({id:result[0].rows[0].id}):wrapper.error(new BadRequestError('Unable to save; check the unique slug and selected media'));
  }
  async hero(payload) {
    if(payload.hero_video_id) {
      const valid=await this.query.videos([payload.hero_video_id]);
      if(!valid) return wrapper.error(new InternalServerError('Unable to validate hero'));
      if(!valid.rows.length||valid.rows[0].format!=='horizontal'||!valid.rows[0].is_active||valid.rows[0].status!=='published')return wrapper.error(new BadRequestError('Choose a published horizontal video'));
    }
    const result=await this.command.hero(payload.hero_video_id);
    if(result)await this.audit('video_hub_settings',null,payload);
    return result?wrapper.data(result.rows[0]):wrapper.error(new InternalServerError('Unable to save video hero'));
  }
}
module.exports=Domain;
