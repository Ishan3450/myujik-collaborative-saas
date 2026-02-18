import type { ClientMessage } from '@repo/shared-types';
import type { MutableRefObject } from 'react';

export function sendWebsocketMessage(ws: MutableRefObject<WebSocket | null>, payload: ClientMessage) {
    if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(payload));
    }
}
