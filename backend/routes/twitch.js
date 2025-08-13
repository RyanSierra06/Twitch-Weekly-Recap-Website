import express from 'express';
import fetch from 'node-fetch';
import { makeTwitchRequest } from '../utils/twitchApi.js';

const router = express.Router();

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

// Get clips for a broadcaster
router.get('/clips', validateToken, async function (req, res) {
    try {
        const accessToken = req.accessToken;
        const broadcaster_id = req.query.broadcaster_id;
        const started_at = req.query.started_at;
        const ended_at = req.query.ended_at;
        
        if (!broadcaster_id || !started_at || !ended_at) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        // First get VODs for the broadcaster
        const vodsCacheKey = `vods_${broadcaster_id}_${started_at}_${ended_at}`;
        const vodsUrl = `https://api.twitch.tv/helix/videos?user_id=${broadcaster_id}&type=archive&first=100`;
        const vodsData = await makeTwitchRequest(vodsUrl, accessToken, vodsCacheKey);
        
        if (!vodsData.data || !Array.isArray(vodsData.data) || vodsData.data.length === 0) {
            return res.json({ data: {} });
        }
        
        // Filter VODs by date range
        const vods = vodsData.data.filter(vod => {
            const created = new Date(vod.created_at);
            return created >= new Date(started_at) && created < new Date(ended_at);
        });
        
        if (vods.length === 0) {
            return res.json({ data: {} });
        }
        
        // Create VOD map
        const vodMap = {};
        vods.forEach(vod => {
            vodMap[vod.id] = vod;
        });
        
        // Get clips for the broadcaster
        let allClips = [];
        let cursors = [null];
        let page = 0;
        let keepFetching = true;
        const maxPages = 10;
        
        while (keepFetching && page < maxPages) {
            const pagePromises = cursors.map(cursor => {
                let clipsUrl = `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcaster_id}&started_at=${encodeURIComponent(started_at)}&ended_at=${encodeURIComponent(ended_at)}&first=50`;
                if (cursor) clipsUrl += `&after=${cursor}`;
                const clipsCacheKey = `clips_${broadcaster_id}_${started_at}_${ended_at}_page${page}_${cursor || 'start'}`;
                return makeTwitchRequest(clipsUrl, accessToken, clipsCacheKey);
            });
            
            const pageResults = await Promise.all(pagePromises);
            let nextCursors = [];
            let gotNew = false;
            
            for (const clipsData of pageResults) {
                if (clipsData.data && Array.isArray(clipsData.data)) {
                    allClips = allClips.concat(clipsData.data);
                    gotNew = gotNew || clipsData.data.length > 0;
                }
                if (clipsData.pagination && clipsData.pagination.cursor) {
                    nextCursors.push(clipsData.pagination.cursor);
                }
            }
            
            if (!gotNew || nextCursors.length === 0) {
                keepFetching = false;
            } else {
                cursors = nextCursors;
                page++;
            }
        }
        
        // Group clips by VOD
        const grouped = {};
        for (const vod of vods) {
            grouped[vod.id] = {
                vod,
                clips: []
            };
        }
        
        for (const clip of allClips) {
            if (clip.video_id && grouped[clip.video_id]) {
                grouped[clip.video_id].clips.push(clip);
            }
        }
        
        // Sort clips by view count and remove empty groups
        Object.values(grouped).forEach(group => {
            group.clips.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        });
        
        Object.keys(grouped).forEach(vodId => {
            if (grouped[vodId].clips.length === 0) {
                delete grouped[vodId];
            }
        });
        
        res.json({ data: grouped });
        
    } catch (error) {
        console.error('Error fetching clips:', error);
        res.status(500).json({ error: 'Failed to fetch grouped clips' });
    }
});

