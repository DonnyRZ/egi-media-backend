const Query=require('./query');
const wrapper=require('../../../../helpers/utils/wrapper');
const {InternalServerError,NotFoundError}=require('../../../../helpers/errors');
class Domain {
  constructor(db) {this.query=new Query(db);}
  async category(id,lang='id') {
    const found=await this.query.category(id);
    if(!found) return wrapper.error(new InternalServerError('Unable to load category'));
    if(!found.rows.length) return wrapper.error(new NotFoundError('Category not found'));
    const category=found.rows[0].id;
    const [slots,pool,topics]=await Promise.all([this.query.slots(category),this.query.pool(category),this.query.topics(category)]);
    if(!slots||!pool||!topics) return wrapper.error(new InternalServerError('Unable to load editorial selection'));
    const chosen=type=>slots.rows.filter(s=>s.slot===type).map(s=>s.article_id);
    const lead=chosen('lead')[0] || pool.rows[0]?.id || null;
    const used=new Set(lead?[lead]:[]);
    const supporting=[];
    for(const articleId of [...chosen('supporting'),...pool.rows.map(a=>a.id)]) {
      if(!used.has(articleId)&&supporting.length<5) {supporting.push(articleId);used.add(articleId);}
    }
    return wrapper.data({category_id:category,curated:{lead_id:chosen("lead")[0]||null,supporting_ids:chosen("supporting"),editor_ids:chosen("editors")},lead_id:lead,supporting_ids:supporting,editor_ids:chosen('editors'),
      topics:topics.rows.map(t=>({id:t.id,name:t['name_'+lang]||t.name,slug:t['slug_'+lang]||t.slug}))});
  }
  localize(row,lang) {return {...row,name:row.translations?.[lang]?.name||row.name,description:row.translations?.[lang]?.description||row.description};}
  async list(kind,payload) {
    const {rows,count}=await this.query.list(kind,payload);
    if(!rows||!count) return wrapper.error(new InternalServerError('Unable to load media catalog'));
    return wrapper.paginationData(rows.rows.map(r=>this.localize(r,payload.lang)),{page:payload.page,limit:payload.limit,total:count.rows[0].total,total_pages:Math.ceil(count.rows[0].total/payload.limit)});
  }
  async one(kind,id,payload) {
    const result=await this.query.one(kind,id,payload.privateRead);
    if(!result) return wrapper.error(new InternalServerError('Unable to load media'));
    if(!result.rows.length) return wrapper.error(new NotFoundError('Media not found'));
    const row=this.localize(result.rows[0],payload.lang);
    if(kind==='collections') {const items=await this.query.items(row.id,payload.privateRead);if(!items)return wrapper.error(new InternalServerError('Unable to load collection'));row.video_ids=items.rows.map(i=>i.video_id);}
    return wrapper.data(row);
  }
  async hero() {const result=await this.query.hero();return result?wrapper.data(result.rows[0]||{hero_video_id:null}):wrapper.error(new InternalServerError('Unable to load video settings'));}
}
module.exports=Domain;
