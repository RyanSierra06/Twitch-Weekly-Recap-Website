import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from './config/session.js';
import passport from './config/passport.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import twitchRoutes from './routes/twitch.js';
import subscriptionRoutes from './routes/subscription.js';

const app = express();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

app.use(session);
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors({
    origin: FRONTEND_BASE_URL,
    credentials: true
}));

app.use('/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', twitchRoutes);
app.use('/api', subscriptionRoutes);

// app.get('/', function (req, res) {
//     if (req.session?.passport?.user) {
//         res.redirect(`${FRONTEND_BASE_URL}/dashboard`);
//     } else {
//         res.redirect(FRONTEND_BASE_URL);
//     }
// });

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
