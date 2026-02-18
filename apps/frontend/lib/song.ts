import type { Song } from "@repo/shared-types";

export function sortSongsByVotes(songs: Song[]) {
    return [...songs].sort((a, b) => b.votes.length - a.votes.length);
}
