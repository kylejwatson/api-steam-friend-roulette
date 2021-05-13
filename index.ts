import express from 'express';
import https from 'https';
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

const getPromise = (url: string) => {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
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


const steamUrl = 'https://api.steampowered.com/ISteamUser';

const makeFriendsUrl = (steamId: string) => {
    return `${steamUrl}/GetFriendList/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}`;
}
const makeSummaryUrl = (steamIds: string) => {
    return `${steamUrl}/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamIds}`;
}


const getFriends = (steamId: string) => getPromise(makeFriendsUrl(steamId));
const getSummary = (steamIds: string) => getPromise(makeSummaryUrl(steamIds));

app.get('/friends', async (req, res) => {
    const steamId = req.query["steamid"] as string;
    if (!steamId) {
        return res.status(400).send('Bad Request: Please provide steamid in the query')
    }
    try {
        const friendsResponse: FriendResponse = await getFriends(steamId);
        if (!friendsResponse.friendslist?.friends) {
            res.sendStatus(404);
        } else {
            res.send(friendsResponse.friendslist.friends);
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
        if (!summaryResponse.response?.players) {
            res.sendStatus(404);
        } else {
            res.send(summaryResponse.response.players);
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
        if (!friendsResponse.friendslist?.friends) {
            return res.sendStatus(404);
        }
        const steamIds = friendsResponse.friendslist.friends.map(friend => friend.steamid);
        const summaryResponse: SummaryResponse = await getSummary(steamIds.join());
        if (!summaryResponse.response?.players) {
            res.sendStatus(404);
        } else {
            res.send(summaryResponse.response.players);
        }
    } catch (error) {
        res.status(500).send(error);
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})