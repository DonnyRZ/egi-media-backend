const HOSTS = new Set(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com']);
function extractYoutubeId(value) {
  try {
    const url = new URL(value);
    if (!['https:','http:'].includes(url.protocol) || url.username || url.password) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    const id = url.hostname === 'youtu.be' ? parts[0]
      : HOSTS.has(url.hostname) ? (parts[0] === 'watch' ? url.searchParams.get('v')
        : ['embed','shorts'].includes(parts[0]) ? parts[1] : null) : null;
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
module.exports = { extractYoutubeId };
