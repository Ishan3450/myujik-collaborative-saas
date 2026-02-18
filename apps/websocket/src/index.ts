import { WebSocket, WebSocketServer } from "ws";
import { getRedisClient } from "@repo/redis-client";
import "dotenv/config";
import type { Song, SongExtended, ClientMessage, ServerMessage } from "@repo/shared-types";
import sendWebsocketMessage from "./lib/websocket.js";

// @ts-ignore
import youtubesearchapi from "youtube-search-api";


const redisClient = getRedisClient();
const PORT = parseInt(process.env.WS_PORT ?? "8080", 10);
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);

const userSocketMap = new Map<string, WebSocket>(); // user id => socket obj
const roomUsersMap = new Map<string, Set<WebSocket>>(); // room id => set<socket obj> (people in the room)
const roomSongsMap = new Map<string, Song[]>(); // room id => array<songs>
const roomSongsHistoryMap = new Map<string, Song[]>(); // room id => array<songs>
const roomCurrentPlayingSongMap = new Map<string, SongExtended>(); // room id => Current Playing Song with some additional fields

wss.on("connection", (ws: WebSocket) => {
    console.log("New client connected");

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });

    ws.on("close", () => {
        cleanupSocket(ws, null, false);
        console.log("Client disconnected");
    });

    ws.on("message", async (data) => {
        let parsed: ClientMessage;
        try {
            parsed = JSON.parse(data.toString()); // toString() because data type is object and contains <Buffer ...> data
        } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
            return;
        }

        switch (parsed.type) {
            case "owner_create_room": {
                // Prevent creating a new room if one is already active with this ID
                if (userSocketMap.has(parsed.id)) {
                    sendWebsocketMessage(ws, {
                        type: "left_room",
                    });
                    return;
                }
                if (!userSocketMap.has(parsed.id)) {
                    userSocketMap.set(parsed.id, ws);
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

                // check if room is already there or not from the roomUsersMap
                // if not then create the room and add the curr user socket to the roomUsersmap
                let roomUsers = roomUsersMap.get(parsed.id);
                if (!roomUsers) {
                    roomUsers = new Set();
                    roomUsersMap.set(parsed.id, roomUsers);
                }
                roomUsers.add(ws);
                roomSongsMap.set(parsed.id, songsList);
                roomSongsHistoryMap.set(parsed.id, previouslyPlayedSongs);

                console.log(`Room created by id ${parsed.id}`);

                sendWebsocketMessage(ws, {
                    type: "room_created",
                    songs: songsList,
                    previouslyPlayedSongs: previouslyPlayedSongs,
                });
                break;
            }
            case "owner_ended_stream": {
                console.log(`Closing stream for ${parsed.roomId}`);

                saveSongListToCache(parsed.roomId, parsed.songs);
                saveSongHistoryToCache(parsed.roomId, parsed.previouslyPlayedSongs);
                roomCurrentPlayingSongMap.delete(parsed.roomId);

                const roomUsers = roomUsersMap.get(parsed.roomId);
                if (!roomUsers) {
                    return logAndReturnWarning(`[OWNER ENDED STREAM] Room users not found for roomId: ${parsed.roomId}`);
                }
                roomUsers.forEach(user => {
                    sendWebsocketMessage(user, {
                        type: "left_room",
                    });
                });
                /**
                 * Here not calling: roomUsersMap.delete(parsed.roomId);
                 * 
                 * Reason: it will trigger follow up event of leave_room and at there if we delete this then users
                 * will not be found there and there will be unnecessary sockets lying in the userSocketMap.
                 */
                break;
            }
            case "join_room": {
                // Prevent user from joining multiple rooms simultaneously
                if (userSocketMap.has(parsed.id)) {
                    sendWebsocketMessage(ws, {
                        type: "left_room",
                    });
                    return;
                }
                const roomUsers = roomUsersMap.get(parsed.roomId);
                if (!roomUsers || parsed.id === parsed.roomId) {
                    sendWebsocketMessage(ws, {
                        type: "room_not_exist",
                    });
                    return;
                }

                // if exists then add the curr ws to the roomUsersMap
                roomUsers.add(ws);
                if (!userSocketMap.has(parsed.id)) userSocketMap.set(parsed.id, ws);

                // send the song lists of the room
                sendWebsocketMessage(ws, {
                    type: "joined_room",
                    songs: roomSongsMap.get(parsed.roomId) ?? [],
                    previouslyPlayedSongs: roomSongsHistoryMap.get(parsed.roomId) ?? [],
                    currentlyPlaying: roomCurrentPlayingSongMap.get(parsed.roomId),
                });
                break;
            }
            case "leave_room": {
                cleanupSocket(ws, parsed.roomId);
                break;
            }
            case "add_song": {
                const extractedId = parsed.extractedId;
                const roomSongs = roomSongsMap.get(parsed.roomId);

                if (!roomSongs) {
                    return logAndReturnWarning(`[ADD SONG] Room songs not found for roomId: ${parsed.roomId}`);
                }
                if (roomSongs.some(song => song.extractedId === extractedId)) {
                    return logAndReturnWarning(`[ADD SONG] Duplicate song request`);
                }

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
                    roomSongs.push({
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
            }
            case "update_songs_list": {
                roomSongsMap.set(parsed.roomId, parsed.songs);
                if (parsed.updatedHistory) {
                    roomSongsHistoryMap.set(parsed.roomId, parsed.updatedHistory);
                }
                broadcastToRoomUsers(parsed.roomId);
                break;
            }
            case "play_next_song": {
                const songToBePlayed: SongExtended = {
                    ...parsed.songToPlay,
                    playedAt: Date.now(),
                    isPlaying: true, // default true because to enable autoplay
                    songResumedTime: 0, // Set to 0 since the song is starting from the beginning
                }

                // store the starting time of the play of song in room
                roomCurrentPlayingSongMap.set(parsed.roomId, songToBePlayed);

                roomSongsMap.set(parsed.roomId, parsed.updatedList);
                roomSongsHistoryMap.set(parsed.roomId, parsed.updatedHistory);

                broadcastToRoomUsers(parsed.roomId, songToBePlayed);
                break;
            }
            case "song_state_pause": {
                const roomUsers = roomUsersMap.get(parsed.roomId);
                const roomCurrentlyPlayingSong = roomCurrentPlayingSongMap.get(parsed.roomId);

                if (!roomUsers) {
                    return logAndReturnWarning(`[SONG STATE PAUSE] Room users not found for roomId: ${parsed.roomId}`);
                }
                if (!roomCurrentlyPlayingSong) {
                    return logAndReturnWarning(`[SONG STATE PAUSE] No currently playing song found for roomId: ${parsed.roomId}`);
                }
                roomCurrentlyPlayingSong.isPlaying = false;
                roomUsers.forEach(user => {
                    sendWebsocketMessage(user, {
                        type: "song_state_pause",
                    });
                });
                break;
            }
            case "song_state_play": {
                const roomUsers = roomUsersMap.get(parsed.roomId);
                const roomCurrentlyPlayingSong = roomCurrentPlayingSongMap.get(parsed.roomId);

                if (!roomUsers) {
                    return logAndReturnWarning(`[SONG STATE PLAY] Room users not found for roomId: ${parsed.roomId}`);
                }
                if (!roomCurrentlyPlayingSong) {
                    return logAndReturnWarning(`[SONG STATE PLAY] No currently playing song found for roomId: ${parsed.roomId}`);
                }

                const updatedPlayTime = Date.now();

                roomCurrentlyPlayingSong.isPlaying = true;
                roomCurrentlyPlayingSong.playedAt = updatedPlayTime;
                roomCurrentlyPlayingSong.songResumedTime = parsed.songResumedTime;

                roomUsers.forEach(user => {
                    sendWebsocketMessage(user, {
                        type: "song_state_play",
                        updatedPlayTime: updatedPlayTime,
                    });
                });
                break;
            }
            case "song_queue_concluded": {
                const roomUsers = roomUsersMap.get(parsed.roomId);
                if (!roomUsers) {
                    return logAndReturnWarning(`[SONG QUEUE CONCLUDED] Room users not found for roomId: ${parsed.roomId}`);
                }
                roomCurrentPlayingSongMap.delete(parsed.roomId);
                roomUsers.forEach(roomParticipant => {
                    sendWebsocketMessage(roomParticipant, {
                        type: "song_queue_concluded",
                    });
                });
                break;
            }
        }
    })
})

