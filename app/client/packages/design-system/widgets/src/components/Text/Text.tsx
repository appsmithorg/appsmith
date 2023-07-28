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
  variant?: keyof typeof TypographyVariant;
  color?: keyof typeof TypographyColor;
  isBold?: boolean;
  isItalic?: boolean;
  textAlign?: "left" | "center" | "right";
  lineClamp?: number;
  className?: string;
  children: React.ReactNode;
}

export const Text = forwardRef(
  (props: TextProps, ref: Ref<HTMLParagraphElement>) => {
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
  },
);
