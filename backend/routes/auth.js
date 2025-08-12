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
    console.log('Initial session ID:', req.sessionID);
    console.log('Initial session exists:', !!req.session);
    console.log('Initial session data:', req.session);
    console.log('Request headers:', req.headers);
    
    passport.authenticate('twitch', (err, user, info) => {
        if (err) {
            console.error('OAuth callback error:', err);
            return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed&reason=oauth_error');
        }
        
        if (!user) {
            console.error('No user returned from OAuth');
            return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed&reason=no_user');
        }
        
        console.log('OAuth user received:', user.id);
        console.log('User data:', user);
        
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error('Login error:', loginErr);
                return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed&reason=login_error');
            }
            
            console.log('User logged in successfully');
            console.log('Session after login:', req.session);
            console.log('Passport user after login:', req.user);
            
            // Multiple session saving attempts with fallbacks
            const saveSession = (attempt = 1) => {
                req.session.save((saveErr) => {
                    if (saveErr) {
                        console.error(`Session save attempt ${attempt} failed:`, saveErr);
                        
                        if (attempt < 3) {
                            console.log(`Retrying session save (attempt ${attempt + 1})...`);
                            setTimeout(() => saveSession(attempt + 1), 1000);
                            return;
                        }
                        
                        console.error('All session save attempts failed');
                        return res.redirect(process.env.FRONTEND_BASE_URL + '/?error=auth_failed&reason=session_save_failed');
                    }
                    
                    console.log(`Session saved successfully on attempt ${attempt}`);
                    console.log('User authenticated successfully:', user.id);
                    console.log('Final Session ID:', req.sessionID);
                    console.log('Final Session data:', req.session);
                    
                    // Set multiple cookie formats for maximum compatibility
                    const cookieOptions = {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                        path: '/',
                        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                    };
                    
                    // Set the session cookie
                    res.cookie('connect.sid', req.sessionID, cookieOptions);
                    
                    // Set additional headers for maximum compatibility
                    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Expires', '0');
                    res.setHeader('X-Auth-Status', 'success');
                    res.setHeader('X-User-ID', user.id);
                    
                    console.log('Cookie set, redirecting to dashboard...');
                    console.log('=== OAuth Callback Completed Successfully ===');
                    
                    // Redirect with success parameter
                    res.redirect(process.env.FRONTEND_BASE_URL + '/dashboard?auth=success');
                });
            };
            
            // Start session saving process
            saveSession();
        });
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    console.log('Logout requested');
    console.log('Session before logout:', req.session);
    
    req.logout(err => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).json({ error: 'Error during logout' });
        }
        
        req.session.destroy(() => {
            console.log('Session destroyed');
            
            // Clear all possible cookie formats
            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            });
            
            // Clear any other potential session cookies
            res.clearCookie('sessionId');
            res.clearCookie('auth');
            
            console.log('Cookies cleared, redirecting to home');
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
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
    });
});

export default router;
