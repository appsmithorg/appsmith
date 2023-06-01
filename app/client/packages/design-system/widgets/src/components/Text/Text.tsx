import type { Ref } from "react";
import React, { forwardRef } from "react";
import { StyledText } from "./index.styled";
import { useThemeContext } from "@design-system/theming";
import type {
  TypographyVariants,
  TypographyTypes,
} from "@design-system/theming";

export interface TextProps {
  variant?: TypographyVariants;
  type?: TypographyTypes;
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
    } = props;

    const theme = useThemeContext();

    return (
      <StyledText
        className={className}
        isBold={isBold}
        isItalic={isItalic}
        lineClamp={lineClamp}
        ref={ref}
        textAlign={textAlign}
        type={type}
        typography={theme?.typography}
        variant={variant}
      >
        <span>{children}</span>
      </StyledText>
    );
  },
);
