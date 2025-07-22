import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import NotFound from './NotFound';
import ProfileHeader from '../components/profile/ProfileHeader';
import SectionBox from '../components/profile/SectionBox';
import ChannelGrid from '../components/profile/ChannelGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function getAccountAge(createdAt) {
  if (!createdAt) return '—';
  const created = new Date(createdAt);
  const now = new Date();
  const diff = now - created;
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
  if (years > 0) return `${years} year${years > 1 ? 's' : ''}${months > 0 ? `, ${months} month${months > 1 ? 's' : ''}` : ''}`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
  return 'Less than a month';
}

export default function Profile() {
  const { user, loading: userLoading } = useAuth();
  const [followed, setFollowed] = useState([]);
  const [subscribed, setSubscribed] = useState([]);
  const [liveStatus, setLiveStatus] = useState({});
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [error, setError] = useState(null);

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    async function fetchProfileData() {
      setProfileLoaded(false);
      setError(null);
      try {
        const followedRes = await fetch(`${BACKEND_BASE_URL}/api/followed`, { credentials: 'include' });
        if (!followedRes.ok) throw new Error('Failed to fetch followed channels');
        const followedData = await followedRes.json();
        const followedList = followedData.data || [];
        if (!isMounted) return;
        setFollowed(followedList);

        let subscribedList = [];
        try {
          const ids = followedList.map(ch => ch.broadcaster_id).join(',');
          const subRes = await fetch(`${BACKEND_BASE_URL}/api/check-subscription-batch?broadcaster_ids=${ids}`, { credentials: 'include' });
          if (subRes.ok) {
            const subData = await subRes.json();
            subscribedList = followedList.filter(ch => subData[ch.broadcaster_id]);
            subscribedList = subscribedList.map(ch => ({ ...ch, subscription: subData[ch.broadcaster_id] }));
          } else {
            subscribedList = [];
          }
        } catch {
          subscribedList = [];
        }
        if (!isMounted) return;
        setSubscribed(subscribedList);

        let live = {};
        try {
          const ids = followedList.map(ch => ch.broadcaster_id).join(',');
          const liveRes = await fetch(`${BACKEND_BASE_URL}/api/stream-status-batch?broadcaster_ids=${ids}`, { credentials: 'include' });
          if (liveRes.ok) {
            const liveData = await liveRes.json();
            live = liveData;
          } else {
            live = {};
          }
        } catch {
          live = {};
        }
        if (!isMounted) return;
        setLiveStatus(live);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setProfileLoaded(true);
      }
    }
    fetchProfileData();
    return () => { isMounted = false; };
  }, [user]);

  const fullyLoading = userLoading || (user && !profileLoaded);

  if (!userLoading && !user) {
    return <NotFound />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (fullyLoading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  const sortedFollowed = [...followed].sort((a, b) => new Date(a.followed_at) - new Date(b.followed_at));
  const sortedSubscribed = [...subscribed].sort((a, b) => new Date(a.followed_at) - new Date(b.followed_at));

  const twitchUser = user.data ? user.data[0] : user;
  const accountAge = getAccountAge(twitchUser.created_at);

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#45323f] to-[#4a3234] w-full pb-10">
      <div className="max-w-2xl mx-auto p-5 pt-24">
        <div className="bg-[#3a2b2f]/80 border border-[#b08b6f] rounded-2xl p-4 flex flex-col items-center text-white shadow-lg">
          <ProfileHeader
            twitchUser={twitchUser}
            followingCount={sortedFollowed.length}
            subscribedCount={sortedSubscribed.length}
            accountAge={accountAge}
          />
          <SectionBox title="Followed Channels">
            <ChannelGrid
              channels={sortedFollowed}
              liveStatus={liveStatus}
              showSubscription={false}
              emptyMessage="No followed channels found."
            />
          </SectionBox>
          <SectionBox title="Subscribed Channels">
            <ChannelGrid
              channels={sortedSubscribed}
              liveStatus={liveStatus}
              showSubscription={true}
              emptyMessage={
                <span className="text-center col-span-full">
                  <span className="text-white/60 block mb-2">No subscribed channels found.</span>
                  <span className="text-white/40 text-sm">This shows channels you follow that you're also subscribed to.</span>
                </span>
              }
            />
          </SectionBox>
        </div>
      </div>
    </div>
  );
} 