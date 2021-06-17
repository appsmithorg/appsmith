import { AppState } from "reducers";
import { get } from "lodash";
import { CommentThread, Comment } from "entities/Comments/CommentsInterfaces";
import { options as filterOptions } from "comments/AppComments/AppCommentsFilterPopover";

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

export const areCommentsEnabledForUserAndApp = (state: AppState) =>
  state.ui.comments?.areCommentsEnabled;

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

const getSortIndexBool = (a: boolean, b: boolean) => {
  if (a && b) return 0;
  if (a) return -1;
  if (b) return 1;
  else return 0;
};

const getSortIndexTime = (
  a: string | number = new Date().toISOString(),
  b: string | number = new Date().toISOString(),
) => {
  const tsA = new Date(a).valueOf();
  const tsB = new Date(b).valueOf();

  if (tsA === tsB) return 0;
  else if (tsA > tsB) return -1;
  else return 1;
};

const getContainsMyComment = (
  thread: CommentThread,
  currentUserUsername?: string,
) =>
  thread.comments.some(
    (comment: Comment) => comment.authorUsername === currentUserUsername,
  );

export const getSortedAndFilteredAppCommentThreadIds = (
  applicationThreadIds: Array<string>,
  commentThreadsMap: Record<string, CommentThread>,
  shouldShowResolved: boolean,
  appCommentsFilter: typeof filterOptions[number]["value"],
  currentUserUsername?: string,
): Array<string> => {
  if (!applicationThreadIds) return [];
  const result = applicationThreadIds
    .sort((a, b) => {
      // TODO verify cases where commentThread can be undefined
      if (!commentThreadsMap[a] || !commentThreadsMap[b]) return -1;

      const {
        pinnedState: isAPinned,
        updationTime: updationTimeA,
      } = commentThreadsMap[a];
      const {
        pinnedState: isBPinned,
        updationTime: updationTimeB,
      } = commentThreadsMap[b];

      const sortIdx = getSortIndexBool(
        !!isAPinned?.active,
        !!isBPinned?.active,
      );
      if (sortIdx !== 0) return sortIdx;

      const result = getSortIndexTime(updationTimeA, updationTimeB);

      return result;
    })
    .filter((threadId: string) => {
      const thread = commentThreadsMap[threadId];

      // Happens during delete thread
      if (!thread) return false;

      const isResolved = thread.resolvedState?.active;
      const isPinned = thread.pinnedState?.active;

      switch (appCommentsFilter) {
        case "show-only-yours": {
          const containsMyComment = getContainsMyComment(
            thread,
            currentUserUsername,
          );
          return containsMyComment;
        }
        case "show-only-pinned": {
          return isPinned && (!isResolved || shouldShowResolved);
        }
        default: {
          return shouldShowResolved || !isResolved;
        }
      }
    });

  return result;
};

export const shouldShowResolved = (state: AppState) =>
  state.ui.comments.shouldShowResolvedAppCommentThreads;

export const appCommentsFilter = (state: AppState) =>
  state.ui.comments.appCommentsFilter;

export const showUnreadIndicator = (state: AppState) =>
  state.ui.comments.showUnreadIndicator;

export const visibleCommentThread = (state: AppState) =>
  state.ui.comments.visibleCommentThreadId;

export const isIntroCarouselVisibleSelector = (state: AppState) =>
  state.ui.comments.isIntroCarouselVisible;
