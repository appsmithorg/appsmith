import type { AriaLabelingProps, DOMProps } from "@react-types/shared";
import type { ICONS } from "./icons";
import type { COLORS, SIZES } from "../../../shared";

export interface IconProps extends DOMProps, AriaLabelingProps {
  /** Size of the icon
   * @default medium
   *
   * Note: we need large size for the icon only
   */
  size?: keyof typeof SIZES;
  /** Color of the Icon
   * @default inherit
   */
  color?: keyof typeof COLORS;
  /** Name of the icon*/
  name: keyof typeof ICONS;
  /** Storke width */
  stroke?: number;
  /** Defines a string value that labels the current element. */
  "aria-label"?: string;
  /** Defines the role of an element.  */
  role?: string;
  /** Sets the CSS className  for the content popover. Only use as a **last resort**. */
  className?: string;
  /** The aria-hidden state indicates whether the element is exposed to an accessibility API. */
  "aria-hidden"?: boolean | "false" | "true";
}
