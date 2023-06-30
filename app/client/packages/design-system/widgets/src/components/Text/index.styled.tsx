import styled, { css } from "styled-components";

import type { TypographyVariant } from "@design-system/theming";
import type { FlattenSimpleInterpolation } from "styled-components";
import type { TextProps } from "./Text";

type StyledTextProp = TextProps & {
  typography?: {
    [key in TypographyVariant]?: FlattenSimpleInterpolation;
  };
};

const truncateStyles = css`
  ${(props: TextProps) => {
    const { lineClamp } = props;

    if (typeof lineClamp === "number") {
      return css`
        span {
          display: -webkit-box;
          -webkit-line-clamp: ${lineClamp};
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

export const StyledText = styled.div<StyledTextProp>`
  font-weight: ${({ isBold }) => (isBold ? "bold" : "normal")};
  font-style: ${({ isItalic }) => (isItalic ? "italic" : "normal")};
  text-align: ${({ textAlign }) => textAlign};
  width: 100%;

  ${truncateStyles}

  ${({ typography, variant }) => {
    if (variant && typography) {
      return typography?.[variant];
    }

    return typography?.body;
  }}

  color: ${({ type }) => {
    switch (true) {
      case type === "default":
        return "inherit";
      case type === "neutral":
        return "var(--color-fg-neutral)";
      case type === "positive":
        return "var(--color-fg-positive)";
      case type === "warn":
        return "var(--color-fg-warn)";
      case type === "negative":
        return "var(--color-fg-negative)";
      default:
        return "inherit";
    }
  }}
`;
