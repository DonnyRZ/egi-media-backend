const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const axios=require('axios');
const authPath=require.resolve('../src/middlewares/verifyToken');
require.cache[authPath]={id:authPath,filename:authPath,loaded:true,exports:(req,res,next)=>{
  const role=req.headers.authorization?.replace('Bearer ','');if(!role)return res.status(401).json({success:false});
  req.userMeta={id:'local-test',role};next();
}};
const configPath=require.resolve('../src/config/global_config');
require.cache[configPath]={id:configPath,filename:configPath,loaded:true,exports:{get:()=> 'http://127.0.0.1:5050'}};
const realGet=axios.get;let requests=[];let upstreamFailure=false;
axios.get=async(url,options)=>{requests.push({url,options});if(upstreamFailure)throw {response:{status:503,data:{message:'snapshot unavailable'}}};return {status:200,data:{success:true,data:{items:[],meta:{availability:'ready'}}}};};
const app=express();require('../src/routes/news_feed')(app);let server,base;
before(async()=>{server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{axios.get=realGet;await new Promise(resolve=>server.close(resolve));});
test('recommendations, detail and status require CMS authentication and roles',async()=>{
  for(const endpoint of ['recommendations','recommendations/radar-0123456789abcdef01234567','status']) {
    assert.equal((await fetch(`${base}/api/v1/news-feed/${endpoint}`)).status,401);
    assert.equal((await fetch(`${base}/api/v1/news-feed/${endpoint}`,{headers:{Authorization:'Bearer member'}})).status,403);
    for(const role of ['author','superadmin'])assert.equal((await fetch(`${base}/api/v1/news-feed/${endpoint}`,{headers:{Authorization:`Bearer ${role}`}})).status,200);
  }
});
test('server-side filters and pinned snapshot reach Crawl unchanged',async()=>{
  requests=[];
  await fetch(`${base}/api/v1/news-feed/recommendations?window_hours=24&page=3&limit=20&search=BNPB&category=politics&trend=rising&engine=candidate&run_id=42`,{headers:{Authorization:'Bearer author'}});
  const params=requests[0].options.params;
  assert.deepEqual(params,{window_hours:'24',page:'3',limit:'20',search:'BNPB',category:'politics',trend:'rising',engine:'candidate',run_id:'42'});
});
test('upstream failure is an error, not an empty successful catalogue',async()=>{
  upstreamFailure=true;
  try{const response=await fetch(`${base}/api/v1/news-feed/recommendations`,{headers:{Authorization:'Bearer superadmin'}});assert.equal(response.status,503);assert.equal((await response.json()).success,false);}
  finally{upstreamFailure=false;}
});
