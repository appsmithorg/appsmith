import clsx from "clsx";
import type { Ref } from "react";
import React, { forwardRef } from "react";
import { getTypographyClassName } from "@design-system/theming";

import type { TextProps } from "./types";
import { StyledText } from "./index.styled";

const _Text = (props: TextProps, ref: Ref<HTMLParagraphElement>) => {
  const {
    children,
    className,
    color = "default",
    fontWeight,
    isBold = false,
    isItalic = false,
    lineClamp,
    textAlign = "left",
    variant = "body",
    ...rest
  } = props;

  return (
    <StyledText
      $fontWeight={fontWeight}
      $isBold={isBold}
      $isItalic={isItalic}
      $lineClamp={lineClamp}
      $textAlign={textAlign}
      $variant={variant}
      className={clsx(className, getTypographyClassName(variant))}
      color={color}
      ref={ref}
      {...rest}
    >
      <span>{children}</span>
    </StyledText>
  );
};

export const Text = forwardRef(_Text);
