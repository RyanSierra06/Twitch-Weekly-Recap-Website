import { useMemo, useState, useEffect } from 'react';
import { selectClipsForRecap } from '../../utils/twitchFormatters';

export default function ClipsPlaylist({ clips }) {
  const sortedClips = useMemo(() => {
    return [...clips].sort((a, b) => {
      if (typeof a.vod_offset === 'number' && typeof b.vod_offset === 'number') {
        return a.vod_offset - b.vod_offset;
      }
      if (typeof a.vod_offset === 'number') return -1;
      if (typeof b.vod_offset === 'number') return 1;
      return (b.view_count || 0) - (a.view_count || 0);
    });
  }, [clips]);
  const recapClips = useMemo(() => selectClipsForRecap(sortedClips), [sortedClips]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent(0);
  }, [clips]);

  if (!recapClips.length) return <div className="text-[#ffc8fe]/70 text-center">No clips available for this day.</div>;

  function formatDuration(seconds) {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m > 0 ? m + 'm ' : ''}${s}s`;
  }

  const totalDuration = recapClips.reduce((a, c) => a + (c.duration || 0), 0);
  const currentClip = recapClips[current];

  const parentDomain = window.location.hostname;


  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 bg-[#a471cf]/30 rounded-xl">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" stroke="#ffc8fe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div className="flex-1 flex flex-col items-start justify-center min-w-0">
          <div
            className="font-semibold text-white text-lg truncate w-full max-w-full"
            title={currentClip.title}
          >
            {currentClip.title}
          </div>
          <div className="text-[#ffc8fe] text-base flex items-center gap-2 mt-1">
            <span>Clip {current + 1} of {recapClips.length}</span>
            <span>&bull;</span>
            <span>{formatDuration(currentClip.duration)}</span>
          </div>
        </div>
      </div>
      <div className="relative w-full flex flex-col items-center mt-2">
        <div className="rounded-2xl overflow-hidden shadow-lg border border-[#ffc8fe] bg-[#2d1e2f] p-2 w-full max-w-[480px] mx-auto">
          <iframe
            src={`https://clips.twitch.tv/embed?clip=${currentClip.id}&parent=${parentDomain}&autoplay=true`}
            width="100%"
            height="300"
            allowFullScreen
            title={currentClip.title}
            className="rounded-xl"
            style={{ background: '#18181b' }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 mt-3">
        <div className="flex gap-2">
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} className="px-3 py-1 rounded bg-[#a471cf] text-white font-bold disabled:opacity-50">Prev</button>
          <button onClick={() => setCurrent(c => Math.min(recapClips.length - 1, c + 1))} disabled={current === recapClips.length - 1} className="px-3 py-1 rounded bg-[#a471cf] text-white font-bold disabled:opacity-50">Next</button>
        </div>
        <div className="text-xs text-[#ffc8fe] font-semibold">
          Total highlights duration: <span className="text-[#ffc8fe]/80">{formatDuration(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
} 