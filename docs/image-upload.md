# CMS upload production release

`POST /api/v1/uploads` remains authenticated and restricted to the existing member, author and superadmin roles. It accepts exactly one `file` multipart part, up to 5 MiB, with the existing supported image MIME types.

- Oversized files return JSON HTTP 413, unsupported MIME types return 415, malformed multipart submissions return 400, and empty images are rejected.
- Image object names are SHA-256 content digests within the existing yearly article directory. Identical payload retries produce the same URL. Existing UUID image URLs remain available.
- Local storage writes to a hidden temporary file and atomically renames it only after the complete buffer is written. Failed temporary files are removed. Existing completed images remain intact if writing fails.
- Upload logs record size, format, storage, duration and safe error codes; they omit authentication credentials and file content.
- R2 remains optional. This release works with persistent VPS local storage and does not require a bucket.
- The translation jobs query casts both article and column status enums to text before UNION ALL, correcting the PostgreSQL 42846 error observed during the upload audit.

Run `npm ci` and `npm run test:upload` before release. The focused suite runs an isolated loopback Express server, preserves real role checks, and verifies duplicate retries, boundary size, invalid MIME, malformed input and atomic local storage. It mocks authentication and storage for route tests; production verification must also check real login, role authorization, public image access and translation jobs.

Production uses reviewed `main` releases. The staging deploy script refuses to run when `/etc/egi-media/production` exists. Do not run old staging migrations or replace environment files and uploads during a production release.
