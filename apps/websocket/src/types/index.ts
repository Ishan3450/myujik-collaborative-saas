import { ClientMessage, Song, SongExtended } from "@repo/shared-types";
import WebSocket from "ws";

export type WebsocketMetadata = {
    userId: string;
    roomId: string;
    role: "owner" | "participant";
}

export type Room = {
    id: string;
    owner: WebSocket; // kept separate just for differentation
    participants: Set<WebSocket>; // includes owner also
    upcomingSongs: Song[];
    previouslyPlayedSongs: Song[];
    currentlyPlayingSong?: SongExtended;
}

/**
 * Middleware guard related types
 */

export type WsContext = {
    ws: WebSocket;
    message: ClientMessage;
    metadata?: WebsocketMetadata;
    room?: Room;
};
export type Guard = (ctx: WsContext) => boolean | Promise<boolean>;
