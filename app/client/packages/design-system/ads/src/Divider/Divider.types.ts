import type { HTMLAttributes } from "react";

export type DividerProps = {
  /** control the direction of the divider*/
  orientation: "horizontal" | "vertical";
  /** (try not to) pass addition classes here */
  className?: string;
} & HTMLAttributes<HTMLSpanElement>;
