import type { HTMLProps } from "react";

export interface AvatarProps extends HTMLProps<HTMLSpanElement> {
  /** The label of the avatar */
  label: string;
  /** The image source of the avatar */
  src?: string;
  /** The size of the avatar
   *
   * @default "medium"
   */
  size?: "small" | "medium" | "large";
}
