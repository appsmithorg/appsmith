import styled, { css } from "styled-components";

import type { TextProps } from "./Text";
import { createTypographyStyles } from "../../utils/typography";

const shouldForwardProp = (prop: any) => {
  const propsToOmit = [
    "fontWeight",
    "fontStyle",
    "color",
    "textAlign",
    "textDecoration",
    "lineClamp",
  ];

  return !propsToOmit.includes(prop);
};

const typographyStyles = css`
  ${(props: TextProps) => {
    const { capHeight = 10, fontFamily, lineGap = 8 } = props;
    const styles = createTypographyStyles({ fontFamily, lineGap, capHeight });

    return styles;
  }}
`;

/**
 * adds Truncate styles
 * truncate -> trucate text to single line
 * lineClamp -> truncate text to multiple lines
 *
 * @param {TextProps} props
 * @returns {string}
 */
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
          text-overflow: ellipsis;
          word-break: break-all;
        }
      `;
    }

    return "";
  }}
`;

export const StyledText = styled.div.withConfig({
  shouldForwardProp,
})<TextProps>`
  color: ${({ color }) => color};
  font-weight: ${({ fontWeight }) => fontWeight};
  text-decoration: ${({ textDecoration }) => textDecoration};
  font-style: ${({ fontStyle }) => fontStyle};
  text-align: ${({ textAlign }) => textAlign};

  ${truncateStyles}
  ${typographyStyles}
`;
