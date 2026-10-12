const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {Pool}=require('pg');
const {extractYoutubeId}=require('../src/helpers/utils/youtube');
const VideoQuery=require('../src/modules/youtube/repositories/queries/query');
const VideoCommand=require('../src/modules/youtube/repositories/commands/command');
const EditorialQuery=require('../src/modules/editorial_media/repositories/queries/domain');
const EditorialCommand=require('../src/modules/editorial_media/repositories/commands/domain');
const ArticleCommand=require('../src/modules/article/repositories/commands/command');
const ColumnCommand=require('../src/modules/column/repositories/commands/command');
const ArticleDomain=require('../src/modules/article/repositories/commands/domain');
const ColumnDomain=require('../src/modules/column/repositories/commands/domain');
const url=process.env.EDITORIAL_TEST_DATABASE_URL;
assert.ok(url&&/^postgres:\/\/[^@]+@127\.0\.0\.1:55436\/egi_editorial_test$/.test(url),'Use the isolated local editorial database');
const pool=new Pool({connectionString:url});
const db={executeQuery:(q,v)=>pool.query(q,v),executeTransaction:async queries=>{
  const c=await pool.connect();try{await c.query('BEGIN');const out=[];for(const x of queries)out.push(await c.query(x.query,x.values));await c.query('COMMIT');return out;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}};
const ids={author:randomUUID(),other:randomUUID(),category:randomUUID(),category2:randomUUID(),articles:Array.from({length:25},()=>randomUUID()),horizontal:randomUUID(),short:randomUUID(),review:randomUUID()};
const eq=new EditorialQuery(db), ec=new EditorialCommand(db),vq=new VideoQuery(db),vc=new VideoCommand(db);
before(async()=>{
  for(const id of [ids.author,ids.other])await pool.query("INSERT INTO users(id,email,full_name,role) VALUES($1,$2,'Local fixture','superadmin')",[id,id+'@example.invalid']);
  for(const id of [ids.category,ids.category2])await pool.query("INSERT INTO categories(id,name,slug) VALUES($1::uuid,'Local fixture',$1::text)",[id]);
  for(let i=0;i<ids.articles.length;i++)await pool.query("INSERT INTO articles(id,author_id,category_id,title,slug,content,status,translation_status,published_at) VALUES($1::uuid,$2,$3,$4,$1::text,'<p>Fixture</p>',$5,'ready',now()-($6::int*interval '1 hour'))",[ids.articles[i],ids.author,ids.category,'Fixture '+i,i<22?'published':i===22?'draft':i===23?'scheduled':'archived',i]);
  for(const [id,format,status,active] of [[ids.horizontal,'horizontal','published',true],[ids.short,'short','published',true],[ids.review,'horizontal','review',false]])await vc.insertOne({id,title:'Local video',url:'https://youtu.be/dQw4w9WgXcQ',is_active:active,author_id:ids.author,status,created_at:new Date(),metadata:{format,poster_portrait:'https://example.invalid/poster.png'}});
});
after(async()=>{
  await pool.query('DELETE FROM audit_logs WHERE user_id=ANY($1::uuid[])',[[ids.author,ids.other]]);
  await pool.query('DELETE FROM youtube_videos WHERE author_id=$1',[ids.author]);
  await pool.query('DELETE FROM articles WHERE author_id=$1',[ids.author]);
  await pool.query('DELETE FROM columns WHERE author_id=$1',[ids.author]);
await pool.query('DELETE FROM categories WHERE id=ANY($1::uuid[])',[[ids.category,ids.category2]]);
  await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[[ids.author,ids.other]]);
  await pool.end();
  for(const name of ['email','article-translation','column-translation']){const queue=require('../src/helpers/queues/'+name+'.queue');for(const value of Object.values(queue))if(value&&typeof value.close==='function')await value.close();}
  require('../src/helpers/databases/redis/connection').getConnection().disconnect();
});
test('YouTube URL forms and hostile hosts',()=>{
  for(const url of ['https://youtu.be/dQw4w9WgXcQ?t=1','https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ','https://youtube.com/shorts/dQw4w9WgXcQ','https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'])assert.equal(extractYoutubeId(url),'dQw4w9WgXcQ');
  for(const url of ['https://youtube.com.evil.invalid/watch?v=dQw4w9WgXcQ','https://evil.invalid/youtube.com/dQw4w9WgXcQ','javascript:alert(1)','https://youtu.be/invalid','https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ'])assert.equal(extractYoutubeId(url),null);
});
test('fallback is bounded and never exposes non-published stories',async()=>{
  const out=await eq.category(ids.category);
  assert.equal(out.err,null);assert.equal(out.data.lead_id,ids.articles[0]);assert.equal(out.data.supporting_ids.length,5);
  assert.ok(!out.data.supporting_ids.some(id=>ids.articles.slice(22).includes(id)));
});
test('empty category remains empty',async()=>assert.equal((await eq.category(ids.category2)).data.lead_id,null));
test('saving image metadata with unchanged titles preserves primary and translated slugs',async()=>{
  const record=ids.articles[20];
  const translations={en:{title:'English headline',content:'<p>English content</p>'},uz:{title:'Uzbek headline',content:'<p>Uzbek content</p>'}};
  await pool.query("UPDATE articles SET slug='canonical-existing',title_en=$2,content_en=$3,slug_en='canonical-en',title_uz=$4,content_uz=$5,slug_uz='canonical-uz' WHERE id=$1",[record,translations.en.title,translations.en.content,translations.uz.title,translations.uz.content]);
  const out=await new ArticleDomain(db).updateArticle({id:record,actor_id:ids.author,actor_role:'superadmin',title:'Fixture 20',content:'<p>Fixture</p>',translations,featured_image_caption:'New caption'});
  assert.equal(out.err,null);const row=(await pool.query('SELECT slug,slug_en,slug_uz FROM articles WHERE id=$1',[record])).rows[0];
  assert.deepEqual(row,{slug:'canonical-existing',slug_en:'canonical-en',slug_uz:'canonical-uz'});
  const column=require('node:crypto').randomUUID();
  await pool.query("INSERT INTO columns(id,author_id,title,slug,content,status,title_en,slug_en,content_en,title_uz,slug_uz,content_uz,translation_status) VALUES($1,$2,'Column headline','column-canonical','<p>Body</p>','published',$3,'column-en',$4,$5,'column-uz',$6,'ready')",[column,ids.author,translations.en.title,translations.en.content,translations.uz.title,translations.uz.content]);
  const result=await new ColumnDomain(db).updateColumn({id:column,actor_id:ids.author,actor_role:'superadmin',title:'Column headline',translations,featured_image_caption:'Column caption'});
  assert.equal(result.err,null);assert.deepEqual((await pool.query('SELECT slug,slug_en,slug_uz FROM columns WHERE id=$1',[column])).rows[0],{slug:'column-canonical',slug_en:'column-en',slug_uz:'column-uz'});
});
test('curation accepts old published article and preserves order',async()=>{
  const out=await ec.slots(ids.category,{lead_id:ids.articles[21],supporting_ids:[ids.articles[4],ids.articles[3]],editor_ids:[ids.articles[8]]});assert.equal(out.err,null);
  const result=(await eq.category(ids.category)).data;assert.equal(result.lead_id,ids.articles[21]);assert.deepEqual(result.supporting_ids.slice(0,2),[ids.articles[4],ids.articles[3]]);
});
test('duplicate opening and unpublished or wrong-category selections are rejected',async()=>{
  for(const selection of [{lead_id:ids.articles[0],supporting_ids:[ids.articles[0]],editor_ids:[]},{lead_id:ids.articles[22],supporting_ids:[],editor_ids:[]}])assert.ok((await ec.slots(ids.category,selection)).err);
  assert.ok((await ec.slots(ids.category2,{lead_id:ids.articles[0],supporting_ids:[],editor_ids:[]})).err);
});
test('unpublished pinned lead is replaced at read time',async()=>{
  await pool.query("UPDATE articles SET status='archived' WHERE id=$1",[ids.articles[21]]);assert.equal((await eq.category(ids.category)).data.lead_id,ids.articles[0]);
});
test('public video query ignores private records',async()=>{
  const out=await vq.findMany({page:1,limit:100,active:'all'});assert.ok(out.rows.rows.some(v=>v.id===ids.horizontal));assert.ok(!out.rows.rows.some(v=>v.id===ids.review));assert.equal((await vq.findOneById(ids.review,true)).rows.length,0);
});
test('CMS author query only reads owned records',async()=>{
  assert.equal((await vq.findMany({page:1,limit:100,active:'all',publicOnly:false,actorRole:'author',actorId:ids.other})).rows.rows.length,0);
});
test('old video update preserves optional metadata and format filters work',async()=>{
  await vc.updateOne({id:ids.short,title:'Updated',url:'https://youtu.be/dQw4w9WgXcQ',is_active:true,status:'published',translationValues:{},updatedTranslationFields:[]});
  assert.equal((await vq.findOneById(ids.short)).rows[0].format,'short');assert.equal((await vq.findOneById(ids.short)).rows[0].poster_portrait,'https://example.invalid/poster.png');
  const out=await vq.findMany({page:1,limit:100,format:'short'});assert.ok(out.rows.rows.every(v=>v.format==='short'));
});
test('hero rejects short or review video',async()=>{
  assert.ok((await ec.hero({hero_video_id:ids.short})).err);assert.ok((await ec.hero({hero_video_id:ids.review})).err);
  assert.equal((await ec.hero({hero_video_id:ids.horizontal})).err,null);await ec.hero({hero_video_id:null});
});
test('program and collection order with format validation',async()=>{
  const p=await ec.save('programs',null,{name:'Local program',slug:'local-'+randomUUID(),is_active:true,sort_order:0,translations:{en:{name:'English program'}},poster_url:null});
  const program=p.data.id;await vc.updateOne({id:ids.horizontal,title:'Episode',url:'https://youtu.be/dQw4w9WgXcQ',is_active:true,status:'published',translationValues:{},updatedTranslationFields:[],metadata:{program_id:program,episode_number:1}});
  assert.equal((await eq.one('programs',program,{lang:'en',privateRead:false})).data.name,'English program');
  assert.ok((await eq.list('programs',{page:1,limit:100,lang:'id'})).data.some(x=>x.id===program));
  assert.ok((await ec.save('collections',null,{name:'Invalid',slug:'invalid-'+randomUUID(),format:'horizontal',video_ids:[ids.short],sort_order:0,is_active:true})).err);
  const c=await ec.save('collections',null,{name:'Local collection',slug:'local-'+randomUUID(),format:'horizontal',video_ids:[ids.horizontal],sort_order:0,is_active:true});
  assert.equal((await vq.findMany({page:1,limit:20,collection_id:c.data.id})).rows.rows[0].id,ids.horizontal);
  await pool.query('DELETE FROM video_collections WHERE id=$1',[c.data.id]);await pool.query('DELETE FROM video_programs WHERE id=$1',[program]);
});
test('article image metadata create and patch preserve previous values',async()=>{
  const command=new ArticleCommand(db);const id=randomUUID();
  const out=await command.insertArticle({id,author_id:ids.author,category_id:ids.category,title:'Metadata',slug:id,content:'<p>Fixture</p>',status:'draft',topic_ids:[],tag_ids:[],imageMetadata:{featured_image_alt:'Alt',featured_image_credit:'Credit'}});assert.equal(out.err,null);
  const updated=await command.updateArticle({id,title:'Changed',updatedFields:['title'],imageMetadata:{}});assert.equal(updated.err,null);
  const row=(await pool.query('SELECT featured_image_alt,featured_image_credit FROM articles WHERE id=$1',[id])).rows[0];assert.equal(row.featured_image_alt,'Alt');assert.equal(row.featured_image_credit,'Credit');
});
test('column image metadata create and patch work',async()=>{
  const command=new ColumnCommand(db);const id=randomUUID();
  assert.equal((await command.insertColumn({id,author_id:ids.author,title:'Column',slug:id,content:'<p>Fixture</p>',status:'draft',imageMetadata:{featured_image_alt:'Column alt'}})).err,null);
  assert.equal((await command.updateColumn({id,updatedFields:['featured_image_caption'],imageMetadata:{featured_image_caption:'Caption'}})).err,null);
  const row=(await pool.query('SELECT featured_image_alt,featured_image_caption FROM columns WHERE id=$1',[id])).rows[0];assert.equal(row.featured_image_alt,'Column alt');assert.equal(row.featured_image_caption,'Caption');
});
