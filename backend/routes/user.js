import express from 'express';
import { makeTwitchRequest, batchGetUserInfo, batchGetStreamStatus } from '../utils/twitchApi.js';

const router = express.Router();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

// Middleware to check for session info in headers
const checkSessionHeader = (req, res, next) => {
  const sessionHeader = req.headers['x-session-info'];
  
  if (sessionHeader) {
    try {
      const sessionInfo = JSON.parse(sessionHeader);
      console.log('Found session info in header:', sessionInfo);
      
      // If we have session info but no session cookie, try to restore the session
      if (!req.session.passport && sessionInfo.sessionId) {
        console.log('Attempting to restore session from header info...');
        // Store the session info for later use
        req.sessionInfo = sessionInfo;
      }
    } catch (error) {
      console.error('Error parsing session header:', error);
    }
  }
  
  next();
};

// Get current user
router.get('/user', checkSessionHeader, (req, res) => {
  console.log('=== /api/user endpoint called ===');
  console.log('Cookies:', req.headers.cookie);
  console.log('Session ID:', req.sessionID);
  console.log('Session passport exists:', !!req.session.passport);
  console.log('Passport user:', req.session.passport?.user);
  console.log('Session info from header:', req.sessionInfo);
  
  // Check if user is authenticated via session
  if (req.session.passport && req.session.passport.user) {
    console.log('User authenticated via session');
    res.json(req.session.passport.user);
    return;
  }
  
  // Check if we have session info from header
  if (req.sessionInfo) {
    console.log('Attempting authentication via session header info...');
    
    // For now, we'll return a basic user object based on the session info
    // In a real implementation, you'd want to validate this against your session store
    const user = {
      id: req.sessionInfo.userId,
      // Add other user properties as needed
    };
    
    console.log('Returning user from session header:', user);
    res.json(user);
    return;
  }
  
  console.log('No authentication found');
  res.status(401).json({ error: 'Not authenticated' });
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
