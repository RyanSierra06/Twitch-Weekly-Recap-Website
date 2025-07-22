import ClipsPlaylist from './ClipsPlaylist';

export default function StreamHighlightsSection({ clips }) {
  return (
    <div className="w-full bg-[#3a2b2f]/80 rounded-2xl p-4 flex flex-col items-center border border-[#ffc8fe]">
      <div className="flex items-center justify-center mb-6 w-full">
        <span className="mr-2 text-[#ffc8fe]">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" stroke="#ffc8fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
        <span className="text-lg font-bold text-white text-center">Stream Highlights</span>
      </div>
      <div className="flex flex-col gap-2 bg-[#6b4e3d]/60 rounded-2xl p-3 w-full">
        <ClipsPlaylist clips={clips} />
      </div>
    </div>
  );
} 