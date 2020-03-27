import React, { ReactNode, useState, useEffect, forwardRef, Ref } from "react";
import styled, { StyledComponent } from "styled-components";
import { useDrag } from "react-use-gesture";
import { Spring } from "react-spring/renderprops";

const ResizeWrapper = styled.div<{ pevents: boolean }>`
  display: block;
  & {
    * {
      pointer-events: ${props => !props.pevents && "none"};
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
  dragCallback: (x: number, y: number) => void;
  component: StyledComponent<"div", {}>;
  onStart: Function;
  onStop: Function;
  snapGrid: {
    x: number;
    y: number;
  };
};

const ResizableHandle = (props: ResizableHandleProps) => {
  const bind = useDrag(
    ({ first, last, dragging, movement: [mx, my], memo }) => {
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

  return <props.component {...bind()} />;
};

type ResizableProps = {
  handles: {
    left: StyledComponent<"div", {}>;
    top: StyledComponent<"div", {}>;
    bottom: StyledComponent<"div", {}>;
    right: StyledComponent<"div", {}>;
    bottomRight: StyledComponent<"div", {}>;
    topLeft: StyledComponent<"div", {}>;
    topRight: StyledComponent<"div", {}>;
    bottomLeft: StyledComponent<"div", {}>;
  };
  componentWidth: number;
  componentHeight: number;
  children: ReactNode;
  onStart: Function;
  onStop: Function;
  snapGrid: { x: number; y: number };
  enable: boolean;
  isColliding: Function;
  className?: string;
};

export const Resizable = forwardRef(
  (props: ResizableProps, ref: Ref<HTMLDivElement>) => {
    const [pointerEvents, togglePointerEvents] = useState(true);
    const [newDimensions, set] = useState({
      width: props.componentWidth,
      height: props.componentHeight,
      x: 0,
      y: 0,
      reset: false,
    });

    const setNewDimensions = (rect: {
      width: number;
      height: number;
      x: number;
      y: number;
    }) => {
      const { width, height, x, y } = rect;
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

    const handles = [
      {
        dragCallback: (x: number) => {
          setNewDimensions({
            width: props.componentWidth - x,
            height: newDimensions.height,
            x,
            y: newDimensions.y,
          });
        },
        component: props.handles.left,
      },
      {
        dragCallback: (x: number) => {
          setNewDimensions({
            width: props.componentWidth + x,
            height: newDimensions.height,
            x: newDimensions.x,
            y: newDimensions.y,
          });
        },
        component: props.handles.right,
      },
      {
        dragCallback: (x: number, y: number) => {
          setNewDimensions({
            width: newDimensions.width,
            height: props.componentHeight - y,
            y: y,
            x: newDimensions.x,
          });
        },
        component: props.handles.top,
      },
      {
        dragCallback: (x: number, y: number) => {
          setNewDimensions({
            width: newDimensions.width,
            height: props.componentHeight + y,
            x: newDimensions.x,
            y: newDimensions.y,
          });
        },
        component: props.handles.bottom,
      },
      {
        dragCallback: (x: number, y: number) => {
          setNewDimensions({
            width: props.componentWidth + x,
            height: props.componentHeight + y,
            x: newDimensions.x,
            y: newDimensions.y,
          });
        },
        component: props.handles.bottomRight,
      },
      {
        dragCallback: (x: number, y: number) => {
          setNewDimensions({
            width: props.componentWidth - x,
            height: props.componentHeight + y,
            x,
            y: newDimensions.y,
          });
        },
        component: props.handles.bottomLeft,
      },
      {
        dragCallback: (x: number, y: number) => {
          setNewDimensions({
            width: props.componentWidth + x,
            height: props.componentHeight - y,
            x: newDimensions.x,
            y: y,
          });
        },
        component: props.handles.topRight,
      },
      {
        dragCallback: (x: number, y: number) => {
          setNewDimensions({
            width: props.componentWidth - x,
            height: props.componentHeight - y,
            x: x,
            y: y,
          });
        },
        component: props.handles.topLeft,
      },
    ];

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
        key={index}
        onStart={() => {
          togglePointerEvents(false);
          props.onStart();
        }}
        onStop={onResizeStop}
        snapGrid={props.snapGrid}
      />
    ));

    return (
      <Spring
        from={{
          width: props.componentWidth,
          height: props.componentHeight,
        }}
        to={{
          width: newDimensions.width,
          height: newDimensions.height,
          transform: `translate3d(${newDimensions.x}px,${newDimensions.y}px,0)`,
        }}
        config={{
          clamp: true,
          friction: 0,
          tension: 999,
        }}
        immediate={newDimensions.reset ? true : false}
      >
        {_props => (
          <ResizeWrapper
            ref={ref}
            style={_props}
            className={props.className}
            pevents={pointerEvents}
          >
            {props.children}
            {props.enable && renderHandles}
          </ResizeWrapper>
        )}
      </Spring>
    );
  },
);

export default Resizable;
