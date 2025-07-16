export type Song = {
  extractedId: string;
  extractedThumbnail: string;
  extractedName: string;
  addedBy: string;
  votes: string[];
};

export type Message = {
  type: string;
  songs: Song[];
  previouslyPlayedSongs: Song[];

  // * participants side
  currentlyPlaying?: Song;
};
