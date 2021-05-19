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
        data?: {

        }
    };
}
