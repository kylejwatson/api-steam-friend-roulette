import { Express } from 'express';
import steamWeb from 'steam-web';
import { OwnedGameResponse, AppResponse } from './types';
import { steamPromise, populateUserStats, getPromise } from './utils';
import flatCache from 'flat-cache';

const steamAppUrl = 'https://store.steampowered.com/api/appdetails';

const makeAppUrl = (appIds: string) => {
    return `${steamAppUrl}/?appids=${appIds}`;
};

export const initAppEndpoints = (app: Express, steam: steamWeb) => {
    const cache = flatCache.load('appCache', process.env.CACHE_DIR);

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
            res.status(error.status).send(error);
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
                const userStatResponses = populateUserStats(games, ids);
                res.send(userStatResponses);
            }
        } catch (error) {
            res.status(error.status).send(error);
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
            res.status(error.status).send(error);
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
        const promises = ids.map(id => {
            return new Promise<any>((resolve) => {
                const cacheResult = cache.getKey(id);
                if (cacheResult) {
                    cacheResult.fromCache = true;
                    return resolve(cacheResult);
                } else {
                    getApps(id).then((appResponse: AppResponse) => {
                        const data = appResponse[id].data;
                        if (data) {
                            data.fromCache = false;
                            cache.setKey(id, data);
                            return resolve(data);
                        }
                        resolve(404);
                    }).catch(err => {
                        if (typeof err === 'string') {
                            err = { error: err };
                        }
                        cache.setKey(id, err);
                        resolve(err);
                    });
                }

            });
        });

        try {
            const appResponse: any[] = await Promise.all(promises);
            res.send(appResponse);
            if (appResponse.some(data => !data.fromCache)) {
                cache.save();
            }
        } catch (error) {
            if (typeof error === 'number') {
                res.sendStatus(error);
            } else {
                res.status(500).send(error);
            }
        }
    });
};
