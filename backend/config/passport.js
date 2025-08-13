import passport from 'passport';
import { OAuth2Strategy } from 'passport-oauth';
import request from 'request';

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const CALLBACK_URL = process.env.TWITCH_CALLBACK_URL;

OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
    const options = {
        url: 'https://api.twitch.tv/helix/users',
        method: 'GET',
        headers: {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': 'Bearer ' + accessToken
        }
    };
    request(options, function (error, response, body) {
        if (error) {
            console.error('Error fetching user profile:', error);
            return done(error);
        }
        
        if (response && response.statusCode === 200) {
            try {
                const data = JSON.parse(body);
                // Extract the first user from the data array
                const user = data.data && data.data[0] ? data.data[0] : data;
                console.log('User profile fetched successfully:', user.id);
                done(null, user);
            } catch (parseError) {
                console.error('Error parsing user profile:', parseError);
                done(parseError);
            }
        } else {
            try {
                const errorData = JSON.parse(body);
                console.error('Twitch API error:', errorData);
                done(errorData);
            } catch (parseError) {
                console.error('Error parsing Twitch API error response:', parseError);
                done(new Error('Failed to parse Twitch API response'));
            }
        }
    });
};

passport.serializeUser(function(user, done) {
    console.log('Serializing user:', user.id);
    // Store the entire user object to ensure we have all necessary data
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    console.log('Deserializing user:', user.id);
    // The user object should already be complete from serialization
    if (user && user.id) {
        done(null, user);
    } else {
        console.error('Invalid user data during deserialization:', user);
        done(new Error('Invalid user data'));
    }
});

passport.use('twitch', new OAuth2Strategy({
    authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
    tokenURL: 'https://id.twitch.tv/oauth2/token',
    clientID: TWITCH_CLIENT_ID,
    clientSecret: TWITCH_SECRET,
    callbackURL: CALLBACK_URL,
    state: true
}, function(accessToken, refreshToken, profile, done) {
    console.log('OAuth callback received for user:', profile.id);
    
    // Ensure we have all necessary user data
    const userData = {
        ...profile,
        accessToken: accessToken,
        refreshToken: refreshToken,
        // Ensure we have the user ID in multiple formats for compatibility
        id: profile.id,
        user_id: profile.id,
        // Add timestamp for debugging
        authenticatedAt: new Date().toISOString()
    };
    
    console.log('User data prepared for authentication:', userData.id);
    done(null, userData);
}));

export default passport;

