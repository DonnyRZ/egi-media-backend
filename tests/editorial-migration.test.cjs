const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {Client}=require('pg');
const target='egi_editorial_migration';
const base='postgres://postgres:editorial-local@127.0.0.1:55436/';
const dir=path.join(__dirname,'../src/migrations');
const run=expected=>spawnSync(process.execPath,['scripts/run-editorial-media-migration.js','--expect-database='+expected],{
  cwd:path.join(__dirname,'..'),env:{...process.env,POSTGRESQL_URL:base+target},encoding:'utf8',timeout:30000
});
test('additive migration, repeat checksum, target guard and isolated schema rollback',async()=>{
  const admin=new Client({connectionString:base+'postgres'});await admin.connect();
  let db;
  try {
    await admin.query('DROP DATABASE IF EXISTS '+target);await admin.query('CREATE DATABASE '+target);
    db=new Client({connectionString:base+target});await db.connect();
    for(const file of fs.readdirSync(dir).filter(f=>/^\d{3}_/.test(f)&&!f.includes('.rollback.')&&Number(f.slice(0,3))<32).sort())await db.query(fs.readFileSync(path.join(dir,file),'utf8'));
    assert.notEqual(run('egi_crawl').status,0);
    assert.equal((await db.query("SELECT to_regclass('video_programs') name")).rows[0].name,null);
    const first=run(target);assert.equal(first.status,0,first.stderr);
    const again=run(target);assert.equal(again.status,0,again.stderr);assert.match(again.stdout,/already applied/);
    assert.equal((await db.query('SELECT count(*)::int total FROM editorial_schema_migrations')).rows[0].total,1);
    await db.query("UPDATE editorial_schema_migrations SET checksum='invalid'");
    const mismatch=run(target);assert.notEqual(mismatch.status,0);assert.match(mismatch.stderr,/checksum mismatch/);
    await db.query(fs.readFileSync(path.join(dir,'032_editorial_media.rollback.sql'),'utf8'));
    assert.equal((await db.query("SELECT to_regclass('video_programs') name")).rows[0].name,null);
    assert.notEqual((await db.query("SELECT to_regclass('articles') name")).rows[0].name,null);
  } finally {
    if(db)await db.end();await admin.query('DROP DATABASE IF EXISTS '+target);await admin.end();
  }
});
