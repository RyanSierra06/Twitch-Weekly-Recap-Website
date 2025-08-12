import express from 'express';
import { makeTwitchRequest, batchGetUserInfo, batchGetStreamStatus } from '../utils/twitchApi.js';

const router = express.Router();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

// Enhanced helper function to get user from session or passport with multiple fallbacks
function getUserFromRequest(req) {
    console.log('Getting user from request...');
    console.log('req.user exists:', !!req.user);
    console.log('req.session exists:', !!req.session);
    console.log('req.session.passport exists:', !!(req.session && req.session.passport));
    console.log('req.session.passport.user exists:', !!(req.session && req.session.passport && req.session.passport.user));
    
    // Check passport user first (most reliable)
    if (req.user) {
        console.log('Using passport user:', req.user.id);
        return req.user;
    }
    
    // Fall back to session passport user
    if (req.session && req.session.passport && req.session.passport.user) {
        console.log('Using session passport user:', req.session.passport.user.id);
        return req.session.passport.user;
    }
    
    // Additional fallback checks
    if (req.session && req.session.user) {
        console.log('Using session user:', req.session.user.id);
        return req.session.user;
    }
    
    console.log('No user found in request');
    return null;
}

// Enhanced user ID extraction with multiple fallbacks
function extractUserId(user) {
    if (!user) return null;
    
    // Try multiple possible user ID fields
    const possibleIds = [
        user.id,
        user.user_id,
        user.userId,
        user.data?.[0]?.id,
        user.profile?.id
    ];
    
    for (const id of possibleIds) {
        if (id) {
            console.log('Extracted user ID:', id);
            return id;
        }
    }
    
    console.error('Could not extract user ID from user object:', user);
    return null;
}

router.get('/user', function (req, res) {
    console.log('=== /api/user endpoint called ===');
    
    const user = getUserFromRequest(req);
    if (user) {
        console.log('User found, returning user data');
        res.json(user);
    } else {
        console.log('No user found, returning 401');
        res.status(401).json({ 
            error: 'Not authenticated',
            details: 'No valid user session found',
            timestamp: new Date().toISOString()
        });
    }
});

router.get('/followed', async function (req, res) {
    console.log('=== /api/followed endpoint called ===');
    
    const user = getUserFromRequest(req);
    if (!user || !user.accessToken) {
        console.log('No user or access token found');
        return res.status(401).json({ 
            error: 'Not authenticated',
            details: 'Missing user or access token',
            timestamp: new Date().toISOString()
        });
    }
    
    const userId = extractUserId(user);
    if (!userId) {
        console.log('Could not extract user ID');
        return res.status(400).json({ 
            error: 'User ID not found in session',
            details: 'Unable to extract user ID from session data',
            timestamp: new Date().toISOString()
        });
    }
    
    try {
        console.log('Fetching followed channels for user:', userId);
        const accessToken = user.accessToken;
        const cacheKey = `followed_${userId}`;
        const followedData = await makeTwitchRequest(
            `https://api.twitch.tv/helix/channels/followed?user_id=${userId}&first=100`,
            accessToken,
            cacheKey
        );
        
        if (!followedData.data || !Array.isArray(followedData.data)) {
            console.log('No followed data returned from Twitch API');
            return res.json({ data: [] });
        }
        
        console.log(`Found ${followedData.data.length} followed channels`);
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
        
        console.log('Successfully processed followed channels');
        res.json({ data: channelsWithProfiles });
    } catch (error) {
        console.error('Error fetching followed streamers:', error);
        res.status(500).json({ 
            error: 'Failed to fetch followed streamers',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

router.get('/streamer-data', async function (req, res) {
    console.log('=== /api/streamer-data endpoint called ===');
    
    const user = getUserFromRequest(req);
    if (!user || !user.accessToken) {
        console.log('No user or access token found');
        return res.status(401).json({ 
            error: 'Not authenticated',
            details: 'Missing user or access token',
            timestamp: new Date().toISOString()
        });
    }
    
    const userId = extractUserId(user);
    if (!userId) {
        console.log('Could not extract user ID');
        return res.status(400).json({ 
            error: 'User ID not found in session',
            details: 'Unable to extract user ID from session data',
            timestamp: new Date().toISOString()
        });
    }
    
    try {
        console.log('Fetching streamer data for user:', userId);
        const accessToken = user.accessToken;
        const cacheKey = `followed_${userId}`;
        const followedData = await makeTwitchRequest(
            `https://api.twitch.tv/helix/channels/followed?user_id=${userId}&first=100`,
            accessToken,
            cacheKey
        );
        
        if (!followedData.data || !Array.isArray(followedData.data)) {
            console.log('No followed data returned from Twitch API');
            return res.json({ 
                followed: [],
                profiles: {},
                liveStatus: {},
                vods: {},
                clips: {}
            });
        }
        
        console.log(`Found ${followedData.data.length} followed channels`);
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
        
        console.log('Successfully processed streamer data');
        res.json({
            followed: followedWithProfiles,
            profiles: profileMap,
            liveStatus: liveStatus,
            vods: {},
            clips: {}
        });
    } catch (error) {
        console.error('Error fetching streamer data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch streamer data',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

router.get('/', function (req, res) {
    console.log('=== /api/ root endpoint called ===');
    
    const user = getUserFromRequest(req);
    if (user) {
        console.log('User found, redirecting to dashboard');
        res.redirect(`${FRONTEND_BASE_URL}/dashboard`);
    } else {
        console.log('No user found, redirecting to home');
        res.redirect(FRONTEND_BASE_URL);
    }
});

export default router;
