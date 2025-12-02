export type Song = {
  extractedId: string;
  extractedThumbnail: string;
  extractedName: string;
  addedBy: string;
  votes: string[];
};
type SongExtended = Song & {
  playedAt: number;
  isPlaying: boolean;
};

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
