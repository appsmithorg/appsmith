import { invisible, theme } from "constants/DefaultTheme";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import styled, { css } from "styled-components";

const EDGE_RESIZE_HANDLE_WIDTH = 10;
const CORNER_RESIZE_HANDLE_WIDTH = 40;

export const VisibilityContainer = styled.div<{
  visible: boolean;
  padding: number;
}>`
  ${props => (!props.visible ? invisible : "")}
  height: 100%;
  width: 100%;
`;

export const EdgeHandleStyles = css`
  position: absolute;
  z-index: 3;
  width: ${EDGE_RESIZE_HANDLE_WIDTH}px;
  height: ${EDGE_RESIZE_HANDLE_WIDTH}px;
  &::before {
    position: absolute;
    background: ${theme.colors.widgetBorder};
    content: "";
  }
  &::after {
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
  top:-${WIDGET_PADDING}px;
  height: calc(100% + ${2 * WIDGET_PADDING}px);
  cursor: col-resize;
  &:before {
    left: 50%;
    bottom: 0px;
    top: 0;
    width: 2px;
  }
`;

export const HorizontalHandleStyles = css`
  ${EdgeHandleStyles}
  left: -${WIDGET_PADDING}px;
  width: calc(100% + ${2 * WIDGET_PADDING}px);
  cursor: row-resize;
  &:before {
    top: 50%;
    right: 0px;
    left: 0px;
    height: 2px;
  }
`;

export const LeftHandleStyles = styled.div`
  ${VerticalHandleStyles}
  left: ${-EDGE_RESIZE_HANDLE_WIDTH / 2 - WIDGET_PADDING}px;
`;

export const RightHandleStyles = styled.div`
  ${VerticalHandleStyles};
  right: ${-EDGE_RESIZE_HANDLE_WIDTH / 2 - WIDGET_PADDING + 1}px;
  height: calc(100% + ${2 * WIDGET_PADDING + 1}px);
`;

export const TopHandleStyles = styled.div`
  ${HorizontalHandleStyles};
  top: ${-EDGE_RESIZE_HANDLE_WIDTH / 2 - WIDGET_PADDING}px;
`;

export const BottomHandleStyles = styled.div`
  ${HorizontalHandleStyles};
  bottom: ${-EDGE_RESIZE_HANDLE_WIDTH / 2 - WIDGET_PADDING + 1}px;
`;

export const CornerHandleStyles = css`
  position: absolute;
  z-index: 3;
  width: ${CORNER_RESIZE_HANDLE_WIDTH}px;
  height: ${CORNER_RESIZE_HANDLE_WIDTH}px;
`;

export const BottomRightHandleStyles = styled.div`
  ${CornerHandleStyles};
  bottom: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  right: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  cursor: se-resize;
`;

export const BottomLeftHandleStyles = styled.div`
  ${CornerHandleStyles};
  left: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  bottom: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  cursor: sw-resize;
`;
export const TopLeftHandleStyles = styled.div`
  ${CornerHandleStyles};
  left: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  top: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  cursor: ew-resize;
`;
export const TopRightHandleStyles = styled.div`
  ${CornerHandleStyles};
  right: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  top: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  cursor: ne-resize;
`;
