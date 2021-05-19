import { Game, SharedResponse, UserStats } from './types';
import * as http from 'http';

export const filterShared = (ownedLists: Game[][], steamIds: string[]) => {
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
            });
        }).on('error', error => reject(error));
    });
};
