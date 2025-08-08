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
        console.log('=== OAuth Callback Debug ===');
        console.log('Error:', err);
        console.log('User:', user);
        console.log('Info:', info);
        
        if (err) {
            console.log('OAuth error, redirecting to home');
            return res.redirect(`${process.env.FRONTEND_BASE_URL}/`);
        }
        
        if (!user) {
            console.log('No user from OAuth, redirecting to home');
            return res.redirect(`${process.env.FRONTEND_BASE_URL}/`);
        }
        
        req.logIn(user, (err) => {
            if (err) {
                console.log('Login error:', err);
                return res.redirect(`${process.env.FRONTEND_BASE_URL}/`);
            }
            
            console.log('=== OAuth Success ===');
            console.log('Session:', req.session);
            console.log('User:', req.user);
            console.log('Passport user:', req.session?.passport?.user);
            console.log('Redirecting to dashboard...');
            
            res.redirect(`${process.env.FRONTEND_BASE_URL}/dashboard`);
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
