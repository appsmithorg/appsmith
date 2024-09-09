import type { AnimatedGridUnit } from "./types";

/** Default rows config. */
export const DEFAULT_ROWS: AnimatedGridUnit[] = ["1fr"];

export const SPRING_ANIMATION_CONFIG = {
  duration: 375,
  friction: 32,
  mass: 1,
  tension: 205,
};
