import express from 'express';
import passport from 'passport';
const router = express.Router();

// Middleware to check for session info in headers
const checkSessionHeader = (req, res, next) => {
  const sessionHeader = req.headers['x-session-info'];
  
  if (sessionHeader) {
    try {
      const sessionInfo = JSON.parse(sessionHeader);
      console.log('Found session info in header:', sessionInfo);
      
      // If we have session info but no session cookie, try to restore the session
      if (!req.session.passport && sessionInfo.sessionId) {
        console.log('Attempting to restore session from header info...');
        // Store the session info for later use
        req.sessionInfo = sessionInfo;
      }
    } catch (error) {
      console.error('Error parsing session header:', error);
    }
  }
  
  next();
};

// Auth status endpoint
router.get('/status', checkSessionHeader, (req, res) => {
  console.log('=== /auth/status endpoint called ===');
  console.log('Cookies:', req.headers.cookie);
  console.log('Session ID:', req.sessionID);
  console.log('Session passport exists:', !!req.session.passport);
  console.log('Passport user:', req.session.passport?.user);
  console.log('Session info from header:', req.sessionInfo);
  
  // Check if user is authenticated via session
  if (req.session.passport && req.session.passport.user) {
    console.log('User authenticated via session');
    res.json({
      authenticated: true,
      user: req.session.passport.user
    });
    return;
  }
  
  // Check if we have session info from header
  if (req.sessionInfo) {
    console.log('Attempting authentication via session header info...');
    
    // For now, we'll return a basic user object based on the session info
    const user = {
      id: req.sessionInfo.userId,
      // Add other user properties as needed
    };
    
    console.log('Returning user from session header:', user);
    res.json({
      authenticated: true,
      user: user
    });
    return;
  }
  
  console.log('No authentication found');
  res.json({
    authenticated: false,
    user: null
  });
});

// Twitch OAuth routes
router.get('/twitch', passport.authenticate('twitch', { scope: 'user:read:email' }));

router.get('/twitch/callback', (req, res, next) => {
  console.log('=== TWITCH CALLBACK START ===');
  
  passport.authenticate('twitch', { session: false }, (err, user, info) => {
    console.log('Passport authenticate callback - err:', err, 'user:', user ? 'exists' : 'null', 'info:', info);
    
    if (err) {
      console.error('Passport authentication error:', err);
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/login?error=auth_failed`);
    }
    
    if (!user) {
      console.error('No user returned from passport authentication');
      return res.redirect(`${process.env.FRONTEND_BASE_URL}/login?error=no_user`);
    }
    
    console.log('User authenticated successfully:', user.id);
    
    // Log in the user
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('Login error:', loginErr);
        return res.redirect(`${process.env.FRONTEND_BASE_URL}/login?error=login_failed`);
      }
      
      console.log('User logged in successfully');
      
      // Save session explicitly
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          return res.redirect(`${process.env.FRONTEND_BASE_URL}/login?error=session_failed`);
        }
        
        console.log('Session saved successfully');
        console.log('Session ID:', req.sessionID);
        console.log('Session passport user:', req.session.passport?.user);
        
        // Set a custom header with session info for cross-site requests
        const sessionInfo = {
          sessionId: req.sessionID,
          userId: user.id,
          timestamp: Date.now()
        };
        
        // Redirect with session info in URL params as fallback
        const redirectUrl = `${process.env.FRONTEND_BASE_URL}/dashboard?session=${encodeURIComponent(JSON.stringify(sessionInfo))}`;
        console.log('Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
      });
    });
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  console.log('Logout requested');
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error('Session destroy error:', destroyErr);
      }
      res.redirect(process.env.FRONTEND_BASE_URL);
    });
  });
});

export default router;
