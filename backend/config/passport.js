import passport from 'passport';
import { OAuth2Strategy } from 'passport-oauth';
import request from 'request';

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const CALLBACK_URL = process.env.TWITCH_CALLBACK_URL;

// Validate environment variables
if (!TWITCH_CLIENT_ID || !TWITCH_SECRET || !CALLBACK_URL) {
  throw new Error('Missing required Twitch OAuth environment variables');
}

OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
    console.log('Fetching user profile from Twitch API...');
    
    const options = {
        url: 'https://api.twitch.tv/helix/users',
        method: 'GET',
        headers: {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': 'Bearer ' + accessToken
        },
        timeout: 10000 // 10 second timeout
    };
    
    request(options, function (error, response, body) {
        if (error) {
            console.error('Request error in userProfile:', error);
            return done(error);
        }
        
        if (!response) {
            console.error('No response received from Twitch API');
            return done(new Error('No response from Twitch API'));
        }
        
        console.log('Twitch API response status:', response.statusCode);
        
        if (response.statusCode === 200) {
            try {
                const data = JSON.parse(body);
                console.log('Twitch API response data:', data);
                
                // Extract the first user from the data array
                const user = data.data && data.data[0] ? data.data[0] : data;
                
                if (!user || !user.id) {
                    console.error('Invalid user data received:', user);
                    return done(new Error('Invalid user data from Twitch API'));
                }
                
                console.log('User profile extracted successfully:', user.id);
                done(null, user);
            } catch (parseError) {
                console.error('Error parsing Twitch API response:', parseError);
                done(parseError);
            }
        } else {
            console.error('Twitch API error response:', response.statusCode, body);
            try {
                const errorData = JSON.parse(body);
                done(errorData);
            } catch (parseError) {
                done(new Error(`Twitch API error: ${response.statusCode}`));
            }
        }
    });
};

passport.serializeUser(function(user, done) {
    try {
        console.log('Serializing user:', user.id);
        done(null, user);
    } catch (error) {
        console.error('Error serializing user:', error);
        done(error);
    }
});

passport.deserializeUser(function(user, done) {
    try {
        console.log('Deserializing user:', user.id);
        done(null, user);
    } catch (error) {
        console.error('Error deserializing user:', error);
        done(error);
    }
});

passport.use('twitch', new OAuth2Strategy({
    authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
    tokenURL: 'https://id.twitch.tv/oauth2/token',
    clientID: TWITCH_CLIENT_ID,
    clientSecret: TWITCH_SECRET,
    callbackURL: CALLBACK_URL,
    state: true,
    scope: [
        'user:read:follows',
        'user:read:email',
        'user:read:subscriptions',
        'channel:read:subscriptions'
    ]
}, function(accessToken, refreshToken, profile, done) {
    try {
        console.log('OAuth callback received for user:', profile.id);
        console.log('Access token received:', !!accessToken);
        console.log('Refresh token received:', !!refreshToken);
        
        // Validate required data
        if (!accessToken) {
            console.error('No access token received');
            return done(new Error('No access token received from Twitch'));
        }
        
        if (!profile || !profile.id) {
            console.error('Invalid profile received:', profile);
            return done(new Error('Invalid profile received from Twitch'));
        }
        
        // Add tokens to profile
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;
        
        console.log('Profile prepared successfully for user:', profile.id);
        done(null, profile);
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        done(error);
    }
}));

export default passport;

