import { computeRowCols } from "layoutSystems/common/resizer/ResizableUtils";
import { isHandleResizeAllowed } from "layoutSystems/common/resizer/ResizableUtils";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { Spring } from "react-spring";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useSelector } from "react-redux";
import type { MovementLimitMap, ReflowedSpace } from "reflow/reflowTypes";
import type {
  DimensionUpdateProps,
  ResizableProps,
} from "layoutSystems/common/resizer/common";
import {
  getWrapperStyle,
  RESIZE_BORDER_BUFFER,
  ResizableHandle,
  ResizeWrapper,
} from "layoutSystems/common/resizer/common";
import { getWidgetByID } from "sagas/selectors";
import { ReflowDirection } from "reflow/reflowTypes";
import { getContainerOccupiedSpacesSelectorWhileResizing } from "selectors/editorSelectors";
import { getReflowSelector } from "selectors/widgetReflowSelectors";
import { isDropZoneOccupied } from "utils/WidgetPropsUtils";
import { useReflow } from "utils/hooks/useReflow";

export function FixedLayoutResizable(props: ResizableProps) {
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
  const widget = useSelector(getWidgetByID(props.widgetId));

  const [pointerEvents, togglePointerEvents] = useState(true);
  const dimensionReflectionProps = {
    reflectDimension: true,
    reflectPosition: true,
  };
  const [newDimensions, set] = useState<DimensionUpdateProps>({
    width: props.componentWidth,
    height: props.componentHeight,
    x: 0,
    y: 0,
    reset: false,
    direction: ReflowDirection.UNSET,
    ...dimensionReflectionProps,
  });

  const setNewDimensions = (rect: DimensionUpdateProps) => {
    const { direction, height, width, x, y } = rect;
    const delta = {
      height: height - props.componentHeight,
      width: width - props.componentWidth,
    };
    const updatedPositions = computeRowCols(
      delta,
      { x, y },
      { ...widget, ...props.gridProps },
    );
    const resizedPositions = {
      left: updatedPositions.leftColumn,
      right: updatedPositions.rightColumn,
      top: updatedPositions.topRow,
      bottom: updatedPositions.bottomRow,
      id: widget.widgetId,
      parentId: widget.parentId,
    };
    //if it is reached the end of canvas
    const { canResizeHorizontally, canResizeVertically } =
      props.getResizedPositions(resizedPositions);
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
          ({ canHorizontalMove, canVerticalMove } =
            movementLimitMap[resizedPositions.id]);
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
          ...dimensionReflectionProps,
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
          ...dimensionReflectionProps,
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
          ...dimensionReflectionProps,
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
          ...dimensionReflectionProps,
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
          ...dimensionReflectionProps,
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
          ...dimensionReflectionProps,
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
          ...dimensionReflectionProps,
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
          ...dimensionReflectionProps,
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
        isHovered={props.isHovered}
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
    (reflowedPosition?.width === undefined
      ? newDimensions.width
      : reflowedPosition.width - 2 * WIDGET_PADDING) + RESIZE_BORDER_BUFFER;
  const widgetHeight =
    (reflowedPosition?.height === undefined
      ? newDimensions.height
      : reflowedPosition.height - 2 * WIDGET_PADDING) + RESIZE_BORDER_BUFFER;
  const resizeWrapperStyle: CSSProperties = getWrapperStyle(
    props.topRow <= 2,
    props.showResizeBoundary,
    !isResizing && props.allowResize,
    props.isHovered,
  );
  const wrapperClassName = useMemo(() => {
    return `${props.className} resize-wrapper ${
      props.showResizeBoundary ? "show-boundary" : ""
    } ${pointerEvents ? "" : "pointer-event-none"}`;
  }, [props.className, pointerEvents, props.showResizeBoundary]);
  return (
    <Spring
      config={{
        clamp: true,
        friction: 0,
        tension: 999,
      }}
      from={{
        width: props.componentWidth,
        height: props.autoHeight
          ? "auto"
          : Math.min(props.maxHeightInPx, props.componentHeight),
        maxHeight: props.maxHeightInPx,
      }}
      immediate={newDimensions.reset ? true : false}
      to={{
        width: widgetWidth,
        // If height is automatically set, use `auto`, widgetHeight is not considered
        // other wise, limit the height based on the max.
        // We could also use the isVerticalDisabled flag here, but that would mean that
        // the auto height with limits will stop working correctly
        height: props.autoHeight
          ? "auto"
          : Math.min(props.maxHeightInPx, widgetHeight),

        maxHeight: props.maxHeightInPx,
        transform: `translate3d(${
          (newDimensions.reflectPosition ? newDimensions.x : 0) -
          RESIZE_BORDER_BUFFER / 2
        }px,${
          (newDimensions.reflectPosition ? newDimensions.y : 0) -
          RESIZE_BORDER_BUFFER / 2
        }px,0)`,
      }}
    >
      {(_props) => (
        <ResizeWrapper
          className={wrapperClassName}
          id={`resize-${props.widgetId}`}
          ref={resizableRef}
          style={{ ..._props, ...resizeWrapperStyle }}
        >
          {props.children}
          {props.enableHorizontalResize && renderHandles}
        </ResizeWrapper>
      )}
    </Spring>
  );
}
