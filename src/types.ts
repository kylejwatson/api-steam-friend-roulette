export interface Friend {
    steamid: string;
    relationship: string;
    friend_since: number;
}
export interface FriendResponse {
    friendslist?: {
        friends: Friend[];
    }
}
export interface SummaryResponse {
    response?: {
        players: [];
    }
}
export interface Game {
    appid: number;
    playtime_2weeks: number;
    playtime_forever: number;
    name: string;
    img_icon_url: string;
    img_logo_url: string;
}
export interface GameResponse {
    response?: {
        games: Game[];
    }
}