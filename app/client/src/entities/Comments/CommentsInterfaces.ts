import { COMMENT_EVENTS } from "constants/CommentConstants";
import { RawDraftContentState } from "draft-js";
import { APP_MODE } from "reducers/entityReducers/appReducer";

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
  pageId: string;
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
    updationTime?: {
      epochSecond: number;
      nano: number;
    };
  };
  isViewed?: boolean;
  mode?: APP_MODE;
};

export type Reaction = {
  byName: string;
  byUsername: string;
  createdAt: string;
  emoji: string;
};

export type Comment = CreateCommentRequest & {
  id: string;
  authorName?: string;
  authorUsername?: string;
  updationTime?: string;
  creationTime?: string;
  reactions?: Array<Reaction>;
  threadId?: string;
} & { _id: string };

export type CommentThread = Omit<CreateCommentThreadRequest, "comments"> & {
  id: string;
  comments: Array<Comment>;
  userPermissions?: string[];
  new?: boolean;
  sequenceId?: string;
  updationTime?: string;
  creationTime?: string;
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
