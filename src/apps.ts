import { Express } from 'express';
import steamWeb from 'steam-web';
import { OwnedGameResponse, AppResponse } from './types';
import { steamPromise, filterShared, getPromise } from './utils';

const steamAppUrl = 'https://store.steampowered.com/api/appdetails';

const makeAppUrl = (appIds: string) => {
    return `${steamAppUrl}/?appids=${appIds}`;
};

export const initAppEndpoints = (app: Express, steam: steamWeb) => {
    const getOwned = (steamid: string): Promise<OwnedGameResponse> => {
        return steamPromise(steam, 'getOwnedGames', { steamid, include_appinfo: true });
    };

    app.get('/owned', async (req, res): Promise<void> => {
        const steamId = req.query.steamid as string;
        if (!steamId) {
            res.status(400).send('Bad Request: Please provide steamid in the query');
            return;
        }
        try {
            const ownedResponse = await getOwned(steamId);
            const games = ownedResponse.response?.games;
            if (!games) {
                res.sendStatus(404);
            } else {
                res.send(games);
            }
        } catch (error) {
            res.status(500).send(error);
        }
    });

    app.get('/shared', async (req, res): Promise<void> => {
        const steamIds = req.query.steamids as string;
        if (!steamIds) {
            res.status(400).send('Bad Request: Please provide steamids in the query');
            return;
        }
        try {
            const ids = steamIds.split(',');
            const ownedResponse = await Promise.all(ids.map(id => {
                return getOwned(id);
            }));
            const games = ownedResponse.map(owned => owned.response?.games || []);
            if (games.every(gameList => gameList.length === 0)) {
                res.sendStatus(404);
            } else {
                const shared = filterShared(games, ids);
                res.send(shared);
            }
        } catch (error) {
            res.status(500).send(error);
        }
    });

    app.get('/recent', async (req, res): Promise<void> => {
        const steamId = req.query.steamid as string;
        if (!steamId) {
            res.status(400).send('Bad Request: Please provide steamid in the query');
            return;
        }
        try {
            const appResponse = await steamPromise(steam, 'getRecentlyPlayedGames', { steamid: steamId });
            res.send(appResponse);
        } catch (error) {
            res.status(500).send(error);
        }
    });

    const getApps = (appIds: string) => getPromise(makeAppUrl(appIds));
    app.get('/app', async (req, res): Promise<void> => {
        const appIds = req.query.appids as string;
        if (!appIds) {
            res.status(400).send('Bad Request: Please provide appids in the query');
            return;
        }
        const ids = appIds.split(',');
        try {
            const appResponse: AppResponse = await getApps(appIds);
            const data = appResponse[appIds].data;
            if (data) {
                res.send(data);
            } else {
                res.sendStatus(404);
            }
        } catch (error) {
            res.status(500).send(error);
        }
    });
};
