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
    console.log('=== TWITCH CALLBACK STARTED ===');
    console.log('Session ID before auth:', req.sessionID);
    console.log('Session before auth:', JSON.stringify(req.session, null, 2));
    
    passport.authenticate('twitch', (err, user, info) => {
        console.log('=== PASSPORT AUTHENTICATE CALLBACK ===');
        console.log('Error:', err);
        console.log('User:', user);
        console.log('Info:', info);
        
        if (err) {
            console.error('❌ Twitch authentication error:', err);
            return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed');
        }
        
        if (!user) {
            console.error('❌ No user returned from Twitch authentication');
            return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed');
        }
        
        console.log('✅ User received from Twitch:', user.id);
        
        req.logIn(user, (loginErr) => {
            console.log('=== LOGIN CALLBACK ===');
            console.log('Login error:', loginErr);
            console.log('Session after login:', JSON.stringify(req.session, null, 2));
            
            if (loginErr) {
                console.error('❌ Login error:', loginErr);
                return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed');
            }
            
            console.log('✅ Login successful, saving session...');
            
            // Ensure session is saved before redirecting
            req.session.save((saveErr) => {
                console.log('=== SESSION SAVE CALLBACK ===');
                console.log('Session save error:', saveErr);
                console.log('Final session data:', JSON.stringify(req.session, null, 2));
                
                if (saveErr) {
                    console.error('❌ Session save error:', saveErr);
                    return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed');
                }
                
                console.log('✅ Authentication successful for user:', user.id);
                console.log('✅ Session saved successfully');
                console.log('✅ Redirecting to dashboard...');
                res.redirect(process.env.FRONTEND_BASE_URL + '/dashboard');
            });
        });
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            console.error('Logout error:', err);
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
