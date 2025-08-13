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

router.get('/twitch/callback', passport.authenticate('twitch', {
    successRedirect: process.env.FRONTEND_BASE_URL + '/dashboard',
    failureRedirect: process.env.FRONTEND_BASE_URL + '/?error=auth_failed'
}));

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
