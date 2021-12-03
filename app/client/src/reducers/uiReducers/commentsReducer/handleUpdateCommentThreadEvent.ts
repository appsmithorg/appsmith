import { ReduxAction } from "constants/ReduxActionConstants";
import { get, uniqBy } from "lodash";
import { CommentsReduxState } from "./interfaces";

// TODO verify cases where commentThread can be undefined for update event
const handleUpdateCommentThreadEvent = (
  state: CommentsReduxState,
  action: ReduxAction<any>,
) => {
  const thread = action.payload;
  const id = thread._id as string;
  const commentThreadInStore = state.commentThreadsMap[id];
  const existingComments = get(commentThreadInStore, "comments", []);
  const newComments = get(action.payload, "comments", []);

  state.commentThreadsMap[id] = {
    ...(commentThreadInStore || {}),
    ...thread,
    id,
    comments: uniqBy([...existingComments, ...newComments], "id"),
  };

  if (!commentThreadInStore) {
    const applicationCommentIdsByRefId = get(
      state.applicationCommentThreadsByRef,
      thread.applicationId,
      {},
    ) as Record<string, Array<string>>;
    const threadsForRefId = get(applicationCommentIdsByRefId, thread.refId, []);
    state.applicationCommentThreadsByRef[thread.applicationId] = {
      ...(state.applicationCommentThreadsByRef[thread.applicationId] || {}),
      [thread.refId]: Array.from(new Set([thread._id, ...threadsForRefId])),
    };
  }

  return {
    ...state,
    lastUpdatedCommentThreadByAppId: {
      ...state.lastUpdatedCommentThreadByAppId,
      [thread.applicationId]: id,
    },
  };
};

export default handleUpdateCommentThreadEvent;
