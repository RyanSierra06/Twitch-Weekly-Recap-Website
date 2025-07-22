export default function ProfileHeader({ twitchUser, followingCount, subscribedCount, accountAge }) {
  return (
    <>
      <div className="relative w-32 h-32 mb-4">
        <img
          src={twitchUser.profile_image_url}
          alt={twitchUser.display_name}
          className="w-32 h-32 object-cover rounded-full border-4 border-[#ffc8fe] shadow-lg"
        />
      </div>
      <div className="text-3xl font-extrabold text-[#ffc8fe] mb-1 flex items-center gap-2">
        {twitchUser.display_name}
        <a
          href={`https://twitch.tv/${twitchUser.login}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 px-2 py-0.5 bg-[#a471cf] text-white text-xs rounded-full font-bold hover:bg-[#ffc8fe] hover:text-[#45323f] transition"
          aria-label={`View ${twitchUser.display_name}'s channel on Twitch`}
        >
          View Channel
        </a>
      </div>
      <div className="text-lg text-[#ffc8fe]/80 mb-2">@{twitchUser.login}</div>
      <div className="flex flex-row items-center justify-center gap-10 my-4">
        <div className="flex flex-col items-center">
          <span className="text-[#ffc8fe] text-base font-bold">Following</span>
          <span className="text-white text-lg font-extrabold">{followingCount}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[#ffc8fe] text-base font-bold">Account Age</span>
          <span className="text-white text-lg font-bold">{accountAge}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[#ffc8fe] text-base font-bold">Subscribed</span>
          <span className="text-white text-lg font-extrabold">{subscribedCount}</span>
        </div>
      </div>
    </>
  );
} 