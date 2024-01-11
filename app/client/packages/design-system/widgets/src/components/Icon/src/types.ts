import type { ComponentType } from "react";
import type { IconProps as HeadlessIconProps } from "@design-system/headless";

import type { ICONS } from "./icons";

export type IconProps = HeadlessIconProps & {
  /** Size of the icon
   * @default medium
   */
  size?: "small" | "medium" | "large";
  /** custom icon component
   * Note: if custom icon is provided, name prop will be ignored
   */
  icon?: ComponentType;
  /** Name of the icon*/
  name?: keyof typeof ICONS;
};
