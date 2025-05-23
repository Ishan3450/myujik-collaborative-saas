const { WebSocket } = require("ws")
const youtubesearchapi = require("youtube-search-api");
const getRedisClient = require("@repo/redis-client");

const redisClient = getRedisClient();
const wss = new WebSocket.Server({ port: 8080 });

const socketMap = new Map(); // id => socket obj
const roomMap = new Map(); // room id => set<socket obj> (people in the room)
const songsMap = new Map(); // room id => array<songs>
const songsHistoryMap = new Map(); // room id => array<songs>

wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", async (data) => {
        /* 
            possible fields in parsed obj:
            parsed: {
                id: string,
                roomId: string,
                extractedId: string,

                song: {
                    extractedName: string,
                    extractedThumbnail: string,
                    url: string,
                    addedBy: string, // id of the user
                    votes: [] // will be added in this file
                }

                songs: [] // when the owner of the room creates an update
            }
        */
        const parsed = JSON.parse(data);

        if (parsed.type === "owner_create_room") { // create room by owner id
            // check if socket map contains curr user id if not then set it
            if (!socketMap.has(parsed.id)) {
                socketMap.set(parsed.id, ws);
            }

            // fetch any previous unplayed songs' list if there
            let songsList, previouslyPlayedSongs;
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
            roomMap.get(parsed.id).add(ws);
            songsMap.set(parsed.id, songsList);
            songsHistoryMap.set(parsed.id, previouslyPlayedSongs);

            console.log(`Room created by id ${parsed.id}`);

            ws.send(JSON.stringify({
                type: "room_created",
                songs: songsList,
                previouslyPlayedSongs
            }))
        }

        if (parsed.type === "owner_ended_stream") {
            console.log(`Closing stream for ${parsed.roomId}`);

            saveSongListToCache(parsed.roomId, parsed.songs);
            saveSongHistoryToCache(parsed.roomId, parsed.previouslyPlayedSongs);
            const roomUsers = roomMap.get(parsed.roomId);
            roomUsers.forEach(user => {
                user.send(JSON.stringify({
                    type: "left_room"
                }));
            });

            roomMap.get(parsed.roomId).clear();
        }

        // this point will only work when the stream is active
        if (parsed.type === "join_room") {
            // check if room exists or not
            if (!roomMap.has(parsed.roomId)) {
                ws.send(JSON.stringify({
                    type: "room_not_exist",
                }))
                return;
            }

            // if exists then add the curr ws to the roomMap
            roomMap.get(parsed.roomId).add(ws);

            if (!socketMap.has(parsed.id)) socketMap.set(parsed.id, ws);

            // send the song lists of the room
            ws.send(JSON.stringify({
                type: "joined_room",
                songs: songsMap.get(parsed.roomId),
                previouslyPlayedSongs: songsHistoryMap.get(parsed.roomId)
            }))
        }

        if (parsed.type === "leave_room") {
            roomMap.get(parsed.roomId).delete(ws);
            socketMap.delete(parsed.id);
        }

        // needs broadcast to all the room users
        if (parsed.type === "add_song") {
            const extractedId = parsed.extractedId;
            const videoDetails = await youtubesearchapi.GetVideoDetails(extractedId);

            // add the song in the songs map
            songsMap.get(parsed.roomId).push({
                extractedId,
                extractedName: videoDetails.title,
                extractedThumbnail: videoDetails.thumbnail.thumbnails[0].url,
                addedBy: parsed.addedBy,
                votes: [],
            });

            // broadcast to all the users the updated list
            broadcastToRoomUsers(parsed.roomId);
        }

        // needs broadcat to all the room users
        if (parsed.type === "update_songs_list") {
            songsMap.set(parsed.roomId, parsed.songs);
            songsHistoryMap.set(parsed.roomId, parsed.updatedHistory);
            broadcastToRoomUsers(parsed.roomId, parsed.setCurrentlyPlaying);
        }
    })
})

function broadcastToRoomUsers(roomId, setCurrentlyPlaying = false) {
    const roomUsers = roomMap.get(roomId);
    const songsList = songsMap.get(roomId);
    const previouslyPlayedSongs = songsHistoryMap.get(roomId);
    saveSongListToCache(roomId, songsList);
    saveSongHistoryToCache(roomId, previouslyPlayedSongs);

    let obj = JSON.stringify({
        type: "update_list",
        songs: songsList,
        previouslyPlayedSongs,
        ...(setCurrentlyPlaying && { currentlyPlaying: previouslyPlayedSongs[0] })
    });
    roomUsers.forEach(user => user.send(obj))
}

// type of songs must be a string, so call a JSON.stringify for songs while calling
async function saveSongListToCache(roomId, songs) {
    try {
        await redisClient.hSet(`stream:${roomId}`, "songsList", JSON.stringify(songs));
        console.log("Saved list of songs to cache");
    } catch (error) {
        console.log("Error while saving songs in cache: ", error);
    }
}
async function saveSongHistoryToCache(roomId, history) {
    try {
        await redisClient.hSet(`stream:${roomId}`, "songsHistory", JSON.stringify(history));
        console.log("Saved list of previously played songs to cache");
    } catch (error) {
        console.log("Error while saving songs history in cache: ", error);
    }
}