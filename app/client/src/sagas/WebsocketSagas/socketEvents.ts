export const SOCKET_CONNECTION_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
};

export const APP_LEVEL_SOCKET_EVENTS = {
  // notification events
  INSERT_NOTIFICATION: "insert:notification",

  LIST_ONLINE_APP_EDITORS: "collab:online_editors", // user presence

  RELEASE_VERSION_NOTIFICATION: "info:release_version", // release version
};

export const PAGE_LEVEL_SOCKET_EVENTS = {
  START_EDITING_APP: "collab:start_edit",
  STOP_EDITING_APP: "collab:leave_edit",
  LIST_ONLINE_PAGE_EDITORS: "collab:online_editors",
  SHARE_USER_POINTER: "collab:mouse_pointer", // multi pointer
};
