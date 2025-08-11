import { format, isToday } from 'date-fns';
import { PlayCircle, Eye } from 'lucide-react';
import DayDetail from './DayDetail';
import { formatClipDuration, parseTwitchDuration } from '../../utils/twitchFormatters';

export default function StreamerTimeline({ vods, clipsByVod, expandedDay, setExpandedDay, days}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 md:gap-3 mb-4 mtxf-6 min-w-max">
        {days.map((day, idx) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const vodList = vods || [];
          const vod = vodList.find(v => format(new Date(v.created_at), 'yyyy-MM-dd') === dayKey);
          const isCurrentDay = isToday(day);
          const expanded = expandedDay === dayKey;
          return (
            <div
              key={dayKey}
              className={`rounded-lg p-3 w-[100px] md:w-[120px] flex-shrink-0 flex flex-col items-center cursor-pointer transition-all duration-200 border-2
               ${expanded ? 'border-[#ffc8fe] bg-[#a471cf]/50 shadow-lg' : 'border-transparent bg-[#a471cf]/30'}
               hover:border-[#ffc8fe] hover:bg-[#a471cf]/50`}
              onClick={() => setExpandedDay(expanded ? null : dayKey)}
            >
              <div className="font-bold text-white mb-1 flex items-center">
                {format(day, 'EEE')}
                {isCurrentDay && <span className="ml-2 px-2 py-0.5 bg-[#ffc8fe] text-[#45323f] text-xs rounded-full font-bold">Today</span>}
              </div>
              <div className="text-xs text-[#ffc8fe] mb-1">{format(day, 'MMM d')}</div>
              {vod ? (
                <div className="flex flex-col items-center justify-center w-full">
                  <span className="inline-flex items-center justify-center bg-[#fff]/10 rounded-full p-1 mb-1">
                    <PlayCircle className="w-5 h-5 text-[#ffc8fe]" />
                  </span>
                  <span className="inline-flex items-center gap-1 mb-1">
                    <Eye className="w-4 h-4 text-[#ffc8fe]" />
                    <span className="text-xs text-[#ffc8fe] font-semibold">{vod.view_count && vod.view_count.toLocaleString()}</span>
                  </span>
                  <div className="text-xs text-[#ffc8fe] mb-1">{formatClipDuration(parseTwitchDuration(vod.duration))}</div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full min-h-[48px]">
                  <span className="inline-flex items-center justify-center bg-[#fff]/10 rounded-full p-1 mb-1">
                    <PlayCircle className="w-5 h-5 text-[#ffc8fe]" />
                  </span>
                  <span className="text-xs text-[#ffc8fe] text-center">No stream for this day</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {expandedDay && (() => {
        const vod = (vods || []).find(v => format(new Date(v.created_at), 'yyyy-MM-dd') === expandedDay);
        let clips = [];
        if (vod && clipsByVod && clipsByVod[vod.id]) {
          clips = clipsByVod[vod.id].clips || [];
        }
        return <DayDetail vod={vod} clips={clips} />;
      })()}
    </div>
  );
} 