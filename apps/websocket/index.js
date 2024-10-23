const { WebSocket } = require("ws")
const youtubesearchapi = require("youtube-search-api");

const wss = new WebSocket.Server({ port: 8080 });

const socketMap = new Map(); // id => socket obj
const roomMap = new Map(); // room id => set<socket obj>
const songsMap = new Map(); // room id => array<songs>

wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", async (data) => {
        /* 
            parsed: {
                id: string,
                roomId: string,
                extractedId: string,

                song: {
                    extractedName: string,
                    extractedThumbnail: string,
                    url: string,
                    addedBy: string, // id of the user
                    votes: [] // will be added in in this file
                }

                songs: [] // when the owner of the room creates an update
            }
        */
        const parsed = JSON.parse(data);

        if (parsed.type === "owner_create_room") { // create room by owner id
            // check if socket map contains curr user id if not then set it
            if (!socketMap.has(parsed.id)) socketMap.set(parsed.id, ws);

            // check if room is already there or not from the roomMap
            // if not then create the room and add the curr user socket to the roommap
            if (!roomMap.has(parsed.id)) {
                roomMap.set(parsed.id, new Set());
            }
            roomMap.get(parsed.id).add(ws);
            songsMap.set(parsed.id, []);

            console.log(`Room created by id ${parsed.id}`);

            ws.send(JSON.stringify({
                type: "room_created",
            }))
        }

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

            // send the song lists of the room
            ws.send(JSON.stringify({
                type: "joined_room",
                songs: songsMap.get(parsed.roomId)
            }))
        }

        if (parsed.type === "leave_room") {
            roomMap.get(parsed.roomId).delete(ws);
            socketMap.delete(parsed.id);
            ws.send(JSON.stringify({
                type: "left_room"
            }))
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
        if (parsed.type === "owner_update_songs_list") {
            songsMap.set(parsed.roomId, parsed.songs);
            broadcastToRoomUsers(parsed.roomId);
        }
    })

})

function broadcastToRoomUsers(roomId) {
    const roomUsers = roomMap.get(roomId);

    roomUsers.forEach(user => user.send(JSON.stringify({
        type: "update_list",
        songs: songsMap.get(roomId) ?? []
    })))
}
