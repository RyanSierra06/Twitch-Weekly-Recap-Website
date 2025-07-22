import { formatClipDuration, parseTwitchDuration } from '../../utils/twitchFormatters';

export default function VodSection({ vod }) {

  const parentDomain = window.location.hostname;

  return (
    <div className="w-full bg-[#3a2b2f]/80 rounded-2xl p-4 flex flex-col items-center border border-[#ffc8fe]">
      <div className="flex items-center justify-center mb-6 w-full">
        <span className="mr-2 text-[#ffc8fe]">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" stroke="#ffc8fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
        <span className="text-lg font-bold text-white text-center">Stream VOD</span>
      </div>
      <div className="flex flex-col gap-2 bg-[#6b4e3d]/60 rounded-2xl p-3 w-full">
        <div className="flex items-center gap-4 mt-1">
          <div className="flex items-center justify-center w-12 h-12 bg-[#a471cf]/30 rounded-xl">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" stroke="#ffc8fe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="flex-1 flex flex-col items-start justify-center min-w-0">
            <div className="font-semibold text-white text-lg truncate w-full max-w-full" title={vod.title}>{vod.title}</div>
            <div className="text-[#ffc8fe] text-base flex items-center gap-2 mt-1">
              {vod.view_count && <span>{vod.view_count.toLocaleString()} views</span>}
              {vod.duration && <span>• {formatClipDuration(parseTwitchDuration(vod.duration))}</span>}
            </div>
          </div>
        </div>
        <div className="relative w-full flex flex-col items-center mt-2">
          <div className="rounded-2xl overflow-hidden shadow-lg border border-[#ffc8fe] bg-[#2d1e2f] p-2 w-full max-w-[480px] mx-auto">
            <div className="relative">
              <iframe
                src={`https://player.twitch.tv/?video=${vod.id}&parent=${parentDomain}&autoplay=false`}
                width="100%"
                height="220"
                allowFullScreen
                title={vod.title}
                className="rounded-xl"
                style={{ background: '#18181b' }}
              />
              <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[#2d1e2f]/80 to-transparent pointer-events-none rounded-t-xl" />
              <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-[#2d1e2f]/80 to-transparent pointer-events-none rounded-b-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 