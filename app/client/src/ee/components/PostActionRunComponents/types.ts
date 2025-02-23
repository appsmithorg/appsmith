import type { PostRunActionNames } from "ce/components/PostActionRunComponents/types";

export type PostRunActionNamesInterface =
  (typeof PostRunActionNames)[keyof typeof PostRunActionNames];
