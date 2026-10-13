const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const { randomUUID } = require('node:crypto');
const Domain = require('../src/modules/article/repositories/queries/domain');
const Query = require('../src/modules/article/repositories/queries/query');
const model = require('../src/modules/article/repositories/queries/query_model');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function apiFor(domain) {
  const imports = {
    '../repositories/commands/command_handler': {},
    '../repositories/commands/command_model': {},
    '../repositories/queries/query_handler': {getHomepageHighlights:payload=>domain.getHomepageHighlights(payload)},
    '../repositories/queries/query_model': model,
    '../../../helpers/utils/validator': require('../src/helpers/utils/validator'),
    '../../../helpers/utils/response': require('../src/helpers/utils/response'),
    '../../../helpers/http-status/status_code': require('../src/helpers/http-status/status_code'),
  };
  const sandbox={module:{exports:{}},require:name=>imports[name]};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/modules/article/handlers/api_handler.js'),'utf8'),sandbox);
  return sandbox.module.exports;
}
const url = process.env.EDITORIAL_TEST_DATABASE_URL;
assert.ok(url && /^postgres:\/\/[^@]+@127\.0\.0\.1:55436\/egi_editorial_test$/.test(url), 'Isolated local database required');
const pool = new Pool({ connectionString: url });
after(() => pool.end());

