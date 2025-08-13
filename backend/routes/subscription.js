import express from 'express';
import { makeTwitchRequest } from '../utils/twitchApi.js';

const router = express.Router();

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

router.get('/check-subscription', function (req, res) {
    const user = getUserFromRequest(req);
    if (!user?.accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    let userId = user.id
        ?? user.data?.[0]?.id
        ?? user.user_id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID not found in session' });
    }

    const broadcaster_id = req.query.broadcaster_id;
    if (!broadcaster_id) {
        return res.status(400).json({ error: 'Broadcaster ID is required' });
    }

    const accessToken = user.accessToken;
    const cacheKey = `subscription_${userId}_${broadcaster_id}`;
    const url = `https://api.twitch.tv/helix/subscriptions/user?user_id=${userId}&broadcaster_id=${broadcaster_id}`;

    makeTwitchRequest(url, accessToken, cacheKey)
        .then(data => {
            res.json({
                subscribed: !!(data.data && data.data.length > 0),
                subscription: data.data?.[0] || null
            });
        })
        .catch((error) => {
            console.error('Error checking subscription:', error);
            res.status(500).json({ error: 'Failed to check subscription' });
        });
});

router.get('/check-subscription-batch', async function (req, res) {
    const user = getUserFromRequest(req);
    if (!user?.accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    let userId = user.id
        ?? user.data?.[0]?.id
        ?? user.user_id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID not found in session' });
    }

    const broadcaster_ids = req.query.broadcaster_ids;
    if (!broadcaster_ids) {
        return res.status(400).json({ error: 'Missing broadcaster_ids parameter' });
    }

    const accessToken = user.accessToken;
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
});

router.get('/stream-status-batch', async function (req, res) {
    const user = getUserFromRequest(req);
    if (!user?.accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const accessToken = user.accessToken;
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
});

export default router;

