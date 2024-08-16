import styled from "styled-components";
import type { Color } from "./Colors";

export interface IconProps {
  width?: number;
  height?: number;
  color?: Color;
  background?: Color;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: (e?: any) => void;
  className?: string;
  keepColors?: boolean;
  disabled?: boolean;
  cursor?: "move" | "grab" | "default";
}

export const IconWrapper = styled.div<IconProps>`
  &:focus {
    outline: none;
  }

  display: inline-flex;
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  cursor: ${(props) =>
    props.disabled
      ? "not-allowed"
      : props.onClick
        ? "pointer"
        : props.cursor ?? "default"};
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};

  && svg {
    width: ${(props) => props.width || props.theme.fontSizes[6]}px;
    height: ${(props) => props.height || props.theme.fontSizes[6]}px;

    ${(props) =>
      !props.keepColors
        ? `
    path {
      fill: ${props.color || props.theme.colors.textOnDarkBG};
    }
    circle {
      fill: ${props.background || props.theme.colors.paneBG};
    }
    rect {
      fill: ${props.background || props.theme.colors.propertyPane.jsIconBg};
    }`
        : ""}
  }
`;
