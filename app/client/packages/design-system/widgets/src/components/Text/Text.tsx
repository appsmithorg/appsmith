import { getTypographyClassName } from "@design-system/theming";
import React, { forwardRef } from "react";
import { StyledText } from "./index.styled";
import classNames from "classnames";

import type { Ref } from "react";
import type {
  TypographyVariant,
  TypographyColor,
} from "@design-system/theming";

export interface TextProps {
  /** variant of the text
   * @default body
   */
  variant?: keyof typeof TypographyVariant;
  /** color of the text
   * @default default — sets inherit via CSS;
   */
  color?: keyof typeof TypographyColor;
  /** sets the weight (or boldness) of the font
   * @default false
   */
  isBold?: boolean;
  /** sets the weight (or boldness) of the font
   * @default false
   */
  isItalic?: boolean;
  /** Sets a font that is classified as italic.
   * @default false
   */
  textAlign?: "left" | "center" | "right";
  lineClamp?: number;
  className?: string;
  children: React.ReactNode;
}

const _Text = (props: TextProps, ref: Ref<HTMLParagraphElement>) => {
  const {
    children,
    className,
    color = "default",
    isBold = false,
    isItalic = false,
    lineClamp,
    textAlign = "left",
    variant = "body",
    ...rest
  } = props;

  return (
    <StyledText
      $isBold={isBold}
      $isItalic={isItalic}
      $lineClamp={lineClamp}
      $textAlign={textAlign}
      $variant={variant}
      className={classNames(className, getTypographyClassName(variant))}
      color={color}
      ref={ref}
      {...rest}
    >
      <span>{children}</span>
    </StyledText>
  );
};

export const Text = forwardRef(_Text);
