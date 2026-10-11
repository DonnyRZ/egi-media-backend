const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createHash, randomUUID } = require("node:crypto");
const express = require("express");

process.env.UPLOAD_PUBLIC_BASE_URL = "https://upload.example.test";
const authPath = require.resolve("../src/middlewares/verifyToken");
require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: (req, res, next) => {
  const role = req.headers.authorization?.replace("Bearer ", "");
  if (!role) return res.status(401).json({ success: false });
  req.userMeta = { id: "test-user", role };
  next();
} };
const logger = require("../src/helpers/utils/logger");
logger.info = logger.warn = logger.error = () => {};
const storage = require("../src/helpers/storage/local");
const realUploadObject = storage.uploadObject;
const objects = new Map();
storage.uploadObject = async ({ key, buffer }) => {
  objects.set(key, buffer);
  return `${process.env.UPLOAD_PUBLIC_BASE_URL}/uploads/${key}`;
};
const server = express();
require("../src/routes/upload")(server);
let listener;
let base;

before(async () => {
  listener = server.listen(0, "127.0.0.1");
  await new Promise(resolve => listener.once("listening", resolve));
  base = `http://127.0.0.1:${listener.address().port}`;
});
after(async () => {
  storage.uploadObject = realUploadObject;
  await new Promise(resolve => listener.close(resolve));
});

async function upload({ bytes = 32, mime = "image/png", role = "superadmin", field = "file", count = 1 } = {}) {
  const form = new FormData();
  for (let index = 0; index < count; index++) form.append(field, new Blob([new Uint8Array(bytes)], { type: mime }), "image");
  const response = await fetch(`${base}/api/v1/uploads`, { method: "POST", headers: role ? { Authorization: `Bearer ${role}` } : {}, body: form });
  return { status: response.status, body: await response.json() };
}

test("authenticated uploads succeed and identical retry payloads share a URL", async () => {
  objects.clear();
  const first = await upload();
  const retry = await upload();
  assert.equal(first.status, 201);
  assert.equal(retry.status, 201);
  assert.equal(first.body.data.url, retry.body.data.url);
  assert.equal(objects.size, 1);
  const digest = createHash("sha256").update(new Uint8Array(32)).digest("hex");
  assert.ok(first.body.data.url.endsWith(`${digest}.png`));
});

test("the exact 5 MiB boundary succeeds and larger files return JSON 413", async () => {
  assert.equal((await upload({ bytes: 5 * 1024 * 1024 })).status, 201);
  const oversized = await upload({ bytes: 5 * 1024 * 1024 + 1 });
  assert.equal(oversized.status, 413);
  assert.match(oversized.body.message, /5 MB upload limit/);
});

test("unsupported MIME, empty images, extra files and wrong fields are rejected", async () => {
  assert.equal((await upload({ mime: "application/pdf" })).status, 415);
  assert.equal((await upload({ bytes: 0 })).status, 400);
  assert.equal((await upload({ count: 2 })).status, 400);
  assert.equal((await upload({ field: "wrong" })).status, 400);
});

test("upload authentication and role restrictions remain enforced", async () => {
  assert.equal((await upload({ role: null })).status, 401);
  assert.equal((await upload({ role: "visitor" })).status, 403);
  assert.equal((await upload({ role: "author" })).status, 201);
  assert.equal((await upload({ role: "member" })).status, 201);
});

test("concurrent retries reuse a single object key", async () => {
  objects.clear();
  const results = await Promise.all(Array.from({ length: 5 }, () => upload({ bytes: 1234 })));
  assert.ok(results.every(result => result.status === 201));
  assert.equal(new Set(results.map(result => result.body.data.url)).size, 1);
  assert.equal(objects.size, 1);
});

test("local storage publishes complete files and cleans temporary files on failure", async () => {
  const directory = `upload-test-${randomUUID()}`;
  const root = path.resolve(storage.UPLOAD_ROOT, directory);
  assert.ok(root.startsWith(`${path.resolve(storage.UPLOAD_ROOT)}${path.sep}`));
  const key = `${directory}/photo.png`;
  const file = path.join(root, "photo.png");
  const originalRename = fs.promises.rename;
  try {
    await realUploadObject({ key, buffer: Buffer.from("original") });
    await realUploadObject({ key, buffer: Buffer.from("replacement") });
    assert.equal(fs.readFileSync(file, "utf8"), "replacement");
    assert.deepEqual(fs.readdirSync(root), ["photo.png"]);
    fs.promises.rename = async () => { const error = new Error("test failure"); error.code = "EACCES"; throw error; };
    await assert.rejects(realUploadObject({ key, buffer: Buffer.from("unfinished") }), /test failure/);
    assert.equal(fs.readFileSync(file, "utf8"), "replacement");
    assert.deepEqual(fs.readdirSync(root), ["photo.png"]);
  } finally {
    fs.promises.rename = originalRename;
    if (fs.existsSync(file)) fs.unlinkSync(file);
    if (fs.existsSync(root)) fs.rmdirSync(root);
  }
});
