import { OwnedGame, ParamObjectCallback, ParamObjectOptionals, UserStatResponse, UserStats } from './types';
import * as https from 'https';
import steamWeb from 'steam-web';

export const populateUserStats = (ownedLists: OwnedGame[][], steamIds: string[]) => {
    const userStatList: UserStatResponse[] = [];

    ownedLists.forEach((userList, userIndex) => {
        userList.forEach(game => {
            const userStat = {
                steamId: steamIds[userIndex],
                playtime_2weeks: game.playtime_2weeks,
                playtime_forever: game.playtime_forever
            };
            const existing = userStatList.find(existingGame => existingGame.appid === game.appid);

            if (existing) {
                existing.userStats.push(userStat);
            } else {
                userStatList.push({
                    appid: game.appid,
                    name: game.name,
                    img_icon_url: game.img_icon_url,
                    img_logo_url: game.img_logo_url,
                    userStats: [userStat]
                });
            }
        });
    });

    return userStatList;
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
            callback: (err, data, status) => {
                if (err) {
                    if (!err.status) {
                        err.status = status || 500;
                    }
                    if (!err.data) {
                        err.data = data;
                    }
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
