import { ReduxAction } from "constants/ReduxActionConstants";
import { get } from "lodash";
import { CommentsReduxState } from "./interfaces";

const handleNewCommentThreadEvent = (
  state: CommentsReduxState,
  action: ReduxAction<any>,
) => {
  const thread = action.payload;
  const applicationCommentIdsByRefId = get(
    state.applicationCommentThreadsByRef,
    thread.applicationId,
    {},
  ) as Record<string, Array<string>>;
  const threadsForRefId = get(applicationCommentIdsByRefId, thread.refId, []);
  const existingComments = get(
    state.commentThreadsMap,
    `${thread._id}.comments`,
    [],
  ) as [];

  // TODO override fields explicitly?
  state.commentThreadsMap[thread._id] = {
    ...thread,
    ...(state.commentThreadsMap[thread._id] || {}),
    id: thread._id,
    comments: [...existingComments, ...(thread.comments || [])],
  };

  if (!state.applicationCommentThreadsByRef[thread.applicationId]) {
    state.applicationCommentThreadsByRef[thread.applicationId] = {};
  }
  state.applicationCommentThreadsByRef[thread.applicationId] = {
    ...state.applicationCommentThreadsByRef[thread.applicationId],
    [thread.refId]: Array.from(new Set([thread._id, ...threadsForRefId])),
  };

  /**
   * Private threads are a part of the comments onboarding
   * These are termed bot threads, triggered from the backend based on the onboarding flow
   * We set these as visible and hide the currently visible thread, following the create event
   */

  if (thread.isPrivate) {
    state.visibleCommentThreadId = thread._id;
  }

  return {
    ...state,
    lastUpdatedCommentThreadByAppId: {
      ...state.lastUpdatedCommentThreadByAppId,
      [thread.applicationId]: thread._id,
    },
  };
};

export default handleNewCommentThreadEvent;
