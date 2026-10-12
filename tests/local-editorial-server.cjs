// Local-only browser QA server. Never accepts a remote database or interface.
if(process.env.NODE_ENV==='production')throw new Error('QA server is disabled in production');
const fs=require('node:fs');
const path=require('node:path');
const {Pool}=require('pg');
const {randomUUID}=require('node:crypto');
process.env.POSTGRESQL_URL='postgres://postgres:editorial-local@127.0.0.1:55436/egi_editorial_test';
process.env.ACCESS_TOKEN_SECRET='local-editorial-qa-only';
process.env.REFRESH_TOKEN_SECRET='local-editorial-qa-refresh-only';
process.env.ACCESS_SIGN_OPTIONS='{"expiresIn":"2h"}';
process.env.ENCRYPTION_KEY='local-editorial-qa-only';
process.env.AI_ENABLED='false';
process.env.MAIL_HOST='';process.env.SMTP_HOST='';
process.env.REDIS_URL='redis://127.0.0.1:6399';
const express=require('express');
const cors=require('cors');
const jwt=require('jsonwebtoken');
const pool=new Pool({connectionString:process.env.POSTGRESQL_URL});
const ids={author:randomUUID(),category:randomUUID(),emptyCategory:randomUUID(),topic:randomUUID(),series:randomUUID(),program:randomUUID(),collection:randomUUID(),videos:Array.from({length:10},()=>randomUUID()),articles:Array.from({length:25},()=>randomUUID()),column:randomUUID()};
const image='http://localhost:3026/images/editorial-preview.png';
const ok=(res,data,meta)=>res.json({success:true,code:200,message:'Local fixture',data,...(meta?{meta}:{})});
async function setup(){
  const fixtureFile=path.join(__dirname,'../node_modules/.editorial-qa-ids.json');
  if(process.argv.includes('--reuse')) {Object.assign(ids,JSON.parse(fs.readFileSync(fixtureFile,'utf8')));} else {
  if(process.argv.includes('--reset')) {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    for(const file of fs.readdirSync(path.join(__dirname,'../src/migrations')).filter(f=>f.endsWith('.sql')&&!f.includes('.rollback.')).sort())await pool.query(fs.readFileSync(path.join(__dirname,'../src/migrations',file),'utf8'));
  }
  await pool.query("INSERT INTO users(id,email,full_name,role) VALUES($1,'editorial-local@example.invalid','Local Editor','superadmin')",[ids.author]);
  for(const [id,name,slug]of [[ids.category,'Bisnis','business'],[ids.emptyCategory,'Teknologi','technology']])await pool.query('INSERT INTO categories(id,name,slug,name_en,name_uz) VALUES($1,$2,$3,$4,$5)',[id,name,slug,name==='Bisnis'?'Business':'Technology',name==='Bisnis'?'Biznes':'Texnologiya']);
  await pool.query("INSERT INTO topics(id,category_id,name,slug) VALUES($1,$2,'Ekonomi kreatif','ekonomi-kreatif')",[ids.topic,ids.category]);
  await pool.query("INSERT INTO series(id,topic_id,author_id,name,slug,image) VALUES($1,$2,$3,'Masa depan industri kreatif','industri-kreatif',$4)",[ids.series,ids.topic,ids.author,image]);
  const titles=['Sentuhan Techno Craft dan Regenerasi Kriya: INACRAFT October 2026 Resmi Dibuka di JICC','Teknologi membuka peluang baru bagi industri kreatif Indonesia','Pelaku usaha memperluas pasar melalui inovasi dan kolaborasi','Pertumbuhan investasi memberi arah baru bagi ekonomi nasional'];
  const content='<p>Perubahan industri kreatif Indonesia menghubungkan tradisi, teknologi, dan generasi baru. Para pelaku usaha memperluas kolaborasi dan mengembangkan inovasi untuk menghadapi kebutuhan pasar.</p>'.repeat(6);
  for(let i=0;i<ids.articles.length;i++){
    const status=i<20?'published':i===20?'draft':i===21?'review':i===22?'scheduled':'archived';
    await pool.query(`INSERT INTO articles(id,author_id,category_id,series_id,title,slug,summary,content,featured_image,status,translation_status,published_at,placements,headline_position,title_en,content_en,summary_en,title_uz,content_uz,summary_uz,featured_image_credit) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'ready',now()-($11::int*interval '1 hour'),$12,$13,$14,$8,$7,$15,$8,$7,'Local fixture · supplied photo')`,[ids.articles[i],ids.author,ids.category,i<4?ids.series:null,titles[i%4],`local-story-${i}`,'Perkembangan industri kreatif menghubungkan tradisi, teknologi, dan generasi baru. Liputan untuk membaca perubahan yang sedang terjadi.',content,image,status,i,i===0?['homepage_hero']:i<4?['headline']:['latest_news'],i>0&&i<4?i:null,'Creative industry develops new opportunities '+i,'Ijodiy sanoat uchun yangi imkoniyatlar '+i]);
    if(i<12)await pool.query('INSERT INTO article_topics(article_id,topic_id) VALUES($1,$2)',[ids.articles[i],ids.topic]);
  }
  await pool.query("INSERT INTO user_profiles(user_id,bio) VALUES($1,'Analisis industri dan ekonomi kreatif.')",[ids.author]);
  await pool.query("INSERT INTO columns(id,author_id,category_id,title,slug,summary,content,featured_image,status,translation_status,published_at,created_at) VALUES($1,$2,$3,'Membaca arah baru ekonomi kreatif','arah-ekonomi-kreatif','Analisis perubahan pasar dan peluang bagi pelaku usaha.',$4,$5,'published','ready',now(),now())",[ids.column,ids.author,ids.category,content,image]);
  await pool.query("INSERT INTO video_programs(id,name,slug,description,poster_url,is_active) VALUES($1,'EGI Conversations','egi-conversations','Percakapan tentang perubahan industri dan masyarakat.',$2,true)",[ids.program,image]);
  await pool.query("INSERT INTO video_collections(id,name,slug,format,is_active) VALUES($1,'Pilihan redaksi','pilihan-redaksi','horizontal',true)",[ids.collection]);
  for(let i=0;i<ids.videos.length;i++){
    await pool.query("INSERT INTO youtube_videos(id,author_id,title,description,url,is_active,status,format,category_id,program_id,episode_number,poster_landscape,poster_portrait,duration_seconds,created_at) VALUES($1,$2,$3,'Percakapan tentang perubahan industri kreatif.',$4,$5,$6,$7,$8,$9,$10,$11,$11,245,now()-($10::int*interval '1 hour'))",[ids.videos[i],ids.author,'Cerita di balik perubahan industri kreatif '+(i+1),i>=5?'https://youtube.com/shorts/dQw4w9WgXcQ':'https://youtu.be/dQw4w9WgXcQ',i!==9,i===9?'review':'published',i>=5?'short':'horizontal',ids.category,i<4?ids.program:null,i+1,image]);
    if(i<4)await pool.query('INSERT INTO video_collection_items(collection_id,video_id,position) VALUES($1,$2,$3)',[ids.collection,ids.videos[i],i+1]);
  }
  await pool.query('UPDATE video_hub_settings SET hero_video_id=$1',[ids.videos[0]]);
  }
  const app=express();app.use(cors({origin:['http://localhost:3026','http://127.0.0.1:3026','http://localhost:3027'],credentials:true}));app.use(express.json());app.use(require('cookie-parser')());
  const user={id:ids.author,email:'editorial-local@example.invalid',full_name:'Local Editor',role:'superadmin',email_verified_at:new Date().toISOString()};
  const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'2h'});
  const failures=new Set();
  app.post('/__qa/fail',(req,res)=>{failures.clear();for(const prefix of req.body.paths||[])failures.add(prefix);res.json({paths:[...failures]});});
  app.use((req,res,next)=>{if([...failures].some(prefix=>req.path.startsWith(prefix)))return res.status(503).json({success:false,message:'Local injected API failure'});next();});
  app.post('/api/v1/uploads',require('multer')({storage:require('multer').memoryStorage(),limits:{fileSize:10*1024*1024}}).single('file'),(req,res)=>{
    if(!req.file)return res.status(400).json({success:false,message:'File required'});
    ok(res,{url:image});
  });
  app.post('/__qa/broken-image',async(req,res)=>{await pool.query('UPDATE articles SET featured_image=$1 WHERE id=$2',[req.body.broken?'http://localhost:3026/images/missing-editorial.png':image,ids.articles[0]]);res.json({broken:!!req.body.broken});});
  app.post('/api/v1/auth/login',(req,res)=>ok(res,{access_token:token,refresh_token:token,token_type:'Bearer',expires_in:7200}));
  app.post('/api/v1/auth/refresh-token',(req,res)=>{const fresh=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'8h'});ok(res,{access_token:fresh,refresh_token:fresh,token_type:'Bearer',expires_in:28800});});
  app.get('/api/v1/auth/me',(req,res)=>ok(res,user));app.get('/api/v1/users/me',(req,res)=>ok(res,user));
  app.get('/__qa/ids',(req,res)=>res.json(ids));
  app.post('/__qa/count/:count',async(req,res)=>{const count=Number(req.params.count);if(![0,1,2,5,20].includes(count))return res.sendStatus(400);await pool.query("UPDATE articles SET status=CASE WHEN array_position($1::uuid[],id)<=$2 THEN 'published'::article_status ELSE 'draft'::article_status END WHERE author_id=$3",[ids.articles,count,ids.author]);res.json({count});});
  app.use('/api/v1/notifications',(req,res)=>ok(res,{items:[],unread_count:0,meta:{total:0}}));
  for(const route of ['editorial_media','article','column','category','topic','series','youtube','user_topic_subscription'])require('../src/routes/'+route)(app);
  app.get('/api/v1/social-media-links',(req,res)=>ok(res,[]));app.get('/api/v1/team-members',(req,res)=>ok(res,[]));app.get('/api/v1/ads',(req,res)=>ok(res,[]));
  app.use((err,req,res,next)=>{console.error(err.message);res.status(500).json({success:false,message:err.message});});
  fs.writeFileSync(fixtureFile,JSON.stringify(ids));
  app.listen(5007,'127.0.0.1',()=>console.log('Local editorial QA server listening on 127.0.0.1:5007; fixture IDs: '+JSON.stringify(ids)));
}
setup().catch(e=>{console.error(e.message);process.exitCode=1;pool.end();});
