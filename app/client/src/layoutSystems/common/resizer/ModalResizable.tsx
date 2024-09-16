import { isHandleResizeAllowed } from "layoutSystems/common/resizer/ResizableUtils";
import type { CSSProperties, ReactNode } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Spring } from "react-spring";
import { useDrag } from "react-use-gesture";
import { ReflowDirection } from "reflow/reflowTypes";
import {
  getWrapperStyle,
  ResizeWrapper,
} from "layoutSystems/common/resizer/common";
import type { StyledComponent } from "styled-components";

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

interface ResizableHandleProps {
  allowResize: boolean;
  showLightBorder?: boolean;
  isHovered: boolean;
  disableDot: boolean;
  dragCallback: (x: number, y: number) => void;
  component: StyledComponent<"div", Record<string, unknown>>;
  onStart: () => void;
  onStop: () => void;
  snapGrid: {
    x: number;
    y: number;
  };
}

function ResizableHandle(props: ResizableHandleProps) {
  const bind = useDrag(
    ({ dragging, first, last, memo, movement: [mx, my] }) => {
      if (!props.allowResize) {
        return;
      }
      const snapped = getSnappedValues(mx, my, props.snapGrid);
      if (dragging && memo && (snapped.x !== memo.x || snapped.y !== memo.y)) {
        props.dragCallback(snapped.x, snapped.y);
      }
      if (first) {
        props.onStart();
      }
      if (last) {
        props.onStop();
      }
      return snapped;
    },
  );
  const propsToPass = {
    ...bind(),
    showAsBorder: !props.allowResize,
    disableDot: props.disableDot,
    isHovered: props.isHovered,
  };

  return <props.component {...propsToPass} />;
}

interface ResizableProps {
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
  onStart: () => void;
  onStop: (
    size: { width: number; height: number },
    position: { x: number; y: number },
  ) => void;
  snapGrid: { x: number; y: number };
  enableVerticalResize: boolean;
  enableHorizontalResize: boolean;
  isColliding: (
    size: { width: number; height: number },
    position: { x: number; y: number },
  ) => boolean;
  className?: string;
  resizeDualSides?: boolean;
  widgetId: string;
  showLightBorder?: boolean;
  zWidgetType?: string;
}

export function ModalResizable(props: ResizableProps) {
  const [pointerEvents, togglePointerEvents] = useState(true);
  const [newDimensions, set] = useState({
    width: props.componentWidth,
    height: props.componentHeight,
    x: 0,
    y: 0,
    reset: false,
  });

  const { resizeDualSides } = props;
  const multiplier = resizeDualSides ? 2 : 1;

  const setNewDimensions = (rect: {
    width: number;
    height: number;
    x: number;
    y: number;
  }) => {
    const { height, width, x, y } = rect;
    const shouldUpdateHeight =
      props.componentHeight !== height && props.enableVerticalResize;
    if (!shouldUpdateHeight) rect.height = props.componentHeight;

    const shouldUpdateWidth =
      props.componentWidth !== width && props.enableHorizontalResize;
    if (!shouldUpdateWidth) rect.width = props.componentWidth;

    const isColliding = props.isColliding({ width, height }, { x, y });
    if (!isColliding) {
      set({ ...rect, reset: false });
    }
  };

  useEffect(() => {
    set({
      width: props.componentWidth,
      height: props.componentHeight,
      x: 0,
      y: 0,
      reset: true,
    });
  }, [props.componentHeight, props.componentWidth]);

  const handles = [];

  if (props.handles.left) {
    handles.push({
      dragCallback: (x: number) => {
        setNewDimensions({
          width: props.componentWidth - multiplier * x,
          height: newDimensions.height,
          x: resizeDualSides ? newDimensions.x : x,
          y: newDimensions.y,
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
          height: props.componentHeight - multiplier * y,
          y: resizeDualSides ? newDimensions.y : y,
          x: newDimensions.x,
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
          width: props.componentWidth + multiplier * x,
          height: newDimensions.height,
          x: newDimensions.x,
          y: newDimensions.y,
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
          height: props.componentHeight + multiplier * y,
          x: newDimensions.x,
          y: newDimensions.y,
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
  };
  const onResizeStopCallback = useCallback(onResizeStop, [
    props.onStop,
    newDimensions,
  ]);

  const onResizeStart = () => {
    togglePointerEvents(false);
    props.onStart();
  };
  const onResizeStartCallback = useCallback(onResizeStart, [props.onStart]);
  const showResizeBoundary = props.enableHorizontalResize;
  const renderHandles = handles.map((handle, index) => {
    const disableDot =
      !showResizeBoundary ||
      !isHandleResizeAllowed(
        props.enableHorizontalResize,
        props.enableVerticalResize,
        handle.handleDirection,
      );
    return (
      <ResizableHandle
        {...handle}
        allowResize={props.allowResize}
        disableDot={disableDot}
        isHovered={showResizeBoundary}
        key={index}
        onStart={onResizeStartCallback}
        onStop={onResizeStopCallback}
        snapGrid={props.snapGrid}
      />
    );
  });
  const resizeWrapperStyle: CSSProperties = getWrapperStyle(
    false,
    showResizeBoundary,
    props.allowResize,
    showResizeBoundary,
  );

  const wrapperClassName = useMemo(() => {
    return `${props.className} resize-wrapper ${
      showResizeBoundary ? "show-boundary" : ""
    } ${pointerEvents ? "" : "pointer-event-none"}`;
  }, [props.className, pointerEvents, showResizeBoundary]);

  return (
    <Spring
      config={{
        clamp: true,
        friction: 0,
        tension: 999,
      }}
      from={{
        width: props.componentWidth,
        height: props.componentHeight,
      }}
      immediate={newDimensions.reset ? true : false}
      to={{
        width: newDimensions.width,
        height: newDimensions.height,
        transform: `translate3d(${newDimensions.x}px,${newDimensions.y}px,0)`,
      }}
    >
      {(_props) => (
        <ResizeWrapper
          className={wrapperClassName}
          style={{ ..._props, ...resizeWrapperStyle }}
        >
          {props.children}
          {props.enableHorizontalResize && renderHandles}
        </ResizeWrapper>
      )}
    </Spring>
  );
}
