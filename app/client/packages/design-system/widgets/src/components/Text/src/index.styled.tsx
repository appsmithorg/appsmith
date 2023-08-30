import type { TypographyFontWeight } from "@design-system/theming";
import styled, { css } from "styled-components";

import type { StyledTextProp } from "./types";

const truncateStyles = css<StyledTextProp>`
  ${(props) => {
    const { $lineClamp } = props;

    if (typeof $lineClamp === "number") {
      return css`
        span {
          display: -webkit-box;
          -webkit-line-clamp: ${$lineClamp};
          -webkit-box-orient: vertical;
          overflow: hidden;
          overflow-wrap: break-word;
        }
      `;
    }

    return css`
      span {
        overflow-wrap: break-word;
      }
    `;
  }}}
`;

const getFontWeight = (
  fontWeight?: keyof typeof TypographyFontWeight,
  isBold?: boolean,
) => {
  if (fontWeight) return fontWeight;

  return isBold ? "bold" : "inherit";
};

export const StyledText = styled.div<StyledTextProp>`
  font-weight: ${({ $fontWeight, $isBold }) =>
    getFontWeight($fontWeight, $isBold)};
  font-style: ${({ $isItalic }) => ($isItalic ? "italic" : "normal")};
  text-align: ${({ $textAlign }) => $textAlign};
  width: auto;

  color: ${({ color }) => {
    switch (true) {
      case color === "default":
        return "inherit";
      case color === "neutral":
        return "var(--color-fg-neutral)";
      case color === "positive":
        return "var(--color-fg-positive)";
      case color === "warning":
        return "var(--color-fg-warning)";
      case color === "negative":
        return "var(--color-fg-negative)";
      default:
        return "inherit";
    }
  }};

  ${truncateStyles};
`;
