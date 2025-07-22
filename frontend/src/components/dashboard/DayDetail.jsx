import TopClipsSection from './TopClipsSection';
import VodSection from './VodSection';
import StreamHighlightsSection from './StreamHighlightsSection';

export default function DayDetail({ vod, clips }) {
  if (!vod) {
    return (
      <div className="w-full bg-[#2d1e2f] rounded-lg p-6 mt-2 flex flex-col items-center justify-center shadow-lg border border-[#a471cf] max-w-full overflow-x-auto">
        <span className="text-[#ffc8fe] text-lg font-semibold">No stream for this day</span>
      </div>
    );
  }
  return (
    <div className="w-full bg-[#2d1e2f] rounded-lg p-6 mt-2 flex flex-col md:flex-row gap-8 shadow-lg border border-[#a471cf] max-w-full overflow-x-auto">
      <div className="flex-1 min-w-[320px] flex flex-col items-start justify-start">
        <TopClipsSection clips={clips} />
      </div>
      <div className="flex-1 min-w-[320px] flex flex-col items-end justify-start gap-8">
        <VodSection vod={vod} />
        <StreamHighlightsSection clips={clips} />
      </div>
    </div>
  );
} 