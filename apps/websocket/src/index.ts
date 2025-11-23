import { WebSocket } from "ws";
import getRedisClient from "@repo/redis-client";

// @ts-ignore
import youtubesearchapi from "youtube-search-api";

// duplicate from apps/types/index.d.ts so in future make a common solution for this
export type Song = {
    extractedId: string;
    extractedThumbnail: string;
    extractedName: string;
    addedBy: string;
    votes: string[];
};

enum IncomingMessageTypes {
    owner_create_room = "owner_create_room",
    owner_ended_stream = "owner_ended_stream",
    join_room = "join_room",
    leave_room = "leave_room",
    add_song = "add_song",
    update_songs_list = "update_songs_list",
}
type IncomingMessage = {
    type: IncomingMessageTypes.owner_create_room,
    id: string,
} | {
    type: IncomingMessageTypes.owner_ended_stream,
    roomId: string,
    songs: Song[],
    previouslyPlayedSongs: Song[],
} | {
    type: IncomingMessageTypes.join_room,
    id: string,
    roomId: string,
} | {
    type: IncomingMessageTypes.leave_room,
    id: string,
    roomId: string,
} | {
    type: IncomingMessageTypes.add_song,
    roomId: string,
    addedBy: string,
    extractedId: string,
} | {
    type: IncomingMessageTypes.update_songs_list,
    songs: Song[],
    roomId: string,
    updatedHistory: Song[],
    setCurrentlyPlaying: boolean,
}


const redisClient = getRedisClient();
const wss = new WebSocket.Server({ port: 8080 }); // currently hardcoded, but in future confiure .env enviroment

const socketMap = new Map<string, WebSocket>(); // user id => socket obj
const roomMap = new Map<string, Set<WebSocket>>(); // room id => set<socket obj> (people in the room)
const songsMap = new Map<string, Song[]>(); // room id => array<songs>
const songsHistoryMap = new Map<string, Song[]>(); // room id => array<songs>