// Get VODs for a user
router.get('/vods', validateToken, async function (req, res) {
    try {
        const accessToken = req.accessToken;
        const user_id = req.query.user_id;
        const started_at = req.query.started_at;
        const ended_at = req.query.ended_at;
        
        if (!user_id || !started_at || !ended_at) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const cacheKey = `vods_${user_id}_${started_at}_${ended_at}`;
        const url = `https://api.twitch.tv/helix/videos?user_id=${user_id}&type=archive&first=100`;
        
        const data = await makeTwitchRequest(url, accessToken, cacheKey);
        
        if (!data.data || !Array.isArray(data.data)) {
            return res.json({ data: [] });
        }
        
        // Filter VODs by date range
        const filtered = data.data.filter(vod => {
            const created = new Date(vod.created_at);
            return created >= new Date(started_at) && created < new Date(ended_at);
        });
        
        res.json({ data: filtered });
        
    } catch (error) {
        console.error('Error fetching VODs:', error);
        res.status(500).json({ error: 'Failed to fetch VODs' });
    }
});

// Get stream status for a broadcaster
router.get('/stream-status', validateToken, async function (req, res) {
    try {
        const accessToken = req.accessToken;
        const broadcaster_id = req.query.broadcaster_id;
        
        if (!broadcaster_id) {
            return res.status(400).json({ error: 'Missing broadcaster_id' });
        }
        
        const cacheKey = `stream_status_${broadcaster_id}`;
        const url = `https://api.twitch.tv/helix/streams?user_id=${broadcaster_id}`;
        
        const data = await makeTwitchRequest(url, accessToken, cacheKey);
        res.json({ live: data.data && data.data.length > 0, stream: data.data && data.data[0] });
        
    } catch (error) {
        console.error('Error fetching stream status:', error);
        res.json({ live: false });
    }
});

// Get streams for multiple users
router.get('/streams', validateToken, async function (req, res) {
    try {
        const accessToken = req.accessToken;
        const user_ids = req.query.user_id;
        
        if (!user_ids) {
            return res.status(400).json({ error: 'Missing user_id parameter' });
        }
        
        const cacheKey = `streams_${user_ids}`;
        const url = `https://api.twitch.tv/helix/streams?user_id=${user_ids}`;
        
        const data = await makeTwitchRequest(url, accessToken, cacheKey);
        res.json(data);
        
    } catch (error) {
        console.error('Error fetching streams:', error);
        res.json({ data: [] });
    }
});

// Get streamer info
router.get('/streamer-info', validateToken, async function (req, res) {
    try {
        const accessToken = req.accessToken;
        const broadcaster_id = req.query.broadcaster_id;
        
        if (!broadcaster_id) {
            return res.status(400).json({ error: 'Missing broadcaster_id' });
        }
        
        const cacheKey = `streamer_info_${broadcaster_id}`;
        const url = `https://api.twitch.tv/helix/users?id=${broadcaster_id}`;
        
        const data = await makeTwitchRequest(url, accessToken, cacheKey);
        res.json(data);
        
    } catch (error) {
        console.error('Error fetching streamer info:', error);
        res.status(500).json({ error: 'Failed to fetch streamer info' });
    }
});

// Get followers count for a user
router.get('/followers', validateToken, async function (req, res) {
    try {
        const accessToken = req.accessToken;
        const userId = req.user.id;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID not found' });
        }
        
        const cacheKey = `followers_${userId}`;
        const url = `https://api.twitch.tv/helix/users/follows?to_id=${userId}`;
        
        const data = await makeTwitchRequest(url, accessToken, cacheKey);
        res.json({ total: data.total });
        
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ error: 'Failed to fetch followers' });
    }
});

// Get following count for a user
router.get('/following', validateToken, async function (req, res) {
    try {
        const accessToken = req.accessToken;
        const userId = req.user.id;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID not found' });
        }
        
        const cacheKey = `following_${userId}`;
        const url = `https://api.twitch.tv/helix/users/follows?from_id=${userId}`;
        
        const data = await makeTwitchRequest(url, accessToken, cacheKey);
        res.json({ total: data.total });
        
    } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ error: 'Failed to fetch following' });
    }
});

export default router;
