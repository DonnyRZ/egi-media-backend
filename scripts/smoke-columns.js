const http = require("http");

const BASE = "http://localhost:5002";

function request(method, path, { token, body } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed = data;
          try {
            parsed = JSON.parse(data);
          } catch (_) {}
          resolve({ status: res.statusCode, body: parsed });
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function login(email, password) {
  const res = await request("POST", "/api/v1/auth/login", {
    body: { email, password },
  });
  if (res.status >= 400) {
    throw new Error(`login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  const token =
    res.body?.data?.access_token ||
    res.body?.data?.token ||
    res.body?.access_token;
  if (!token) throw new Error(`no token for ${email}: ${JSON.stringify(res.body)}`);
  return token;
}

async function main() {
  const list = await request("GET", "/api/v1/columns?lang=en");
  console.log("GET /columns", list.status, {
    total: list.body?.data?.meta?.total,
    firstTitle: list.body?.data?.items?.[0]?.title,
    locales: list.body?.data?.items?.[0]?.available_locales,
  });

  const publishedId = list.body?.data?.items?.[0]?.id;
  const detail = await request("GET", `/api/v1/columns/${publishedId}?lang=uz`);
  console.log("GET /columns/:id", detail.status, {
    title: detail.body?.data?.title,
    view_count: detail.body?.data?.view_count,
    comment_count: detail.body?.data?.comment_count,
  });

  const comments = await request("GET", `/api/v1/columns/${publishedId}/comments`);
  console.log("GET comments", comments.status, {
    total: comments.body?.data?.meta?.total,
  });

  const view = await request("POST", `/api/v1/columns/${publishedId}/view`);
  console.log("POST view", view.status, view.body?.data);

  const share = await request("POST", `/api/v1/columns/${publishedId}/share`, {
    body: { platform: "whatsapp" },
  });
  console.log("POST share", share.status, share.body?.data);

  // Member login (seed password)
  const memberToken = await login("member-one@example.com", "SuperAdmin@123");
  console.log("member login OK");

  const create = await request("POST", "/api/v1/columns", {
    token: memberToken,
    body: {
      title: "Smoke Test Kolom Member",
      summary: "Ringkasan smoke test",
      content: "Ini konten kolom untuk smoke test otomatis.",
      status: "draft",
    },
  });
  console.log("POST create", create.status, {
    id: create.body?.data?.id,
    status: create.body?.data?.status,
  });
  const newId = create.body?.data?.id;

  const submit = await request("POST", `/api/v1/columns/${newId}/submit`, {
    token: memberToken,
  });
  console.log("POST submit", submit.status, submit.body?.data?.status);

  const me = await request("GET", "/api/v1/columns/me", { token: memberToken });
  console.log("GET me", me.status, { total: me.body?.data?.meta?.total });

  const comment = await request("POST", `/api/v1/columns/${publishedId}/comments`, {
    token: memberToken,
    body: { content: "Komentar smoke test dari member-one" },
  });
  console.log("POST comment", comment.status, { id: comment.body?.data?.id });
  const commentId = comment.body?.data?.id;

  const delComment = await request(
    "DELETE",
    `/api/v1/columns/${publishedId}/comments/${commentId}`,
    { token: memberToken },
  );
  console.log("DELETE comment", delComment.status, delComment.body?.success ?? delComment.body);

  const pendingForbidden = await request("GET", "/api/v1/columns/pending", {
    token: memberToken,
  });
  console.log("GET pending as member (expect 403)", pendingForbidden.status);

  const save = await request("POST", `/api/v1/columns/${publishedId}/save`, {
    token: memberToken,
  });
  console.log("POST save", save.status, save.body?.success ?? save.body);

  const saved = await request("GET", "/api/v1/columns/saved", { token: memberToken });
  console.log("GET saved", saved.status, { total: saved.body?.data?.meta?.total });

  // Approve via SQL is not needed; exercise approve/reject RBAC with member token
  const approveForbidden = await request("POST", `/api/v1/columns/${newId}/approve`, {
    token: memberToken,
  });
  console.log("POST approve as member (expect 403)", approveForbidden.status);

  if (newId) {
    const del = await request("DELETE", `/api/v1/columns/${newId}`, {
      token: memberToken,
    });
    console.log("DELETE column", del.status, del.body?.success ?? del.body);
  }

  console.log("SMOKE OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
