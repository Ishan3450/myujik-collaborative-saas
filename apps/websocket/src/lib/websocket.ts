import { WebSocket } from "ws";
import type { ServerMessage } from "@repo/shared-types";

export default function sendWebsocketMessage(ws: WebSocket, payload: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
    } else {
        console.log("Failed to send message to the user:", payload);
    }
}
