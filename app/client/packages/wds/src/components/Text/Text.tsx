import React from "react";
import { StyledText } from "./index.styled";
import type { fontFamilyTypes } from "../../utils/typography";

export type TextProps = {
  children: React.ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
  fontFamily?: fontFamilyTypes;
  fontSize?: string;
  color?: string;
  fontWeight?: "normal" | "bold" | "bolder" | "lighter";
  textDecoration?: "none" | "underline" | "line-through";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  capHeight?: number;
  lineGap?: number;
  as?: keyof JSX.IntrinsicElements;
};

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  (props, ref) => {
    const { children, ...rest } = props;

    return (
      <StyledText ref={ref} {...rest}>
        <span>{children}</span>
      </StyledText>
    );
  },
) as typeof StyledText;
