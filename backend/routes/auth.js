import express from 'express';
import passport from '../config/passport.js';

const router = express.Router();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

router.get('/twitch', passport.authenticate('twitch', {
    scope: [
        'user:read:follows',
        'user:read:email',
        'user:read:subscriptions',
        'channel:read:subscriptions'
    ]
}));

router.get('/twitch/callback', passport.authenticate('twitch', {
    failureRedirect: `${FRONTEND_BASE_URL}/login-error`
}), (req, res) => {
    console.log('OAuth callback successful, user:', req.user);
    console.log('Session after OAuth:', req.session);
    
    // Ensure session is saved before redirect
    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.redirect(`${FRONTEND_BASE_URL}/login-error`);
        }
        
        console.log('Session saved successfully, redirecting to dashboard');
        console.log('Final session data:', req.session);
        
        // Set a custom header to indicate successful login
        res.setHeader('X-Auth-Status', 'success');
        
        // Successful authentication - redirect to frontend dashboard
        res.redirect(`${FRONTEND_BASE_URL}/dashboard`);
    });
});

router.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            return res.status(500).json({ error: 'Error during logout' });
        }
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.json({ message: 'Logged out successfully' });
        });
    });
});

// Test route to check session
router.get('/test-session', (req, res) => {
    res.json({
        sessionID: req.sessionID,
        session: req.session,
        passportUser: req.session?.passport?.user,
        isAuthenticated: req.isAuthenticated(),
        cookies: req.headers.cookie,
        userAgent: req.headers['user-agent']
    });
});

// Test route to check if user is authenticated
router.get('/check-auth', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: req.user,
            sessionID: req.sessionID
        });
    } else {
        res.json({
            authenticated: false,
            sessionID: req.sessionID,
            session: req.session
        });
    }
});

export default router;
