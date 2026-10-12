// Explicit target + checksum + transaction. Does not run seed files.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {Client}=require('pg');
const config=require('../src/config/global_config');
async function main(){
  const expected=process.argv.find(arg=>arg.startsWith('--expect-database='))?.split('=')[1];
  if(!expected)throw new Error('Pass --expect-database=<exact database name>');
  const source=fs.readFileSync(path.join(__dirname,'../src/migrations/032_editorial_media.sql'),'utf8');
  const checksum=crypto.createHash('sha256').update(source).digest('hex');
  const adminSocket=process.argv.includes('--admin-socket');
  if(adminSocket&&process.platform!=='linux')throw new Error('Admin socket mode requires Linux peer authentication');
  const client=new Client(adminSocket?{host:'/var/run/postgresql',user:'postgres',database:expected}:{connectionString:config.get('/postgresqlUrl')});
  await client.connect();
  try{
    if((await client.query('SELECT current_database() name')).rows[0].name!==expected)throw new Error('Database target mismatch');
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout='10s'; SET LOCAL statement_timeout='120s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('egi.editorial.migrations'))");
    await client.query('CREATE TABLE IF NOT EXISTS editorial_schema_migrations(version text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
    const previous=await client.query('SELECT checksum FROM editorial_schema_migrations WHERE version=$1',['032_editorial_media']);
    if(previous.rows.length){
      if(previous.rows[0].checksum!==checksum)throw new Error('Migration checksum mismatch');
      await client.query('COMMIT');console.log('032_editorial_media already applied; checksum matches');return;
    }
    await client.query(source);
    await client.query('INSERT INTO editorial_schema_migrations(version,checksum) VALUES($1,$2)',['032_editorial_media',checksum]);
    await client.query('COMMIT');console.log('032_editorial_media applied to '+expected+'; checksum '+checksum);
  }catch(e){await client.query('ROLLBACK');throw e;}finally{await client.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
