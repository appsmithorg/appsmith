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

export const RTS_BASE_PATH = "/rts";
export const WEBSOCKET_NAMESPACE = {
  PAGE_EDIT: "/page/edit",
};
