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

export default router;
