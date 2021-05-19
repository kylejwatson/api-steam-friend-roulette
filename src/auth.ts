
import passport from 'passport';
import session from 'express-session';
import { Strategy as SteamStrategy } from 'passport-steam';
import { Express } from 'express';

export const init = (app: Express) => {
    app.use(session({
        secret: process.env.SESSION_SECRET,
        name: 'steam-friend-roulette',
        resave: true,
        saveUninitialized: true
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function (user, done) {
        done(null, user);
    });
    passport.deserializeUser(function (obj, done) {
        done(null, obj);
    });
    passport.use(new SteamStrategy({
        returnURL: `${process.env.API_URL}/auth`,
        realm: process.env.API_URL,
        apiKey: process.env.STEAM_API_KEY,
        profile: false
    },
        (identifier, profile, done) => {
            return done(null, identifier);
        }
    ));

    app.get('/auth', passport.authenticate('steam'),
        (req: any, res) => {
            const id = req.user.split('/').pop();
            const url = `${process.env.UI_URL}/steam-id/?id=${id}`;
            res.redirect(url);
        });
}