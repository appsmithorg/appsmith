import { getTypographyClassName } from "@design-system/theming";
import React, { forwardRef } from "react";
import { StyledText } from "./index.styled";
import classNames from "classnames";

import type { Ref } from "react";
import type { TextProps } from "./types";

const _Text = (props: TextProps, ref: Ref<HTMLParagraphElement>) => {
  const {
    children,
    className,
    color = "default",
    fontWeight = 400,
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
