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
    playtime_2weeks: number;
    playtime_forever: number;
    name: string;
    img_icon_url: string;
    img_logo_url: string;
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
const makeRecentUrl = (steamId: string) => {
    return `${steamPlayerUrl}/GetRecentlyPlayedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamId=${steamId}`;
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

const filterShared = (ownedLists: Game[][], steamIds: string[]) => {
    const sharedList = [];
    const primaryUsersList = ownedLists[0];

    primaryUsersList.forEach(game => {
        const userStats = [];
        const isShared = ownedLists.every((list, index) => {
            const found = list.find(searchGame => searchGame.appid === game.appid);
            if (!found) {
                return false;
            }
            userStats.push({ steamId: steamIds[index], playtime_2weeks: found.playtime_2weeks, playtime_forever: found.playtime_forever })
            return true;
        });
        if (isShared) {
            sharedList.push({
                appid: game.appid,
                name: game.name,
                img_icon_url: game.img_icon_url,
                img_logo_url: game.img_logo_url,
                userStats
            })
        }
    })
    return sharedList;
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
            const shared = filterShared(games, ids);
            res.send(shared);
        }
    } catch (error) {
        res.status(500).send(error);
    }
})
const getRecent = (steamId: string) => getPromise(makeRecentUrl(steamId));

app.get('/recent', async (req, res) => {
    const steamId = req.query["steamid"] as string;
    if (!steamId) {
        return res.status(400).send('Bad Request: Please provide steamid in the query')
    }
    try {
        const appResponse: any = await getRecent(steamId);
        res.send(appResponse)
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
        res.send(appResponse)
    } catch (error) {
        res.status(500).send(error);
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})