import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { FriendResponse, SummaryResponse, OwnedGameResponse, AppResponse } from './types';
import { getPromise, filterShared } from './utils';
import { init } from './auth';

config();

const app = express();
app.use(cors({
    origin: process.env.UI_URL,
    methods: 'GET'
}));
const port = process.env.PORT;
init(app);

const steamFriendUrl = 'https://api.steampowered.com/ISteamUser';
const steamPlayerUrl = 'https://api.steampowered.com/IPlayerService';
const steamAppUrl = 'https://store.steampowered.com/api/appdetails';

const makeFriendsUrl = (steamId: string) => {
    return `${steamFriendUrl}/GetFriendList/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}`;
};
const makeSummaryUrl = (steamIds: string) => {
    return `${steamFriendUrl}/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamIds}`;
};
const makeOwnedUrl = (steamId: string) => {
    return `${steamPlayerUrl}/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true`;
};
const makeAppUrl = (appIds: string) => {
    return `${steamAppUrl}/?appids=${appIds}`;
};
const makeRecentUrl = (steamId: string) => {
    return `${steamPlayerUrl}/GetRecentlyPlayedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamId=${steamId}`;
};

const getFriends = (steamId: string): Promise<FriendResponse> => getPromise(makeFriendsUrl(steamId));
const getSummary = (steamIds: string) => getPromise(makeSummaryUrl(steamIds));
const getOwned = (steamId: string) => getPromise(makeOwnedUrl(steamId));

app.get('/friends', async (req, res): Promise<void> => {
    const steamId = req.query.steamid as string;
    if (!steamId) {
        res.status(400).send('Bad Request: Please provide steamid in the query');
        return;
    }
    try {
        const friendsResponse = await getFriends(steamId);
        const friends = friendsResponse.friendslist?.friends;
        if (!friends) {
            res.sendStatus(404);
        } else {
            res.send(friends);
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/summary', async (req, res): Promise<void> => {
    const steamIds = req.query.steamids as string;
    if (!steamIds) {
        res.status(400).send('Bad Request: Please provide steamids in the query');
        return;
    }
    try {
        const summaryResponse: SummaryResponse = await getSummary(steamIds);
        const players = summaryResponse.response?.players;
        if (!players) {
            res.sendStatus(404);
        } else {
            res.send(players);
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/friendSummary', async (req, res): Promise<void> => {
    const steamId = req.query.steamid as string;
    if (!steamId) {
        res.status(400).send('Bad Request: Please provide steamid in the query');
        return;
    }
    try {
        const friendsResponse: FriendResponse = await getFriends(steamId);
        const friends = friendsResponse.friendslist?.friends;
        if (!friends) {
            res.sendStatus(404);
            return;
        }
        const steamIds = friends.map(friend => friend.steamid);
        const summaryResponse: SummaryResponse = await getSummary(steamIds.join());
        const players = summaryResponse.response?.players;
        if (!players) {
            res.sendStatus(404);
        } else {
            res.send(players);
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/owned', async (req, res): Promise<void> => {
    const steamId = req.query.steamid as string;
    if (!steamId) {
        res.status(400).send('Bad Request: Please provide steamid in the query');
        return;
    }
    try {
        const ownedResponse: OwnedGameResponse = await getOwned(steamId);
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
        const ownedResponse: OwnedGameResponse[] = await Promise.all(ids.map(id => {
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

const getRecent = (steamId: string) => getPromise(makeRecentUrl(steamId));
app.get('/recent', async (req, res): Promise<void> => {
    const steamId = req.query.steamid as string;
    if (!steamId) {
        res.status(400).send('Bad Request: Please provide steamid in the query');
        return;
    }
    try {
        const appResponse: any = await getRecent(steamId);
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

app.listen(port, () => {
    // @ts-ignore
    console.log(`steam-friend-roulette listening at http://localhost:${port}`);
});
