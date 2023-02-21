import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { Colors } from "constants/Colors";
import React, { ReactNode } from "react";
import { animated } from "react-spring";
import { useDrag } from "react-use-gesture";
import { GridProps, ReflowDirection } from "reflow/reflowTypes";
import styled, { StyledComponent } from "styled-components";
import {
  LayoutDirection,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import { getNearestParentCanvas } from "utils/generators";

const resizeBorderPadding = 1;
const resizeBorder = 1;
const resizeBoxShadow = 1;
const resizeOutline = 1;

export const RESIZE_BORDER_BUFFER =
  resizeBorderPadding + resizeBorder + resizeBoxShadow + resizeOutline;

export const ResizeWrapper = styled(animated.div)<{
  $prevents: boolean;
  isHovered: boolean;
  showBoundaries: boolean;
}>`
  display: block;
  & {
    * {
      pointer-events: ${(props) => !props.$prevents && "none"};
    }
  }
  ${(props) => {
    if (props.showBoundaries) {
      return `
      box-shadow: 0px 0px 0px ${resizeBoxShadow}px ${
        props.isHovered ? Colors.WATUSI : "#f86a2b"
      };
      border-radius: 0px 4px 4px 4px;
      border: ${resizeBorder}px solid ${Colors.GREY_1};
      padding: ${resizeBorderPadding}px;
      outline: ${resizeOutline}px solid ${Colors.GREY_1} !important;
      outline-offset: 1px;`;
    } else {
      return `
        border: 0px solid transparent;
      `;
    }
  }}}
`;

const getSnappedValues = (
  x: number,
  y: number,
  snapGrid: { x: number; y: number },
) => {
  return {
    x: Math.round(x / snapGrid.x) * snapGrid.x,
    y: Math.round(y / snapGrid.y) * snapGrid.y,
  };
};

export type DimensionUpdateProps = {
  width: number;
  height: number;
  x: number;
  y: number;
  reset?: boolean;
  direction: ReflowDirection;
  X?: number;
  Y?: number;
  reflectPosition: boolean;
  reflectDimension: boolean;
};

type ResizableHandleProps = {
  allowResize: boolean;
  scrollParent: HTMLDivElement | null;
  disableDot: boolean;
  isHovered: boolean;
  checkForCollision: (widgetNewSize: {
    left: number;
    top: number;
    bottom: number;
    right: number;
  }) => boolean;
  dragCallback: (x: number, y: number) => void;
  component: StyledComponent<"div", Record<string, unknown>>;
  onStart: () => void;
  onStop: () => void;
  snapGrid: {
    x: number;
    y: number;
  };
  direction?: ReflowDirection;
};

export function ResizableHandle(props: ResizableHandleProps) {
  const bind = useDrag((state) => {
    const {
      first,
      last,
      dragging,
      memo,
      movement: [mx, my],
    } = state;
    if (!props.allowResize || props.disableDot) {
      return;
    }
    const scrollParent = getNearestParentCanvas(props.scrollParent);

    const initialScrollTop = memo ? memo.scrollTop : 0;
    const currentScrollTop = scrollParent?.scrollTop || 0;

    const deltaScrolledHeight = currentScrollTop - initialScrollTop;
    const deltaY = my + deltaScrolledHeight;
    const snapped = getSnappedValues(mx, deltaY, props.snapGrid);
    if (first) {
      props.onStart();
      return { scrollTop: currentScrollTop, snapped };
    }
    const { snapped: snappedMemo } = memo;

    if (
      dragging &&
      snappedMemo &&
      (snapped.x !== snappedMemo.x || snapped.y !== snappedMemo.y)
    ) {
      props.dragCallback(snapped.x, snapped.y);
    }
    if (last) {
      props.onStop();
    }

    return { ...memo, snapped };
  });
  const propsToPass = {
    ...bind(),
    showAsBorder: !props.allowResize,
    disableDot: props.disableDot,
    isHovered: props.isHovered,
  };

  return (
    <props.component
      data-cy={`t--resizable-handle-${props.direction}`}
      {...propsToPass}
    />
  );
}

export type ResizableProps = {
  allowResize: boolean;
  handles: {
    left?: StyledComponent<"div", Record<string, unknown>>;
    top?: StyledComponent<"div", Record<string, unknown>>;
    bottom?: StyledComponent<"div", Record<string, unknown>>;
    right?: StyledComponent<"div", Record<string, unknown>>;
    bottomRight?: StyledComponent<"div", Record<string, unknown>>;
    topLeft?: StyledComponent<"div", Record<string, unknown>>;
    topRight?: StyledComponent<"div", Record<string, unknown>>;
    bottomLeft?: StyledComponent<"div", Record<string, unknown>>;
  };
  componentWidth: number;
  componentHeight: number;
  children: ReactNode;
  updateBottomRow: (bottomRow: number) => void;
  getResizedPositions: (
    resizedPositions: OccupiedSpace,
  ) => {
    canResizeHorizontally: boolean;
    canResizeVertically: boolean;
  };
  fixedHeight: boolean;
  maxDynamicHeight?: number;
  originalPositions: OccupiedSpace;
  onStart: (affectsWidth?: boolean) => void;
  onStop: (
    size: { width: number; height: number },
    position: { x: number; y: number },
  ) => void;
  snapGrid: { x: number; y: number };
  enableVerticalResize: boolean;
  enableHorizontalResize: boolean;
  className?: string;
  parentId?: string;
  widgetId: string;
  gridProps: GridProps;
  zWidgetType?: string;
  zWidgetId?: string;
  isFlexChild?: boolean;
  isHovered: boolean;
  responsiveBehavior?: ResponsiveBehavior;
  direction?: LayoutDirection;
  paddingOffset: number;
  isMobile: boolean;
  showResizeBoundary: boolean;
};
