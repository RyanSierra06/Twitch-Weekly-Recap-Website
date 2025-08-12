import { useEffect, useState, useMemo } from 'react';
import { User } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import StreamerTimeline from '../components/dashboard/StreamerTimeline';
import NotFound from './NotFound';

export default function Dashboard() {
  const { user: authUser, loading: authLoading, login} = useAuth();
  const [followed, setFollowed] = useState([]);
  const [streamerProfiles, setStreamerProfiles] = useState({});
  const [vods, setVods] = useState({});
  const [clipsByVod, setClipsByVod] = useState({});
  const [clipsLoaded, setClipsLoaded] = useState(false);
  const [liveStatus, setLiveStatus] = useState({});
  const [expandedDay, setExpandedDay] = useState({});
  const [error, setError] = useState(null);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [vodsLoaded, setVodsLoaded] = useState(false);

  const fullyLoading = authLoading || !profilesLoaded || !vodsLoaded || !clipsLoaded;

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  function getPastNDates(n) {
    return Array.from({ length: n }, (_, i) => subDays(new Date(), n - 1 - i));
  }
  const days = useMemo(() => getPastNDates(7), []);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        if (!authUser) return;
        const streamerDataRes = await fetch(`${BACKEND_BASE_URL}/api/streamer-data`, { credentials: 'include' });
        if (!streamerDataRes.ok) throw new Error('Could not fetch streamer data');
        const streamerData = await streamerDataRes.json();
        const sortedFollowed = (streamerData.followed || []).sort((a, b) => new Date(a.followed_at) - new Date(b.followed_at));
        if (isMounted) {
          setFollowed(sortedFollowed);
          setStreamerProfiles(streamerData.profiles || {});
          setLiveStatus(streamerData.liveStatus || {});
          setProfilesLoaded(true);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [authUser]);

  useEffect(() => {
    let isMounted = true;
    async function fetchAllVods() {
      if (!followed.length) return;
      const allVods = {};
      const vodPromises = followed.map(async (follow) => {
        const id = follow.broadcaster_id;
        try {
          const start = format(subDays(new Date(), 6), "yyyy-MM-dd'T'00:00:00'Z'");
          const end = format(new Date(), "yyyy-MM-dd'T'23:59:59'Z'");
          const res = await fetch(`${BACKEND_BASE_URL}/api/vods?user_id=${id}&started_at=${start}&ended_at=${end}`, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            return { id, data: data.data || [] };
          }
        } catch {}
        return { id, data: [] };
      });
      const vodResults = await Promise.all(vodPromises);
      vodResults.forEach(({ id, data }) => {
        allVods[id] = data;
      });
      if (isMounted) {
        setVods(allVods);
        setVodsLoaded(true);
      }
    }
    if (followed.length > 0) {
      setVodsLoaded(false);
      fetchAllVods();
    }
    return () => { isMounted = false; };
  }, [followed]);

  useEffect(() => {
    let isMounted = true;
    async function fetchAllClips() {
      if (!followed.length) return;
      const allClips = {};
      const start = format(subDays(new Date(), 6), "yyyy-MM-dd'T'00:00:00'Z'");
      const end = format(new Date(), "yyyy-MM-dd'T'23:59:59'Z'");
      const clipPromises = followed.map(async (follow) => {
        const id = follow.broadcaster_id;
        try {
          const res = await fetch(`${BACKEND_BASE_URL}/api/clips?broadcaster_id=${id}&started_at=${start}&ended_at=${end}`, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            allClips[id] = data.data || {};
          } else {
            allClips[id] = {};
          }
        } catch {
          allClips[id] = {};
        }
      });
      await Promise.all(clipPromises);
      if (isMounted) {
        setClipsByVod(allClips);
        setClipsLoaded(true);
      }
    }
    if (followed.length > 0) {
      setClipsLoaded(false);
      fetchAllClips();
    }
    return () => { isMounted = false; };
  }, [followed]);

  useEffect(() => {
    if (!authLoading) return;
    let count = 1;
    let linger = false;
    const interval = setInterval(() => {
      if (count === 4 && !linger) {
        linger = true;
        return;
      }
      linger = false;
      count = count === 4 ? 1 : count + 1;
    }, 200);
    return () => clearInterval(interval);
  }, [authLoading]);

  if (!authLoading && !authUser) {
    return <NotFound />;
  }

  if (error) return <div className="text-red-400 p-10">{error}</div>;

  if (fullyLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#45323f] to-[#4a3234] w-full">
        <span className="relative flex h-12 w-12 mb-4">
          <span className="animate-spin absolute inline-flex h-full w-full rounded-full border-4 border-t-[#ffc8fe] border-b-[#ffc8fe] border-l-transparent border-r-transparent"></span>
          <span className="absolute inline-flex h-full w-full rounded-full opacity-30 border-4 border-[#ffc8fe]"></span>
        </span>
        <div className="text-[#ffc8fe] text-lg font-semibold">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#45323f] to-[#4a3234] w-full pb-10">
      <div className="max-w-5xl mx-auto p-5 pt-24">
        <section className="text-left space-y-3 mb-4 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Your <span className="bg-gradient-to-r from-[#a471cf] to-[#f073ba] bg-clip-text text-transparent">Weekly Recap</span>
          </h1>
          <p className="text-xl text-[#ffc8fe] leading-relaxed">
            Catch up on the best moments, top clips, and stream highlights from your favorite creators, all in one place.
          </p>
        </section>
        <div className="space-y-8">
          {followed.length === 0 && <div className="text-white">You are not following any streamers.</div>}
          {followed.map((follow) => {
            const profile = streamerProfiles[follow.broadcaster_id];
            const isLive = liveStatus[follow.broadcaster_id];
            return (
              <div key={follow.broadcaster_id} className="bg-[#3a2b2f]/80 border border-[#b08b6f] rounded-xl p-6 text-white mb-8">
                <div className="flex items-center space-x-4 mb-4 flex-wrap gap-2">
                  <div 
                    className="relative w-14 h-14 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => {
                      const twitchUrl = `https://www.twitch.tv/${follow.broadcaster_login}`;
                      window.open(twitchUrl, '_blank');
                    }}
                    title={`Visit ${profile ? profile.display_name : follow.broadcaster_name}'s Twitch channel`}
                  >
                    {profile && profile.profile_image_url ? (
                      <img src={profile.profile_image_url} alt={profile.display_name} className="w-14 h-14 object-cover rounded-full" />
                    ) : (
                      <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-[#a471cf] via-[#e559f9] to-[#ff8c8c]">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    )}
                    {isLive && (
                      <span className="absolute -bottom-1 -right-1 flex items-center justify-center">
                        <span className="bg-red-600 rounded-full px-2 py-0.5 flex items-center justify-center border-2 border-white shadow-lg min-w-[32px] min-h-[20px]">
                          <span className="text-white font-bold text-xs leading-none uppercase">LIVE</span>
                        </span>
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xl font-bold">{profile ? profile.display_name : follow.broadcaster_name}</div>
                    <div className="text-[#ffc8fe] text-sm">@{follow.broadcaster_login}</div>
                  </div>
                  <div className="ml-auto flex gap-2 flex-wrap">
                    <div className="bg-[#a471cf] text-white px-3 py-1 rounded-lg text-xs font-semibold">Followed {format(new Date(follow.followed_at), 'MMM d, yyyy')}</div>
                    <div className="bg-[#ffc8fe] text-[#45323f] px-3 py-1 rounded-lg text-xs font-semibold">
                      {(() => {
                        const streamerVods = vods[follow.broadcaster_id] || [];
                        const streamedDays = streamerVods.length;
                        return `${streamedDays} stream${streamedDays !== 1 ? 's' : ''} this week`;
                      })()}
                    </div>
                  </div>
                </div>
                <StreamerTimeline
                  follow={follow}
                  profile={profile}
                  vods={vods[follow.broadcaster_id]}
                  clipsByVod={clipsByVod[follow.broadcaster_id]}
                  liveStatus={isLive}
                  expandedDay={expandedDay[follow.broadcaster_id]}
                  setExpandedDay={dayKey => setExpandedDay(prev => ({ ...prev, [follow.broadcaster_id]: dayKey }))}
                  days={days}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 