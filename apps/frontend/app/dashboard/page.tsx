"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp, Share2, Play } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";

// @ts-ignore
import youtubeurl from "youtube-url";

// Type for a song
type Song = {
  extractedId: string;
  extractedThumbnail: string;
  extractedName: string;
  addedBy: string;
  votes: string[];
};

type Message = {
  type: string;
  songs: Song[];
};

export default function MusicStream() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<Song | null>(null);
  const session: any = useSession();
  const ws = useRef<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (session.status === "loading" || ws.current) return;

    async function init() {
      if (session.status === "unauthenticated") {
        toast.error("Unauthorized access !! Login to start stream");
        router.push("/");
        return;
      }

      if (session.status === "authenticated") {
        await startWsConnection();

        ws.current?.send(
          JSON.stringify({
            type: "owner_create_room",
            id: session.data?.user?.id,
          })
        );
      }
    }
    init();

    // return () => {
    // ws.current?.close();
    // ws.current = null;
    // };
  }, [session]);

  async function startWsConnection() {
    return new Promise<void>((resolve) => {
      ws.current = new WebSocket("ws://localhost:8080");

      ws.current.onopen = () => {
        resolve();
      };

      ws.current.onmessage = (event) => {
        const message: Message = JSON.parse(event.data);

        if (message.type === "room_created") {
          setSongs(message.songs);
          toast.success("Stream started");
        }

        if (message.type === "room_not_exist") {
          toast.error("Room does not exists");
          router.push("/");
        }

        if (message.type === "joined_room" || message.type === "update_list") {
          setSongs(message.songs);
        }

        if (message.type === "left_room") {
          setSongs([]);
          setCurrentlyPlaying(null);
          ws.current = null;
          toast.success("Stream Ended");
          router.push("/");
          leaveRoom();
        }
      };

      ws.current.onclose = () => {
        ws.current = null;
      };
    });
  }

  const handleStreamEnd = () => {
    ws.current?.send(JSON.stringify({
      type: "owner_ended_stream",
      roomId: session.data?.user?.id,
      songs
    }));
  }

  const handleAddSong = async () => {
    if (youtubeurl.valid(youtubeLink)) {
      const videoId = youtubeurl.extractId(youtubeLink);

      ws.current?.send(
        JSON.stringify({
          type: "add_song",
          roomId: session.data?.user?.id,
          addedBy: session.data?.user?.name,
          extractedId: videoId,
        })
      );
      setYoutubeLink("");
    }
  };

  const handleUpvote = (extractedId: string) => {
    const newSongList = songs.map((song) => {
      return song.extractedId === extractedId
        ? {
          ...song,
          votes: [...song.votes, session.data?.user?.id],
        }
        : song;
    });

    ws.current?.send(
      JSON.stringify({
        type: "update_songs_list",
        songs: newSongList,
        roomId: session.data?.user?.id,
      })
    );
  };

  const handlePlayNext = () => {
    if (songs.length > 0) {
      const nextSong = sortedSongs[0];
      setCurrentlyPlaying(nextSong);
      const newList = sortedSongs.slice(1);

      ws.current?.send(
        JSON.stringify({
          type: "update_songs_list",
          roomId: session.data?.user?.id,
          songs: newList,
        })
      );
    } else if (!songs.length && currentlyPlaying) {
      setCurrentlyPlaying(null);
    }
  };

  const leaveRoom = () => {
    ws.current?.send(JSON.stringify({
      type: "leave_room",
      roomId: session.data?.user?.id,
      id: session.data?.user?.id
    }));
  }

  const sortedSongs = [...songs].sort(
    (a, b) => b.votes.length - a.votes.length
  );

  function shareStream() {
    const shareUrl = `${window.location.origin}/stream/${session.data?.user?.id}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast.success("Stream URL copied to clipboard!");
      })
      .catch((error) => {
        console.error("Failed to copy URL:", error);
        toast.error("Failed to copy URL");
      });
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: List of songs */}
        <Card className="p-4">
          <div className="flex justify-between mb-4 items-end">
            <h2 className="text-2xl font-bold">Songs List</h2>
            <Button className="bg-red-600 text-white font-bold" variant={"outline"} onClick={handleStreamEnd}>End Stream</Button>
          </div>
          <ScrollArea className="h-[calc(100vh-200px)]">
            {sortedSongs.map((song) => (
              <div
                key={song.extractedId}
                className="flex items-center space-x-4 mb-4"
              >
                <img
                  src={song.extractedThumbnail}
                  alt={song.extractedName}
                  className="w-20 h-20 object-contain rounded"
                />
                <div className="flex-grow">
                  <h3 className="font-semibold">{song.extractedName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Added by {song.addedBy}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  {!song.votes.find((id) => id === session.data?.user?.id) ? (
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

        {/* Right column: Controls and currently playing */}
        <div className="space-y-3">
          <Card className="p-4">
            <h2 className="text-2xl font-bold mb-4">Add Song</h2>
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
                Add Song
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-2xl font-bold mb-2">Currently Playing</h2>
            {currentlyPlaying ? (
              <LiteYouTubeEmbed
                id={currentlyPlaying.extractedId}
                title={currentlyPlaying.extractedName}
              />
            ) : (
              // <div className="flex items-center space-x-4">
              //   <img
              //     src={currentlyPlaying.extractedThumbnail}
              //     alt={currentlyPlaying.extractedName}
              //     className="w-20 h-20 object-cover rounded"
              //   />
              //   <div>
              //     <h3 className="font-semibold">
              //       {currentlyPlaying.extractedName}
              //     </h3>
              //     <p className="text-sm text-muted-foreground">
              //       Added by {currentlyPlaying.addedBy}
              //     </p>
              //   </div>
              // </div>
              <p>No song is currently playing</p>
            )}
          </Card>

          <div className="flex space-x-2">
            <Button onClick={handlePlayNext} className="flex-1">
              <Play className="mr-2 h-4 w-4" /> Play Next
            </Button>
            <Button variant="outline" className="flex-1" onClick={shareStream}>
              <Share2 className="mr-2 h-4 w-4" /> Share Stream
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
