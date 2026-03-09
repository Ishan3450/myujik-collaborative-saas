import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import type { ServerMessage } from "@repo/shared-types";
import { sendWebsocketMessage } from "@/lib/websocket";


interface UseWebsocketParams {
    role: "owner" | "participant";
    streamId: string | undefined;
    onMessageHandler: (message: ServerMessage) => void;
    onBeforeUnloadHandler: () => void;
}

export default function useWebsocket({ role, streamId, onMessageHandler, onBeforeUnloadHandler }: UseWebsocketParams) {
    const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
    const isManualClose = useRef<boolean>(false);
    const session = useSession();
    const router = useRouter();

    const ws = useRef<WebSocket | null>(null);
    const messageHandlerRef = useRef<(e: MessageEvent) => void>(() => { });

    useEffect(() => {
        if (
            session.status === "loading"
            || !streamId
            || ws.current?.readyState === WebSocket.OPEN
            || ws.current?.readyState === WebSocket.CONNECTING
        ) return;

        async function init() {
            if (session.status === "unauthenticated") {
                toast.error("Unauthorized access !! Login to start stream");
                router.push("/");
                return;
            }

            if (session.status === "authenticated") {
                const userId = session.data?.user?.id;
                if (!userId || !streamId) return;

                try {
                    await startWsConnection();
                } catch {
                    return;
                }

                messageHandlerRef.current = (event: MessageEvent) => {
                    try {
                        onMessageHandler(JSON.parse(event.data));
                    } catch {
                        toast.error("Something went wrong while parsing the message from the server.");
                    }
                }

                ws.current?.addEventListener("message", messageHandlerRef.current);

                if (role === "owner") {
                    sendWebsocketMessage(ws, {
                        type: "owner_create_room",
                        id: userId,
                    });
                }
                if (role === "participant") {
                    sendWebsocketMessage(ws, {
                        type: "join_room",
                        id: userId,
                        roomId: streamId,
                    });
                }
            }
        }
        init();
        window.addEventListener("beforeunload", onBeforeUnloadHandler);

        return () => {
            // Note: WebSocket listener cleanup is intentionally omitted here to prevent
            // reconnection issues on tab switches; listener is removed in leaveRoom instead

            window.removeEventListener("beforeunload", onBeforeUnloadHandler);
        }

        // The exhaustive-deps rule is disabled intentionally:
        // We do not want to add onBeforeUnloadHandler and onMessageHandler as dependencies.
        // - onMessageHandler cannot be included safely because it references websocketCleanup,
        //   which is exported from this hook, making dependency management circular.
        // This ensures stable refs and avoids unnecessary effect reruns.

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, session.status, streamId]);

    async function startWsConnection() {
        isManualClose.current = false;
        return new Promise<void>((resolve, reject) => {
            try {
                const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
                if (!wsUrl) {
                    setStatus("error");
                    reject(new Error("WebSocket URL not found"));
                    return;
                }
                ws.current = new WebSocket(wsUrl);

                ws.current.onopen = () => {
                    setStatus("connected");
                    resolve();
                };

                ws.current.onerror = (error) => {
                    setStatus("error");
                    console.error("WebSocket connection error:", error);
                    reject(error);
                };

                ws.current.onclose = () => {
                    console.log("WebSocket connection closed");
                    if (!isManualClose.current) {
                        setStatus("error");
                    }
                };
            } catch (error) {
                setStatus("error");
                console.error("Error creating WebSocket:", error);
                reject(error);
            }
        });
    }

    function websocketCleanup() {
        isManualClose.current = true;
        ws.current?.removeEventListener("message", messageHandlerRef.current);
        ws.current?.close();
        ws.current = null;
    }

    return { ws, websocketCleanup, status };
}
