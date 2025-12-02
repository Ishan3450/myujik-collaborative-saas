export type Song = {
  extractedId: string;
  extractedThumbnail: string;
  extractedName: string;
  addedBy: string;
  votes: string[];
};
export type SongExtended = Song & {
  playedAt: number; // time in unix form (server time)
  isPlaying: boolean; // flag telling whether the song is in playing or pause state
  songResumedTime: number; // elapsed seconds since the song started playing or was last resumed
};

// incoming message type from websocket
export type Message = {
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