wss.on("connection", (ws: WebSocket) => {
    console.log("New client connected");

    ws.on("message", async (data) => {
        const parsed: IncomingMessage = JSON.parse(data.toString()); // toString() because data type is object and contains <Buffer ...> data

        switch (parsed.type) {
            case IncomingMessageTypes.owner_create_room:
                // check if socket map contains curr user id if not then set it
                if (!socketMap.has(parsed.id)) {
                    socketMap.set(parsed.id, ws);
                }

                // fetch any previous unplayed songs' list if there
                let songsList: Song[], previouslyPlayedSongs: Song[];
                try {
                    const streamExists = await redisClient.exists(`stream:${parsed.id}`);
                    if (streamExists === 1) {
                        const songsListInStringForm = await redisClient.hGet(`stream:${parsed.id}`, "songsList");
                        const songsHistoryInStringForm = await redisClient.hGet(`stream:${parsed.id}`, "songsHistory");
                        songsList = songsListInStringForm ? JSON.parse(songsListInStringForm) : [];
                        previouslyPlayedSongs = songsHistoryInStringForm ? JSON.parse(songsHistoryInStringForm) : [];
                    } else {
                        songsList = [];
                        previouslyPlayedSongs = [];
                    }
                } catch (error) {
                    console.log(error);
                    songsList = [];
                    previouslyPlayedSongs = [];
                }

                // check if room is already there or not from the roomMap
                // if not then create the room and add the curr user socket to the roommap
                if (!roomMap.has(parsed.id)) {
                    roomMap.set(parsed.id, new Set());
                }
                roomMap.get(parsed.id)!.add(ws);
                songsMap.set(parsed.id, songsList);
                songsHistoryMap.set(parsed.id, previouslyPlayedSongs);

                console.log(`Room created by id ${parsed.id}`);

                ws.send(JSON.stringify({
                    type: "room_created",
                    songs: songsList,
                    previouslyPlayedSongs: previouslyPlayedSongs,
                }))
                break;
            case IncomingMessageTypes.owner_ended_stream:
                console.log(`Closing stream for ${parsed.roomId}`);

                saveSongListToCache(parsed.roomId, parsed.songs);
                saveSongHistoryToCache(parsed.roomId, parsed.previouslyPlayedSongs);

                const roomUsers = roomMap.get(parsed.roomId)!;
                roomUsers.forEach(user => {
                    user.send(JSON.stringify({
                        type: "left_room",
                    }));
                });

                roomMap.get(parsed.roomId)!.clear();
                break;
            case IncomingMessageTypes.join_room: // this type will only work when the stream is active
                if (!roomMap.has(parsed.roomId)) {
                    ws.send(JSON.stringify({
                        type: "room_not_exist",
                    }))
                    return;
                }

                // if exists then add the curr ws to the roomMap
                roomMap.get(parsed.roomId)!.add(ws);

                if (!socketMap.has(parsed.id)) socketMap.set(parsed.id, ws);

                // send the song lists of the room
                ws.send(JSON.stringify({
                    type: "joined_room",
                    songs: songsMap.get(parsed.roomId),
                    previouslyPlayedSongs: songsHistoryMap.get(parsed.roomId)
                }))
                break;
            case IncomingMessageTypes.leave_room:
                if (roomMap.has(parsed.roomId)) {
                    roomMap.get(parsed.roomId)!.delete(ws);
                }
                socketMap.delete(parsed.id);
                break;
            case IncomingMessageTypes.add_song:
                const extractedId = parsed.extractedId;
                let videoDetails;
                try {
                    videoDetails = await youtubesearchapi.GetVideoDetails(extractedId);
                } catch (error) {
                    console.error("Failed to fetch video details:", error);
                    break;
                }

                // add the song in the songs map
                if (
                    videoDetails &&
                    videoDetails.title &&
                    videoDetails.thumbnail &&
                    Array.isArray(videoDetails.thumbnail.thumbnails) &&
                    videoDetails.thumbnail.thumbnails.length > 0 &&
                    videoDetails.thumbnail.thumbnails[0].url
                ) {
                    songsMap.get(parsed.roomId)!.push({
                        extractedId,
                        extractedName: videoDetails.title,
                        extractedThumbnail: videoDetails.thumbnail.thumbnails[0].url,
                        addedBy: parsed.addedBy,
                        votes: [],
                    });

                    // broadcast to all the users the updated list
                    broadcastToRoomUsers(parsed.roomId);
                } else {
                    console.log("Invalid video details received from API.");
                }
                break;
            case IncomingMessageTypes.update_songs_list:
                songsMap.set(parsed.roomId, parsed.songs);
                songsHistoryMap.set(parsed.roomId, parsed.updatedHistory);
                broadcastToRoomUsers(parsed.roomId, parsed.setCurrentlyPlaying);
                break;
            default:
                break;
        }
    })
})

function broadcastToRoomUsers(roomId: string, setCurrentlyPlaying = false) {
    const roomUsers = roomMap.get(roomId)!;
    const songsList = songsMap.get(roomId)!;
    const previouslyPlayedSongs = songsHistoryMap.get(roomId)!;
    saveSongListToCache(roomId, songsList);
    saveSongHistoryToCache(roomId, previouslyPlayedSongs);

    let obj = JSON.stringify({
        type: "update_list",
        songs: songsList,
        previouslyPlayedSongs,
        ...(setCurrentlyPlaying && { currentlyPlaying: previouslyPlayedSongs[0] })
    });
    roomUsers.forEach(user => {
        if (user.readyState === WebSocket.OPEN) {
            try {
                user.send(obj);
            } catch (error) {
                console.error("Error sending message to user:", error);
            }
        }
    });
}

// type of songs must be a string, so call a JSON.stringify for songs while calling
async function saveSongListToCache(roomId: string, songs: Song[]) {
    try {
        await redisClient.hSet(`stream:${roomId}`, "songsList", JSON.stringify(songs));
        console.log("Saved list of songs to cache");
    } catch (error) {
        console.log("Error while saving songs in cache: ", error);
    }
}
async function saveSongHistoryToCache(roomId: string, history: Song[]) {
    try {
        await redisClient.hSet(`stream:${roomId}`, "songsHistory", JSON.stringify(history));
        console.log("Saved list of previously played songs to cache");
    } catch (error) {
        console.log("Error while saving songs history in cache: ", error);
    }
}
