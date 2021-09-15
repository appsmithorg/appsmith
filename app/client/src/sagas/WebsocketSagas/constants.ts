export const APP_COMMENTS_SOCKET_EVENTS = {
  // comment events
  // SET_COMMENTS: "SET_COMMENTS",
  INSERT_COMMENT_THREAD: "insert:commentThread",
  INSERT_COMMENT: "insert:comment",
  UPDATE_COMMENT_THREAD: "update:commentThread",
  REPLACE_COMMENT_THREAD: "replace:commentThread",
  DELETE_COMMENT_THREAD: "delete:commentThread",
  UPDATE_COMMENT: "update:comment",
  DELETE_COMMENT: "delete:comment",

  // notification events
  INSERT_NOTIFICATION: "insert:notification",
};

export const APP_MULTIPLAYER_SOCKET_EVENTS = {
  START_EDITING_APP: "collab:start_edit",
  STOP_EDITING_APP: "collab:leave_edit",
  LIST_ONLINE_APP_EDITORS: "collab:online_editors",
  SHARE_USER_POINTER: "collab:mouse_pointer",
};
