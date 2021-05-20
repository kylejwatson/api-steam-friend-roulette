
import passport from 'passport';
import session from 'express-session';
import { Strategy as SteamStrategy } from 'passport-steam';
import { Express } from 'express';
import cors from 'cors';

export const initAuth = (app: Express) => {
    app.use(cors({
        origin: process.env.UI_URL,
        methods: 'GET'
    }));

    app.use(session({
        secret: process.env.SESSION_SECRET || 'set-to-real-secret-in-dot-env-file',
        name: 'steam-friend-roulette',
        resave: true,
        saveUninitialized: true
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => {
        done(null, user);
    });
    passport.deserializeUser((obj: Express.User, done) => {
        done(null, obj);
    });

    passport.use(new SteamStrategy({
        returnURL: `${process.env.API_URL}/auth`,
        realm: process.env.API_URL,
        apiKey: process.env.STEAM_API_KEY,
        profile: false
    },
        (identifier: string, profile: Express.User, done: (flag: any, param: string) => void) => {
            return done(null, identifier);
        }
    ));

    app.get('/auth', passport.authenticate('steam'),
        (req: any, res) => {
            const id = req.user.split('/').pop();
            const url = `${process.env.UI_URL}/steam-id?id=${id}`;
            res.redirect(url);
        });
};
