import { useMemo } from 'react';
import { PlayCircle } from 'lucide-react';
import { formatClipDuration } from '../../utils/twitchFormatters';

export default function TopClipsSection({ clips }) {
  const paddedClips = useMemo(() => {
    const arr = [...(clips.slice(0, 3))];
    while (arr.length < 3) arr.push(null);
    return arr;
  }, [clips]);

  const parentDomain = window.location.hostname;

  return (
    <div className="w-full h-full min-h-[260px] bg-[#3a2b2f]/80 rounded-2xl p-4 flex flex-col gap-4 border border-[#ffc8fe] justify-start">
      <div className="flex items-center justify-center mb-2 w-full">
        <span className="mr-2 text-[#ffc8fe]">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" stroke="#ffc8fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
        <span className="text-lg font-bold text-white text-center">Top 3 Clips</span>
      </div>
      {paddedClips.map((clip, i) => (
        clip ? (
          <div key={clip.id} className="flex flex-col gap-2 bg-[#6b4e3d]/60 rounded-2xl p-3 w-full">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-[#a471cf]/30 rounded-xl">
                <PlayCircle className="w-7 h-7 text-[#ffc8fe]" />
              </div>
              <div className="flex-1 flex flex-col items-start justify-center min-w-0">
                <div className="font-semibold text-white text-lg truncate w-full max-w-full" title={clip.title || `Clip #${i+1}`}>{clip.title || `Clip #${i+1}`}</div>
                <div className="text-[#ffc8fe] text-base flex items-center gap-2 mt-1">
                  {clip.view_count && <span>{clip.view_count.toLocaleString()} views</span>}
                  {clip.duration && <span>• {formatClipDuration(clip.duration)}</span>}
                </div>
              </div>
            </div>
            <div className="relative w-full flex flex-col items-center mt-2">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-[#ffc8fe] bg-[#2d1e2f] p-2 w-full max-w-[480px] mx-auto">
                <div className="relative">
                  <iframe
                    src={`https://clips.twitch.tv/embed?clip=${clip.id}&parent=${parentDomain}&autoplay=false`}
                    width="100%"
                    height="180"
                    allowFullScreen
                    title={clip.title || `Clip #${i+1}`}
                    className="rounded-xl"
                    style={{ background: '#18181b' }}
                  />
                  <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[#2d1e2f]/80 to-transparent pointer-events-none rounded-t-xl" />
                  <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-[#2d1e2f]/80 to-transparent pointer-events-none rounded-b-xl" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div key={`placeholder-${i}`} className="flex flex-col gap-2 bg-[#6b4e3d]/30 rounded-2xl p-3 w-full opacity-60 border-2 border-dashed border-[#ffc8fe] min-h-[120px] items-center justify-center">
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-center justify-center w-12 h-12 bg-[#a471cf]/10 rounded-xl">
                <PlayCircle className="w-7 h-7 text-[#ffc8fe] opacity-40" />
              </div>
              <div className="flex-1 flex flex-col items-start justify-center min-w-0">
                <div className="font-semibold text-white/60 text-lg truncate w-full max-w-full">No clip</div>
                <div className="text-[#ffc8fe]/60 text-base flex items-center gap-2 mt-1">—</div>
              </div>
            </div>
            <div className="relative w-full flex flex-col items-center mt-2">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-[#ffc8fe]/40 bg-[#2d1e2f]/40 p-2 w-full max-w-[480px] mx-auto min-h-[100px] flex items-center justify-center">
                <span className="text-[#ffc8fe]/60 text-sm">No clip available</span>
              </div>
            </div>
          </div>
        )
      ))}
    </div>
  );
} 