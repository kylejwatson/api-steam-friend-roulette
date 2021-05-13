import express from 'express';
import http from 'http';
import cors from 'cors';
import { config } from 'dotenv';
config()

const app = express()
app.use(cors());
const port = 3000

interface Friend {
    steamid: string;
    relationship: string;
    friend_since: number;
}
interface FriendResponse {
    friendslist?: {
        friends: Friend[];
    }
}
interface SummaryResponse {
    response?: {
        players: [];
    }
}
interface Game {
    appid: number;
}
interface GameResponse {
    response?: {
        games: Game[];
    }
}

const getPromise = (url: string) => {
    return new Promise((resolve, reject) => {
        http.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch {
                    reject(data);
                }
            })
        }).on('error', error => reject(error));
    });
}


const steamFriendUrl = 'http://api.steampowered.com/ISteamUser';
const steamPlayerUrl = 'http://api.steampowered.com/IPlayerService'
const steamAppUrl = 'http://store.steampowered.com/api/appdetails';

const makeFriendsUrl = (steamId: string) => {
    return `${steamFriendUrl}/GetFriendList/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}`;
}
const makeSummaryUrl = (steamIds: string) => {
    return `${steamFriendUrl}/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamIds}`;
}
const makeOwnedUrl = (steamId: string) => {
    return `${steamPlayerUrl}/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true`;
}
const makeAppUrl = (appIds: string) => {
    return `${steamAppUrl}/?key=${process.env.STEAM_API_KEY}&appids=${appIds}`;
}


const getFriends = (steamId: string) => getPromise(makeFriendsUrl(steamId));
const getSummary = (steamIds: string) => getPromise(makeSummaryUrl(steamIds));
const getOwned = (steamId: string) => getPromise(makeOwnedUrl(steamId));

app.get('/friends', async (req, res) => {
    const steamId = req.query["steamid"] as string;
    if (!steamId) {
        return res.status(400).send('Bad Request: Please provide steamid in the query')
    }
    try {
        const friendsResponse: FriendResponse = await getFriends(steamId);
        const friends = friendsResponse.friendslist?.friends;
        if (!friends) {
            res.sendStatus(404);
        } else {
            res.send(friends);
        }
    } catch (error) {
        res.status(500).send(error);
    }
})

app.get('/summary', async (req, res) => {
    const steamIds = req.query["steamids"] as string;
    if (!steamIds) {
        return res.status(400).send('Bad Request: Please provide steamids in the query')
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
})

app.get('/friendSummary', async (req, res) => {
    const steamId = req.query["steamid"] as string;
    if (!steamId) {
        return res.status(400).send('Bad Request: Please provide steamid in the query')
    }
    try {
        const friendsResponse: FriendResponse = await getFriends(steamId);
        const friends = friendsResponse.friendslist?.friends;
        if (!friends) {
            return res.sendStatus(404);
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
})

app.get('/owned', async (req, res) => {
    const steamId = req.query["steamid"] as string;
    if (!steamId) {
        return res.status(400).send('Bad Request: Please provide steamid in the query')
    }
    try {
        const ownedResponse: GameResponse = await getOwned(steamId);
        const games = ownedResponse.response?.games;
        if (!games) {
            res.sendStatus(404);
        } else {
            res.send(games);
        }
    } catch (error) {
        res.status(500).send(error);
    }
})

const filterShared = (ownedLists: Game[][]) => {
    // console.log(ownedLists[0]);
    return ownedLists[0].filter(game => ownedLists.every(list => list.find(searchGame => searchGame.appid === game.appid)));
}

app.get('/shared', async (req, res) => {
    const steamIds = req.query["steamids"] as string;
    if (!steamIds) {
        return res.status(400).send('Bad Request: Please provide steamids in the query')
    }
    try {
        const ids = steamIds.split(',');
        const ownedResponse: GameResponse[] = await Promise.all(ids.map(id => {
            return getOwned(id);
        }));
        const games = ownedResponse.map(owned => owned.response?.games);
        if (games.every(game => !game)) {
            res.sendStatus(404);
        } else {
            const shared = filterShared(games);
            console.log(shared);
            res.send(shared);
        }
    } catch (error) {
        res.status(500).send(error);
    }
})

const getApps = (appIds: string) => getPromise(makeAppUrl(appIds));

app.get('/app', async (req, res) => {
    const appIds = req.query["appids"] as string;
    if (!appIds) {
        return res.status(400).send('Bad Request: Please provide appids in the query')
    }
    try {
        const appResponse: any = await getApps(appIds);
        console.log(appResponse)
        res.send(appResponse)
        // if (!summaryResponse.response?.players) {
        //     res.sendStatus(404);
        // } else {
        //     res.send(summaryResponse.response.players);
        // }
    } catch (error) {
        res.status(500).send(error);
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})