test('selection uses a consistent real SQL snapshot and all eligibility filters before limits', async t => {
  const client = await pool.connect();
  try {
    // Temporary tables shadow production-shaped public tables on this connection.
    // No existing fixtures, schema or stored data are modified.
    for (const table of ['users', 'categories', 'articles']) {
      await client.query(`CREATE TEMP TABLE ${table} (LIKE public.${table} INCLUDING DEFAULTS)`);
    }
    const author = randomUUID(), politics = randomUUID(), business = randomUUID();
    await client.query("INSERT INTO users(id,email,full_name,role) VALUES($1,'highlights@example.invalid','QA author','superadmin')", [author]);
    await client.query("INSERT INTO categories(id,name,slug,name_en,name_uz) VALUES($1,'Politik','politics','Politics','Siyosat'),($2,'Bisnis','business','Business','Biznes')", [politics, business]);
    const rows = [];
    async function add({ category = business, trending = false, age = rows.length, status = 'published', ready = 'ready', deleted = false, date, id = randomUUID() } = {}) {
      const published = date === undefined ? new Date(Date.now() - 86400000 - age * 60000) : date;
      await client.query(`INSERT INTO articles(id,author_id,category_id,title,slug,content,title_en,content_en,title_uz,content_uz,status,translation_status,published_at,placements,deleted_at)
        VALUES($1::uuid,$2,$3,'Judul artikel',$1::text,'<p>Konten</p>','English title','<p>Body</p>','Uzbek title','<p>Matn</p>',$4,$5,$6,$7,$8)`,
      [id, author, category, status, ready, published, trending ? ['trending'] : ['latest_news'], deleted ? new Date() : null]);
      rows.push({ id, category, trending, published }); return id;
    }
    const domain = new Domain({ executeQuery: (sql, values) => client.query(sql, values) });
    const read = async lang => { const result = await domain.getHomepageHighlights({ lang }); assert.equal(result.err, null); return result.data; };
    const clear = async () => { await client.query('DELETE FROM articles'); rows.length = 0; };

    await t.test('empty response and all locale mapping, no content leakage', async () => {
      assert.deepEqual(await read('id'), { primary: [], supporting: [] });
      await add({ category: politics });
      for (const [lang, title, name] of [['id','Judul artikel','Politik'],['en','English title','Politics'],['uz','Uzbek title','Siyosat']]) {
        const item = (await read(lang)).primary[0];
        assert.equal(item.title, title); assert.equal(item.category.name, name);
        assert.equal(item.reading_time_minutes, 1);
        for (const key of ['content','content_en','content_uz','reading_content','group_name']) assert.ok(!(key in item));
      }
      await client.query('UPDATE articles SET title_en=NULL');
      const fallback = (await read('en')).primary[0]; assert.equal(fallback.locale, 'id'); assert.equal(fallback.category.name, 'Politics');
    });
    await t.test('mixed, double qualification, old newly trending and deterministic ties', async () => {
      await clear();
      const tie = new Date('2025-01-02T00:00:00Z');
      const a = await add({ category: politics, trending: true, date: tie, id: '10000000-0000-4000-8000-000000000001' });
      const b = await add({ trending: true, date: tie, id: '10000000-0000-4000-8000-000000000002' });
      const c = await add({ category: politics, date: tie, id: '10000000-0000-4000-8000-000000000003' });
      const old = await add({ date: new Date('2024-01-01T00:00:00Z') });
      await client.query("UPDATE articles SET placements=ARRAY['trending'],updated_at=now() WHERE id=$1", [old]);
      assert.deepEqual((await read('id')).primary.map(item => item.id), [a,b,c]);
      assert.equal((await read('id')).supporting.length, 0);
      await client.query("UPDATE articles SET placements=ARRAY['latest_news'],category_id=$2 WHERE id=$1", [a,business]);
      assert.equal((await read('id')).supporting[0].id, a);
      await client.query("UPDATE articles SET status='draft' WHERE id=$1", [b]);
      assert.ok(!(await read('id')).primary.some(item => item.id === b));
    });
    await t.test('over 40 primary stories cannot crowd older supporting stories out', async () => {
      await clear();
      for (let i = 0; i < 45; i++) await add({ category: politics, trending: i % 2 === 0 });
      const supporting = [];
      for (let i = 0; i < 12; i++) supporting.push(await add());
      const out = await read('id'); assert.equal(out.primary.length, 3);
      assert.deepEqual(out.supporting.map(item => item.id), supporting.slice(0,9));
      assert.equal(new Set([...out.primary,...out.supporting].map(item => item.id)).size, 12);
    });
    await t.test('all primary can be trending, regardless of category', async () => {
      await clear();
      for (let i = 0; i < 4; i++) await add({ trending: true });
      assert.equal((await read('id')).primary.length, 3); assert.equal((await read('id')).supporting.length, 0);
    });
    await t.test('draft, scheduled, deleted, pending translations, invalid/future time never consume slots', async () => {
      await clear();
      for (const props of [{status:'draft'},{status:'review'},{status:'scheduled'},{deleted:true},{ready:'pending'},{date:null},{date:new Date('2099-01-01')},{date:'-infinity'}]) await add({ ...props, category: politics });
      assert.equal((await read('id')).primary.length, 0);
      const valid = await add(); assert.equal((await read('id')).supporting[0].id, valid);
    });
    await t.test('public HTTP endpoint returns envelope, locale, no-store, validation and safe database error', async () => {
      const app = require('express')();let fail=false;
      const api=apiFor({getHomepageHighlights:payload=>fail
        ? new Domain({executeQuery:async()=>null}).getHomepageHighlights(payload)
        : domain.getHomepageHighlights(payload)});
      app.get('/api/v1/articles/homepage-highlights',api.getHomepageHighlights);
      app.get('/api/v1/articles/:id',(_req,res)=>res.status(404).json({detailRoute:true}));
      const server=await new Promise(resolve=>{const instance=app.listen(0,'127.0.0.1',()=>resolve(instance));});
      const endpoint=`http://127.0.0.1:${server.address().port}/api/v1/articles/homepage-highlights`;
      try {
        for(const lang of ['id','en','uz']) {
          const response=await fetch(endpoint+'?lang='+lang);const json=await response.json();
          assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
          assert.equal(json.success,true);assert.equal(json.data.supporting[0].locale,lang);
        }
        assert.equal((await fetch(endpoint+'?lang=ar')).status,400);
        fail=true;const response=await fetch(endpoint);assert.equal(response.status,500);
        const json=await response.json();assert.equal(json.success,false);assert.equal(json.message,'Unable to load homepage highlights');
      } finally {await new Promise(resolve=>server.close(resolve));}
    });
  } finally { await client.query('DISCARD TEMP'); client.release(); }
});

test('database failure is an error; language validation is strict', async () => {
  assert.ok((await new Query({executeQuery: async () => null}).findHomepageHighlights()).err);
  assert.ok((await new Query({executeQuery: async () => {throw new Error('offline');}}).findHomepageHighlights()).err);
  assert.equal(model.getHomepageHighlightsParamType.validate({}).value.lang, 'id');
  assert.ok(model.getHomepageHighlightsParamType.validate({ lang: 'ar' }).error);
  assert.ok(model.getHomepageHighlightsParamType.validate({ limit: 1000 }).error);
});
