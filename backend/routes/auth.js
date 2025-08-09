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

router.get('/twitch/callback', (req, res, next) => {
    passport.authenticate('twitch', { session: false }, (err, user, info) => {
        if (err) {
            console.error('Passport authentication error:', err);
            return res.redirect(`${FRONTEND_BASE_URL}/login-error?error=auth_failed`);
        }
        
        if (!user) {
            console.error('No user returned from Twitch OAuth');
            return res.redirect(`${FRONTEND_BASE_URL}/login-error?error=no_user`);
        }
        
        // Manually log in the user
        req.login(user, (loginErr) => {
            if (loginErr) {
                console.error('Login error:', loginErr);
                return res.redirect(`${FRONTEND_BASE_URL}/login-error?error=login_failed`);
            }
            
            console.log('User logged in successfully:', user);
            console.log('Session after login:', req.session);
            
            // Save session explicitly
            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error('Session save error:', saveErr);
                    return res.redirect(`${FRONTEND_BASE_URL}/login-error?error=session_save_failed`);
                }
                
                console.log('Session saved successfully');
                console.log('Final session data:', req.session);
                console.log('Session ID:', req.sessionID);
                
                // Set a success cookie for the frontend
                res.cookie('auth_success', 'true', {
                    maxAge: 60000, // 1 minute
                    httpOnly: false,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    domain: process.env.NODE_ENV === 'production' ? undefined : undefined
                });
                
                // Redirect to frontend dashboard
                res.redirect(`${FRONTEND_BASE_URL}/dashboard?auth=success&session=${req.sessionID}`);
            });
        });
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Error during logout' });
        }
        
        req.session.destroy((destroyErr) => {
            if (destroyErr) {
                console.error('Session destroy error:', destroyErr);
            }
            
            res.clearCookie('connect.sid');
            res.clearCookie('auth_success');
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
