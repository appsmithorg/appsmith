import type { Action } from "entities/Action";
import type { ActionResponse } from "api/ActionAPI";
import type { PostRunActionNamesInterface } from "./types";

export const PostRunActionComponentMap: Record<
  PostRunActionNamesInterface,
  React.ElementType<{
    action: Action;
    actionResponse: ActionResponse;
  }>
> = {};
