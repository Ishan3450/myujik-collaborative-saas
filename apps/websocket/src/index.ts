import { RawData, WebSocket, WebSocketServer } from "ws";
import "dotenv/config";
import { type SongExtended, type ClientMessage, type ServerMessage, ClientMessageSchema } from "@repo/shared-types";
import sendWebsocketMessage from "./lib/websocket.js";
import { getVideoDetail } from "./lib/youtube.js";
import { Guard, Room, WebsocketMetadata, WsContext } from "./types/index.js";
import prismaClient from "@repo/db";


const ZOMBIE_SOCKET_CLEANUP_INTERVAL = parseInt(process.env.ZOMBIE_SOCKET_CLEANUP_INTERVAL ?? "300000", 10); // fallback: 1000 * 60 * 5 = 5 minutes
const MAX_MESSAGE_BYTES = parseInt(process.env.MAX_MESSAGE_BYTES ?? "262144", 10); // fallback: 1024 * 256 = 256kb
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",").map(origin => origin.trim());

if(Number.isNaN(ZOMBIE_SOCKET_CLEANUP_INTERVAL)) {
    throw new Error("Invalid ZOMBIE_SOCKET_CLEANUP_INTERVAL value in environment variables. It should be a valid number representing milliseconds.");
}
if(Number.isNaN(MAX_MESSAGE_BYTES)) {
    throw new Error("Invalid MAX_MESSAGE_BYTES value in environment variables. It should be a valid number representing bytes.");
}

const PORT = parseInt(process.env.WS_PORT ?? "8080", 10);
const wss = new WebSocketServer({
    port: PORT,
    maxPayload: MAX_MESSAGE_BYTES,
    verifyClient: ({ origin }, cb) => {
        if (process.env.ALLOWED_ORIGINS === '*' || (ALLOWED_ORIGINS && ALLOWED_ORIGINS.includes(origin))) { // allow all
            cb(true);
        } else {
            logAndReturnWarning(`[VERIFY CLIENT] Connection attempt from disallowed origin: ${origin}`);
            cb(false, 403, "Chal chal chal, chal 🤟");
        }
    },
});


/**
 * Zombie sockets cleanup (basic logic, not scalable but works for our use case):
 * 
 * Purpose: 
 * - Remove sockets that are still open but don't have metadata associated with them in the websocketMetadataMap.
 * - Prevent memory leaks and stale connections that can consume server resources unnecessarily.
 */
let zombieSocketsCleanupInterval: NodeJS.Timeout | null = null;

function startZombieSocketCleanupInterval() {
    if(zombieSocketsCleanupInterval) return; // already running

    console.log("[ZOMBIE CLEANUP] Starting cleanup interval");
    zombieSocketsCleanupInterval = setInterval(() => {
        wss.clients.forEach(connectedClients => {
            if(!websocketMetadataMap.has(connectedClients)) {
                console.warn(`[ZOMBIE CLEANUP] Terminating connection, no metadata after ${ZOMBIE_SOCKET_CLEANUP_INTERVAL/1000}s`);
                connectedClients.terminate();
            }
        });
    }, ZOMBIE_SOCKET_CLEANUP_INTERVAL);
}
function stopZombieSocketCleanupInterval() {
    if(!zombieSocketsCleanupInterval) return; // already not running

    clearInterval(zombieSocketsCleanupInterval);
    console.log("[ZOMBIE SOCKETS CLEANUP] No clients left, stopping cleanup interval");
    zombieSocketsCleanupInterval = null;
}

console.log(`WebSocket server started on port ${PORT}`);

const websocketMetadataMap = new Map<WebSocket, WebsocketMetadata>(); // socket => attached meta data
const roomsMap = new Map<string, Room>(); // room id => room object

/**
 * Guards for authorization
 */

// Returns a closure given a list of guards, returns a single Guard function that runs them sequentially.
function composeGuards(...guards: Guard[]): Guard {
    return async (ctx) => {
        for (const guard of guards) {
            const ok = await guard(ctx);
            if (!ok) return false;
        }
        return true;
    };
}

