import { CommentThread } from "entities/Comments/CommentsInterfaces";
import { options as filterOptions } from "comments/AppComments/AppCommentsFilterPopover";
import { EditorState } from "draft-js";

export interface CommentsReduxState {
  commentThreadsMap: Record<string, CommentThread>;
  applicationCommentThreadsByRef: Record<string, Record<string, Array<string>>>;
  unpublishedCommentThreads: Record<string, CommentThread>;
  isCommentMode: boolean;
  creatingNewThread: boolean;
  creatingNewThreadComment: boolean;
  appCommentsFilter: typeof filterOptions[number]["value"];
  shouldShowResolvedAppCommentThreads: boolean;
  visibleCommentThreadId?: string;
  isIntroCarouselVisible?: boolean;
  unsubscribed: boolean;
  draggingCommentThreadId: string | null;
  dragPointerOffset: {
    x: number;
    y: number;
  } | null;
  unpublishedThreadDraftComment: EditorState | null;
  draftComments: Record<string, EditorState>;
  commentThreadsFetched: boolean;
  lastUpdatedCommentThreadByAppId: Record<string, string | null>;
}
