export interface Friend {
    steamid: string;
    relationship: string;
    friend_since: number;
}
export interface FriendResponse {
    friendslist?: {
        friends: Friend[];
    };
}
export interface SummaryResponse {
    response?: {
        players: [];
    };
}
export interface OwnedGame {
    appid: number;
    playtime_2weeks: number;
    playtime_forever: number;
    name: string;
    img_icon_url: string;
    img_logo_url: string;
}
export interface OwnedGameResponse {
    response?: {
        games: OwnedGame[];
    };
}
export interface SharedResponse {
    appid: number;
    name: string;
    img_icon_url: string;
    img_logo_url: string;
    userStats: UserStats[];
}
export interface UserStats {
    steamId: string;
    playtime_2weeks: number;
    playtime_forever: number;
}
export interface AppResponse {
    [key: string]: {
        data?: any;
    };
}
export interface ParamObjectOptionals {
    steamid?: string;
    steamids?: string[];
    relationship?: string;
    include_appinfo?: boolean;
}
export interface ParamObjectCallback {
    callback: (err: Error, data: object) => void;
}
export type SteamMethod = (paramObject: ParamObjectCallback & ParamObjectOptionals) => void;
