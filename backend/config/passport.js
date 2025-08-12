import passport from 'passport';
import { OAuth2Strategy } from 'passport-oauth';

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const CALLBACK_URL = process.env.TWITCH_CALLBACK_URL;

OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
    const options = {
        method: 'GET',
        headers: {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': 'Bearer ' + accessToken
        }
    };
    
    fetch('https://api.twitch.tv/helix/users', options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Extract the first user from the data array
            const user = data.data && data.data[0] ? data.data[0] : data;
            done(null, user);
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
            done(error);
        });
};

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use('twitch', new OAuth2Strategy({
    authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
    tokenURL: 'https://id.twitch.tv/oauth2/token',
    clientID: TWITCH_CLIENT_ID,
    clientSecret: TWITCH_SECRET,
    callbackURL: CALLBACK_URL,
    state: true
}, function(accessToken, refreshToken, profile, done) {
    try {
        // Ensure profile has the required fields
        if (!profile || !profile.id) {
            return done(new Error('Invalid profile data received from Twitch'));
        }
        
        // Add tokens to profile
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;
        
        console.log('Twitch authentication successful for user:', profile.id);
        done(null, profile);
    } catch (error) {
        console.error('Error in Twitch strategy:', error);
        done(error);
    }
}));

export default passport;

