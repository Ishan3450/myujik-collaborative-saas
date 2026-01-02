"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp, Share2, Play, HistoryIcon, ThumbsUpIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import {
  Message,
  Song,
  SongExtended,
} from "@/types/index"

// @ts-ignore
import youtubeurl from "youtube-url";
import { YouTubeEmbed } from "@/components/YoutubeEmbed";

/**
 * Manage and render the owner's music streaming room, including UI, WebSocket synchronization, queue/history management, and playback controls.
 *
 * This component opens and maintains a WebSocket connection for the owner, handles room lifecycle events (create/join/leave/end), synchronizes the song queue and previously played history with the server, provides controls to add/upvote songs, advance or control playback, and exposes a shareable stream URL.
 *
 * @returns The JSX element for the owner's music stream management interface.
 */
export default function MusicStreamOwner() {
  const session: any = useSession();
  const ws = useRef<WebSocket | null>(null);
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [previouslyPlayedSongs, setPreviouslyPlayedSongs] = useState<Song[]>([]);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<SongExtended | null>(null);

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

    window.addEventListener("beforeunload", handleStreamEnd);

    // NOTE: here no need of beforeunload event on the cleanup function because, on refresh also the stream will end
    // leading the participants to be redirected on the home page
  }, [session]);

  async function startWsConnection() {
    return new Promise<void>((resolve) => {
      ws.current = new WebSocket("ws://localhost:8080");

      ws.current.onopen = () => {
        resolve();
      };

      ws.current.addEventListener("message", (event) => {
        const message: Message = JSON.parse(event.data);

        if (message.type === "room_created") {
          setSongs(message.songs);
          setPreviouslyPlayedSongs(message.previouslyPlayedSongs);
          toast.success("Stream started");
        }

        if (message.type === "room_not_exist") {
          toast.error("Room does not exists");
          router.push("/");
        }

        if (message.type === "joined_room" || message.type === "update_list") {
          setSongs(message.songs);
          setPreviouslyPlayedSongs(message.previouslyPlayedSongs);

          // When a song is picked from the queue to play, or when a participant joins the stream
          if (message.currentlyPlaying) {
            setCurrentlyPlaying(message.currentlyPlaying);
          }
        }

        if (message.type === "left_room") {
          setSongs([]);
          setCurrentlyPlaying(null);
          ws.current = null;
          toast.success("Stream Ended");
          router.push("/");
          leaveRoom();
        }

        if (message.type === "song_queue_concluded") {
          setCurrentlyPlaying(null);
        }
      });

      ws.current.onclose = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          handleStreamEnd();
          ws.current = null;
          console.log("Closed the websocket connection");
        }
      };
    });
  }

  const handleStreamEnd = () => {
    ws.current?.send(JSON.stringify({
      type: "owner_ended_stream",
      roomId: session.data?.user?.id,
      songs,
      previouslyPlayedSongs
    }));
    ws.current = null;
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
        updatedHistory: previouslyPlayedSongs,
      })
    );
  };

  const handlePlayNext = () => {
    if (songs.length > 0) {
      const nextSong = sortedSongs[0];
      const newList = sortedSongs.slice(1);
      const updatedHistory = [nextSong, ...previouslyPlayedSongs];

      ws.current?.send(
        JSON.stringify({
          type: "play_next_song",
          songToPlay: nextSong,
          roomId: session.data?.user?.id,
          updatedList: newList,
          updatedHistory: updatedHistory,
        })
      );
    } else if (!songs.length && currentlyPlaying) {
      ws.current?.send(
        JSON.stringify({
          type: "song_queue_concluded",
          roomId: session.data?.user?.id,
        })
      );
    }
  };

  const leaveRoom = () => {
    ws.current?.send(JSON.stringify({
      type: "leave_room",
      roomId: session.data?.user?.id,
      id: session.data?.user?.id
    }));
  }

  const handlePlaySong = () => {
    if (!currentlyPlaying) return;

    ws.current?.send(JSON.stringify({
      type: "song_state_play",
      roomId: session.data?.user?.id,
    }))
  }

  const handlePauseSong = () => {
    if (!currentlyPlaying) return;

    ws.current?.send(JSON.stringify({
      type: "song_state_pause",
      roomId: session.data?.user?.id,
    }))
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
            {sortedSongs.map((song, idx) => (
              <div
                key={idx}
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
                    Requested by {song.addedBy}
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
            <div className="flex justify-between mb-3 items-center">
              <h2 className="text-2xl font-bold">Add Song</h2>
              <Sheet>
                <SheetTrigger className="flex gap-1 items-center text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none">
                  <HistoryIcon className="h-5 w-5" /> History
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
                            <img
                              src={song.extractedThumbnail}
                              alt={song.extractedName}
                              className="h-20 w-20 object-contain rounded"
                            />
                            <div className="flex-grow">
                              <h3 className="font-semibold">{song.extractedName}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Requested by {song.addedBy}
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
            </div>
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
              <YouTubeEmbed
                currentlyPlaying={currentlyPlaying}
                setCurrentlyPlaying={setCurrentlyPlaying}
                handlePlayNext={handlePlayNext}
                websocket={ws.current}
                handlePlaySong={handlePlaySong}
                handlePauseSong={handlePauseSong}
                isAdmin={true}
              />
            ) : (
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