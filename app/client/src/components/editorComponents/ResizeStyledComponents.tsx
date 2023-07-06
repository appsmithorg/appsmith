import { Colors } from "constants/Colors";
import { invisible } from "constants/DefaultTheme";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import styled, { css } from "styled-components";

const EDGE_RESIZE_HANDLE_WIDTH = 12;
const CORNER_RESIZE_HANDLE_WIDTH = 10;

export const VisibilityContainer = styled.div<{
  visible: boolean;
  padding: number;
  reduceOpacity: boolean;
}>`
  ${(props) => (!props.visible ? invisible : "")}
  height: 100%;
  width: 100%;
  ${({ reduceOpacity }) =>
    reduceOpacity &&
    css`
      opacity: 0.25;
    `}
`;

type ResizeProps = {
  showAsBorder: boolean;
  showLightBorder: boolean;
  disableDot: boolean;
  isHovered: boolean;
};

const VerticalResizeIndicators = css<ResizeProps>`
  ${(props) =>
    props.showAsBorder || props.disableDot
      ? ""
      : css`
          &::after {
            position: absolute;
            content: "";
            width: 7px;
            height: 16px;
            border-radius: 50%/16%;
            background: ${Colors.GREY_1};
            top: calc(50% - 8px);
            left: calc(50% - 2.5px);
            border: ${(props: any) => {
              return `1px solid ${props.isHovered ? Colors.WATUSI : "#F86A2B"}`;
            }};
            outline: 1px solid ${Colors.GREY_1};
          }
          &:hover::after {
            background: #f86a2b;
          }
        `}
`;

const HorizontalResizeIndicators = css<ResizeProps>`
  ${(props) =>
    props.showAsBorder || props.disableDot
      ? ""
      : css`
          &::after {
            position: absolute;
            content: "";
            width: 16px;
            height: 7px;
            border-radius: 16%/50%;
            border: ${(props: any) => {
              return `1px solid ${props.isHovered ? Colors.WATUSI : "#F86A2B"}`;
            }};
            background: ${Colors.GREY_1};
            top: calc(50% - 2.5px);
            left: calc(50% - 8px);
            outline: 1px solid ${Colors.GREY_1};
          }
          &:hover::after {
            background: #f86a2b;
          }
        `}
`;

export const EdgeHandleStyles = css<ResizeProps>`
  position: absolute;
  width: ${EDGE_RESIZE_HANDLE_WIDTH}px;
  height: ${EDGE_RESIZE_HANDLE_WIDTH}px;
  &::before {
    position: absolute;
    background: unset;
    content: "";
  }
`;

export const VerticalHandleStyles = css<{
  showAsBorder: boolean;
  showLightBorder: boolean;
  disableDot: boolean;
  isHovered: boolean;
}>`
  ${EdgeHandleStyles}
  ${VerticalResizeIndicators}
  top:${~(WIDGET_PADDING - 1) + 1}px;
  height: calc(100% + ${2 * WIDGET_PADDING - 1}px);
  ${(props) =>
    props.showAsBorder || props.disableDot ? "" : "cursor: col-resize;"}
  &:before {
    left: 50%;
    bottom: 0px;
    top: 0;
    width: 1px;
  }
`;

export const HorizontalHandleStyles = css<ResizeProps>`
  ${EdgeHandleStyles}
  ${HorizontalResizeIndicators}
  left: ${~WIDGET_PADDING + 1}px;
  width: calc(100% + ${2 * WIDGET_PADDING}px);
  ${(props) =>
    props.showAsBorder || props.disableDot ? "" : "cursor: row-resize;"}
  &:before {
    top: 50%;
    right: 0px;
    left: 0px;
    height: 1px;
  }
`;

export const LeftHandleStyles = styled.div<ResizeProps>`
  ${VerticalHandleStyles};
  left: ${-EDGE_RESIZE_HANDLE_WIDTH / 2 - WIDGET_PADDING + 1.5}px;
`;

export const RightHandleStyles = styled.div<ResizeProps>`
  ${VerticalHandleStyles};
  right: ${-EDGE_RESIZE_HANDLE_WIDTH / 2 - WIDGET_PADDING + 3.5}px;
  height: calc(100% + ${2 * WIDGET_PADDING}px);
`;

export const TopHandleStyles = styled.div<ResizeProps>`
  ${HorizontalHandleStyles};
  top: ${-EDGE_RESIZE_HANDLE_WIDTH / 2 - WIDGET_PADDING + 1.5}px;
`;

export const BottomHandleStyles = styled.div<ResizeProps>`
  ${HorizontalHandleStyles};
  bottom: ${-EDGE_RESIZE_HANDLE_WIDTH / 2 - WIDGET_PADDING + 3.5}px;
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
