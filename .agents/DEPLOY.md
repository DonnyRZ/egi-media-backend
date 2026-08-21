# Staging Deploy — EGI Media Backend

Staging API: https://staging.egi-media.com/api/  
VPS path: `/var/www/egi-media/cms/backend`  
Process: systemd `egi-media-cms-backend` (`node index.js` on port `5002`)

## Git workflow (wajib)

1. Kerja di `feature/*` / `fix/*` / `ci/*` dari `develop` yang sudah di-pull.
2. Jangan commit atau push ke `develop` / `main`.
3. Buka Pull Request ke **`develop`**.
4. Setelah PR di-merge, GitHub Actions **Deploy staging** jalan otomatis.
5. Production tidak ikut ter-deploy dari alur ini.

## Apa yang dilakukan CI

Pada setiap push ke `develop`:

1. SSH ke VPS staging (bukan production).
2. `git fetch` + `git checkout develop` + `git pull --ff-only`.
3. `npm ci`.
4. Jalankan migration idempotent yang ada di `scripts/run-*-migration.js` (saat ini video review `031`).
5. `systemctl restart egi-media-cms-backend`.
6. Health check `http://127.0.0.1:5002/api-docs/`.

Script di VPS: `scripts/deploy-staging.sh`.  
Tidak mengubah `.env` / `src/config`, tidak `git reset --hard`, tidak menyentuh `be-prod`.

Cadangan: systemd timer `egi-media-cms-backend-sync` mem-poll `origin/develop` tiap ~60 detik.

## GitHub secrets (repo, bukan environment)

| Secret | Isi |
|---|---|
| `STAGING_SSH_HOST` | `212.85.24.238` |
| `STAGING_SSH_USER` | `root` |
| `STAGING_SSH_KEY` | Private key yang public key-nya sudah ada di VPS |

Tanpa `STAGING_SSH_KEY`, job GitHub Actions di-skip. Timer VPS tetap men-deploy.

## Migration

SQL baru wajib punya file migration + rollback. Script deploy hanya menjalankan helper yang idempotent. Jangan `DROP` / hapus data di deploy otomatis.

## Rollback

```bash
cd /var/www/egi-media/cms/backend
git checkout <commit-sebelumnya>
npm ci
systemctl restart egi-media-cms-backend
```

Rollback SQL hanya jika diminta eksplisit (file `*.rollback.sql`).
