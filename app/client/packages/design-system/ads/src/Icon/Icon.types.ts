import type { Sizes } from "../__config__/types";
import type { IconNames } from "./Icon.provider";

export type IconSizes = Extract<Sizes, "sm" | "md" | "lg">;

export type IconProps = {
  /** name of the icon from our library */
  name: IconNames;
  /** size of the icon - sm = 12px, md = 16px, lg = 24px */
  size?: IconSizes;
  /** color of the icon */
  color?: string;
  /** class name to be applied to the icon */
  className?: string;
  /** enable a wrapper around the icon */
  withWrapper?: boolean;
  /** color of the wrapper */
  wrapperColor?: string;
} & React.HTMLAttributes<HTMLSpanElement>;

export type { IconNames };
