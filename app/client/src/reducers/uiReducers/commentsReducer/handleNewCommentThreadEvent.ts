import { ReduxAction } from "constants/ReduxActionConstants";
import { get } from "lodash";
import { CommentsReduxState } from "./interfaces";

const handleNewCommentThreadEvent = (
  state: CommentsReduxState,
  action: ReduxAction<any>,
) => {
  const { comment: thread } = action.payload;
  const applicationCommentIdsByRefId = get(
    state.applicationCommentThreadsByRef,
    thread.applicationId,
    {},
  ) as Record<string, Array<string>>;
  const threadsForRefId = get(applicationCommentIdsByRefId, thread.refId, []);
  const isVisible = get(
    state.commentThreadsMap,
    `${thread._id}.isVisible`,
    false,
  );
  return {
    ...state,
    applicationCommentThreadsByRef: {
      ...state.applicationCommentThreadsByRef,
      [thread.applicationId]: {
        ...applicationCommentIdsByRefId,
        [thread.refId]: Array.from(new Set([...threadsForRefId, thread._id])),
      },
    },
    commentThreadsMap: {
      ...state.commentThreadsMap,
      [thread._id]: { id: thread._id, ...thread, isVisible },
    },
  };
};

export default handleNewCommentThreadEvent;
