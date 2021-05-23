import { Express } from 'express';
import { FriendResponse, SummaryResponse } from './types';
import { steamPromise } from './utils';
import steamWeb from 'steam-web';

export const initFriendEndpoints = (app: Express, steam: steamWeb) => {
    const getFriends = (steamid: string): Promise<FriendResponse> => {
        return steamPromise(steam, 'getFriendList', { steamid, relationship: 'all' });
    };
    const getSummary = (steamids: string[]): Promise<SummaryResponse> => steamPromise(steam, 'getPlayerSummaries', { steamids });

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
            const ids = steamIds.split(',');
            const summaryResponse = await getSummary(ids);
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
            const friendsResponse = await getFriends(steamId);
            const friends = friendsResponse.friendslist?.friends;
            if (!friends) {
                res.sendStatus(404);
                return;
            }
            const steamIds = friends.map(friend => friend.steamid.toString());
            const summaryResponse = await getSummary(steamIds);
            const players = summaryResponse.response?.players;
            players.forEach(player => {
                player.friend_since = friends.find(friend => friend.steamid === player.steamid).friend_since;
            });

            if (!players) {
                res.sendStatus(404);
            } else {
                res.send(players);
            }
        } catch (error) {
            res.status(500).send(error);
        }
    });
};
