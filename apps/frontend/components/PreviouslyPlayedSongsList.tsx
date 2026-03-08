import { HistoryIcon, ThumbsUpIcon } from "lucide-react";
import Image from "next/image";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Song } from "@repo/shared-types";


interface PreviouslyPlayedSongsListProps {
    children: React.ReactNode;  // React node to render as the trigger element for opening the sheet
    previouslyPlayedSongs: Song[];
}

export default function PreviouslyPlayedSongsList({ children, previouslyPlayedSongs }: PreviouslyPlayedSongsListProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent className="min-w-[40%] max-w-[40%]">
                <SheetHeader>
                    <SheetTitle className="mb-2">
                        <h2 className="text-2xl flex items-center gap-2"><HistoryIcon /> Previously Played Songs</h2>
                    </SheetTitle>
                    <SheetDescription>
                        <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                            {previouslyPlayedSongs.map((song, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center space-x-4 mb-2 border rounded-lg px-4"
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
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Suggested by {song.addedBy}
                                        </p>
                                    </div>

                                    {/* total upvotes indicator */}
                                    <div className="flex gap-1 items-center">
                                        <ThumbsUpIcon className="w-4 h-4" /> {song.votes.length}
                                    </div>
                                </div>
                            ))}
                        </ScrollArea>
                    </SheetDescription>
                </SheetHeader>
            </SheetContent>
        </Sheet>
    );
}
