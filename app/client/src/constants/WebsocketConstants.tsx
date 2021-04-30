export const WEBSOCKET_EVENTS = {
  RECONNECT: "RECONNECT",
  DISCONNECTED: "DISCONNECTED",
  CONNECTED: "CONNECTED",
};

export const reconnectWebsocketEvent = () => ({
  type: WEBSOCKET_EVENTS.RECONNECT,
});

export const websocketDisconnectedEvent = () => ({
  type: WEBSOCKET_EVENTS.DISCONNECTED,
});

export const websocketConnectedEvent = () => ({
  type: WEBSOCKET_EVENTS.CONNECTED,
});
