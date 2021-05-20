declare module 'steam-web' {
    export default class {
        constructor(paramObject: { apiKey: string, format?: string });
        getPlayerSummaries: (paramObject: {
            steamids: string[];
            callback: (err: Error, data: object) => void;
        }) => void;
        getFriendList: (paramObject: {
            steamid: string;
            relationship: string; //'all' or 'friend'
            callback: (err: Error, data: object) => void;
        }) => void;
        getRecentlyPlayedGames: (paramObject: {
            steamid: string;
            callback: (err: Error, data: object) => void;
        }) => void;
        getOwnedGames: (paramObject: {
            steamid: string;
            include_appinfo: boolean;
            callback: (err: Error, data: object) => void;
        }) => void;
    }
}
