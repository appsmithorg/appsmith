import { invisible, theme } from "constants/DefaultTheme";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import styled, { css } from "styled-components";

const EDGE_RESIZE_HANDLE_WIDTH = 12;
const CORNER_RESIZE_HANDLE_WIDTH = 10;

export const VisibilityContainer = styled.div<{
  visible: boolean;
  padding: number;
}>`
  ${(props) => (!props.visible ? invisible : "")}
  height: 100%;
  width: 100%;
`;

const ResizeIndicatorStyle = css<{
  showLightBorder: boolean;
}>`
  &::after {
    position: absolute;
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${(props) =>
      props.showLightBorder
        ? theme.colors.widgetLightBorder
        : theme.colors.widgetBorder};
    top: calc(50% - 2px);
    left: calc(50% - 2px);
  }
`;

export const EdgeHandleStyles = css<{
  showAsBorder: boolean;
  showLightBorder: boolean;
}>`
  position: absolute;
  width: ${EDGE_RESIZE_HANDLE_WIDTH}px;
  height: ${EDGE_RESIZE_HANDLE_WIDTH}px;
  &::before {
    position: absolute;
    background: ${(props) => {
      if (props.showLightBorder) return theme.colors.widgetLightBorder;

      if (props.showAsBorder) return theme.colors.widgetMultiSelectBorder;

      return theme.colors.widgetBorder;
    }};
    content: "";
  }
  ${(props) => (!props.showAsBorder ? ResizeIndicatorStyle : "")}
`;

export const VerticalHandleStyles = css<{
  showAsBorder: boolean;
  showLightBorder: boolean;
}>`
  ${EdgeHandleStyles}
  top:-${WIDGET_PADDING - 1}px;
  height: calc(100% + ${2 * WIDGET_PADDING - 1}px);
  ${(props) => (!props.showAsBorder ? "cursor: col-resize;" : "")}
  &:before {
    left: 50%;
    bottom: 0px;
    top: 0;
    width: 1px;
  }
`;

export const HorizontalHandleStyles = css<{
  showAsBorder: boolean;
  showLightBorder: boolean;
}>`
  ${EdgeHandleStyles}
  left: -${WIDGET_PADDING}px;
  width: calc(100% + ${2 * WIDGET_PADDING}px);
  ${(props) => (!props.showAsBorder ? "cursor: row-resize;" : "")}
  &:before {
    top: 50%;
    right: 0px;
    left: 0px;
    height: 1px;
  }
`;

export const LeftHandleStyles = styled.div`
  ${VerticalHandleStyles}
  left: ${-EDGE_RESIZE_HANDLE_WIDTH / 2 - WIDGET_PADDING}px;
`;

export const RightHandleStyles = styled.div`
  ${VerticalHandleStyles};
  right: ${-EDGE_RESIZE_HANDLE_WIDTH / 2 - WIDGET_PADDING + 1}px;
  height: calc(100% + ${2 * WIDGET_PADDING}px);
`;

export const TopHandleStyles = styled.div`
  ${HorizontalHandleStyles};
  top: ${-EDGE_RESIZE_HANDLE_WIDTH / 2 - WIDGET_PADDING}px;
`;

export const BottomHandleStyles = styled.div`
  ${HorizontalHandleStyles};
  bottom: ${-EDGE_RESIZE_HANDLE_WIDTH / 2 - WIDGET_PADDING}px;
`;

export const CornerHandleStyles = css`
  position: absolute;
  z-index: 3;
  width: ${CORNER_RESIZE_HANDLE_WIDTH}px;
  height: ${CORNER_RESIZE_HANDLE_WIDTH}px;
`;

export const BottomRightHandleStyles = styled.div<{
  showAsBorder: boolean;
}>`
  ${CornerHandleStyles};
  bottom: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  right: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  ${(props) => (!props.showAsBorder ? "cursor: se-resize;" : "")}
`;

export const BottomLeftHandleStyles = styled.div<{
  showAsBorder: boolean;
}>`
  ${CornerHandleStyles};
  left: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  bottom: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  ${(props) => (!props.showAsBorder ? "cursor: sw-resize;" : "")}
`;
export const TopLeftHandleStyles = styled.div<{
  showAsBorder: boolean;
}>`
  ${CornerHandleStyles};
  left: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  top: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  ${(props) => (!props.showAsBorder ? "cursor: nw-resize;" : "")}
`;
export const TopRightHandleStyles = styled.div<{
  showAsBorder: boolean;
}>`
  ${CornerHandleStyles};
  right: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  top: -${CORNER_RESIZE_HANDLE_WIDTH / 2}px;
  ${(props) => (!props.showAsBorder ? "cursor: ne-resize;" : "")}
`;
