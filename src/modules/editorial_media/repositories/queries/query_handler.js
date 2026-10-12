const config=require('../../../../config/global_config');
const DB=require('../../../../helpers/databases/postgresql/db');
const Domain=require('./domain');
const domain=new Domain(new DB(config.get('/postgresqlUrl')));
module.exports={category:(...args)=>domain.category(...args),list:(...args)=>domain.list(...args),one:(...args)=>domain.one(...args),hero:()=>domain.hero()};

