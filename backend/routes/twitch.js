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

router.get('/clips', async function (req, res) {
    const user = getUserFromRequest(req);
    if (!user || !user.accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const accessToken = user.accessToken;
    const broadcaster_id = req.query.broadcaster_id;
    const started_at = req.query.started_at;
    const ended_at = req.query.ended_at;
    if (!broadcaster_id || !started_at || !ended_at) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    try {
        const vodsCacheKey = `vods_${broadcaster_id}_${started_at}_${ended_at}`;
        const vodsUrl = `https://api.twitch.tv/helix/videos?user_id=${broadcaster_id}&type=archive&first=100`;
        const vodsData = await makeTwitchRequest(vodsUrl, accessToken, vodsCacheKey);
        if (!vodsData.data || !Array.isArray(vodsData.data) || vodsData.data.length === 0) {
            return res.json({ data: {} });
        }
        const vods = vodsData.data.filter(vod => {
            const created = new Date(vod.created_at);
            return created >= new Date(started_at) && created < new Date(ended_at);
        });
        if (vods.length === 0) {
            return res.json({ data: {} });
        }
        const vodMap = {};
        vods.forEach(vod => {
            vodMap[vod.id] = vod;
        });
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

router.get('/vods', function (req, res) {
    const user = getUserFromRequest(req);
    if (!user || !user.accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const accessToken = user.accessToken;
    const user_id = req.query.user_id;
    const started_at = req.query.started_at;
    const ended_at = req.query.ended_at;
    if (!user_id || !started_at || !ended_at) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    const cacheKey = `vods_${user_id}_${started_at}_${ended_at}`;
    const url = `https://api.twitch.tv/helix/videos?user_id=${user_id}&type=archive&first=20`;
    makeTwitchRequest(url, accessToken, cacheKey)
        .then(data => {
            if (!data.data || !Array.isArray(data.data)) {
                return res.json({ data: [] });
            }
            const filtered = data.data.filter(vod => {
                const created = new Date(vod.created_at);
                return created >= new Date(started_at) && created < new Date(ended_at);
            });
            res.json({ data: filtered });
        })
        .catch(error => {
            console.error('Error fetching VODs:', error);
            res.status(500).json({ error: 'Failed to fetch VODs' });
    });
});

router.get('/stream-status', function (req, res) {
    const user = getUserFromRequest(req);
    if (!user || !user.accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const accessToken = user.accessToken;
    const broadcaster_id = req.query.broadcaster_id;
    if (!broadcaster_id) {
        return res.status(400).json({ error: 'Missing broadcaster_id' });
    }
    const cacheKey = `stream_status_${broadcaster_id}`;
    const url = `https://api.twitch.tv/helix/streams?user_id=${broadcaster_id}`;
    makeTwitchRequest(url, accessToken, cacheKey)
        .then(data => {
            res.json({ live: data.data && data.data.length > 0, stream: data.data && data.data[0] });
        })
        .catch(error => {
            console.error('Error fetching stream status:', error);
            res.json({ live: false });
        });
});

router.get('/streams', function (req, res) {
    const user = getUserFromRequest(req);
    if (!user || !user.accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const accessToken = user.accessToken;
    const user_ids = req.query.user_id;
    if (!user_ids) {
        return res.status(400).json({ error: 'Missing user_id parameter' });
    }
    const cacheKey = `streams_${user_ids}`;
    const url = `https://api.twitch.tv/helix/streams?user_id=${user_ids}`;
    makeTwitchRequest(url, accessToken, cacheKey)
        .then(data => {
            res.json(data);
        })
        .catch(error => {
            console.error('Error fetching streams:', error);
            res.json({ data: [] });
    });
});

router.get('/streamer-info', function (req, res) {
    const user = getUserFromRequest(req);
    if (!user || !user.accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const accessToken = user.accessToken;
    const broadcaster_id = req.query.broadcaster_id;
    if (!broadcaster_id) {
        return res.status(400).json({ error: 'Missing broadcaster_id' });
    }
    const cacheKey = `streamer_info_${broadcaster_id}`;
    const url = `https://api.twitch.tv/helix/users?id=${broadcaster_id}`;
    makeTwitchRequest(url, accessToken, cacheKey)
        .then(data => {
            res.json(data);
        })
        .catch(error => {
            console.error('Error fetching streamer info:', error);
            res.status(500).json({ error: 'Failed to fetch streamer info' });
    });
});

router.get('/followers', function (req, res) {
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
    const accessToken = user.accessToken;
    const cacheKey = `followers_${userId}`;
    const url = `https://api.twitch.tv/helix/users/follows?to_id=${userId}`;
    makeTwitchRequest(url, accessToken, cacheKey)
        .then(data => {
            res.json({ total: data.total });
        })
        .catch(error => {
            console.error('Error fetching followers:', error);
            res.status(500).json({ error: 'Failed to fetch followers' });
    });
});

router.get('/following', function (req, res) {
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
    const accessToken = user.accessToken;
    const cacheKey = `following_${userId}`;
    const url = `https://api.twitch.tv/helix/users/follows?from_id=${userId}`;
    makeTwitchRequest(url, accessToken, cacheKey)
        .then(data => {
            res.json({ total: data.total });
        })
        .catch(error => {
            console.error('Error fetching following:', error);
            res.status(500).json({ error: 'Failed to fetch following' });
    });
});

export default router;
