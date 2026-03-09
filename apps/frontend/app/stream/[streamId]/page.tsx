"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { DoorOpenIcon, HistoryIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ShareButton from "@/components/ui/share-button";
import { YouTubeEmbed } from "@/components/YoutubeEmbed";
import UserStreamConfigDialog from "@/components/UserStreamConfigDialog";
import SongsList from "@/components/SongsList";
import PreviouslyPlayedSongsList from "@/components/PreviouslyPlayedSongsList";
import SuggestSong from "@/components/SuggestSong";
import { sortSongsByVotes } from "@/lib/song";
import useWebsocket from "@/hooks/useWebsocket";
import { sendWebsocketMessage } from "@/lib/websocket";
import WebsocketConnectionLoader from "@/components/ui/websocket-connection-loader";

import type { Song, SongExtended, ServerMessage } from "@repo/shared-types";


export default function MusicStreamParticipant({
  params,
}: {
  params: { streamId: string };
}) {
  const { streamId } = params;

  const session = useSession();
  const router = useRouter();

  const [songs, setSongs] = useState<Song[]>([]);
  const [previouslyPlayedSongs, setPreviouslyPlayedSongs] = useState<Song[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<SongExtended | null>(null);
  const [showDialog, setShowDialog] = useState<boolean>(true);

  const songsRef = useRef(songs);

  const leaveRoom = () => {
    const userId = session.data?.user?.id;

    if (userId) {
      sendWebsocketMessage(ws, {
        type: "leave_room",
        roomId: streamId,
        id: userId,
      });
      toast.success("Leaving stream");
    }
    websocketCleanup();
    router.push("/");
  }

  const { ws, websocketCleanup, status } = useWebsocket({
    role: "participant",
    streamId: streamId,
    onBeforeUnloadHandler: leaveRoom,
    onMessageHandler: (message: ServerMessage) => {
      if (message.type === "room_not_exist") {
        toast.error("Room does not exist");
        websocketCleanup();
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
        websocketCleanup();
        setSongs([]);
        setCurrentlyPlaying(null);
        toast.success("Stream Ended");
        router.push("/");
      }

      if (message.type === "song_queue_concluded") {
        setCurrentlyPlaying(null);
      }
    }
  })

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  const sortedSongs = useMemo(() => sortSongsByVotes(songs), [songs])

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
    <div className="container mx-auto px-4 py-3">
      {status === "connecting" && (
        <WebsocketConnectionLoader
          title="Finding the stream..."
          subtitle="Connecting to the stream. Hang tight, this won't take long."
        />
      )}

      {status === "connected" && (
        <>
          <UserStreamConfigDialog
            showDialog={showDialog}
            setShowDialog={setShowDialog}
            leaveRoom={leaveRoom}
          />

          {!showDialog && (
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
                      streamId={streamId}
                    />
                  ) : (
                    <p>No song is currently playing</p>
                  )}
                </Card>

                {/* action buttons */}
                <div className="flex space-x-2">
                  <ShareButton streamId={streamId} className="flex-1" />

                  <Button className="flex-1 border-red-400 text-red-600 hover:text-red-600" variant={"outline"} onClick={leaveRoom}>
                    <DoorOpenIcon />
                    Leave Stream
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
        </>
      )}
    </div>
  );
}
