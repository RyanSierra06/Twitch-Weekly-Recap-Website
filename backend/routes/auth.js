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
    passport.authenticate('twitch', (err, user, info) => {
        if (err) {
            console.error('OAuth callback error:', err);
            return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed');
        }
        
        if (!user) {
            console.error('No user returned from OAuth');
            return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed');
        }
        
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error('Login error:', loginErr);
                return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed');
            }
            
            // Explicitly save the session after login
            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error('Session save error:', saveErr);
                    return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed');
                }
                
                console.log('User authenticated successfully:', user.id);
                console.log('Session saved, redirecting to dashboard');
                console.log('Session ID:', req.sessionID);
                console.log('Session data:', req.session);
                
                // Set additional headers to ensure cookie is sent
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                
                // Force cookie to be set
                res.cookie('connect.sid', req.sessionID, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    path: '/',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });
                
                res.redirect(process.env.FRONTEND_BASE_URL + '/dashboard');
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
            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            });
            res.redirect(process.env.FRONTEND_BASE_URL);
        });
    });
});

router.get('/debug', (req, res) => {
    console.log('Debug endpoint called');
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('Session data:', req.session);
    console.log('Passport user:', req.user);
    console.log('Cookies:', req.headers.cookie);
    console.log('Headers:', req.headers);
    
    res.json({
        sessionId: req.sessionID,
        sessionExists: !!req.session,
        sessionData: req.session,
        passportUser: req.user,
        cookies: req.headers.cookie,
        userAgent: req.headers['user-agent']
    });
});

export default router;
