import styled, { css } from "styled-components";
import type { PickRename } from "../../utils/PickRename";

import type { TextProps } from "./Text";

type StyledTextProp = PickRename<
  TextProps,
  {
    isBold: "$isBold";
    isItalic: "$isItalic";
    lineClamp: "$lineClamp";
    textAlign: "$textAlign";
    variant: "$variant";
  }
>;

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

export const StyledText = styled.div<StyledTextProp>`
  font-weight: ${({ $isBold }) => ($isBold ? "bold" : "normal")};
  font-style: ${({ $isItalic }) => ($isItalic ? "italic" : "normal")};
  text-align: ${({ $textAlign }) => $textAlign};
  max-width: 100%;

  color: ${({ color }) => {
    switch (true) {
      case color === "default":
        return "inherit";
      case color === "neutral":
        return "var(--color-fg-neutral)";
      case color === "positive":
        return "var(--color-fg-positive)";
      case color === "warn":
        return "var(--color-fg-warn)";
      case color === "negative":
        return "var(--color-fg-negative)";
      default:
        return "inherit";
    }
  }};

  ${truncateStyles};
`;
