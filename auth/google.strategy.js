// ./auth/google.strategy.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, PORT } from '../config.js';

const isDev = process.env.NODE_ENV === 'development';

const callbackURL = isDev
  ? `http://localhost:${PORT}/api/auth/google/callback`
  : `https://tusitio.com/api/auth/google/callback`;


passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0].value,
      };
      return done(null, user);
    }
  )
);

export default passport;