// Currently this function handles the play_next_song logic also, kept it here only
// I feel that it has to be separate type when processing increases but as of now this is what we have :)
function broadcastToRoomUsers(roomId: string, updateCurrentPlayingSong: SongExtended | null = null) {
    const roomUsers = roomUsersMap.get(roomId);
    const songsList = roomSongsMap.get(roomId);
    const previouslyPlayedSongs = roomSongsHistoryMap.get(roomId);

    if (!roomUsers) {
        return logAndReturnWarning(`[BROADCAST] Room users not found for roomId: ${roomId}`);
    }
    if (!songsList) {
        return logAndReturnWarning(`[BROADCAST] Songs list not found for roomId: ${roomId}`);
    }
    if (!previouslyPlayedSongs) {
        return logAndReturnWarning(`[BROADCAST] Song history not found for roomId: ${roomId}`);
    }

    saveSongListToCache(roomId, songsList);
    saveSongHistoryToCache(roomId, previouslyPlayedSongs);

    const obj: ServerMessage = {
        type: "update_list",
        songs: songsList,
        previouslyPlayedSongs,
        ...(updateCurrentPlayingSong && { currentlyPlaying: updateCurrentPlayingSong })
    };
    roomUsers.forEach(user => {
        sendWebsocketMessage(user, obj);
    });
}

function logAndReturnWarning(message: string): void {
    console.warn(message);
}

function cleanupSocket(ws: WebSocket, roomId: string | null = null, logs: boolean = true) {
    let roomUsers: Set<WebSocket> | undefined = undefined;
    let userId: string | null = null;
    for (const [uid, socket] of userSocketMap.entries()) {
        if (ws === socket) {
            userSocketMap.delete(uid);
            userId = uid;
            break;
        }
    }
    if (!userId) {
        if (logs) {
            return logAndReturnWarning("[CLEANUPSOCKET] userId not found for socket.");
        }
        return;
    }
    if (roomId) {
        roomUsers = roomUsersMap.get(roomId);
    } else {
        for (const [_roomId, participants] of roomUsersMap.entries()) {
            if (participants.has(ws)) {
                roomUsers = participants;
                roomId = _roomId;
                break;
            }
        }
    }
    if (!roomId || !roomUsers) {
        if (logs) {
            return logAndReturnWarning(`[CLEANUPSOCKET] Room not found for roomId: ${roomId}, userId: ${userId}`);
        }
        return;
    }
    roomUsers.delete(ws);
    if (roomUsers.size === 0) {
        roomUsersMap.delete(roomId);
        roomSongsMap.delete(roomId);
        roomSongsHistoryMap.delete(roomId);
        roomCurrentPlayingSongMap.delete(roomId);
    }
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
