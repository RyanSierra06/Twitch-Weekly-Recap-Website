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
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Authorization': 'Bearer ' + accessToken
        }
    };
    request(options, function (error, response, body) {
        if (response && response.statusCode === 200) {
            const userData = JSON.parse(body);
            // Ensure we have the user data in the expected format
            if (userData.data && userData.data.length > 0) {
                const user = userData.data[0];
                done(null, user);
            } else {
                done(new Error('No user data received from Twitch'));
            }
        } else {
            done(new Error('Failed to fetch user profile from Twitch'));
        }
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
    done(null, userProfile);
}));

export default passport;

