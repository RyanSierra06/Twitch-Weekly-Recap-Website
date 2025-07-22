export function parseTwitchDuration(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const h = durationStr.match(/(\d+)h/);
  const m = durationStr.match(/(\d+)m/);
  const s = durationStr.match(/(\d+)s/);
  return (
    (h ? parseInt(h[1], 10) * 3600 : 0) +
    (m ? parseInt(m[1], 10) * 60 : 0) +
    (s ? parseInt(s[1], 10) : 0)
  );
}

export function formatClipDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  let str = '';
  if (h > 0) str += `${h}h `;
  if (m > 0 || h > 0) str += `${m}m `;
  str += `${s}s`;
  return str.trim();
}

export function selectClipsForRecap(clips, maxDuration = 600) {
  const sortedByViews = [...clips].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
  let total = 0;
  const selected = [];
  for (const clip of sortedByViews) {
    if (total + (clip.duration || 0) > maxDuration) break;
    selected.push(clip);
    total += clip.duration || 0;
  }
  selected.sort((a, b) => {
    if (typeof a.vod_offset === 'number' && typeof b.vod_offset === 'number') {
      return a.vod_offset - b.vod_offset;
    }
    if (typeof a.vod_offset === 'number') return -1;
    if (typeof b.vod_offset === 'number') return 1;
    return (b.view_count || 0) - (a.view_count || 0);
  });
  return selected;
} 