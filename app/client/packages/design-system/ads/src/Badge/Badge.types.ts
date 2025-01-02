import type { Kind } from "../__config__/types";

export type BadgeKind = Exclude<Kind, "info" | undefined>;

export interface BadgeProps {
  /** visual style to be used indicating type of badge */
  kind?: BadgeKind;
  /** (try not to) pass addition classes here */
  className?: string;
}
