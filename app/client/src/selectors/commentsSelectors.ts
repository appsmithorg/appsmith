import { AppState } from "reducers";
import { get } from "lodash";
import { getCurrentUser } from "selectors/usersSelectors";
import { CommentThread } from "entities/Comments/CommentsInterfaces";

export const refCommentThreadsSelector = (
  refId: string,
  applicationId?: string,
) => (state: AppState) =>
  get(
    state.ui.comments.applicationCommentThreadsByRef,
    `${applicationId}.${refId}`,
    [],
  );

export const commentThreadsSelector = (commentThreadId: string) => (
  state: AppState,
) => state.ui.comments.commentThreadsMap[commentThreadId];

export const unpublishedCommentThreadSelector = (refId: string) => (
  state: AppState,
) => state.ui.comments.unpublishedCommentThreads[refId];

export const commentModeSelector = (state: AppState) =>
  state.ui.comments?.isCommentMode;

export const applicationCommentsSelector = (applicationId: string) => (
  state: AppState,
) => state.ui.comments.applicationCommentThreadsByRef[applicationId];

export const areCommentsEnabledForUser = (state: AppState) => {
  const user = getCurrentUser(state);
  const email = get(user, "email", "");
  const isAppsmithEmail = email.toLowerCase().indexOf("@appsmith.com") !== -1;
  return isAppsmithEmail;
};

/**
 * Comments are stored as a map of refs (for example widgetIds)
 * Flatten to fetch all application comment threads
 */
export const getAppCommentThreads = (
  threadsByRefMap: Record<string, Array<string>>,
): Array<string> => {
  if (!threadsByRefMap) return [];
  return Object.entries(threadsByRefMap).reduce(
    (res: Array<string>, [, threadIds]) => {
      return [...res, ...threadIds];
    },
    [],
  );
};

export const allCommentThreadsMap = (state: AppState) =>
  state.ui.comments.commentThreadsMap;

export const getSortedAppCommentThreadIds = (
  applicationThreadIds: Array<string>,
  commentThreadsMap: Record<string, CommentThread>,
): Array<string> => {
  if (!applicationThreadIds) return [];
  return applicationThreadIds.sort((a, b) => {
    const { isPinned: isAPinned } = commentThreadsMap[a];
    const { isPinned: isBPinned } = commentThreadsMap[b];

    if (isAPinned && isBPinned) return -0;
    if (isAPinned) return -1;
    if (isBPinned) return 1;
    else return 0;
  });
};
