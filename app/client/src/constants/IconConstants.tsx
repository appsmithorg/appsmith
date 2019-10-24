import styled from "styled-components";
import { Color } from "./Colors";

export type IconProps = {
  width: number;
  height: number;
  color: Color;
};

export const IconWrapper = styled.div<IconProps>`
  &:focus {
    outline: none;
  }
  svg {
    width: ${props => props.width || props.theme.fontSizes[7]}px;
    height: ${props => props.height || props.theme.fontSizes[7]}px;
    path {
      fill: ${props => props.color || props.theme.colors.textOnDarkBG};
    }
  }
`;
