import React, { ReactNode, useState, useEffect, useRef } from "react";
import styled, { StyledComponent } from "styled-components";
import {
  GridDefaults,
  WidgetHeightLimits,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { useDrag } from "react-use-gesture";
import { animated, Spring } from "react-spring";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useReflow } from "utils/hooks/useReflow";
import { getReflowSelector } from "selectors/widgetReflowSelectors";
import { useSelector } from "react-redux";
import { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  GridProps,
  MovementLimitMap,
  ReflowDirection,
  ReflowedSpace,
} from "reflow/reflowTypes";
import { getNearestParentCanvas } from "utils/generators";
import { getContainerOccupiedSpacesSelectorWhileResizing } from "selectors/editorSelectors";
import { isDropZoneOccupied } from "utils/WidgetPropsUtils";
import { isHandleResizeAllowed } from "components/editorComponents/ResizableUtils";

const ResizeWrapper = styled(animated.div)<{ $prevents: boolean }>`
  display: block;
  & {
    * {
      pointer-events: ${(props) => !props.$prevents && "none"};
    }
  }
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

export type DimensionProps = {
  width: number;
  height: number;
  x: number;
  y: number;
  reset?: boolean;
  direction: ReflowDirection;
  X?: number;
  Y?: number;
};

type ResizableHandleProps = {
  allowResize: boolean;
  scrollParent: HTMLDivElement | null;
  disableDot: boolean;
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

function ResizableHandle(props: ResizableHandleProps) {
  const bind = useDrag((state) => {
    const {
      first,
      last,
      dragging,
      memo,
      movement: [mx, my],
    } = state;
    if (!props.allowResize) {
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
  };

  return (
    <props.component
      data-cy={`t--resizable-handle-${props.direction}`}
      {...propsToPass}
    />
  );
}

type ResizableProps = {
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
    size: { width: number; height: number },
    position: { x: number; y: number },
  ) => {
    canResizeHorizontally: boolean;
    canResizeVertically: boolean;
    resizedPositions?: OccupiedSpace;
  };
  fixedHeight: boolean;
  maxDynamicHeight?: number;
  originalPositions: OccupiedSpace;
  onStart: () => void;
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
};

export function ReflowResizable(props: ResizableProps) {
  const resizableRef = useRef<HTMLDivElement>(null);
  const [isResizing, setResizing] = useState(false);

  const occupiedSpacesBySiblingWidgets = useSelector(
    getContainerOccupiedSpacesSelectorWhileResizing(props.parentId),
  );
  const checkForCollision = (widgetNewSize: {
    left: number;
    top: number;
    bottom: number;
    right: number;
  }) => {
    return isDropZoneOccupied(
      widgetNewSize,
      props.widgetId,
      occupiedSpacesBySiblingWidgets,
    );
  };
  // Performance tracking start
  const sentryPerfTags = props.zWidgetType
    ? [{ name: "widget_type", value: props.zWidgetType }]
    : [];
  PerformanceTracker.startTracking(
    PerformanceTransactionName.SHOW_RESIZE_HANDLES,
    { widgetId: props.zWidgetId },
    true,
    sentryPerfTags,
  );
  const reflowSelector = getReflowSelector(props.widgetId);

  const equal = (
    reflowA: ReflowedSpace | undefined,
    reflowB: ReflowedSpace | undefined,
  ) => {
    if (
      reflowA?.width !== reflowB?.width ||
      reflowA?.height !== reflowB?.height
    )
      return false;

    return true;
  };

  const reflowedPosition = useSelector(reflowSelector, equal);

  const reflow = useReflow(
    [props.originalPositions],
    props.parentId || "",
    props.gridProps,
  );

  useEffect(() => {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.SHOW_RESIZE_HANDLES,
    );
  }, []);
  //end
  const [pointerEvents, togglePointerEvents] = useState(true);
  const [newDimensions, set] = useState<DimensionProps>({
    width: props.componentWidth,
    height: props.componentHeight,
    x: 0,
    y: 0,
    reset: false,
    direction: ReflowDirection.UNSET,
  });

  const setNewDimensions = (rect: DimensionProps) => {
    const { direction, height, width, x, y } = rect;

    //if it is reached the end of canvas
    const {
      canResizeHorizontally,
      canResizeVertically,
      resizedPositions,
    } = props.getResizedPositions({ width, height }, { x, y });
    const canResize = canResizeHorizontally || canResizeVertically;

    if (canResize) {
      set((prevState) => {
        let newRect = { ...rect };

        let canVerticalMove = true,
          canHorizontalMove = true,
          bottomMostRow = 0,
          movementLimitMap: MovementLimitMap | undefined = {};

        if (resizedPositions) {
          //calling reflow to update movements of reflowing widgets and get movementLimit of current resizing widget
          ({ bottomMostRow, movementLimitMap } = reflow.reflowSpaces(
            [resizedPositions],
            direction,
            true,
          ));
        }

        if (
          resizedPositions &&
          movementLimitMap &&
          movementLimitMap[resizedPositions.id]
        ) {
          ({ canHorizontalMove, canVerticalMove } = movementLimitMap[
            resizedPositions.id
          ]);
        }

        //if it should not resize horizontally, we keep keep the previous horizontal dimensions
        if (!canHorizontalMove || !canResizeHorizontally) {
          newRect = {
            ...newRect,
            width: prevState.width,
            x: prevState.x,
            X: prevState.X,
          };
        }

        //if it should not resize vertically, we keep keep the previous vertical dimensions
        if (!canVerticalMove || !canResizeVertically) {
          newRect = {
            ...newRect,
            height: prevState.height,
            y: prevState.y,
            Y: prevState.Y,
          };
        }

        if (bottomMostRow) {
          props.updateBottomRow(bottomMostRow);
        }

        return newRect;
      });
    }
  };

  useEffect(() => {
    set((prevDimensions) => {
      return {
        ...prevDimensions,
        width: props.componentWidth,
        height: props.componentHeight,
        x: 0,
        y: 0,
        reset: true,
      };
    });
  }, [props.componentHeight, props.componentWidth, isResizing]);

  const handles = [];

  if (props.handles.left) {
    handles.push({
      dragCallback: (x: number) => {
        setNewDimensions({
          width: props.componentWidth - x,
          height: newDimensions.height,
          x: x,
          y: newDimensions.y,
          direction: ReflowDirection.LEFT,
          X: x,
        });
      },
      component: props.handles.left,
      handleDirection: ReflowDirection.LEFT,
    });
  }

  if (props.handles.top) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        setNewDimensions({
          width: newDimensions.width,
          height: props.componentHeight - y,
          y: y,
          x: newDimensions.x,
          direction: ReflowDirection.TOP,
          Y: y,
        });
      },
      component: props.handles.top,
      handleDirection: ReflowDirection.TOP,
    });
  }

  if (props.handles.right) {
    handles.push({
      dragCallback: (x: number) => {
        setNewDimensions({
          width: props.componentWidth + x,
          height: newDimensions.height,
          x: newDimensions.x,
          y: newDimensions.y,
          direction: ReflowDirection.RIGHT,
          X: x,
        });
      },
      component: props.handles.right,
      handleDirection: ReflowDirection.RIGHT,
    });
  }

  if (props.handles.bottom) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        setNewDimensions({
          width: newDimensions.width,
          height: props.componentHeight + y,
          x: newDimensions.x,
          y: newDimensions.y,
          direction: ReflowDirection.BOTTOM,
          Y: y,
        });
      },
      component: props.handles.bottom,
      handleDirection: ReflowDirection.BOTTOM,
    });
  }

  if (props.handles.topLeft) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        setNewDimensions({
          width: props.componentWidth - x,
          height: props.componentHeight - y,
          x: x,
          y: y,
          direction: ReflowDirection.TOPLEFT,
          X: x,
          Y: y,
        });
      },
      component: props.handles.topLeft,
    });
  }

  if (props.handles.topRight) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        setNewDimensions({
          width: props.componentWidth + x,
          height: props.componentHeight - y,
          x: newDimensions.x,
          y: y,
          direction: ReflowDirection.TOPRIGHT,
          X: x,
          Y: y,
        });
      },
      component: props.handles.topRight,
    });
  }

  if (props.handles.bottomRight) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        setNewDimensions({
          width: props.componentWidth + x,
          height: props.componentHeight + y,
          x: newDimensions.x,
          y: newDimensions.y,
          direction: ReflowDirection.BOTTOMRIGHT,
          X: x,
          Y: y,
        });
      },
      component: props.handles.bottomRight,
    });
  }

  if (props.handles.bottomLeft) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        setNewDimensions({
          width: props.componentWidth - x,
          height: props.componentHeight + y,
          x,
          y: newDimensions.y,
          direction: ReflowDirection.BOTTOMLEFT,
          X: x,
          Y: y,
        });
      },
      component: props.handles.bottomLeft,
    });
  }
  const onResizeStop = () => {
    togglePointerEvents(true);
    props.onStop(
      {
        width: newDimensions.width,
        height: newDimensions.height,
      },
      {
        x: newDimensions.x,
        y: newDimensions.y,
      },
    );
    setResizing(false);
  };

  const renderHandles = handles.map((handle, index) => {
    const disableDot = !isHandleResizeAllowed(
      props.enableHorizontalResize,
      props.enableVerticalResize,
      handle.handleDirection,
    );
    return (
      <ResizableHandle
        {...handle}
        allowResize={props.allowResize}
        checkForCollision={checkForCollision}
        direction={handle.handleDirection}
        disableDot={disableDot}
        key={index}
        onStart={() => {
          togglePointerEvents(false);
          props.onStart();
          setResizing(true);
        }}
        onStop={onResizeStop}
        scrollParent={resizableRef.current}
        snapGrid={props.snapGrid}
      />
    );
  });

  const widgetWidth =
    reflowedPosition?.width === undefined
      ? newDimensions.width
      : reflowedPosition.width - 2 * WIDGET_PADDING;
  const widgetHeight =
    reflowedPosition?.height === undefined
      ? newDimensions.height
      : reflowedPosition.height - 2 * WIDGET_PADDING;
  return (
    <Spring
      config={{
        clamp: true,
        friction: 0,
        tension: 999,
      }}
      from={{
        width: props.componentWidth,
        height: props.fixedHeight
          ? Math.min(
              (props.maxDynamicHeight ||
                WidgetHeightLimits.MAX_HEIGHT_IN_ROWS) *
                GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
              props.componentHeight,
            )
          : "auto",
        maxHeight:
          (props.maxDynamicHeight || WidgetHeightLimits.MAX_HEIGHT_IN_ROWS) *
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      }}
      immediate={newDimensions.reset ? true : false}
      to={{
        width: widgetWidth,
        height: props.fixedHeight
          ? Math.min(
              (props.maxDynamicHeight ||
                WidgetHeightLimits.MAX_HEIGHT_IN_ROWS) *
                GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
              widgetHeight,
            )
          : "auto",

        maxHeight:
          (props.maxDynamicHeight || WidgetHeightLimits.MAX_HEIGHT_IN_ROWS) *
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        transform: `translate3d(${newDimensions.x}px,${newDimensions.y}px,0)`,
      }}
    >
      {(_props) => (
        <ResizeWrapper
          $prevents={pointerEvents}
          className={props.className}
          ref={resizableRef}
          style={_props}
        >
          {props.children}
          {props.enableHorizontalResize && renderHandles}
        </ResizeWrapper>
      )}
    </Spring>
  );
}

export default ReflowResizable;