const guardEnsureNoSocketMetaDataWithSameUserIdExists: Guard = (ctx) => {
    if(ctx.message.type === "owner_create_room" || ctx.message.type === "join_room") {
        const userIdToCheck = ctx.message.id;
        for(const [_wsObject, metadata] of websocketMetadataMap.entries()) {
            if(metadata.userId === userIdToCheck) {
                logAndReturnWarning(`[GUARD CHECK USERID MUST NOT EXIST] A socket with same user ID already exists. User ID: ${userIdToCheck}, Socket Meta Data: ${JSON.stringify(metadata)}`);
                return false;
            }
        }
    }
    return true;
}

const guardRequireMetadata: Guard = (ctx) => {
    const metadata = websocketMetadataMap.get(ctx.ws);
    if (!metadata) {
        logAndReturnWarning(`[GUARD REQUIRE METADATA] No metadata found for socket, unauthorized access attempt. Socket: ${JSON.stringify(ctx.ws)}`);
        return false;
    }
    ctx.metadata = metadata;
    return true;
};

const guardRequireRoomToExist: Guard = (ctx) => {
    // If joining room, use roomId from message otherwise, get from metadata
    let roomId;
    if (ctx.message.type === "join_room") {
        roomId = ctx.message.roomId;
    } else {
        if (!ctx.metadata) return false;
        roomId = ctx.metadata.roomId;
    }

    const room = roomsMap.get(roomId);
    if (!room) {
        logAndReturnWarning(`[GUARD REQUIRE ROOM TO EXIST] No room found for roomId: ${roomId}, Socket Meta Data: ${JSON.stringify(ctx.metadata)}`);
        return false;
    }
    ctx.room = room;
    return true;
};

const guardRequireRoomParticipant: Guard = (ctx) => {
    if (!ctx.room) return false;
    const roomExists = ctx.room.participants.has(ctx.ws);
    if (!roomExists) {
        logAndReturnWarning(`[GUARD REQUIRE ROOM PARTICIPANT] Socket is not a participant in the room. Socket: ${JSON.stringify(ctx.ws)}, Room ID: ${ctx.metadata?.roomId}`);
        return false;
    }
    return true;
};

const guardRequireOwner: Guard = (ctx) => {
    if (!ctx.metadata) return false;
    const isOwner = ctx.metadata.role === "owner";
    if (!isOwner) {
        logAndReturnWarning(`[GUARD REQUIRE OWNER] Socket is not the owner of the room. Socket: ${JSON.stringify(ctx.ws)}, Room ID: ${ctx.metadata?.roomId}`);
        return false;
    }
    return true;
};

const guardRequireRoomParticipantButNotOwner: Guard = (ctx) => {
    if (!ctx.metadata || !ctx.room) return false;
    const isOwner = ctx.metadata.role === "owner";
    if (isOwner) {
        logAndReturnWarning(`[GUARD REQUIRE ROOM PARTICIPANT BUT NOT OWNER] Socket is the owner of the room, but should be a participant. Socket: ${JSON.stringify(ctx.ws)}, Room ID: ${ctx.metadata.roomId}`);
        return false;
    }
    const isParticipant = ctx.room.participants.has(ctx.ws);
    if (!isParticipant) {
        logAndReturnWarning(`[GUARD REQUIRE ROOM PARTICIPANT BUT NOT OWNER] Socket is not a participant in the room. Socket: ${JSON.stringify(ctx.ws)}, Room ID: ${ctx.metadata.roomId}`);
        return false;
    }
    return !isOwner && isParticipant;
};

const guardEnsureUserExists: Guard = async (ctx) => {
    if (ctx.message.type !== "owner_create_room" && ctx.message.type !== "join_room") {
        return false;
    }
    try {
        const user = await prismaClient.user.findUnique({
            where: { id: ctx.message.id },
        });
        const isUserFound = !!user;
        if (!isUserFound) {
            logAndReturnWarning(`[GUARD ENSURE USER EXISTS] User not found for ID: ${ctx.message.id}`);
            return false;
        }
        return isUserFound;
    } catch (error) {
        logAndReturnWarning(`[GUARD ENSURE USER EXISTS] DB error checking user existence for ID: ${ctx.message.id}, Error: ${error}`);
        return false;
    }
};

