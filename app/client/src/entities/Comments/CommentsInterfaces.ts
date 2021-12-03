import { COMMENT_EVENTS } from "constants/CommentConstants";
import { WidgetType } from "constants/WidgetConstants";
import { RawDraftContentState } from "draft-js";
import { APP_MODE } from "entities/App";

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
  mode?: APP_MODE;
};

export type CreateCommentThreadRequest = {
  applicationId: string;
  pageId: string;
  refId: string; // could be an id to refer any parent based on parent type
  tabId?: string;
  position: {
    top?: number;
    left?: number;
    leftPercent: number;
    topPercent: number;
  };
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
  widgetType?: WidgetType;
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
  authorPhotoId?: string;
  authorUsername?: string;
  updationTime?: string;
  creationTime?: string;
  reactions?: Array<Reaction>;
  threadId: string;
} & { _id: string };

export type CommentThread = Omit<CreateCommentThreadRequest, "comments"> & {
  id: string;
  comments: Array<Comment>;
  userPermissions?: string[];
  new?: boolean;
  sequenceId?: string;
  updationTime?: string;
  creationTime?: string;
  viewedByUsers?: Array<string>;
} & { _id: string };

export type DraggedCommentThread = {
  dragPosition: {
    x: number;
    y: number;
  };
  containerSizePosition: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  refId: string;
  widgetType?: WidgetType;
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
