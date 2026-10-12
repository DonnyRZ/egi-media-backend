const verifyToken=require('../middlewares/verifyToken');
const verifyRoleName=require('../middlewares/verifyRoleName');
const handlers=require('../modules/editorial_media/handlers/api_handler');
module.exports=server=>{
  const admin=verifyRoleName(['superadmin']);
  const readers=verifyRoleName(['superadmin','author']);
  server.get('/api/v1/categories/:id/editorial',handlers.category);
  server.put('/api/v1/categories/:id/editorial',verifyToken,admin,handlers.slots);
  for(const kind of ['programs','collections']) {
    const resource='/api/v1/video-'+kind;
    server.get(resource,handlers.list(kind));
    server.get(resource+'/:id',handlers.one(kind));
    server.get('/api/v1/cms/video-'+kind,verifyToken,readers,handlers.list(kind,true));
    server.get('/api/v1/cms/video-'+kind+'/:id',verifyToken,readers,handlers.one(kind,true));
    server.post(resource,verifyToken,admin,handlers.save(kind));
    server.put(resource+'/:id',verifyToken,admin,handlers.save(kind));
  }
  server.get('/api/v1/video-hub/settings',handlers.hero);
  server.put('/api/v1/video-hub/settings',verifyToken,admin,handlers.saveHero);
};

