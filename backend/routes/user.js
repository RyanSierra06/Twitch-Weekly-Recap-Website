import express from 'express';
import fetch from 'node-fetch';
import { makeTwitchRequest, batchGetUserInfo, batchGetStreamStatus } from '../utils/twitchApi.js';

const router = express.Router();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;

// Middleware to validate access token
const validateToken = async (req, res, next) => {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
        return res.status(401).json({ error: 'No access token provided' });
    }
    
    try {
        const response = await fetch('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            return res.status(401).json({ error: 'Invalid access token' });
        }
        
        const data = await response.json();
        const user = data.data && data.data[0] ? data.data[0] : null;
        
        if (!user) {
            return res.status(401).json({ error: 'No user data returned' });
        }
        
        // Add user and token to request object
        req.user = user;
        req.accessToken = accessToken;
        next();
        
    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({ error: 'Token validation failed' });
    }
};

// Get current user
router.get('/user', validateToken, (req, res) => {
    console.log('User authenticated via token:', req.user.id);
    res.json(req.user);
});

// Get followed channels
router.get('/followed', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const accessToken = req.accessToken;
        
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

// Get streamer data
router.get('/streamer-data', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const accessToken = req.accessToken;
        
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

// Root redirect
router.get('/', (req, res) => {
    res.redirect(`${FRONTEND_BASE_URL}/dashboard`);
});

export default router;
