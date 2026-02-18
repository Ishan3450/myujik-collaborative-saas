import { MutableRefObject, useState } from "react";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import youtubeurl from "youtube-url";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendWebsocketMessage } from "@/lib/websocket";


interface SuggestSongProps {
    ws: MutableRefObject<WebSocket | null>;
    roomId: string | undefined;
    suggestedBy: string | null | undefined; // name of the user who suggested the song
}

export default function SuggestSong({ ws, roomId, suggestedBy }: SuggestSongProps) {
    const [youtubeLink, setYoutubeLink] = useState<string>("");

    if (!roomId || !suggestedBy) {
        return null;
    }

    const handleAddSong = () => {
        if (youtubeurl.valid(youtubeLink)) {
            const videoId = youtubeurl.extractId(youtubeLink);
            sendWebsocketMessage(ws, {
                type: "add_song",
                roomId: roomId,
                addedBy: suggestedBy,
                extractedId: videoId,
            });
            setYoutubeLink("");
        }
    };

    return (
        <Card className="p-4">
            <h2 className="text-2xl font-bold mb-2">Suggest Song</h2>

            <div className="flex space-x-2">
                <Input
                    type="text"
                    placeholder="Enter YouTube link"
                    value={youtubeLink}
                    onChange={(e) => setYoutubeLink(e.target.value)}
                />
                <Button
                    onClick={handleAddSong}
                    disabled={!youtubeLink || !youtubeurl.valid(youtubeLink)}
                >
                    Suggest
                </Button>
            </div>
        </Card>
    );
}
