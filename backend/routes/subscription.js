import express from 'express';
import fetch from 'node-fetch';
import { makeTwitchRequest } from '../utils/twitchApi.js';

const router = express.Router();

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;

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

        req.user = user;
        req.accessToken = accessToken;
        next();
        
    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({ error: 'Token validation failed' });
    }
};

router.get('/check-subscription', validateToken, async function (req, res) {
    try {
        const accessToken = req.accessToken;
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({ error: 'User ID not found' });
        }

        const broadcaster_id = req.query.broadcaster_id;
        if (!broadcaster_id) {
            return res.status(400).json({ error: 'Broadcaster ID is required' });
        }

        const cacheKey = `subscription_${userId}_${broadcaster_id}`;
        const url = `https://api.twitch.tv/helix/subscriptions/user?user_id=${userId}&broadcaster_id=${broadcaster_id}`;

        const data = await makeTwitchRequest(url, accessToken, cacheKey);
        res.json({
            subscribed: !!(data.data && data.data.length > 0),
            subscription: data.data?.[0] || null
        });
        
    } catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({ error: 'Failed to check subscription' });
    }
});

router.get('/check-subscription-batch', validateToken, async function (req, res) {
    try {
        const accessToken = req.accessToken;
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({ error: 'User ID not found' });
        }

        const broadcaster_ids = req.query.broadcaster_ids;
        if (!broadcaster_ids) {
            return res.status(400).json({ error: 'Missing broadcaster_ids parameter' });
        }

        const ids = broadcaster_ids.split(',');
        const result = {};

        await Promise.all(ids.map(async (broadcaster_id) => {
            const cacheKey = `subscription_${userId}_${broadcaster_id}`;
            const url = `https://api.twitch.tv/helix/subscriptions/user?user_id=${userId}&broadcaster_id=${broadcaster_id}`;
            try {
                const data = await makeTwitchRequest(url, accessToken, cacheKey);
                result[broadcaster_id] = data.data?.[0] || null;
            } catch (error) {
                console.error(`Error checking subscription for ${broadcaster_id}:`, error);
                result[broadcaster_id] = null;
            }
        }));

        res.json(result);
        
    } catch (error) {
        console.error('Error checking batch subscriptions:', error);
        res.status(500).json({ error: 'Failed to check batch subscriptions' });
    }
});

router.get('/stream-status-batch', validateToken, async function (req, res) {
    try {
        const accessToken = req.accessToken;
        const broadcaster_ids = req.query.broadcaster_ids;
        
        if (!broadcaster_ids) {
            return res.status(400).json({ error: 'Missing broadcaster_ids parameter' });
        }

        const ids = broadcaster_ids.split(',');
        const batches = [];
        for (let i = 0; i < ids.length; i += 100) {
            batches.push(ids.slice(i, i + 100));
        }

        const liveStatus = {};
        await Promise.all(batches.map(async (batch) => {
            const userIdsParam = batch.map(id => `user_id=${id}`).join('&');
            const url = `https://api.twitch.tv/helix/streams?${userIdsParam}`;
            const cacheKey = `streams_${userIdsParam}`;
            try {
                const data = await makeTwitchRequest(url, accessToken, cacheKey);
                data.data?.forEach(stream => {
                    liveStatus[stream.user_id] = true;
                });
            } catch (error) {
                console.error('Error fetching batch stream status:', error);
                // silent fail
            }
        }));

        ids.forEach(id => {
            if (!(id in liveStatus)) {
                liveStatus[id] = false;
            }
        });

        res.json(liveStatus);
        
    } catch (error) {
        console.error('Error fetching batch stream status:', error);
        res.status(500).json({ error: 'Failed to fetch batch stream status' });
    }
});

export default router;

