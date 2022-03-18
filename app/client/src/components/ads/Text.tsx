import styled from "styled-components";
import { ThemeProp, Classes, CommonComponentProps } from "./common";
import { Theme } from "constants/DefaultTheme";
import { TypographyKeys } from "constants/typography";

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

const typeSelector = (props: TextProps & ThemeProp): string => {
  let color = "";
  switch (props.type) {
    case TextType.P0:
      color = props.theme.colors.text.normal;
      break;
    case TextType.P1:
      color = props.theme.colors.text.normal;
      break;
    case TextType.P2:
      color = props.theme.colors.text.normal;
      break;
    case TextType.P3:
      color = props.theme.colors.text.normal;
      break;
    default:
      color = props.theme.colors.text.heading;
      break;
  }
  return color;
};

const getFontWeight = ({
  theme,
  type,
  weight,
}: {
  theme: Theme;
  weight: string | undefined;
  type: TypographyKeys;
}) => {
  if (weight) {
    switch (weight) {
      case FontWeight.BOLD:
        return theme.fontWeights[2];
      case FontWeight.NORMAL:
        return "normal";
      default:
        return weight;
    }
  } else {
    return theme.typography[type].fontWeight;
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
      theme: props.theme,
      type: props.type,
      weight: props.weight,
    })};
  font-size: ${(props) => props.theme.typography[props.type].fontSize}px;
  line-height: ${(props) => props.theme.typography[props.type].lineHeight}px;
  letter-spacing: ${(props) =>
    props.theme.typography[props.type].letterSpacing}px;
  color: ${(props) =>
    props.highlight
      ? props.theme.colors.text.highlight
      : props.color
      ? props.color
      : typeSelector(props)};
  text-transform: ${(props) => (props.case ? props.case : "none")};
  text-align: ${(props) => (props.textAlign ? props.textAlign : "normal")};
`;

export default Text;
