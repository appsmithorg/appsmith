import type { HTMLProps } from "react";

export interface UserAvatarProps extends HTMLProps<HTMLSpanElement> {
  username: string;
}
