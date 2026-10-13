const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function handler(module) {
  let captured;
  const commands=new Proxy({}, {get:()=>async payload=>{captured=payload;return {data:payload,err:null};}});
  const model=require('../src/modules/'+module+'/repositories/commands/command_model');
  const queryModel=require('../src/modules/'+module+'/repositories/queries/query_model');
  const imports={
    '../repositories/commands/command_handler':commands,
    '../repositories/commands/command_model':model,
    '../repositories/queries/query_handler':commands,
    '../repositories/queries/query_model':queryModel,
    '../../../helpers/utils/validator':require('../src/helpers/utils/validator'),
    '../../../helpers/utils/response':{sendResponse:r=>r},
    '../../../helpers/http-status/status_code':{SUCCESS:{CREATED:201}},
  };
  const sandbox={module:{exports:{}},require:name=>{assert.ok(name in imports,name);return imports[name];}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/modules/'+module+'/handlers/api_handler.js'),'utf8'),sandbox);
  return {api:sandbox.module.exports,read:()=>captured};
}
const id='123e4567-e89b-42d3-a456-426614174000';
const req=body=>({params:{id},body,query:{},userMeta:{id,role:'superadmin'},headers:{},socket:{}});
for(const module of ['article','column']) {
  test(module+' HTTP update forwards media metadata and preserves omitted values',async()=>{
    const h=handler(module),name='update'+(module==='article'?'Article':'Column');
    const body={title:'A valid title',featured_image_alt:'Photo description',featured_image_caption:'Caption',featured_image_credit:'Photographer',...(module==='column'?{category_id:id}:{})};
    const out=await h.api[name](req(body),{});assert.equal(out.err,null);
    for(const key of ['featured_image_alt','featured_image_caption','featured_image_credit',...(module==='column'?['category_id']:[])])assert.equal(h.read()[key],body[key]);
    await h.api[name](req({title:'Another valid title'}),{});
    assert.ok(!Object.hasOwn(h.read(),'featured_image_credit'));
    assert.equal(h.read().category_id,undefined);
  });
}
test('Column HTTP list passes category scope to query',async()=>{
  const h=handler('column');const out=await h.api.getColumns({...req({}),query:{category_id:id}},{});
  assert.equal(out.err,null);assert.equal(h.read().category_id,id);
});

test('homepage highlights handler validates locale, disables cache and static route precedes detail', async () => {
  const h = handler('article'); const headers = {};
  const res = {setHeader:(name,value)=>headers[name]=value};
  assert.equal((await h.api.getHomepageHighlights({...req({}),query:{}},res)).err,null);
  assert.equal(h.read().lang,'id'); assert.equal(headers['Cache-Control'],'no-store');
  for(const lang of ['en','uz']) { await h.api.getHomepageHighlights({...req({}),query:{lang}},res); assert.equal(h.read().lang,lang); }
  assert.ok((await h.api.getHomepageHighlights({...req({}),query:{lang:'invalid'}},res)).err);
  const routes=fs.readFileSync(path.join(__dirname,'../src/routes/article.js'),'utf8');
  assert.ok(routes.indexOf('/api/v1/articles/homepage-highlights')<routes.indexOf('server.get("/api/v1/articles/:id"'));
});
