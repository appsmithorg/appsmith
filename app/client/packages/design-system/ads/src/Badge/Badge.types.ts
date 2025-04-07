import type { Kind } from "../__config__/types";

export type BadgeKind = Exclude<Kind, undefined>;
export type BadgeSize = "small" | "medium";

export interface BadgeProps {
  /** visual style to be used indicating type of badge */
  kind?: BadgeKind;
  /** (try not to) pass addition classes here */
  className?: string;
  /** Size of the badge */
  size?: BadgeSize;
  /** Adds an pulse animation to the badge */
  isAnimated?: boolean;
}
