import { OwnedGame, ParamObjectCallback, ParamObjectOptionals, SharedResponse, UserStats } from './types';
import * as https from 'https';
import steamWeb from 'steam-web';

export const filterShared = (ownedLists: OwnedGame[][], steamIds: string[]) => {
    const sharedList: SharedResponse[] = [];
    const primaryUsersList = ownedLists[0];

    primaryUsersList.forEach(game => {
        const userStats: UserStats[] = [];
        const isShared = ownedLists.every((list, index) => {
            const found = list.find(searchGame => searchGame.appid === game.appid);
            if (!found) {
                return false;
            }
            userStats.push({ steamId: steamIds[index], playtime_2weeks: found.playtime_2weeks, playtime_forever: found.playtime_forever });
            return true;
        });
        if (isShared) {
            sharedList.push({
                appid: game.appid,
                name: game.name,
                img_icon_url: game.img_icon_url,
                img_logo_url: game.img_logo_url,
                userStats
            });
        }
    });
    return sharedList;
};

export const getPromise = (url: string): Promise<any> => {
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
            });
        }).on('error', error => reject(error));
    });
};

export const steamPromise = (steam: steamWeb, steamMethod: string, optionals: ParamObjectOptionals) => {
    return new Promise((resolve, reject) => {
        const paramObject: ParamObjectCallback = {
            callback: (err, data) => {
                if (err) {
                    reject(err);
                }
                if (data) {
                    resolve(data);
                }
            },
        };
        steam[steamMethod]({ ...paramObject, ...optionals });
    });
};
