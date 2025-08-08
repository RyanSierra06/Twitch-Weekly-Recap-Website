import express from 'express';
import passport from '../config/passport.js';

const router = express.Router();

router.get('/twitch', passport.authenticate('twitch', {
    scope: [
        'user:read:follows',
        'user:read:email',
        'user:read:subscriptions',
        'channel:read:subscriptions'
    ]
}));

router.get('/twitch/callback', (req, res, next) => {
    console.log('=== OAuth Callback Started ===');
    console.log('Request URL:', req.url);
    console.log('Request headers:', req.headers);
    console.log('Session before OAuth:', req.session);
    console.log('FRONTEND_BASE_URL:', process.env.FRONTEND_BASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    passport.authenticate('twitch', (err, user, info) => {
        console.log('=== OAuth Callback Debug ===');
        console.log('Error:', err);
        console.log('User:', user);
        console.log('Info:', info);
        console.log('Session after passport.authenticate:', req.session);
        
        if (err) {
            console.log('OAuth error, redirecting to home');
            console.error('OAuth Error Details:', err);
            return res.redirect(`${process.env.FRONTEND_BASE_URL}/`);
        }
        
        if (!user) {
            console.log('No user from OAuth, redirecting to home');
            return res.redirect(`${process.env.FRONTEND_BASE_URL}/`);
        }
        
        req.logIn(user, (err) => {
            if (err) {
                console.log('Login error:', err);
                console.error('Login Error Details:', err);
                return res.redirect(`${process.env.FRONTEND_BASE_URL}/`);
            }
            
            console.log('=== OAuth Success ===');
            console.log('Session after logIn:', req.session);
            console.log('User after logIn:', req.user);
            console.log('Passport user after logIn:', req.session?.passport?.user);
            console.log('Session ID:', req.sessionID);
            console.log('Redirecting to dashboard...');
            
            // Save session and redirect
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.redirect(`${process.env.FRONTEND_BASE_URL}/`);
                }
                
                console.log('Session saved successfully');
                console.log('Final Session ID:', req.sessionID);
                console.log('Final Session:', req.session);
                
                // Force session to be saved to store
                req.session.touch();
                
                // For production, ensure session cookie is properly set for cross-domain
                if (process.env.NODE_ENV === 'production') {
                    console.log('Production: Setting cross-domain session cookie');
                    console.log('Session ID for cookie:', req.sessionID);
                    console.log('Frontend URL:', process.env.FRONTEND_BASE_URL);
                    
                    // Ensure proper CORS headers for cross-domain cookies
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_BASE_URL);
                }
                
                res.redirect(`${process.env.FRONTEND_BASE_URL}/dashboard`);
            });
        });
    })(req, res, next);
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

export default router;
