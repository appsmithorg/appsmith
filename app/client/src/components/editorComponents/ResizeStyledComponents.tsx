import { invisible, theme } from "constants/DefaultTheme";

import styled, { css } from "styled-components";

export const VisibilityContainer = styled.div<{
  visible: boolean;
  padding: number;
}>`
  ${props => (!props.visible ? invisible : "")}
  height: 100%;
  width: 100%;
  padding: ${props => props.padding}px;
`;

export const EdgeHandleStyles = css`
  position: absolute;
  z-index: 3;
  width: 20px;
  height: 20px;
  &:before {
    position: absolute;
    background: ${theme.colors.widgetBorder};
    content: "";
    width: 2px;
    height: 2px;
  }
  &:after {
    position: absolute;
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${theme.colors.widgetBorder};
    top: calc(50% - 2px);
    left: calc(50% - 2px);
  }
`;

export const VerticalHandleStyles = css`
  ${EdgeHandleStyles}
  top:0;
  height: 100%;
  cursor: col-resize;
  &:before {
    left: 50%;
    height: 100%;
    top: 0;
  }
`;

export const HorizontalHandleStyles = css`
  ${EdgeHandleStyles}
  left: 0;
  width: 100%;
  cursor: row-resize;
  &:before {
    top: 50%;
    width: 100%;
    left: 0;
  }
`;

export const LeftHandleStyles = css`
  ${VerticalHandleStyles}
  left:-10px;
`;

export const RightHandleStyles = css`
  ${VerticalHandleStyles};
  right: -10px;
`;

export const TopHandleStyles = css`
  ${HorizontalHandleStyles};
  top: -10px;
`;

export const BottomHandleStyles = css`
  ${HorizontalHandleStyles};
  bottom: -10px;
`;

export const CornerHandleStyles = css`
  position: absolute;
  z-index: 3;
  width: 40px;
  height: 40px;
`;

export const BottomRightHandleStyles = css`
  ${CornerHandleStyles}
  bottom: -20px;
  right: -20px;
  cursor: se-resize;
`;

export const BottomLeftHandleStyles = css`
  ${CornerHandleStyles}
  left: -20px;
  bottom: -20px;
  cursor: sw-resize;
`;
export const TopLeftHandleStyles = css`
  ${CornerHandleStyles}
  left: -20px;
  top: -20px;
  cursor: ew-resize;
`;
export const TopRightHandleStyles = css`
  ${CornerHandleStyles}
  right: -20px;
  top: -20px;
  cursor: ne-resize;
`;
