import { CommentThread } from "entities/Comments/CommentsInterfaces";

export interface CommentsReduxState {
  commentThreadsMap: Record<string, CommentThread>;
  applicationCommentThreadsByRef: Record<string, Record<string, Array<string>>>;
  unpublishedCommentThreads: Record<string, CommentThread>;
  isCommentMode: boolean;
  creatingNewThread: boolean;
  creatingNewThreadComment: boolean;
}
