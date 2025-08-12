import passport from 'passport';
import { OAuth2Strategy } from 'passport-oauth';

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const CALLBACK_URL = process.env.TWITCH_CALLBACK_URL;

console.log('Passport config - Client ID:', TWITCH_CLIENT_ID ? 'Set' : 'Not set');
console.log('Passport config - Secret:', TWITCH_SECRET ? 'Set' : 'Not set');
console.log('Passport config - Callback URL:', CALLBACK_URL);

OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
    console.log('Fetching user profile with access token:', accessToken ? 'Present' : 'Missing');
    
    const options = {
        method: 'GET',
        headers: {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': 'Bearer ' + accessToken
        }
    };
    
    console.log('Making request to Twitch API with headers:', {
        'Client-ID': TWITCH_CLIENT_ID ? 'Set' : 'Not set',
        'Authorization': accessToken ? 'Bearer token present' : 'No token'
    });
    
    fetch('https://api.twitch.tv/helix/users', options)
        .then(response => {
            console.log('Twitch API response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Twitch API response data:', data);
            // Extract the first user from the data array
            const user = data.data && data.data[0] ? data.data[0] : data;
            console.log('Extracted user profile:', user);
            done(null, user);
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
            done(error);
        });
};

passport.serializeUser(function(user, done) {
    console.log('Serializing user:', user ? user.id : 'null');
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    console.log('Deserializing user:', user ? user.id : 'null');
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
    console.log('OAuth callback received:');
    console.log('- Access token:', accessToken ? 'Present' : 'Missing');
    console.log('- Refresh token:', refreshToken ? 'Present' : 'Missing');
    console.log('- Profile:', profile);
    
    try {
        // Ensure profile has the required fields
        if (!profile || !profile.id) {
            console.error('Invalid profile data received from Twitch:', profile);
            return done(new Error('Invalid profile data received from Twitch'));
        }
        
        // Add tokens to profile
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;
        
        console.log('Twitch authentication successful for user:', profile.id);
        console.log('Final profile data:', {
            id: profile.id,
            login: profile.login,
            display_name: profile.display_name,
            email: profile.email,
            accessToken: accessToken ? 'Present' : 'Missing'
        });
        
        done(null, profile);
    } catch (error) {
        console.error('Error in Twitch strategy:', error);
        done(error);
    }
}));

export default passport;

