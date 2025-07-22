export default function ChannelCard({ channel, isLive, subscription }) {
  return (
    <a
      href={`https://twitch.tv/${channel.broadcaster_login}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-3 bg-[#a471cf]/20 rounded-xl p-5 hover:bg-[#a471cf]/40 hover:scale-105 hover:shadow-lg transition-all duration-200 w-28 max-w-xs min-w-0 box-border shadow-sm border border-[#ffc8fe] relative"
      aria-label={`Go to ${channel.broadcaster_name}'s Twitch channel`}
    >
      <div className="relative">
        <img
          src={channel.profile_image_url || '/icon.png'}
          alt={channel.broadcaster_name}
          className="w-16 h-16 rounded-full object-cover border-2 border-[#ffc8fe]"
          style={{ background: '#2d1e2f' }}
        />
        {isLive && (
          <span className="absolute -bottom-1 -right-1 flex items-center justify-center">
            <span className="bg-red-600 rounded-full px-2 py-0.5 flex items-center justify-center border-2 border-white shadow-lg min-w-[32px] min-h-[20px]">
              <span className="text-white font-bold text-xs leading-none uppercase">LIVE</span>
            </span>
          </span>
        )}
      </div>
      <span className="text-white text-sm font-semibold truncate max-w-[90px] text-center">{channel.broadcaster_name}</span>
      {subscription && (
        <div className="absolute -top-1 -right-1 bg-[#ffc8fe] text-[#45323f] text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap shadow">
          {subscription.tier === '1000' ? 'Tier 1' : subscription.tier === '2000' ? 'Tier 2' : subscription.tier === '3000' ? 'Tier 3' : 'Sub'}
        </div>
      )}
    </a>
  );
} 