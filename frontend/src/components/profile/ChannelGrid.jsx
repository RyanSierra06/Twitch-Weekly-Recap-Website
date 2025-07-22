import ChannelCard from './ChannelCard';

export default function ChannelGrid({ channels, liveStatus, showSubscription, emptyMessage }) {
  return (
    <div className="w-full overflow-x-auto px-4 md:px-8 pb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-center w-full max-w-full mt-6 overflow-visible">
        {channels.length === 0 ? (
          <span className="text-white/60 col-span-full">{emptyMessage}</span>
        ) : (
          channels.map((ch, idx) => (
            <ChannelCard
              key={ch.broadcaster_id}
              channel={ch}
              isLive={!!liveStatus[ch.broadcaster_id]}
              subscription={showSubscription ? ch.subscription : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
} 