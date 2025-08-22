import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

router.get('/twitch', (req, res) => {
    const state = Math.random().toString(36).substring(7);
    const scope = 'user:read:follows user:read:email user:read:subscriptions channel:read:subscriptions';
    
    const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
        `client_id=${TWITCH_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(process.env.TWITCH_CALLBACK_URL)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${state}`;
    
    console.log('Redirecting to Twitch OAuth:', authUrl);
    res.redirect(authUrl);
});

router.get('/twitch/callback', async (req, res) => {
    const { code, state, error } = req.query;
    
    if (error) {
        console.error('OAuth error:', error);
        return res.redirect(`${FRONTEND_BASE_URL}/?error=auth_failed`);
    }
    
    if (!code) {
        console.error('No authorization code received');
        return res.redirect(`${FRONTEND_BASE_URL}/?error=auth_failed`);
    }
    
    try {
        console.log('Exchanging authorization code for access token...');

        const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.TWITCH_CALLBACK_URL
            })
        });
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange failed:', tokenResponse.status, errorText);
            return res.redirect(`${FRONTEND_BASE_URL}/?error=token_exchange_failed`);
        }
        
        const tokenData = await tokenResponse.json();
        const { access_token, refresh_token } = tokenData;
        
        console.log('Access token received, fetching user data...');

        const userResponse = await fetch('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${access_token}`
            }
        });
        
        if (!userResponse.ok) {
            console.error('Failed to fetch user data:', userResponse.status);
            return res.redirect(`${FRONTEND_BASE_URL}/?error=user_fetch_failed`);
        }
        
        const userData = await userResponse.json();
        const user = userData.data && userData.data[0] ? userData.data[0] : null;
        
        if (!user) {
            console.error('No user data returned from Twitch API');
            return res.redirect(`${FRONTEND_BASE_URL}/?error=no_user_data`);
        }
        
        console.log('User authenticated successfully:', user.id, user.display_name);

        const redirectUrl = `${FRONTEND_BASE_URL}/dashboard?token=${encodeURIComponent(access_token)}&refresh_token=${encodeURIComponent(refresh_token)}`;
        res.redirect(redirectUrl);
        
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${FRONTEND_BASE_URL}/?error=auth_failed`);
    }
});

router.get('/validate-token', async (req, res) => {
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
        
        res.json({ 
            valid: true, 
            user: user 
        });
        
    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({ error: 'Token validation failed' });
    }
});

router.post('/refresh-token', async (req, res) => {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
        return res.status(400).json({ error: 'No refresh token provided' });
    }
    
    try {
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token refresh failed:', response.status, errorText);
            return res.status(401).json({ error: 'Token refresh failed' });
        }
        
        const tokenData = await response.json();
        res.json(tokenData);
        
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

router.get('/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
});

export default router;
