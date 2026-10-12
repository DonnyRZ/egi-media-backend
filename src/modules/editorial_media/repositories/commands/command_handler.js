const config=require('../../../../config/global_config');
const DB=require('../../../../helpers/databases/postgresql/db');
const Domain=require('./domain');
const domain=new Domain(new DB(config.get('/postgresqlUrl')));
module.exports={slots:(...args)=>domain.slots(...args),save:(...args)=>domain.save(...args),hero:(...args)=>domain.hero(...args)};

