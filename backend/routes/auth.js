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
        
        console.log('OAuth successful, user:', user.id);
        
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error('Login error:', loginErr);
                return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed');
            }
            
            console.log('User logged in successfully, saving session...');
            
            // Store user data in session as backup
            req.session.user = user;
            
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
                
                // Force cookie to be set with more explicit options
                res.cookie('connect.sid', req.sessionID, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    path: '/',
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                    domain: undefined // Let browser set domain automatically
                });
                
                // Add a small delay to ensure session is fully saved
                setTimeout(() => {
                    res.redirect(process.env.FRONTEND_BASE_URL + '/dashboard');
                }, 100);
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
    console.log('=== Debug endpoint called ===');
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
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
    });
});

// New endpoint to help recover sessions
router.get('/recover-session', (req, res) => {
    console.log('=== Session recovery endpoint called ===');
    
    // Check if we have any user data in the session
    const user = req.user || req.session?.passport?.user || req.session?.user;
    
    if (user) {
        console.log('Found user data, attempting to restore session...');
        
        // Ensure user data is properly stored in all locations
        req.session.user = user;
        if (!req.session.passport) {
            req.session.passport = {};
        }
        req.session.passport.user = user;
        
        req.session.save((err) => {
            if (err) {
                console.error('Error saving recovered session:', err);
                return res.status(500).json({ error: 'Failed to recover session' });
            }
            
            console.log('Session recovered successfully');
            res.json({
                success: true,
                user: user,
                sessionId: req.sessionID,
                message: 'Session recovered successfully'
            });
        });
    } else {
        console.log('No user data found to recover');
        res.status(404).json({
            success: false,
            message: 'No user data found to recover',
            sessionId: req.sessionID,
            sessionExists: !!req.session
        });
    }
});

// New endpoint to check session health
router.get('/session-health', (req, res) => {
    console.log('=== Session health check ===');
    
    const health = {
        sessionId: req.sessionID,
        sessionExists: !!req.session,
        hasPassportUser: !!(req.user || (req.session?.passport?.user)),
        hasSessionUser: !!req.session?.user,
        cookies: req.headers.cookie ? 'present' : 'missing',
        timestamp: new Date().toISOString()
    };
    
    console.log('Session health:', health);
    res.json(health);
});

export default router;