// The order of guards in composeGuards is important:
// Each guard runs sequentially and can depend on context fields set by previous guards.
// For example, guardRequireRoomToExist expects ctx.metadata to be set by guardRequireMetadata.
// Always arrange guards so that context prerequisites are satisfied left to right.
const BASE_GUARDS: Readonly<Guard[]> = [guardRequireMetadata, guardRequireRoomToExist];
const PARTICIPANT_GUARDS: Readonly<Guard[]> = [...BASE_GUARDS, guardRequireRoomParticipant];
const middlewareByType = {
    owner_create_room: composeGuards(guardEnsureUserExists, guardEnsureNoSocketMetaDataWithSameUserIdExists),
    join_room: composeGuards(guardEnsureUserExists, guardRequireRoomToExist, guardEnsureNoSocketMetaDataWithSameUserIdExists),
    owner_ended_room: composeGuards(...PARTICIPANT_GUARDS, guardRequireOwner),
    leave_room: composeGuards(...BASE_GUARDS, guardRequireRoomParticipantButNotOwner),
    add_song: composeGuards(...PARTICIPANT_GUARDS),
    update_songs_list: composeGuards(...PARTICIPANT_GUARDS),
    play_next_song: composeGuards(...PARTICIPANT_GUARDS, guardRequireOwner),
    song_state_play: composeGuards(...PARTICIPANT_GUARDS, guardRequireOwner),
    song_state_pause: composeGuards(...PARTICIPANT_GUARDS, guardRequireOwner),
    song_queue_concluded: composeGuards(...PARTICIPANT_GUARDS, guardRequireOwner),
} satisfies Record<ClientMessage["type"], Guard>;

async function middleware(
    ws: WebSocket,
    message: ClientMessage,
): Promise<{
    valid: boolean,
    socketMetaData: WebsocketMetadata | null,
    room: Room | null,
    parsedMessage: ClientMessage | null
}> {
    // Received message validation using zod
    const validationResult = ClientMessageSchema.safeParse(message);
    if (!validationResult.success) {
        logAndReturnWarning(`[VALIDATION] Invalid message received: ${JSON.stringify(message)}, Error: ${JSON.stringify(validationResult.error.issues)}`);
        return {
            valid: false,
            socketMetaData: null,
            room: null,
            parsedMessage: null,
        };
    }

    const context: WsContext = {
        ws,
        message: validationResult.data,
    };
    const guard = middlewareByType[context.message.type];
    const ok = await guard(context);

    // At this stage, the context has been populated with socket metadata and room information by the guards.
    // Initially, only the socket and message were provided for validation.
    return {
        valid: ok,
        socketMetaData: context.metadata ?? null,
        room: context.room ?? null,
        parsedMessage: validationResult.data,
    };
}

