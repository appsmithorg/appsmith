import styled from "styled-components";
import type { CommonComponentProps } from "../types/common";
import type { TypographyKeys } from "../constants/typography";
import { typography } from "../constants/typography";
import { Classes } from "../constants/classes";

export enum TextType {
  P0 = "p0",
  P1 = "p1",
  P2 = "p2",
  P3 = "p3",
  P4 = "p4",
  H1 = "h1",
  H2 = "h2",
  H3 = "h3",
  H4 = "h4",
  H5 = "h5",
  H6 = "h6",
  BUTTON_MEDIUM = "btnMedium",
  BUTTON_SMALL = "btnSmall",
  SIDE_HEAD = "sideHeading",
  DANGER_HEADING = "dangerHeading",
}

export enum Case {
  UPPERCASE = "uppercase",
  LOWERCASE = "lowercase",
  CAPITALIZE = "capitalize",
}

export enum FontWeight {
  BOLD = "bold",
  NORMAL = "normal",
}

export type TextProps = CommonComponentProps & {
  type: TextType;
  underline?: boolean;
  italic?: boolean;
  case?: Case;
  weight?: FontWeight | string;
  highlight?: boolean;
  textAlign?: string;
  color?: string;
};

const typeSelector = (props: TextProps): string => {
  let color = "";
  switch (props.type) {
    case TextType.P0:
      color = "var(--ads-v2-color-fg)";
      break;
    case TextType.P1:
      color = "var(--ads-v2-color-fg)";
      break;
    case TextType.P2:
      color = "var(--ads-v2-color-fg)";
      break;
    case TextType.P3:
      color = "var(--ads-v2-color-fg)";
      break;
    default:
      color = "var(--ads-v2-color-fg-emphasis-plus)";
      break;
  }
  return color;
};

const getFontWeight = ({
  type,
  weight,
}: {
  weight: string | undefined;
  type: TypographyKeys;
}) => {
  if (weight) {
    switch (weight) {
      case FontWeight.BOLD:
        return "var(--ads-font-weight-bold)";
      case FontWeight.NORMAL:
        return "normal";
      default:
        return weight;
    }
  } else {
    return typography[type].fontWeight;
  }
};

const Text = styled.span.attrs<TextProps>(({ className, cypressSelector }) => ({
  className: className ? `${className} ${Classes.TEXT}` : Classes.TEXT,
  "data-cy": cypressSelector,
}))<TextProps>`
  text-decoration: ${(props) => (props.underline ? "underline" : "unset")};
  font-style: ${(props) => (props.italic ? "italic" : "normal")};
  font-weight: ${(props) =>
    getFontWeight({
      type: props.type,
      weight: props.weight,
    })};
  font-size: ${(props) => typography[props.type].fontSize}px;
  line-height: ${(props) => typography[props.type].lineHeight}px;
  letter-spacing: ${(props) => typography[props.type].letterSpacing}px;
  color: ${(props) =>
    props.highlight
      ? "var(--ads-text-highlight-color)"
      : props.color
        ? props.color
        : typeSelector(props)};
  text-transform: ${(props) => (props.case != null ? props.case : "none")};
  text-align: ${(props) => (props.textAlign ? props.textAlign : "normal")};
`;

export default Text;
