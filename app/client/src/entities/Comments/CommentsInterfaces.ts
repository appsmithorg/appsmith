import { COMMENT_EVENTS } from "constants/CommentConstants";
import { RawDraftContentState } from "draft-js";

// export enum CommentThreadParentTypes {
//   widget = "widget",
//   action = "action",
//   datasource = "datasource",
// }

// ref ui sections within a parent
// enum CommentRefChild {
//   body = "body",
//   header = "header",
// }

export type CreateCommentRequest = {
  body: RawDraftContentState;
};

export type CreateCommentThreadRequest = {
  applicationId: string;
  refId: string; // could be an id to refer any parent based on parent type
  tabId?: string;
  position: { top: number; left: number }; // used as a percentage value
  comments: Array<CreateCommentRequest>;
  resolvedState?: {
    active: boolean;
  };
  pinnedState?: {
    active: boolean;
    authorName?: string;
    authorUsername?: string;
  };
  isViewed?: boolean;
};

export type Comment = CreateCommentRequest & {
  id: string;
  authorName?: string;
};

export type CommentThread = Omit<CreateCommentThreadRequest, "comments"> & {
  id: string;
  comments: Array<Comment>;
  userPermissions?: string[];
  new?: boolean;
  sequenceId?: string;
  updationTime?: {
    epochSecond: number;
    nano: number;
  };
};

export type CommentEventPayload = {
  type: typeof COMMENT_EVENTS[keyof typeof COMMENT_EVENTS];
  payload: any; // based on comment event
};

export type CreateCommentThreadPayload = {
  commentBody: RawDraftContentState;
  commentThread: Partial<CreateCommentThreadRequest>;
};

export type AddCommentToCommentThreadSuccessPayload = {
  commentThreadId: string;
  comment: Comment;
};

export type AddCommentToCommentThreadRequestPayload = {
  commentThread: CommentThread;
  commentBody: RawDraftContentState;
  callback: () => void;
};

export type NewCommentEventPayload = {
  comment: Partial<Comment> & {
    _id: string;
    threadId: string;
    body: RawDraftContentState;
  };
};

export type NewCommentThreadPayload = {
  thread: Partial<CommentThread> & { _id: string };
};
