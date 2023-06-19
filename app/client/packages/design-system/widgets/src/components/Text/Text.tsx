import { getTypographyClassName } from "@design-system/theming";
import React, { forwardRef } from "react";
import { StyledText } from "./index.styled";
import classNames from "classnames";

import type { Ref } from "react";
import type { TypographyVariant, TypographyType } from "@design-system/theming";

export interface TextProps {
  variant?: keyof typeof TypographyVariant;
  type?: TypographyType;
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
      isBold = false,
      isItalic = false,
      lineClamp,
      textAlign = "left",
      type = "default",
      variant = "body",
      ...rest
    } = props;

    return (
      <StyledText
        className={classNames(className, getTypographyClassName(variant))}
        isBold={isBold}
        isItalic={isItalic}
        lineClamp={lineClamp}
        ref={ref}
        textAlign={textAlign}
        type={type}
        variant={variant}
        {...rest}
      >
        <span>{children}</span>
      </StyledText>
    );
  },
);
