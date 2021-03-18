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
  body: string;
};

export type CreateCommentThreadRequest = {
  applicationId: string;
  refId: string; // could be an id to refer any parent based on parent type
  tabId: string;
  position: { top: number; left: number }; // used as a percentage value
  comments: Array<CreateCommentRequest>;
};

export type Comment = CreateCommentRequest & {
  id: string;
  authorName: string;
};

export type CommentThread = CreateCommentThreadRequest & {
  id: string;
  comments: Array<Comment>;
  isVisible: boolean;
};
