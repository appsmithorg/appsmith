import type { TooltipPlacement } from "../Tooltip/Tooltip.types";
import type { Sizes } from "../__config__/types";

export type AvatarSize = Extract<Sizes, "sm" | "md">;

// Avatar props
export type AvatarProps = {
  /** The size of the avatar. */
  size?: AvatarSize;
  /** The name of the icon to be used as avatar. */
  svgIconName?: string;
  /** The image of the avatar. */
  image?: string;
  /** The letter to be used as avatar. */
  firstLetter?: string;
  /** The class name for the avatar. */
  className?: string;
  /** The label for the avatar. */
  label: string;
  /** The tooltip placement. */
  tooltipPlacement?: TooltipPlacement;
  /** Whether to enable tooltip or not. */
  isTooltipEnabled?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>;

export type AvatarGroupAvatarProps = Omit<
  AvatarProps,
  "size" | "tooltipPlacement"
>;

export interface AvatarGroupProps {
  /** avatars to be rendered. */
  avatars: AvatarGroupAvatarProps[];
  /** The size of the avatar. */
  size?: AvatarSize;
  /** The class name for the avatar group. */
  className?: string;
  /** The tooltip placement. */
  tooltipPlacement?: TooltipPlacement;
  /** The max number of avatars to be rendered. */
  maxAvatars?: number;
}
