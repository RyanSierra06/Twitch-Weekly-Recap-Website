import express from 'express';
import { makeTwitchRequest, batchGetUserInfo, batchGetStreamStatus } from '../utils/twitchApi.js';

const router = express.Router();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

// Helper function to get user from session or passport
function getUserFromRequest(req) {
    // Check passport user first (most reliable)
    if (req.user) {
        return req.user;
    }
    
    // Fall back to session passport user
    if (req.session && req.session.passport && req.session.passport.user) {
        return req.session.passport.user;
    }
    
    return null;
}

router.get('/user', function (req, res) {
    const user = getUserFromRequest(req);
    if (user) {
        res.json(user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

router.get('/followed', async function (req, res) {
    const user = getUserFromRequest(req);
    if (!user || !user.accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    let userId = null;
    if (user.id) {
        userId = user.id;
    } else if (user.data && Array.isArray(user.data) && user.data[0] && user.data[0].id) {
        userId = user.data[0].id;
    } else if (user.user_id) {
        userId = user.user_id;
    }
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID not found in session' });
    }
    
    try {
        const accessToken = user.accessToken;
        const cacheKey = `followed_${userId}`;
        const followedData = await makeTwitchRequest(
            `https://api.twitch.tv/helix/channels/followed?user_id=${userId}&first=100`,
            accessToken,
            cacheKey
        );
        if (!followedData.data || !Array.isArray(followedData.data)) {
            return res.json({ data: [] });
        }
        const broadcasterIds = followedData.data.map(channel => channel.broadcaster_id);
        // Fetch user profiles and live status in parallel
        const [userProfiles, liveStatus] = await Promise.all([
            batchGetUserInfo(broadcasterIds, accessToken),
            batchGetStreamStatus(broadcasterIds, accessToken)
        ]);
        const profileMap = new Map();
        userProfiles.forEach(profile => {
            profileMap.set(profile.id, profile);
        });
        const channelsWithProfiles = followedData.data.map(channel => {
            const profile = profileMap.get(channel.broadcaster_id);
            return {
                ...channel,
                profile_image_url: profile ? profile.profile_image_url : null,
                display_name: profile ? profile.display_name : channel.broadcaster_name
            };
        });
        res.json({ data: channelsWithProfiles });
    } catch (error) {
        console.error('Error fetching followed streamers:', error);
        res.status(500).json({ error: 'Failed to fetch followed streamers' });
    }
});

router.get('/streamer-data', async function (req, res) {
    const user = getUserFromRequest(req);
    if (!user || !user.accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    let userId = null;
    if (user.id) {
        userId = user.id;
    } else if (user.data && Array.isArray(user.data) && user.data[0] && user.data[0].id) {
        userId = user.data[0].id;
    } else if (user.user_id) {
        userId = user.user_id;
    }
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID not found in session' });
    }
    
    try {
        const accessToken = user.accessToken;
        const cacheKey = `followed_${userId}`;
        const followedData = await makeTwitchRequest(
            `https://api.twitch.tv/helix/channels/followed?user_id=${userId}&first=100`,
            accessToken,
            cacheKey
        );
        if (!followedData.data || !Array.isArray(followedData.data)) {
            return res.json({ 
                followed: [],
                profiles: {},
                liveStatus: {},
                vods: {},
                clips: {}
            });
        }
        const broadcasterIds = followedData.data.map(channel => channel.broadcaster_id);
        const [userProfiles, liveStatus] = await Promise.all([
            batchGetUserInfo(broadcasterIds, accessToken),
            batchGetStreamStatus(broadcasterIds, accessToken)
        ]);
        const profileMap = {};
        userProfiles.forEach(profile => {
            profileMap[profile.id] = profile;
        });
        const followedWithProfiles = followedData.data.map(channel => {
            const profile = profileMap[channel.broadcaster_id];
            return {
                ...channel,
                profile_image_url: profile ? profile.profile_image_url : null,
                display_name: profile ? profile.display_name : channel.broadcaster_name
            };
        });
        res.json({
            followed: followedWithProfiles,
            profiles: profileMap,
            liveStatus: liveStatus,
            vods: {},
            clips: {}
        });
    } catch (error) {
        console.error('Error fetching streamer data:', error);
        res.status(500).json({ error: 'Failed to fetch streamer data' });
    }
});

router.get('/', function (req, res) {
    const user = getUserFromRequest(req);
    if (user) {
        res.redirect(`${FRONTEND_BASE_URL}/dashboard`);
    } else {
        res.redirect(FRONTEND_BASE_URL);
    }
});

export default router;
