import type {
  TYPOGRAPHY_VARIANTS,
  TYPOGRAPHY_FONT_WEIGHTS,
} from "@appsmith/wds-theming";
import type { ReactNode } from "react";
import type { COLORS } from "../../../shared";

export interface TextProps {
  /** size variant of the text
   * @default body
   */
  size?: keyof typeof TYPOGRAPHY_VARIANTS;
  /** Color of the text
   * @default inherit
   */
  color?: keyof typeof COLORS | "neutral-subtle";
  /** Sets the weight (or boldness) of the font
   * @default false
   */
  isBold?: boolean;
  /** Sets the weight (or boldness) of the font. Has priority over isBold prop. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight).
   * @default 400
   */
  fontWeight?: keyof typeof TYPOGRAPHY_FONT_WEIGHTS;
  /** Sets a font that is classified as italic.
   * @default false
   */
  isItalic?: boolean;
  /** Sets the horizontal alignment of the inline-level content inside a block element or table-cell box. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/text-align).
   * @default left
   */
  textAlign?: "start" | "center" | "end";
  /** Allows limiting of the contents of a block to the specified number of lines. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp). */
  lineClamp?: number;
  /** Sets the CSS [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) for the element. Only use as a **last resort**. Use style props instead. */
  className?: string;
  /** The children of the component. */
  children?: ReactNode;
  /** title attribute for the component */
  title?: string;
  /** Sets the HTML [id](https://developer.mozilla.org/en-US/docs/Web/API/Element/id) for the element. */
  id?: string;
  /** extra style properties to pass to the component */
  style?: React.CSSProperties;
  /** The word-break CSS property sets whether line breaks appear wherever the text would otherwise overflow its content box. */
  wordBreak?: "break-word" | "break-all";
}
