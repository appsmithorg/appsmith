import styled from "styled-components";

export interface IconProps {
  width?: number;
  height?: number;
  color?: string;
  background?: string;
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
    width: ${(props) => props.width + "px" || "var(--ads-font-size-6)"};
    height: ${(props) => props.height + "px" || "var(--ads-font-size-6)"};

    ${(props) =>
      !props.keepColors
        ? `
    path {
      fill: ${props.color || "var(--ads-color-black-0)"};
    }
    circle {
      fill: ${props.background || "var(--ads-old-color-outer-space)"};
    }
    rect {
      fill: ${props.background || "var(--ads-color-black-450)"};
    }`
        : ""}
  }
`;
