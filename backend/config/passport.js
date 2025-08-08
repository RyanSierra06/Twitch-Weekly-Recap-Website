import passport from 'passport';
import { OAuth2Strategy } from 'passport-oauth';
import request from 'request';

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const CALLBACK_URL = process.env.TWITCH_CALLBACK_URL;

OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
    console.log('=== Twitch User Profile Request ===');
    console.log('Access Token:', accessToken ? 'Present' : 'Missing');
    console.log('Client ID:', TWITCH_CLIENT_ID);
    
    const options = {
        url: 'https://api.twitch.tv/helix/users',
        method: 'GET',
        headers: {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': 'Bearer ' + accessToken
        }
    };
    request(options, function (error, response, body) {
        console.log('Twitch API Response Status:', response?.statusCode);
        console.log('Twitch API Response Body:', body);
        
        if (response && response.statusCode === 200) {
            const userData = JSON.parse(body);
            console.log('User data parsed successfully:', userData);
            done(null, userData);
        } else {
            console.log('Twitch API error:', error || response?.statusCode);
            done(JSON.parse(body));
        }
    });
};

passport.serializeUser(function(user, done) {
    console.log('=== Serialize User ===');
    console.log('User to serialize:', user);
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    console.log('=== Deserialize User ===');
    console.log('User to deserialize:', user);
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
    console.log('=== OAuth Strategy Callback ===');
    console.log('Access Token:', accessToken ? 'Present' : 'Missing');
    console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');
    console.log('Profile:', profile);
    
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    console.log('Final profile with tokens:', profile);
    done(null, profile);
}));

export default passport;



