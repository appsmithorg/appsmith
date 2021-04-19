import { ReduxAction } from "constants/ReduxActionConstants";
import { get } from "lodash";
import { CommentsReduxState } from "./interfaces";

const handleNewCommentThreadEvent = (
  state: CommentsReduxState,
  action: ReduxAction<any>,
) => {
  const { thread } = action.payload;
  const applicationCommentIdsByRefId = get(
    state.applicationCommentThreadsByRef,
    thread.applicationId,
    {},
  ) as Record<string, Array<string>>;
  const threadsForRefId = get(applicationCommentIdsByRefId, thread.refId, []);
  // Prevent duplicate events from hiding the thread popover
  // Can happen if the creator is also receiving the new comment thread updates
  const isVisible = get(
    state.commentThreadsMap,
    `${thread._id}.isVisible`,
    false,
  );
  const existingComments = get(
    state.commentThreadsMap,
    `${thread._id}.comments`,
    [],
  ) as [];

  state.commentThreadsMap[thread._id] = {
    id: thread._id,
    ...thread,
    isVisible,
    comments: [...existingComments, ...(thread.comments || [])],
  };

  if (!state.applicationCommentThreadsByRef[thread.applicationId]) {
    state.applicationCommentThreadsByRef[thread.applicationId] = {};
  }
  state.applicationCommentThreadsByRef[thread.applicationId] = {
    ...state.applicationCommentThreadsByRef[thread.applicationId],
    [thread.refId]: Array.from(new Set([...threadsForRefId, thread._id])),
  };

  return {
    ...state,
  };
};

export default handleNewCommentThreadEvent;
