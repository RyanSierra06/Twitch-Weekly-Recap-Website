import passport from 'passport';
import { OAuth2Strategy } from 'passport-oauth';

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const CALLBACK_URL = process.env.TWITCH_CALLBACK_URL;

// Override the userProfile method to use modern fetch
OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
    fetch('https://api.twitch.tv/helix/users', {
        method: 'GET',
        headers: {
            'Client-ID': TWITCH_CLIENT_ID,
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(userData => {
        if (userData.data && userData.data.length > 0) {
            const user = userData.data[0];
            done(null, user);
        } else {
            done(new Error('No user data received from Twitch'));
        }
    })
    .catch(error => {
        console.error('Error fetching Twitch user profile:', error);
        done(error);
    });
};

// Serialize user to session
passport.serializeUser(function(user, done) {
    console.log('Serializing user:', user);
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser(function(user, done) {
    console.log('Deserializing user:', user);
    done(null, user);
});

// Twitch OAuth strategy
passport.use('twitch', new OAuth2Strategy({
    authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
    tokenURL: 'https://id.twitch.tv/oauth2/token',
    clientID: TWITCH_CLIENT_ID,
    clientSecret: TWITCH_SECRET,
    callbackURL: CALLBACK_URL,
    state: true
}, function(accessToken, refreshToken, profile, done) {
    console.log('OAuth callback received profile:', profile);
    
    // Ensure the profile has all necessary fields
    const userProfile = {
        id: profile.id,
        login: profile.login,
        display_name: profile.display_name,
        email: profile.email,
        profile_image_url: profile.profile_image_url,
        accessToken: accessToken,
        refreshToken: refreshToken,
        created_at: profile.created_at
    };
    
    console.log('Created user profile:', userProfile);
    done(null, userProfile);
}));

export default passport;