wss.on("connection", (ws: WebSocket) => {
    console.log("New client connected");
    startZombieSocketCleanupInterval();

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });

    ws.on("close", () => {
        cleanupSocket(ws, null, false);
        console.log("Client disconnected");

        if(wss.clients.size === 0) {
            stopZombieSocketCleanupInterval();
        }
    });

    ws.on("message", async (data) => {
        _logMessageSize(data);

        let parsed: ClientMessage;
        try {
            parsed = JSON.parse(data.toString()); // toString() because data type is object and contains <Buffer ...> data
        } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
            return;
        }

        const middlewareResult = await middleware(ws, parsed);
        if (!middlewareResult.valid || !middlewareResult.parsedMessage) {
            sendWebsocketMessage(ws, {
                type: "left_room",
                reason: "Unauthorized access",
            })
            cleanupSocket(ws, middlewareResult.socketMetaData?.roomId || null, true, true);
            return logAndReturnWarning(`[MIDDLEWARE] Unauthorized access, middleware result: ${JSON.stringify(middlewareResult)}`);
        }

        const message: ClientMessage = middlewareResult.parsedMessage;
        const socketMetadata = middlewareResult.socketMetaData;
        const room = middlewareResult.room;

        switch (message.type) {
            case "owner_create_room": {
                // Prevent creating a new room if one is already active with this ID
                if (socketMetadata) {
                    sendWebsocketMessage(ws, {
                        type: "left_room",
                        reason: "A room is already active for this user.",
                    });
                    cleanupSocket(ws, socketMetadata.roomId, true, true);
                    return logAndReturnWarning(`[OWNER CREATE ROOM] One session already found payload, Meta Data: ${JSON.stringify(socketMetadata)}`);
                }
                const roomId = message.id;
                const ownerSocketMetaData: WebsocketMetadata = {
                    userId: message.id,
                    roomId: roomId,
                    role: "owner",
                };
                const newRoomInstance: Room = {
                    id: roomId,
                    owner: ws,
                    participants: new Set([ws]),
                    upcomingSongs: [],
                    previouslyPlayedSongs: [],
                }
                websocketMetadataMap.set(ws, ownerSocketMetaData);
                roomsMap.set(roomId, newRoomInstance);

                console.log(`Room created by id ${roomId}`);
                sendWebsocketMessage(ws, {
                    type: "room_created",
                    songs: newRoomInstance.upcomingSongs,
                    previouslyPlayedSongs: newRoomInstance.previouslyPlayedSongs,
                });
                break;
            }
            case "owner_ended_room": {
                if (!room || !socketMetadata) return;
                room.participants.forEach(user => {
                    sendWebsocketMessage(user, {
                        type: "left_room",
                        reason: "Stream ended by owner.",
                    });
                    cleanupSocket(user, socketMetadata.roomId, true, true);
                });
                break;
            }
            case "join_room": {
                // Prevent user from joining multiple rooms simultaneously and/or same owner joining their own room as participant
                if (socketMetadata || message.id === message.roomId) {
                    sendWebsocketMessage(ws, {
                        type: "left_room",
                        reason: "You are already in a room. Please leave the current room before joining another.",
                    });
                    cleanupSocket(ws, message.roomId, true, true);
                    return;
                }
                if (!room) return;

                const newUserMetadata: WebsocketMetadata = {
                    userId: message.id,
                    roomId: message.roomId,
                    role: "participant",
                }

                // if exists then add the curr ws to the roomUsersMap
                websocketMetadataMap.set(ws, newUserMetadata);
                room.participants.add(ws);

                // send the song lists of the room
                sendWebsocketMessage(ws, {
                    type: "joined_room",
                    songs: room.upcomingSongs,
                    previouslyPlayedSongs: room.previouslyPlayedSongs,
                    currentlyPlaying: room.currentlyPlayingSong,
                });
                break;
            }
            case "leave_room": {
                if (!socketMetadata) return;
                cleanupSocket(ws, socketMetadata.roomId, true, true);
                break;
            }
            case "add_song": {
                if (!room) return;

                const extractedId = message.extractedId;
                if (room.upcomingSongs.some(song => song.extractedId === extractedId)) {
                    return logAndReturnWarning(`[ADD SONG] Duplicate song request`);
                }

                const videoDetails = await getVideoDetail(extractedId);
                if (videoDetails) {
                    room.upcomingSongs.push({
                        extractedId,
                        extractedName: videoDetails.title,
                        extractedThumbnail: videoDetails.thumbnailUrl,
                        addedBy: message.addedBy,
                        votes: [],
                    });

                    // broadcast to all the users the updated list
                    broadcastToRoomUsers(room);
                } else {
                    console.log("Invalid video details received from API for ID:", extractedId);
                }
                break;
            }
            case "update_songs_list": {
                if (!room) return;

                room.upcomingSongs = message.songs;
                if (message.updatedHistory) {
                    room.previouslyPlayedSongs = message.updatedHistory;
                }
                broadcastToRoomUsers(room);
                break;
            }
            case "play_next_song": {
                if (!room) return;

                const songToBePlayed: SongExtended = {
                    ...message.songToPlay,
                    playedAt: Date.now(),
                    isPlaying: true, // default true because to enable autoplay
                    songResumedTime: 0, // 0 as the song is starting from the beginning
                }

                room.currentlyPlayingSong = songToBePlayed;
                room.upcomingSongs = message.updatedList;
                room.previouslyPlayedSongs = message.updatedHistory;

                broadcastToRoomUsers(room, true);
                break;
            }
            case "song_state_pause": {
                if (!room || !socketMetadata) return;

                if (!room.currentlyPlayingSong) {
                    return logAndReturnWarning(`[SONG STATE PAUSE] No currently playing song found for roomId: ${socketMetadata.roomId}`);
                }
                room.currentlyPlayingSong.isPlaying = false;
                room.participants.forEach(user => {
                    sendWebsocketMessage(user, {
                        type: "song_state_pause",
                    });
                });
                break;
            }
            case "song_state_play": {
                if (!room || !socketMetadata) return;

                if (!room.currentlyPlayingSong) {
                    return logAndReturnWarning(`[SONG STATE PLAY] No currently playing song found for roomId: ${socketMetadata.roomId}`);
                }
                const updatedPlayTime = Date.now();
                room.currentlyPlayingSong = {
                    ...room.currentlyPlayingSong,
                    isPlaying: true,
                    playedAt: updatedPlayTime,
                    songResumedTime: message.songResumedTime,
                }

                room.participants.forEach(user => {
                    sendWebsocketMessage(user, {
                        type: "song_state_play",
                        updatedPlayTime: updatedPlayTime,
                    });
                });
                break;
            }
            case "song_queue_concluded": {
                if (!room) return;

                delete room.currentlyPlayingSong;
                room.participants.forEach(participant => {
                    sendWebsocketMessage(participant, {
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
function broadcastToRoomUsers(room: Room, updateCurrentPlayingSong: boolean = false) {
    const obj: ServerMessage = {
        type: "update_list",
        songs: room.upcomingSongs,
        previouslyPlayedSongs: room.previouslyPlayedSongs,
    };
    if (updateCurrentPlayingSong) {
        obj.currentlyPlaying = room.currentlyPlayingSong;
    }
    room.participants.forEach(participant => {
        sendWebsocketMessage(participant, obj);
    });
}

function logAndReturnWarning(message: string): void {
    console.warn(message);
}

function _logMessageSize(data: RawData) {
    const sizeInBytes = Buffer.byteLength(data as unknown as string, 'utf8')
    const sizeInKB = sizeInBytes / 1024
    const sizeInMB = sizeInKB / 1024

    console.log(`[MESSAGE SIZE] Size: ${sizeInBytes} bytes / ${sizeInKB.toFixed(2)} KB / ${sizeInMB.toFixed(4)} MB`)
}

/**
 * Cleans up a disconnected user from all data structures.
 *
 * Performs cleanup in this order:
 * 1. Removes user from websocketMetadataMap
 * 2. Removes user from their room
 * 3. If room becomes empty, performs cleanup of room
 */
function cleanupSocket(ws: WebSocket, roomId: string | null = null, logs: boolean = true, isCalledIntentional: boolean = false) {
    if(ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.terminate();
    }

    const socketMetadata = websocketMetadataMap.get(ws);
    if (!socketMetadata) {
        if (logs) {
            return logAndReturnWarning(`[CLEANUPSOCKET] socket not found`);
        }
        return;
    }
    websocketMetadataMap.delete(ws);

    if (!roomId) { // if roomId is not passed as argument, then we can get one from socket meta data
        roomId = socketMetadata.roomId;
    }
    const room = roomsMap.get(roomId);
    if (!room || !room.participants) {
        if (logs) {
            return logAndReturnWarning(`[CLEANUPSOCKET] Room not found for roomId: ${roomId}, Socket Meta Data: ${socketMetadata}`);
        }
        return;
    }

    room.participants.delete(ws);
    if(!isCalledIntentional && socketMetadata.role === "owner") {
        // if owner left, then we can consider that the stream has ended and we can cleanup the room and notify the participants
        room.participants.forEach(user => {
            sendWebsocketMessage(user, {
                type: "left_room",
                reason: "Stream ended by owner.",
            });
            cleanupSocket(user, socketMetadata.roomId, true, true);
        });
    }

    if (room.participants.size === 0) {
        roomsMap.delete(roomId);
        console.log(`Closed stream for ${socketMetadata.roomId}`);
    }
}
