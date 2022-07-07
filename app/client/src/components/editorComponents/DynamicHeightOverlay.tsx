import { focusWidget } from "actions/widgetActions";
import React, { memo, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useDrag } from "react-use-gesture";
import { AppState } from "reducers";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import styled from "styled-components";
import {
  useShowPropertyPane,
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import { getParentToOpenIfAny } from "utils/hooks/useClickToSelectWidget";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { WidgetProps } from "widgets/BaseWidget";

const StyledDynamicHeightOverlay = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const OVERLAY_COLOR = "#F32B8B";

interface OverlayDisplayProps {
  isActive: boolean;
  maxY: number;
}

const OverlayDisplay = styled.div<OverlayDisplayProps>`
  display: ${(props) => (props.isActive ? "block" : "none")};
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${(props) => props.maxY}px;
  border-bottom: 1px solid ${OVERLAY_COLOR};
  background-color: rgba(243, 43, 139, 0.1);
`;

interface MinMaxHeightProps {
  maxDynamicHeight: number;
  minDynamicHeight: number;
}

const StyledOverlayHandles = styled.div`
  position: absolute;
  right: -16px;
`;

const OverlayHandleLabel = styled.div`
  position: absolute;
  pointer-events: none;
  padding: 1px 4px;
  background: #191919;
  font-weight: 400;
  font-size: 10px;
  line-height: 16px;
  color: #ffffff;
  text-align: center;
  white-space: nowrap;
  left: 16px;
`;

const OverlayHandle = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  height: 18px;
`;

const OverlayHandleDot = styled.div`
  cursor: pointer;
  border-radius: 50%;
`;

const StyledDraggableOverlayHandleDot = styled.div`
  cursor: pointer;
`;

interface DragFunctions {
  onStart: () => void;
  onStop: () => void;
  onUpdate: (x: number, y: number) => void;
}

const DraggableOverlayHandleDot: React.FC<DragFunctions> = ({
  children,
  onStart,
  onStop,
  onUpdate,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const bind = useDrag(
    (state) => {
      if (state.first) {
        onStart();
        return;
      }

      if (state.last) {
        onStop();
        return;
      }
      const [mx, my] = state.movement;

      onUpdate(mx, my);
    },
    { axis: "y" },
  );
  const bindings = bind();
  return (
    <StyledDraggableOverlayHandleDot
      ref={ref}
      {...bindings}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        bindings?.onMouseDown && bindings.onMouseDown(e);
      }}
      onMouseUp={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {children}
    </StyledDraggableOverlayHandleDot>
  );
};
interface OverlayHandleProps {
  y: number;
}

const MinHeightOverlayHandle = styled(OverlayHandle)<OverlayHandleProps>`
  transform: translateY(${(props) => props.y}px);
`;

const MinHeightOverlayHandleDot = styled(OverlayHandleDot)<{
  isActive: boolean;
}>`
  width: 6px;
  height: 6px;
  border: 1px solid ${OVERLAY_COLOR};
  background-color: ${(props) => (props.isActive ? OVERLAY_COLOR : "none")};
`;

const MaxHeightOverlayHandle = styled(OverlayHandle)<OverlayHandleProps>`
  transform: translateY(${(props) => props.y}px);
`;

const MaxHeightOverlayHandleDot = styled(OverlayHandleDot)`
  width: 10px;
  height: 10px;
  background-color: ${OVERLAY_COLOR};
`;

interface UseHoverStateFunctions {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

type UseHoverStateReturnType = [boolean, UseHoverStateFunctions];

function useHoverState(): UseHoverStateReturnType {
  const [isMinDotActive, setDotActive] = useState(false);

  function handleMinDotMouseEnter(state: boolean) {
    setDotActive(state);
  }

  return [
    isMinDotActive,
    {
      onMouseEnter: () => handleMinDotMouseEnter(true),
      onMouseLeave: () => handleMinDotMouseEnter(false),
    },
  ];
}

interface OverlayHandlesProps {
  isMaxDotActive: boolean;
  isMinDotActive: boolean;
  maxY: number;
  minY: number;
  maxDragFunctions: DragFunctions;
  minDragFunctions: DragFunctions;
  onMaxHeightSet: (height: number) => void;
  onMinHeightSet: (height: number) => void;
  maxHoverFns: UseHoverStateFunctions;
  minHoverFns: UseHoverStateFunctions;
}

const OverlayHandles: React.FC<OverlayHandlesProps> = ({
  isMaxDotActive,
  isMinDotActive,
  maxDragFunctions,
  maxHoverFns,
  maxY,
  minDragFunctions,
  minHoverFns,
  minY,
}) => {
  const isColliding = maxY === minY;

  const maxRows = Math.floor(maxY / 10);
  const minRows = Math.floor(minY / 10);

  return (
    <StyledOverlayHandles>
      <MinHeightOverlayHandle y={minY}>
        <DraggableOverlayHandleDot {...minDragFunctions}>
          <MinHeightOverlayHandleDot
            isActive={isMinDotActive}
            {...minHoverFns}
          />
        </DraggableOverlayHandleDot>
        {!isColliding ? (
          <OverlayHandleLabel
            style={{ display: isMinDotActive ? "initial" : "none" }}
          >
            Min-height: {minRows} rows
          </OverlayHandleLabel>
        ) : null}
      </MinHeightOverlayHandle>
      <MaxHeightOverlayHandle
        style={isColliding ? { right: "-24px" } : undefined}
        y={maxY}
      >
        <DraggableOverlayHandleDot {...maxDragFunctions}>
          <MaxHeightOverlayHandleDot {...maxHoverFns} />
        </DraggableOverlayHandleDot>
        <OverlayHandleLabel
          style={{ display: isMaxDotActive ? "initial" : "none" }}
        >
          Max-height: {maxRows} rows
        </OverlayHandleLabel>
      </MaxHeightOverlayHandle>
    </StyledOverlayHandles>
  );
};

interface DynamicHeightOverlayProps extends MinMaxHeightProps, WidgetProps {
  onMaxHeightSet: (height: number) => void;
  onMinHeightSet: (height: number) => void;
}

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

const DynamicHeightOverlay: React.FC<DynamicHeightOverlayProps> = memo(
  ({
    children,
    maxDynamicHeight,
    minDynamicHeight,
    onMaxHeightSet,
    onMinHeightSet,
    ...props
  }) => {
    const widgetId = props.widgetId;
    const showPropertyPane = useShowPropertyPane();
    const { selectWidget } = useWidgetSelection();
    const selectedWidget = useSelector(
      (state: AppState) => state.ui.widgetDragResize.lastSelectedWidget,
    );
    const canvasWidgets = useSelector(getCanvasWidgets);
    const parentWidgetToSelect = getParentToOpenIfAny(widgetId, canvasWidgets);
    const showTableFilterPane = useShowTableFilterPane();
    const { setIsResizing } = useWidgetDragResize();
    const isResizing = useSelector(
      (state: AppState) => state.ui.widgetDragResize.isResizing,
    );

    const [isMinDotDragging, setIsMinDotDragging] = useState(false);
    const [isMaxDotDragging, setIsMaxDotDragging] = useState(false);

    const [maxY, setMaxY] = useState(maxDynamicHeight * 10);
    const [maxdY, setMaxdY] = useState(0);

    const [minY, setMinY] = useState(minDynamicHeight * 10);
    const [mindY, setMindY] = useState(0);

    const finalMaxY = maxY + maxdY;
    const finalMinY = minY + mindY;

    useEffect(() => {
      setMaxY(maxDynamicHeight * 10);
    }, [maxDynamicHeight]);

    function onAnyDotStop() {
      // Tell the Canvas that we've stopped resizing
      // Put it later in the stack so that other updates like click, are not propagated to the parent container
      setTimeout(() => {
        setIsResizing && setIsResizing(false);
      }, 0);
      // Tell the Canvas to put the focus back to this widget
      // By setting the focus, we enable the control buttons on the widget
      selectWidget &&
        selectedWidget !== props.widgetId &&
        parentWidgetToSelect?.widgetId !== props.widgetId &&
        selectWidget(props.widgetId);

      if (parentWidgetToSelect) {
        selectWidget &&
          selectedWidget !== parentWidgetToSelect.widgetId &&
          selectWidget(parentWidgetToSelect.widgetId);
        focusWidget(parentWidgetToSelect.widgetId);
      } else {
        selectWidget &&
          selectedWidget !== props.widgetId &&
          selectWidget(props.widgetId);
      }
      // Property pane closes after a resize/drag
      showPropertyPane && showPropertyPane();
    }

    function onMaxUpdate(dx: number, dy: number) {
      const snapped = getSnappedValues(dx, dy, snapGrid);

      // if (maxY + dy <= minY) {
      //   setMindY(dy + (maxY - minY));
      // }

      setMaxdY(snapped.y);
    }

    function updateMaxHeight(height: number) {
      setMaxY(height);
      onMaxHeightSet(height);
    }

    function updateMinHeight(height: number) {
      setMinY(height);
      onMinHeightSet(height);
    }

    function onMaxStop() {
      setIsMaxDotDragging(false);
      const heightToSet = maxY + maxdY;
      updateMaxHeight(heightToSet);
      setMaxY(maxY + maxdY);
      setMaxdY(0);
      if (heightToSet === minY + mindY) {
        updateMinHeight(heightToSet);
      }
      onAnyDotStop();
    }

    /////////////////////////////////////////////////////////

    useEffect(() => {
      setMinY(minDynamicHeight * 10);
    }, [minDynamicHeight]);

    function onMinUpdate(dx: number, dy: number) {
      if (minY + dy <= 10) {
        return;
      }

      // if (minY + dy >= maxY) {
      //   setMaxdY(dy - (maxY - minY));
      // }

      const snapped = getSnappedValues(dx, dy, snapGrid);
      setMindY(snapped.y);
    }

    function onMinStop() {
      setIsMinDotDragging(false);
      const heightToSet = minY + mindY;
      updateMinHeight(heightToSet);
      setMindY(0);
      if (heightToSet === maxY + maxdY) {
        updateMaxHeight(heightToSet);
      }
      onAnyDotStop();
    }

    function onMinDotStart() {
      setIsMinDotDragging(true);
      onAnyDotStart();
    }

    function onAnyDotStart() {
      setIsResizing && !isResizing && setIsResizing(true);
      selectWidget &&
        selectedWidget !== props.widgetId &&
        selectWidget(props.widgetId);
      // Make sure that this tableFilterPane should close
      showTableFilterPane && showTableFilterPane();
    }

    function onMaxDotStart() {
      setIsMaxDotDragging(true);
      onAnyDotStart();
    }

    const [isMinDotActive, minHoverFns] = useHoverState();
    const [isMaxDotActive, maxHoverFns] = useHoverState();

    const snapGrid = useMemo(
      () => ({
        x: props.parentColumnSpace,
        y: props.parentRowSpace,
      }),
      [props.parentColumnSpace, props.parentRowSpace],
    );

    return (
      <StyledDynamicHeightOverlay>
        <OverlayDisplay
          isActive={
            isMinDotDragging ||
            isMaxDotDragging ||
            isMinDotActive ||
            isMaxDotActive
          }
          maxY={finalMaxY}
        />
        <OverlayHandles
          isMaxDotActive={isMaxDotDragging || isMaxDotActive}
          isMinDotActive={isMinDotDragging || isMinDotActive}
          maxDragFunctions={{
            onUpdate: onMaxUpdate,
            onStop: onMaxStop,
            onStart: onMaxDotStart,
          }}
          maxHoverFns={maxHoverFns}
          maxY={finalMaxY}
          minDragFunctions={{
            onUpdate: onMinUpdate,
            onStop: onMinStop,
            onStart: onMinDotStart,
          }}
          minHoverFns={minHoverFns}
          minY={finalMinY}
          onMaxHeightSet={onMaxHeightSet}
          onMinHeightSet={onMinHeightSet}
        />
        {children}
      </StyledDynamicHeightOverlay>
    );
  },
);

DynamicHeightOverlay.displayName = "DynamicHeightOverlay";

export default DynamicHeightOverlay;
