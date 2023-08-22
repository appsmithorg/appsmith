import type {
  TypographyColor,
  TypographyVariant,
  TypographyFontWeight,
} from "@design-system/theming";
import type { ReactNode } from "react";
import type { OmitRename } from "../../../utils";

export interface TextProps {
  /** Variant of the text
   * @default body
   */
  variant?: keyof typeof TypographyVariant;
  /** Color of the text
   * @default default — sets inherit via CSS;
   */
  color?: keyof typeof TypographyColor;
  /** Sets the weight (or boldness) of the font
   * @default false
   */
  isBold?: boolean;
  /** Sets the weight (or boldness) of the font. Has priority over isBold prop. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight).
   * @default 400
   */
  fontWeight?: keyof typeof TypographyFontWeight;
  /** Sets a font that is classified as italic.
   * @default false
   */
  isItalic?: boolean;
  /** Sets the horizontal alignment of the inline-level content inside a block element or table-cell box. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/text-align).
   * @default left
   */
  textAlign?: "left" | "center" | "right";
  /** Allows limiting of the contents of a block to the specified number of lines. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp). */
  lineClamp?: number;
  /** Sets the CSS [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) for the element. Only use as a **last resort**. Use style props instead. */
  className?: string;
  /** The children of the component. */
  children: ReactNode;
}

export type StyledTextProp = OmitRename<
  TextProps,
  "className" | "color" | "children"
>;
