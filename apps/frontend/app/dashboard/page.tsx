"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import toast from "react-hot-toast";
import { Play, HistoryIcon, LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ShareButton from "@/components/ui/share-button";
import { YouTubeEmbed } from "@/components/YoutubeEmbed";
import SongsList from "@/components/SongsList";
import PreviouslyPlayedSongsList from "@/components/PreviouslyPlayedSongsList";
import SuggestSong from "@/components/SuggestSong";
import { sortSongsByVotes } from "@/lib/song";
import { sendWebsocketMessage } from "@/lib/websocket";
import useWebsocket from "@/hooks/useWebsocket";
import WebsocketConnectionLoader from "@/components/ui/websocket-connection-loader";

import type { Song, SongExtended, ServerMessage } from "@repo/shared-types";


export default function MusicStreamOwner() {
  const session = useSession();
  const router = useRouter();
  const streamId = session.data?.user?.id;

  const [songs, setSongs] = useState<Song[]>([]);
  const [previouslyPlayedSongs, setPreviouslyPlayedSongs] = useState<Song[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<SongExtended | null>(null);

  const songsRef = useRef(songs);
  const previouslyPlayedSongsRef = useRef(previouslyPlayedSongs);

  // Flag holds whether a "play next song" request is currently in progress to prevent concurrent handlePlayNext calls
  const isLoadingNextSong = useRef<boolean>(false);

  const sortedSongs = useMemo(() => sortSongsByVotes(songs), [songs])
  const handleStreamEnd = () => {
    if (!streamId) return;

    sendWebsocketMessage(ws, {
      type: "owner_ended_room",
    });
  }

  const { ws, websocketCleanup, status } = useWebsocket({
    role: "owner",
    streamId: streamId,
    onBeforeUnloadHandler: handleStreamEnd,
    onMessageHandler: (message: ServerMessage) => {
      if (message.type === "room_created") {
        setSongs(message.songs);
        setPreviouslyPlayedSongs(message.previouslyPlayedSongs);
        toast.success("Stream started");
      }

      if (message.type === "joined_room" || message.type === "update_list") {
        setSongs(message.songs);
        setPreviouslyPlayedSongs(message.previouslyPlayedSongs);

        // When a song is picked from the queue to play, or when a participant joins the stream
        if (message.currentlyPlaying) {
          isLoadingNextSong.current = false;
          setCurrentlyPlaying(message.currentlyPlaying);
        }
      }

      if (message.type === "left_room") {
        websocketCleanup();
        isLoadingNextSong.current = false;
        setSongs([]);
        setCurrentlyPlaying(null);
        toast.success(message.reason);
        router.push("/");
      }

      if (message.type === "song_queue_concluded") {
        isLoadingNextSong.current = false;
        setCurrentlyPlaying(null);
      }
    },
  });

  useEffect(() => {
    songsRef.current = songs;
    previouslyPlayedSongsRef.current = previouslyPlayedSongs;
  }, [songs, previouslyPlayedSongs]);

  const handlePlayNext = useCallback(() => {
    if (!streamId) return;

    if (sortedSongs.length > 0) {
      const nextSong = sortedSongs[0];
      const newList = sortedSongs.slice(1);
      const updatedHistory = [nextSong, ...previouslyPlayedSongsRef.current];

      sendWebsocketMessage(ws, {
        type: "play_next_song",
        songToPlay: nextSong,
        updatedList: newList,
        updatedHistory: updatedHistory,
      });
    } else if (!sortedSongs.length && currentlyPlaying) {
      sendWebsocketMessage(ws, {
        type: "song_queue_concluded",
      });
    }
  }, [currentlyPlaying, sortedSongs, streamId, ws]);

  useEffect(() => {
    if (!isLoadingNextSong.current && !currentlyPlaying && songs.length > 0) {
      isLoadingNextSong.current = true;
      handlePlayNext();
    }
  }, [currentlyPlaying, handlePlayNext, songs]);

  useEffect(() => {
    if (status === "error") {
      toast.error("Something went wrong.");
      router.replace("/");
    }
  }, [router, status]);

  if (status === "error") {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      {status === "connecting" && (
        <WebsocketConnectionLoader
          title="Creating your music stream..."
          subtitle="Booting up a fresh server and getting everything ready. This may take a few moments, especially if servers are waking up."
        />
      )}

      {status === "connected" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: List of songs */}
          <SongsList
            ws={ws}
            userId={session.data?.user?.id}
            streamId={streamId}
            songsList={sortedSongs}
            songsListRef={songsRef}
          />

          {/* Right column: Controls and currently playing */}
          <div className="space-y-3">
            <SuggestSong
              ws={ws}
              roomId={streamId}
              suggestedBy={session.data?.user?.name}
            />

            <Card className="p-4">
              <h2 className="text-2xl font-bold mb-2">Currently Playing</h2>
              {currentlyPlaying ? (
                <YouTubeEmbed
                  currentlyPlaying={currentlyPlaying}
                  setCurrentlyPlaying={setCurrentlyPlaying}
                  websocket={ws}
                  isAdmin={true}
                  handlePlayNext={handlePlayNext}
                  streamId={streamId}
                />
              ) : (
                <p>No song is currently playing</p>
              )}
            </Card>

            {/* action buttons */}
            <div className="grid grid-cols-2 xl:flex xl:space-x-2 gap-2">
              <Button onClick={handlePlayNext} className="flex-1">
                <Play className="h-4 w-4" /> Play Next
              </Button>

              <ShareButton streamId={streamId} className="flex-1" />

              <Button variant={"outline"} onClick={handleStreamEnd} className="border-red-400 text-red-400 hover:bg-red-600 hover:text-white flex-1">
                <LogOutIcon /> End Stream
              </Button>

              <PreviouslyPlayedSongsList previouslyPlayedSongs={previouslyPlayedSongs}>
                <Button variant={"outline"} className="flex-1 border-blue-500 text-blue-500 hover:text-white hover:bg-blue-600">
                  <HistoryIcon className="h-4 w-4" /> History
                </Button>
              </PreviouslyPlayedSongsList>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
