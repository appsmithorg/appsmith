import React, { ReactNode, useState, useEffect, forwardRef, Ref } from "react";
import styled, { StyledComponent } from "styled-components";
import { useDrag } from "react-use-gesture";
import { Spring, animated } from "react-spring";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

const ResizeWrapper = styled(animated.div)<{ prevents: boolean }>`
  display: block;
  & {
    * {
      pointer-events: ${(props) => !props.prevents && "none"};
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

type ResizableHandleProps = {
  allowResize: boolean;
  showLightBorder?: boolean;
  dragCallback: (x: number, y: number) => void;
  component: StyledComponent<"div", Record<string, unknown>>;
  onStart: () => void;
  onStop: () => void;
  snapGrid: {
    x: number;
    y: number;
  };
};

function ResizableHandle(props: ResizableHandleProps) {
  const bind = useDrag(
    ({ first, last, dragging, movement: [mx, my], memo }) => {
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
    showLightBorder: props.showLightBorder,
  };

  return <props.component {...propsToPass} />;
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
  onStart: () => void;
  onStop: (
    size: { width: number; height: number },
    position: { x: number; y: number },
  ) => void;
  snapGrid: { x: number; y: number };
  enable: boolean;
  isColliding: (
    size: { width: number; height: number },
    position: { x: number; y: number },
  ) => boolean;
  className?: string;
  resizeDualSides?: boolean;
  showLightBorder?: boolean;
  zWidgetType?: string;
  zWidgetId?: string;
};

export const Resizable = forwardRef(function Resizable(
  props: ResizableProps,
  ref: Ref<HTMLDivElement>,
) {
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

  useEffect(() => {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.SHOW_RESIZE_HANDLES,
    );
  });
  //end
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

  const renderHandles = handles.map((handle, index) => (
    <ResizableHandle
      {...handle}
      allowResize={props.allowResize}
      key={index}
      onStart={() => {
        togglePointerEvents(false);
        props.onStart();
      }}
      onStop={onResizeStop}
      showLightBorder={props.showLightBorder}
      snapGrid={props.snapGrid}
    />
  ));

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
          className={props.className}
          prevents={pointerEvents}
          ref={ref}
          style={_props}
        >
          {props.children}
          {props.enable && renderHandles}
        </ResizeWrapper>
      )}
    </Spring>
  );
});

export default Resizable;
