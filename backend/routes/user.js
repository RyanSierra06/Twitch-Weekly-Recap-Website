import express from 'express';
import { makeTwitchRequest, batchGetUserInfo, batchGetStreamStatus } from '../utils/twitchApi.js';

const router = express.Router();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

router.get('/user', function (req, res) {
    console.log('=== USER ENDPOINT CALLED ===');
    console.log('Request headers:', req.headers);
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('Session passport exists:', !!(req.session && req.session.passport));
    console.log('Session passport user exists:', !!(req.session && req.session.passport && req.session.passport.user));
    console.log('Full session data:', JSON.stringify(req.session, null, 2));
    console.log('Passport user:', req.user);
    
    if(req.session && req.session.passport && req.session.passport.user) {
        console.log('✅ User authenticated, returning user data');
        console.log('User data being returned:', req.session.passport.user);
        res.json(req.session.passport.user);
    } else {
        console.log('❌ User not authenticated, returning 401');
        console.log('Session check failed:');
        console.log('- Session exists:', !!req.session);
        console.log('- Session passport exists:', !!(req.session && req.session.passport));
        console.log('- Session passport user exists:', !!(req.session && req.session.passport && req.session.passport.user));
        res.status(401).json({ error: 'Not authenticated' });
    }
});

router.get('/followed', async function (req, res) {
    if(req.session && req.session.passport && req.session.passport.user && req.session.passport.user.accessToken) {
        const userSession = req.session.passport.user;
        let userId = null;
        if (userSession.id) {
            userId = userSession.id;
        } else if (userSession.data && Array.isArray(userSession.data) && userSession.data[0] && userSession.data[0].id) {
            userId = userSession.data[0].id;
        } else if (userSession.user_id) {
            userId = userSession.user_id;
        }
        if (!userId) {
            return res.status(400).json({ error: 'User ID not found in session' });
        }
        try {
            const accessToken = userSession.accessToken;
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
            res.status(500).json({ error: 'Failed to fetch followed streamers' });
        }
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

router.get('/streamer-data', async function (req, res) {
    if(req.session && req.session.passport && req.session.passport.user && req.session.passport.user.accessToken) {
        const userSession = req.session.passport.user;
        let userId = null;
        if (userSession.id) {
            userId = userSession.id;
        } else if (userSession.data && Array.isArray(userSession.data) && userSession.data[0] && userSession.data[0].id) {
            userId = userSession.data[0].id;
        } else if (userSession.user_id) {
            userId = userSession.user_id;
        }
        if (!userId) {
            return res.status(400).json({ error: 'User ID not found in session' });
        }
        try {
            const accessToken = userSession.accessToken;
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
            res.status(500).json({ error: 'Failed to fetch streamer data' });
        }
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

router.get('/', function (req, res) {
    if(req.session && req.session.passport && req.session.passport.user) {
        res.redirect(`${FRONTEND_BASE_URL}/dashboard`);
    } else {
        res.redirect(FRONTEND_BASE_URL);
    }
});

export default router;
