import { CommentThread } from "entities/Comments/CommentsInterfaces";
import { options as filterOptions } from "comments/AppComments/AppCommentsFilterPopover";

export interface CommentsReduxState {
  commentThreadsMap: Record<string, CommentThread>;
  applicationCommentThreadsByRef: Record<string, Record<string, Array<string>>>;
  unpublishedCommentThreads: Record<string, CommentThread>;
  isCommentMode: boolean;
  isSnipingMode: boolean;
  creatingNewThread: boolean;
  creatingNewThreadComment: boolean;
  appCommentsFilter: typeof filterOptions[number]["value"];
  shouldShowResolvedAppCommentThreads: boolean;
  unreadCommentThreadsCount: number;
  visibleCommentThreadId?: string;
  isIntroCarouselVisible?: boolean;
  areCommentsEnabled?: boolean;
}
