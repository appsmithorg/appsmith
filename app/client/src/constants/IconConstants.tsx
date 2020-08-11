import styled from "styled-components";
import { Color } from "./Colors";

export type IconProps = {
  width?: number;
  height?: number;
  color?: Color;
  background?: Color;
  onClick?: (e?: any) => void;
  className?: string;
  keepColors?: boolean;
};

export const IconWrapper = styled.div<IconProps>`
  &:focus {
    outline: none;
  }
  display: inline-block;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  svg {
    width: ${props => props.width || props.theme.fontSizes[7]}px;
    height: ${props => props.height || props.theme.fontSizes[7]}px;
    ${props =>
      !props.keepColors
        ? `path {
      fill: ${props.color || props.theme.colors.textOnDarkBG};
    }
    circle {
      fill: ${props.background || props.theme.colors.paneBG};
    }`
        : ""}
`;
