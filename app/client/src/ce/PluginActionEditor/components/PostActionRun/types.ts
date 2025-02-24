export const PostRunActionNames = {} as const;

export type PostRunActionNamesInterface =
  (typeof PostRunActionNames)[keyof typeof PostRunActionNames];
