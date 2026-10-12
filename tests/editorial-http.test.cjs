const test=require('node:test');
const assert=require('node:assert/strict');
const jwt=require('jsonwebtoken');
const base='http://127.0.0.1:5007';
async function request(path,method='GET',body,token) {
  const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:response.status,data:await response.json()};
}
test('actual HTTP authorization, video publication boundaries, scope and metadata',async()=>{
  const ids=(await request('/__qa/ids')).data;
  const token=role=>jwt.sign({id:ids.author,role,full_name:'Local Editor'},'local-editorial-qa-only',{expiresIn:'10m'});
  assert.equal((await request('/api/v1/cms/youtube-videos')).status,401);
  assert.equal((await request('/api/v1/categories/'+ids.category+'/editorial','PUT',{lead_id:null,supporting_ids:[],editor_ids:[]},token('author'))).status,403);
  const publicList=await request('/api/v1/youtube-videos?active=all&limit=100');
  assert.ok(publicList.data.data.every(v=>v.is_active&&v.status==='published'));
  assert.equal((await request('/api/v1/youtube-videos/'+ids.videos[9])).status,404);
  const video=await request('/api/v1/youtube-videos','POST',{title:'HTTP local review boundary',url:'https://youtube.com/shorts/dQw4w9WgXcQ',is_active:true,duration_seconds:45},token('author'));
  assert.equal(video.status,201);assert.equal(video.data.data.status,'review');assert.equal(video.data.data.format,'short');
  const videoId=video.data.data.id;
  try {
    assert.equal((await request('/api/v1/youtube-videos/'+videoId)).status,404);
    const published=await request('/api/v1/youtube-videos/'+videoId,'PUT',{title:'HTTP local review boundary',url:'https://youtube.com/shorts/dQw4w9WgXcQ',is_active:true},token('superadmin'));
    assert.equal(published.status,200);assert.equal(published.data.data.format,'short');assert.equal(published.data.data.duration_seconds,45);
    assert.equal((await request('/api/v1/youtube-videos/'+videoId)).status,200);
    const columns=await request('/api/v1/columns?category_id='+ids.emptyCategory);assert.equal(columns.data.data.items.length,0);
    const article=await request('/api/v1/articles/'+ids.articles[0]);
    const stored = article.data.data;
    const metadata = { featured_image_caption: 'HTTP metadata check', featured_image_credit: 'Local HTTP fixture' };
    try {
      const updated = await request('/api/v1/articles/'+ids.articles[0], 'PUT', metadata, token('superadmin'));
      assert.equal(updated.status, 200);
      const reloaded = (await request('/api/v1/articles/'+ids.articles[0])).data.data;
      assert.equal(reloaded.featured_image_caption, metadata.featured_image_caption);
      assert.equal(reloaded.featured_image_credit, metadata.featured_image_credit);
      assert.equal(reloaded.slug, stored.slug);
    } finally {
      await request('/api/v1/articles/'+ids.articles[0], 'PUT', { featured_image_caption: stored.featured_image_caption, featured_image_credit: stored.featured_image_credit }, token('superadmin'));
    }
  } finally {await request('/api/v1/youtube-videos/'+videoId,'DELETE',undefined,token('superadmin'));}
});
