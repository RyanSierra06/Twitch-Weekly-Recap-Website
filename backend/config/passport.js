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
            return done(error);
        }
        
        if (response && response.statusCode === 200) {
            try {
                const data = JSON.parse(body);
                // Extract the first user from the data array
                const user = data.data && data.data[0] ? data.data[0] : data;
                done(null, user);
            } catch (parseError) {
                done(parseError);
            }
        } else {
            try {
                const errorData = JSON.parse(body);
                done(errorData);
            } catch (parseError) {
                done(new Error('Failed to parse Twitch API response'));
            }
        }
    });
};

passport.serializeUser(function(user, done) {
    console.log('Serializing user:', user.id);
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    console.log('Deserializing user:', user.id);
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
    console.log('OAuth callback received for user:', profile.id);
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    done(null, profile);
}));

export default passport;

