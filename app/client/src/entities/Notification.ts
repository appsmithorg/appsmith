export type AppsmithNotification = {
  id: string;
  _id?: string;
  type: string;
  new: boolean;
  [key: string]: any;
};

export enum NotificationTypes {
  CommentNotification = "CommentNotification",
  CommentThreadNotification = "CommentThreadNotification",
}
