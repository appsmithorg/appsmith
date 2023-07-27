import styled, { css } from "styled-components";
import type { OmitRename } from "../../utils";

import type { TextProps } from "./Text";

type StyledTextProp = OmitRename<TextProps, "className" | "color" | "children">;

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

export const StyledText = styled.div.withConfig({
  shouldForwardProp,
})<TextProps>`
  color: red;
  font-weight: ${({ fontWeight }) => fontWeight};
  text-decoration: ${({ textDecoration }) => textDecoration};
  font-style: ${({ fontStyle }) => fontStyle};
  text-align: ${({ textAlign }) => textAlign};

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
