import {
  isHandleResizeAllowed,
  isResizingDisabled,
} from "components/editorComponents/WidgetResizer/ResizableUtils";
import type { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { CSSProperties } from "react";
import { useSelector } from "react-redux";
import { ReflowDirection } from "reflow/reflowTypes";
import {
  ResizableHandle,
  ResizeWrapper,
  getWrapperStyle,
} from "components/editorComponents/WidgetResizer/resizable/common";
import type { DimensionUpdateProps } from "components/editorComponents/WidgetResizer/resizable/common";
import { getWidget, getWidgets } from "sagas/selectors";
import {
  getContainerOccupiedSpacesSelectorWhileResizing,
  getDimensionMap,
} from "selectors/editorSelectors";
import { getLayerIndexOfWidget } from "utils/autoLayout/AutoLayoutUtils";
import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import type { LayoutDirection } from "utils/autoLayout/constants";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import WidgetFactory from "utils/WidgetFactory";
import { isDropZoneOccupied } from "utils/WidgetPropsUtils";
import { isFunction } from "lodash";
import type { AppState } from "@appsmith/reducers";
import { getAutoLayoutCanvasMetaWidth } from "selectors/autoLayoutSelectors";
import type { StyledComponent } from "styled-components";

export type AutoLayoutResizableProps = {
  hasAutoHeight: boolean;
  hasAutoWidth: boolean;
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
  getResizedPositions: (resizedPositions: OccupiedSpace) => {
    canResizeHorizontally: boolean;
    canResizeVertically: boolean;
  };
  maxHeightInPx: number; // Maximum height in pixels, the child can have.
  originalPositions: OccupiedSpace;
  onStart: (affectsWidth?: boolean) => void;
  onStop: (props: { width: number; height: number }) => void;
  snapGrid: { x: number; y: number };
  enableVerticalResize: boolean;
  enableHorizontalResize: boolean;
  className?: string;
  parentId?: string;
  widgetId: string;
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
export function ReflowResizable(props: AutoLayoutResizableProps) {
  // Auto Layouts resizable is dependent on the app state of the widget so on delete it crashes the app
  // so adding this check to render auto layout resize only when the widget does have an app state.
  const widget = useSelector((state: AppState) =>
    getWidget(state, props.widgetId),
  );

  return widget ? <AutoLayoutResizable {...props} /> : null;
}

function AutoLayoutResizable(props: AutoLayoutResizableProps) {
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

  useEffect(() => {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.SHOW_RESIZE_HANDLES,
    );
  }, []);
  //end
  const [pointerEvents, togglePointerEvents] = useState(true);
  const [newDimensions, set] = useState<DimensionUpdateProps>({
    width: 0,
    height: props.componentHeight,
    x: 0,
    y: 0,
    reset: false,
    direction: ReflowDirection.UNSET,
    reflectDimension: true,
    reflectPosition: true,
  });
  const allWidgets = useSelector(getWidgets);
  const parentWidth = useSelector((state) =>
    getAutoLayoutCanvasMetaWidth(
      state,
      props.parentId || MAIN_CONTAINER_WIDGET_ID,
    ),
  );
  const dimensionMap = useSelector(getDimensionMap);
  const {
    bottomRow: bottomRowMap,
    leftColumn: leftColumnMap,
    rightColumn: rightColumnMap,
    topRow: topRowMap,
  } = dimensionMap;
  const { computedAlignment, layer } = useMemo(() => {
    const { widgetId } = props;
    const widget = allWidgets[widgetId];
    const layer = (() => {
      if (!widget || !widget?.parentId) return {};
      const parent = allWidgets[widget?.parentId];
      if (!parent) return {};
      const flexLayers = parent.flexLayers;
      const layerIndex = getLayerIndexOfWidget(flexLayers, widgetId);
      if (layerIndex === -1) return {};
      return flexLayers[layerIndex];
    })();
    const computedAlignment = (() => {
      const centerColumn = GridDefaults.DEFAULT_GRID_COLUMNS / 2;
      const leftColumn = widget[leftColumnMap];
      return leftColumn > centerColumn ? "end" : "start";
    })();
    return { computedAlignment, layer };
  }, [props, allWidgets, leftColumnMap]);
  const widget = allWidgets[props.widgetId];
  const fillWidgetsFilter = (each: any) => {
    const currentWidget = allWidgets[each.id];
    return (
      currentWidget &&
      currentWidget?.responsiveBehavior === ResponsiveBehavior.Fill &&
      !(
        currentWidget[topRowMap] >= widget[bottomRowMap] ||
        currentWidget[bottomRowMap] <= widget[topRowMap]
      )
    );
  };
  const allFillWidgets =
    !!layer && layer?.children?.length
      ? layer.children.filter(fillWidgetsFilter)
      : [];
  const hasFillChild = allFillWidgets.length > 0;
  const widgetAlignment = hasFillChild
    ? computedAlignment
    : widget?.alignment || FlexLayerAlignment.Start;

  const setNewDimensions = (rect: DimensionUpdateProps) => {
    const { canResizeHorizontally, canResizeVertically } =
      props.getResizedPositions(resizedPositions);
    const canResize = canResizeHorizontally || canResizeVertically;
    if (canResize) {
      set((prevState) => {
        let newRect = { ...rect };
        // ToDo(Ashok): need to add limits
        const canVerticalMove = true,
          canHorizontalMove = true;

        //if it should not resize horizontally, we keep keep the previous horizontal dimensions
        if (!canHorizontalMove || !(canResizeHorizontally || hasFillChild)) {
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

        return newRect;
      });
    }
  };

  useEffect(() => {
    set((prevDimensions) => {
      return {
        ...prevDimensions,
        width: 0,
        height: props.componentHeight,
        x: 0,
        y: 0,
        reset: true,
      };
    });
  }, [props.componentHeight, props.componentWidth, isResizing]);

  const handles = [];
  const resizedPositions = {
    left: widget[leftColumnMap],
    right: widget[rightColumnMap],
    top: widget[topRowMap],
    bottom: widget[bottomRowMap],
    id: widget?.widgetId,
  };
  if (widget[leftColumnMap] !== 0 && props.handles.left) {
    handles.push({
      dragCallback: (x: number) => {
        let dimensionUpdates = {
          reflectDimension: true,
          reflectPosition: false,
          y: newDimensions.y,
          direction: ReflowDirection.LEFT,
          X: x,
          height: newDimensions.height,
          width: props.componentWidth,
          x: x,
        };
        if (widgetAlignment === "start") {
          dimensionUpdates = {
            ...dimensionUpdates,
            width: -x,
            x: 0,
          };
        } else if (widgetAlignment === "center") {
          dimensionUpdates = {
            ...dimensionUpdates,
            width: -2 * x,
            x: 0,
            reflectDimension: true,
            reflectPosition: true,
          };
        } else {
          dimensionUpdates = {
            ...dimensionUpdates,
            width: -x,
            x,
          };
        }
        setNewDimensions(dimensionUpdates);
      },
      component: props.handles.left,
      handleDirection: ReflowDirection.LEFT,
    });
  }

  if (
    !(
      widget[leftColumnMap] !== 0 &&
      widget[rightColumnMap] === GridDefaults.DEFAULT_GRID_COLUMNS
    ) &&
    props.handles.right
  ) {
    handles.push({
      dragCallback: (x: number) => {
        let dimensionUpdates = {
          reflectDimension: true,
          reflectPosition: false,
          y: newDimensions.y,
          direction: ReflowDirection.RIGHT,
          X: x,
          height: newDimensions.height,
          width: props.componentWidth,
          x: x,
        };
        if (widgetAlignment === "start") {
          dimensionUpdates = {
            ...dimensionUpdates,
            width: x,
            x: 0,
          };
        } else if (widgetAlignment === "center") {
          dimensionUpdates = {
            ...dimensionUpdates,
            width: 2 * x,
            x: 0,
            reflectDimension: true,
            reflectPosition: true,
          };
        } else {
          dimensionUpdates = {
            ...dimensionUpdates,
            width: x,
            x: 0,
          };
        }
        setNewDimensions(dimensionUpdates);
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
          reflectDimension: true,
          reflectPosition: true,
        });
      },
      component: props.handles.bottom,
      handleDirection: ReflowDirection.BOTTOM,
    });
  }

  if (props.handles.bottomRight) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        let dimensionUpdates = {
          reflectDimension: true,
          reflectPosition: false,
          y: newDimensions.y,
          width: props.componentWidth + x,
          height: props.componentHeight + y,
          x: newDimensions.x,
          direction: ReflowDirection.BOTTOMRIGHT,
          X: x,
          Y: y,
        };

        if (widgetAlignment === "start") {
          dimensionUpdates = {
            ...dimensionUpdates,
            width: x,
            x: 0,
          };
        } else if (widgetAlignment === "center") {
          dimensionUpdates = {
            ...dimensionUpdates,
            width: 2 * x,
            x: 0,
            reflectDimension: true,
            reflectPosition: true,
          };
        } else {
          dimensionUpdates = {
            ...dimensionUpdates,
            width: x,
            x: 0,
          };
        }
        setNewDimensions(dimensionUpdates);
      },
      component: props.handles.bottomRight,
      handleDirection: ReflowDirection.BOTTOMRIGHT,
      affectsWidth: true,
    });
  }

  if (props.handles.bottomLeft) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        let dimensionUpdates = {
          reflectDimension: true,
          reflectPosition: false,
          x: x,
          width: props.componentWidth - x,
          height: props.componentHeight + y,
          y: newDimensions.y,
          direction: ReflowDirection.BOTTOMLEFT,
          X: x,
          Y: y,
        };

        if (widgetAlignment === "start") {
          dimensionUpdates = {
            ...dimensionUpdates,
            width: -x,
            x: 0,
          };
        } else if (widgetAlignment === "center") {
          dimensionUpdates = {
            ...dimensionUpdates,
            width: -2 * x,
            x: 0,
            reflectDimension: true,
            reflectPosition: true,
          };
        } else {
          dimensionUpdates = {
            ...dimensionUpdates,
            width: -x,
            x,
          };
        }
        setNewDimensions(dimensionUpdates);
      },
      component: props.handles.bottomLeft,
      handleDirection: ReflowDirection.BOTTOMLEFT,
      affectsWidth: true,
    });
  }

  const onResizeStop = () => {
    togglePointerEvents(true);
    const widthChange = (newDimensions.width * 100) / parentWidth;
    props.onStop({
      width: Math.min(props.componentWidth + widthChange, 100),
      height: newDimensions.height,
    });
    setResizing(false);
  };

  const renderHandles = handles.map((handle, index) => {
    const disableDot = !isHandleResizeAllowed(
      props.enableHorizontalResize,
      props.enableVerticalResize,
      handle.handleDirection,
    );

    let disableResizing = false;

    if (widget && widget.type) {
      let { disableResizeHandles } = WidgetFactory.getWidgetAutoLayoutConfig(
        widget.type,
      );
      if (isFunction(disableResizeHandles)) {
        disableResizeHandles = disableResizeHandles(widget);
      }

      disableResizing = isResizingDisabled(
        disableResizeHandles,
        handle.handleDirection,
        props.isFlexChild,
        props.responsiveBehavior,
      );
    }

    return (
      <ResizableHandle
        {...handle}
        allowResize={
          props.allowResize &&
          !(
            props.responsiveBehavior === ResponsiveBehavior.Fill &&
            handle?.affectsWidth
          ) &&
          !disableResizing
        }
        checkForCollision={checkForCollision}
        direction={handle.handleDirection}
        disableDot={disableDot || disableResizing}
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

  const resizeWrapperStyle: CSSProperties = getWrapperStyle(
    false,
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
    <ResizeWrapper
      className={wrapperClassName}
      id={`resize-${props.widgetId}`}
      ref={resizableRef}
      style={{
        ...resizeWrapperStyle,
        ...{
          width:
            props.hasAutoWidth || !isResizing
              ? "100%"
              : isResizing && `calc(100% + ${newDimensions.width}px)`,
          height:
            props.hasAutoHeight || !isResizing
              ? "100%"
              : `${newDimensions.height}px`,
        },
      }}
    >
      {props.children}
      {props.enableHorizontalResize && renderHandles}
    </ResizeWrapper>
  );
}

export default ReflowResizable;
