import { easings } from "@react-spring/web";

import type { AnimatedGridUnit } from "./types";

/** Default rows config. */
export const DEFAULT_ROWS: AnimatedGridUnit[] = ["1fr"];

export const SPRING_ANIMATION_CONFIG = {
  easing: easings.easeInCirc,
};
