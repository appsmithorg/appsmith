import { easings } from "@react-spring/web";

export const DEFAULT_ROWS = ["1fr"];
export const SPRING_ANIMATION_CONFIG = {
  precision: 0.25,
  velocity: 0.025,
  clamp: false,
  easing: easings.easeOutQuart,
};
