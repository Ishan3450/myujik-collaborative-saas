import { z } from "zod";

/**
 * Common types
 */

export const SongSchema = z.object({
    extractedId: z.string().min(1),
    extractedThumbnail: z.url(),
    extractedName: z.string().min(1),
    addedBy: z.string().min(1),
    votes: z.array(z.string()),
});
export type Song = z.infer<typeof SongSchema>;

export const SongExtendedSchema = SongSchema.extend({
    playedAt: z.number(), // epoch time in milliseconds
    songResumedTime: z.number(), // elapsed seconds since the song started playing or was last resumed
    isPlaying: z.boolean(),
});
export type SongExtended = z.infer<typeof SongExtendedSchema>;

/**
 * From websocket to frontend
 */

export const ServerMessageSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.enum(["room_created", "joined_room", "update_list"]),
        songs: z.array(SongSchema),
        previouslyPlayedSongs: z.array(SongSchema),
        currentlyPlaying: SongExtendedSchema.optional(), // this can be used in -> update_list, joined_room
    }),
    z.object({
        type: z.literal("song_state_play"),
        updatedPlayTime: z.number(),
    }),
    z.object({
        type: z.literal("left_room"),
        reason: z.string(),
    }),
    z.object({
        type: z.enum([
            "room_not_exist",
            "song_state_pause",
            "song_queue_concluded",
        ]),
    }),
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

/**
 * From frontend to websocket
 */

export const ClientMessageSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("owner_create_room"),
        id: z.uuid(),
    }),
    z.object({
        type: z.literal("join_room"),
        id: z.uuid(),
        roomId: z.uuid(),
    }),
    z.object({
        type: z.literal("add_song"),
        addedBy: z.string().min(1),
        extractedId: z.string().min(1),
    }),
    z.object({
        type: z.literal("update_songs_list"),
        songs: z.array(SongSchema),
        updatedHistory: z.array(SongSchema).optional(),
    }),
    z.object({
        type: z.literal("play_next_song"),
        songToPlay: SongSchema,
        updatedList: z.array(SongSchema),
        updatedHistory: z.array(SongSchema),
    }),
    z.object({
        type: z.literal("song_state_play"),
        songResumedTime: z.number(),
    }),
    z.object({
        type: z.enum([
            "song_state_pause",
            "song_queue_concluded",
            "owner_ended_room",
            "leave_room",
        ]),
    }),
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;
