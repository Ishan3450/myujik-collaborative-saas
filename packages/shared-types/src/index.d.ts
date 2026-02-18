/**
 * Common types
 */

export type Song = {
    extractedId: string;
    extractedThumbnail: string;
    extractedName: string;
    addedBy: string;
    votes: string[];
};

export type SongExtended = Song & {
    playedAt: number; // epoch time in milliseconds
    songResumedTime: number; // elapsed seconds since the song started playing or was last resumed
    isPlaying: boolean;
};


/**
 * From websocket to frontend
 */

// incoming message type from websocket
export type ServerMessage = {
    type: "room_created" | "joined_room" | "update_list";
    songs: Song[];
    previouslyPlayedSongs: Song[];
    currentlyPlaying?: SongExtended; // this can be used in -> update_list, joined_room
} | {
    type: "song_state_play";
    updatedPlayTime: number;
} | {
    type: "left_room" | "room_not_exist" | "song_state_pause" | "song_queue_concluded";
};


/**
 * From frontend to websocket
 */

export type ClientMessage = {
    type: "owner_create_room",
    id: string,
} | {
    type: "owner_ended_stream",
    roomId: string,
    songs: Song[],
    previouslyPlayedSongs: Song[],
} | {
    type: "join_room",
    id: string,
    roomId: string,
} | {
    type: "leave_room",
    id: string,
    roomId: string,
} | {
    type: "add_song",
    roomId: string,
    addedBy: string,
    extractedId: string,
} | {
    type: "update_songs_list",
    songs: Song[],
    roomId: string,
    updatedHistory?: Song[],
} | {
    type: "play_next_song",
    songToPlay: Song,
    roomId: string,
    updatedList: Song[],
    updatedHistory: Song[],
} | {
    type: "song_state_play",
    roomId: string,
    songResumedTime: number,
} | {
    type: "song_state_pause" | "song_queue_concluded",
    roomId: string,
};
