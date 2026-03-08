import { MutableRefObject } from "react";
import { ChevronUp } from "lucide-react";
import Image from "next/image";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Song } from "@repo/shared-types";
import { sendWebsocketMessage } from "@/lib/websocket";


interface SongsListProps {
    ws: MutableRefObject<WebSocket | null>;
    userId: string | undefined;
    streamId: string | undefined;
    songsList: Song[];
    songsListRef: MutableRefObject<Song[]>;
}

export default function SongsList({ ws, userId, streamId, songsList, songsListRef }: SongsListProps) {
    if (!userId || !streamId) {
        return null;
    }

    const handleUpvote = (extractedId: string) => {
        const newSongList = songsListRef.current.map((song) => {
            return song.extractedId === extractedId
                ? {
                    ...song,
                    votes: song.votes.includes(userId) ? song.votes : [...song.votes, userId],
                }
                : song;
        });
        sendWebsocketMessage(ws, {
            type: "update_songs_list",
            songs: newSongList,
            roomId: streamId,
        });
    };

    return (
        <Card className="p-4">
            <h2 className="text-2xl font-bold">Songs List</h2>

            <ScrollArea className="h-[calc(100vh-200px)]">
                {songsList.map((song) => (
                    <div
                        key={song.extractedId}
                        className="flex items-center space-x-4 mb-4"
                    >
                        <Image
                            src={song.extractedThumbnail || "/thumbnail_fallback.png"}
                            alt={song.extractedName}
                            className="object-contain rounded"
                            width={80}
                            height={80}
                        />
                        <div className="flex-grow">
                            <h3 className="font-semibold">{song.extractedName}</h3>
                            <p className="text-sm text-muted-foreground">
                                Suggested by {song.addedBy}
                            </p>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            {!song.votes.find((id) => id === userId) ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUpvote(song.extractedId)}
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </Button>
                                    <span>{song.votes.length ? song.votes.length : 0}</span>
                                </>
                            ) : (
                                <Button>{song.votes.length ? song.votes.length : 0}</Button>
                            )}
                        </div>
                    </div>
                ))}
            </ScrollArea>
        </Card>
    )
}
