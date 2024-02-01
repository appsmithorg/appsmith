import type { ComponentType } from "react";
import type { IconProps as HeadlessIconProps } from "@design-system/headless";

import type { ICONS } from "./icons";
import type { SIZES } from "../../../shared";

export type IconProps = Omit<HeadlessIconProps, "children"> & {
  /** Size of the icon
   * @default medium
   *
   * Note: we need large size for the icon only
   */
  size?: keyof typeof SIZES;
  /** custom icon component
   * Note: if custom icon is provided, name prop will be ignored
   */
  icon?: ComponentType;
  /** Name of the icon*/
  name?: keyof typeof ICONS;
  /** storke width */
  stroke?: number;
  /** filled variant */
  filled?: boolean;
};
