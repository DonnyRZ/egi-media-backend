const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { PGlite } = require('@electric-sql/pglite');
process.env.ACCESS_TOKEN_SECRET = 'local-test-only-ad-metadata-signing-key';
const auth = require.resolve('../src/middlewares/verifyToken');
require.cache[auth] = { id: auth, filename: auth, loaded: true, exports(req, res, next) {
  const role = req.headers.authorization?.replace('Bearer ', '');
  if (!role) return res.status(401).json({ success: false });
  req.userMeta = { id: 'test-admin', role }; next();
} };
const logger = require('../src/helpers/utils/logger');
logger.info = logger.warn = logger.error = () => {};
const pg = new PGlite();
const connection = require('../src/helpers/databases/postgresql/connection');
connection.getConnection = async () => pg;
const storage = require('../src/helpers/storage/local');
const objects = new Map();
storage.uploadObject = async ({ key, buffer }) => { objects.set(key, buffer); return `https://assets.example.test/uploads/${key}`; };
const app = express(); app.use(express.json());
require('../src/routes/upload')(app); require('../src/routes/ad')(app);
let listener, base;
const sql = name => fs.readFileSync(path.join(__dirname, '../src/migrations', name), 'utf8');
const migration = sql('034_homepage_ad_slots.sql');
const admin = { Authorization: 'Bearer superadmin' };

function png(width, height) {
  const result = Buffer.alloc(33); Buffer.from('89504e470d0a1a0a', 'hex').copy(result);
  result.writeUInt32BE(13, 8); result.write('IHDR', 12); result.writeUInt32BE(width, 16); result.writeUInt32BE(height, 20);
  result[24] = 8; result[25] = 2; return result;
}
async function upload(placement, width, height, role = 'superadmin') {
  const body = new FormData(); body.append('file', new Blob([png(width, height)], { type: 'image/png' }), 'ad.png');
  const response = await fetch(`${base}/api/v1/uploads?purpose=ad&placement=${placement}`, { method: 'POST', headers: { Authorization: `Bearer ${role}` }, body });
  return { status: response.status, body: await response.json() };
}
async function write(id, body) {
  const response = await fetch(`${base}/api/v1/ads/${id}`, { method: 'PUT', headers: { ...admin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
before(async () => {
  await pg.exec(sql('024_create_ads.sql')); await pg.exec(sql('027_streamline_ads_placements.sql'));
  await pg.exec("CREATE UNIQUE INDEX idx_ads_placement_unique ON ads(placement)");
  await pg.query("INSERT INTO ads(id,title,image_url,target_url,placement,is_active,clicks,impressions) VALUES ($1,'Legacy partner','/old.png','https://example.test','IN_FEED',true,7,11),($2,'Sidebar legacy','/sidebar.png','https://example.test','SIDEBAR_RECTANGLE',false,3,5)", ['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222']);
  await pg.exec(migration);
  listener = app.listen(0, '127.0.0.1'); await new Promise(resolve => listener.once('listening', resolve));
  base = `http://127.0.0.1:${listener.address().port}`;
});
after(async () => { await new Promise(resolve => listener.close(resolve)); await pg.close(); });

test('additive migration preserves legacy IDs, images and counters; exactly three CMS slots', async () => {
  await pg.exec(migration); // A rerun neither duplicates slots nor changes existing assets.
  const rows = (await pg.query('SELECT * FROM ads ORDER BY placement')).rows;
  assert.equal(rows.length, 4);
  const legacy = rows.find(row => row.placement === 'IN_FEED');
  assert.equal(legacy.id, '11111111-1111-4111-8111-111111111111'); assert.equal(legacy.clicks, 7); assert.equal(legacy.impressions, 11); assert.equal(legacy.image_url, '/old.png');
  const res = await fetch(`${base}/api/v1/ads`, { headers: admin }); const result = await res.json();
  assert.equal(result.data.length, 3); assert.equal(result.meta.total, 3);
  assert.ok(!result.data.some(row => row.placement === 'SIDEBAR_RECTANGLE'));
  assert.equal(rows.find(row => row.placement === 'LATEST_VIDEOS').is_active, false);
});
test('upload validates actual binary dimensions, ratio, role and preserves bytes', async () => {
  assert.equal((await upload('LEADERBOARD', 970, 250)).status, 201);
  const valid = await upload('IN_FEED', 1280, 720); assert.equal(valid.status, 201);
  assert.equal(valid.body.data.width, 1280); assert.equal(valid.body.data.height, 720);
  assert.deepEqual([...objects.values()].find(value => value.readUInt32BE(16) === 1280), png(1280, 720));
  assert.equal((await upload('LEADERBOARD', 1280, 720)).status, 400);
  assert.equal((await upload('IN_FEED', 970, 250)).status, 400);
  assert.equal((await upload('LATEST_VIDEOS', 1280, 720, 'author')).status, 403);
  assert.equal((await upload('UNKNOWN', 1280, 720)).status, 400);
});
test('one uploaded creative can fill two slots with independent counters; receipts reject forgery', async () => {
  const { body } = await upload('IN_FEED', 1280, 720);
  const payload = { title: 'Shared local creative', image_url: body.data.url, image_receipt: body.data.image_receipt, target_url: 'https://example.test', is_active: true };
  const newsId = '11111111-1111-4111-8111-111111111111', videoId = '00000000-0000-4000-8000-000000004005';
  assert.equal((await write(newsId, payload)).status, 200); assert.equal((await write(videoId, payload)).status, 200);
  assert.equal((await write(videoId, { ...payload, image_url: 'https://example.test/forged.png' })).status, 400);
  assert.equal((await write(videoId, { ...payload, image_receipt: 'tampered.invalid' })).status, 400);
  assert.equal((await write(videoId, { ...payload, placement: 'IN_FEED' })).status, 400);
  const click = await (await fetch(`${base}/api/v1/ads/${videoId}/click`, { method: 'POST' })).json();
  assert.equal(click.data.image_receipt, undefined);
  const rows = (await pg.query('SELECT id,clicks FROM ads WHERE id=ANY($1::uuid[])', [[newsId, videoId]])).rows;
  assert.equal(rows.find(row => row.id === newsId).clicks, 7); assert.equal(rows.find(row => row.id === videoId).clicks, 1);
  const publicAds = await (await fetch(`${base}/api/v1/ads/active?placement=LATEST_VIDEOS`)).json();
  assert.equal(publicAds.data[0].image_width, 1280); assert.equal(publicAds.data[0].image_receipt, undefined);
});
test('empty inactive slot saves; activation without creative fails; legacy unchanged asset remains compatible', async () => {
  const id = '00000000-0000-4000-8000-000000004001';
  const blank = { title: 'Empty slot', image_url: '', target_url: '', is_active: false };
  assert.equal((await write(id, blank)).status, 200);
  assert.equal((await write(id, { ...blank, is_active: true })).status, 400);
  const sidebar = { title: 'Preserved legacy', image_url: '/sidebar.png', target_url: 'https://example.test', is_active: false };
  assert.equal((await write('22222222-2222-4222-8222-222222222222', sidebar)).status, 200);
});
