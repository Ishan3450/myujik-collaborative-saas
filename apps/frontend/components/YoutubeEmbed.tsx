import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useRef, useState } from "react";

import type { ServerMessage, SongExtended } from "@repo/shared-types";
import { Options, YouTubePlayer } from "@/types/YouTube";

import YouTube, { YouTubeEvent } from "react-youtube";
import { InfoIcon, PauseIcon, PlayIcon, RefreshCwIcon } from "lucide-react";

import { Button } from "./ui/button";
import { sendWebsocketMessage } from "@/lib/websocket";


const playerOptions: Options = { // https://developers.google.com/youtube/player_parameters#Parameters
    playerVars: {
        autoplay: 0,
        controls: 1,
        disablekb: 1,
        start: 0, // start time of the video
    }
}

interface YouTubeEmbedProps {
    currentlyPlaying: SongExtended;
    setCurrentlyPlaying: Dispatch<SetStateAction<SongExtended | null>>;
    websocket: MutableRefObject<WebSocket | null>;
    isAdmin?: boolean;
    handlePlayNext?: () => void;
    streamId: string | undefined;
}

export function YouTubeEmbed({ currentlyPlaying, setCurrentlyPlaying, handlePlayNext, websocket, isAdmin = false, streamId }: YouTubeEmbedProps) {
    const [player, setPlayer] = useState<YouTubePlayer | null>(null);
    const [isSongPlaying, setIsSongPlaying] = useState<boolean>(currentlyPlaying.isPlaying);
    const [isStreamPlaying, setIsStreamPlaying] = useState<boolean>(currentlyPlaying.isPlaying);
    const [isDriftNeeded, setIsDriftNeeded] = useState<boolean>(false);

    const songResumedTimeRef = useRef<number>(0);
    const isDriftNeededRef = useRef<boolean>(isDriftNeeded);
    const currentlyPlayingRef = useRef(currentlyPlaying);
    const driftNeededCheckIntervalId = useRef<NodeJS.Timeout | null>(null);

    const checkDriftNeeded = useCallback(async (): Promise<boolean> => {
        if (isDriftNeededRef.current) return true;
        if (!player) return false;
        const timePassedSinceSongPlayed = Math.abs(Math.ceil(await player.getCurrentTime()) - songResumedTimeRef.current);
        const expectedTime = (Date.now() - currentlyPlayingRef.current.playedAt) / 1000;
        const drift = Math.abs(expectedTime - timePassedSinceSongPlayed);

        if (drift >= 5) {
            setIsDriftNeeded(true);
            isDriftNeededRef.current = true;

            if (driftNeededCheckIntervalId.current) {
                clearInterval(driftNeededCheckIntervalId.current);
                driftNeededCheckIntervalId.current = null;
            }
            return true;
        }
        return false;
    }, [player])

    const startDriftCheckInterval = useCallback(() => {
        if (driftNeededCheckIntervalId.current) {
            stopDriftCheckInterval();
        }
        driftNeededCheckIntervalId.current = setInterval(checkDriftNeeded, 5000);
    }, [checkDriftNeeded])

    const syncPlayer = useCallback(async (trigerredFromFrontend = false) => {
        if (!player) return;
        const seekToTime = songResumedTimeRef.current + ((Date.now() - currentlyPlayingRef.current.playedAt) / 1000);
        /*
         * Here the second argument is passed true because:
         * - If passed true then at sync the video will continue playing.
         * - If passed false then at sync the video will seek to that particular
         *   second but won't continue playing it will be stopped.
         */
        await player?.seekTo(Math.min(seekToTime, await player.getDuration()), true);
        setIsDriftNeeded(false);
        isDriftNeededRef.current = false;

        // After sync, restart the drift check interval only if trigerred from frontend
        if (trigerredFromFrontend) {
            startDriftCheckInterval();
        }
    }, [player, startDriftCheckInterval])

    useEffect(() => {
        return () => {
            // Not calling the stopDriftCheckInterval() here becuase it internally calls
            // state variable setIsDriftNeeded causing unnecessary render on unmount.
            if (driftNeededCheckIntervalId.current) {
                clearInterval(driftNeededCheckIntervalId.current);
                driftNeededCheckIntervalId.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const ws = websocket.current;
        if (ws && player) {
            const handleMessage = async (event: MessageEvent) => {
                let parsed: ServerMessage;
                try {
                    parsed = JSON.parse(event.data);
                } catch (error) {
                    console.error("Failed to parse websocket message:", error);
                    return;
                }

                if (parsed.type === "song_state_play") {
                    // Sync player before updating state to ensure it matches the stream's current position.
                    // This prevents playback inconsistencies if the player drifted while paused.
                    if (await checkDriftNeeded()) {
                        await syncPlayer();
                    }

                    /*
                     * Store the time before player resumes playing
                     * Used to calculate the gap after resume
                     * Example: Song play event at 9:45:46, player was paused at 15s
                     * At 9:45:48 should be at 17s, but without storing resumed time
                     * drift check will show incorrect difference
                     */
                    const playerCurrentlyAt = await player.getCurrentTime();
                    if (playerCurrentlyAt > songResumedTimeRef.current) {
                        songResumedTimeRef.current = playerCurrentlyAt;
                    }
                    setCurrentlyPlaying(prev => {
                        if (!prev) return null;
                        return { ...prev, isPlaying: true, playedAt: parsed.updatedPlayTime };
                    });
                    await player.playVideo();
                    setIsStreamPlaying(true);
                }
                if (parsed.type === "song_state_pause") {
                    setCurrentlyPlaying(prev => {
                        if (!prev) return null;
                        return { ...prev, isPlaying: false }
                    });
                    await player.pauseVideo();
                    setIsStreamPlaying(false);
                }
            }
            ws?.addEventListener("message", handleMessage);

            return () => {
                ws?.removeEventListener("message", handleMessage);
            }
        }
    }, [checkDriftNeeded, player, setCurrentlyPlaying, syncPlayer, websocket]);

    useEffect(() => {
        currentlyPlayingRef.current = currentlyPlaying;
    }, [currentlyPlaying]);

    useEffect(() => {
        const syncAndPlay = async () => {
            if (!player) return;

            /**
             * Update songResumedTimeRef to the latest resumed time, this is important for accurate sync when participants
             * newly join or rejoin the stream. It ensures the player can correctly calculate time since resuming, even
             * song has been played -> paused -> played multiple times.
             *
             * Example:
             *   - Song is paused at 30s, then played again at 9:45:46 AM
             *   - songResumedTime is set to 30s
             *   - If a participant joins after this resume, we update the ref to 30s, so their player can sync accurately.
             */
            songResumedTimeRef.current = currentlyPlaying.songResumedTime;

            // This block will be particularly useful when participants join or rejoin the stream
            if (await checkDriftNeeded()) {
                await syncPlayer();
            }
        }
        syncAndPlay();
    }, [checkDriftNeeded, currentlyPlaying.songResumedTime, player, syncPlayer]);

    const handlePlaySong = (songResumedTime: number) => {
        if (!currentlyPlaying || !streamId) return;

        sendWebsocketMessage(websocket, {
            type: "song_state_play",
            roomId: streamId,
            songResumedTime: songResumedTime,
        });
    }

    const handlePauseSong = () => {
        if (!currentlyPlaying || !streamId) return;

        sendWebsocketMessage(websocket, {
            type: "song_state_pause",
            roomId: streamId,
        });
    }

    const handleReady = async (event: YouTubeEvent) => {
        setIsSongPlaying(false);
        const newPlayer: YouTubePlayer = event.target;
        setPlayer(prev => {
            prev?.destroy();
            return newPlayer;
        });
        if (isDriftNeededRef.current || driftNeededCheckIntervalId.current) {
            stopDriftCheckInterval();
        }

        // Wait a bit for the player to be fully ready
        setTimeout(async () => {
            if (currentlyPlayingRef.current.isPlaying) {
                await newPlayer.playVideo();
            } else {
                await newPlayer.pauseVideo();
                startDriftCheckInterval(); // manually need to start the drift check as we kind of manually paused the palyer
            }
        }, 500); // YouTube iframe API can report ready before internal state is fully initialized, that's why small micro delay is there
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handlePlay = (event: YouTubeEvent<number>) => {
        setIsSongPlaying(true);

        // Only start drift detection when the stream is already playing.
        // This prevents unnecessary checks if play was triggered locally by the user.
        if (isStreamPlaying) {
            startDriftCheckInterval();
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handlePause = (event: YouTubeEvent<number>) => {
        setIsSongPlaying(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleEnd = async (event: YouTubeEvent<number>) => {
        setIsSongPlaying(false);
        stopDriftCheckInterval();

        /*
         * Skip to next song only if player is in sync.
         * If drift is detected, will auto sync before
         * advancing to prevent inconsistent playback
         * states across clients.
         */
        if (await checkDriftNeeded()) {
            await syncPlayer();
            return;
        }

        if (isAdmin && handlePlayNext) {
            handlePlayNext();
        }
    };

    const handleError = (event: YouTubeEvent<number>) => {
        setIsSongPlaying(false);
        console.error("Error", event);
    };

    // const handleStateChange = (event: YouTubeEvent<number>) => {};
    // const handlePlaybackRateChange = (event: YouTubeEvent<number>) => {};
    // const handlePlaybackQualityChange = (event: YouTubeEvent<string>) => {};

    const stopDriftCheckInterval = () => {
        if (driftNeededCheckIntervalId.current) {
            clearInterval(driftNeededCheckIntervalId.current);
            driftNeededCheckIntervalId.current = null;
        }
        setIsDriftNeeded(false);
        isDriftNeededRef.current = false;
    }

    const playSongHandler = async () => {
        if (!player) return;
        const playerCurrentlyAt = await player.getCurrentTime();
        handlePlaySong(playerCurrentlyAt);
    }

    if (!streamId) {
        return null;
    }
    return (
        <>
            {!currentlyPlaying.isPlaying && (
                <div className="flex items-center mb-2 gap-1 bg-blue-600 border-blue-800 text-white p-3 rounded-lg">
                    <InfoIcon />
                    {isAdmin ? "Stream Paused by You" : "Stream Paused by Admin"}
                </div>
            )}

            <YouTube
                videoId={currentlyPlaying.extractedId}
                title={currentlyPlaying.extractedName}
                loading={"lazy"}
                opts={playerOptions}
                iframeClassName={"w-full min-h-full rounded-lg aspect-video"}
                onReady={handleReady}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnd={handleEnd}
                onError={handleError}
            // onStateChange={handleStateChange}
            // onPlaybackRateChange={handlePlaybackRateChange}
            // onPlaybackQualityChange={handlePlaybackQualityChange}
            />

            <div className="mt-4">
                <h2 className="text-lg font-semibold">Global Stream Controls</h2>

                <div className="mt-2 flex gap-1">
                    <div className="font-medium">Suggested by</div>
                    <div className="text-gray-800 underline">{currentlyPlaying.addedBy}</div>
                </div>
                <div className="mt-1 flex gap-1">
                    <div className="font-medium">Votes:</div>
                    <div className="text-gray-800">{currentlyPlaying.votes.length}</div>
                </div>
            </div>

            <div className="flex gap-2 mt-3">
                {/*
                  * Only show play/pause controls when:
                  * - User is admin
                  * - No drift is detected (player is in sync)
                  * - Player state matches stream state (prevents duplicate events)
                  */}
                {isAdmin && !isDriftNeeded && isStreamPlaying === isSongPlaying && (
                    <Button variant="outline" size="sm" onClick={isStreamPlaying ? handlePauseSong : playSongHandler}>
                        {isStreamPlaying ? <PauseIcon /> : <PlayIcon />}
                        {isStreamPlaying ? "Pause" : "Play"}
                    </Button>
                )}

                {isDriftNeeded && (
                    <Button size="sm" title="Sync the player with the stream time" onClick={async () => await syncPlayer(true)}>
                        <RefreshCwIcon /> Sync
                    </Button>
                )}
            </div>
        </>
    );
}
