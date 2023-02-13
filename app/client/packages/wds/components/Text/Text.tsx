import React, { useMemo } from "react";
import { StyledText } from "./index.styled";
import { createTypographyStyles, fontFamilyTypes } from "./utils";

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
};

export const Text = React.forwardRef<HTMLDivElement, TextProps>(
  (props, ref) => {
    const {
      capHeight = 10,
      children,
      fontFamily,
      lineGap = 8,
      textAlign = "center",
      ...rest
    } = props;

    const typographyStyles = useMemo(() => {
      return createTypographyStyles({ fontFamily, capHeight, lineGap });
    }, [fontFamily, capHeight, lineGap]);

    return (
      <StyledText
        ref={ref}
        textAlign={textAlign}
        {...rest}
        style={typographyStyles}
      >
        {children}
      </StyledText>
    );
  },
) as typeof StyledText;
