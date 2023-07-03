import { isResizingDisabled } from "components/editorComponents/WidgetResizer/ResizableUtils";
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
import { getDimensionMap } from "selectors/editorSelectors";
import { getLayerIndexOfWidget } from "utils/autoLayout/AutoLayoutUtils";
import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import WidgetFactory from "utils/WidgetFactory";
import { isFunction } from "lodash";
import type { AppState } from "@appsmith/reducers";
import { getAutoLayoutCanvasMetaWidth } from "selectors/autoLayoutSelectors";
import type { StyledComponent } from "styled-components";
import {
  getWidgetCssWidth,
  getWidgetMinMaxDimensionsInPixel,
} from "utils/autoLayout/flexWidgetUtils";
import type { MinMaxSize } from "utils/autoLayout/flexWidgetUtils";
import type { AlignWidgetTypes } from "widgets/constants";

export type AutoLayoutResizableProps = {
  mainCanvasWidth: number;
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
  onStart: (affectsWidth?: boolean) => void;
  onStop: (props: { width: number; height: number }) => void;
  enableResizing: boolean;
  className?: string;
  parentId?: string;
  widgetId: string;
  zWidgetType?: string;
  zWidgetId?: string;
  isFillWidget?: boolean;
  isHovered: boolean;
  responsiveBehavior?: ResponsiveBehavior;
  isMobile: boolean;
  showResizeBoundary: boolean;
};
const AutoLayoutSnapGrid = {
  x: 1,
  y: 1,
};

export function AutoLayoutResizer(props: AutoLayoutResizableProps) {
  // auto-layouts resizable is dependent on the app state of the widget so on delete it crashes the app
  // so adding this check to render auto layout resize only when the widget does have an app state.
  const widget = useSelector((state: AppState) =>
    getWidget(state, props.widgetId),
  );

  return widget ? <AutoLayoutResizable {...props} /> : null;
}
const checkForCollision: any = () => {
  return false;
};

function AutoLayoutResizable({
  allowResize,
  children,
  className,
  componentHeight,
  componentWidth,
  enableResizing,
  getResizedPositions,
  handles: handlesToRender,
  hasAutoHeight,
  hasAutoWidth,
  isFillWidget,
  isHovered,
  isMobile,
  mainCanvasWidth,
  onStart,
  onStop,
  parentId,
  responsiveBehavior,
  showResizeBoundary,
  widgetId,
  zWidgetId,
  zWidgetType,
}: AutoLayoutResizableProps) {
  const resizableRef = useRef<HTMLDivElement>(null);
  const [isResizing, setResizing] = useState(false);
  // Performance tracking start
  const sentryPerfTags = zWidgetType
    ? [{ name: "widget_type", value: zWidgetType }]
    : [];
  PerformanceTracker.startTracking(
    PerformanceTransactionName.SHOW_RESIZE_HANDLES,
    { widgetId: zWidgetId },
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
    height: componentHeight,
    x: 0,
    y: 0,
    reset: false,
    direction: ReflowDirection.UNSET,
    reflectDimension: true,
    reflectPosition: true,
  });
  const allWidgets = useSelector(getWidgets);
  const { minWidth }: { [key in keyof MinMaxSize]: number | undefined } =
    getWidgetMinMaxDimensionsInPixel(
      { type: zWidgetType },
      mainCanvasWidth || 1,
    );

  const parentWidth = useSelector((state) =>
    getAutoLayoutCanvasMetaWidth(state, parentId || MAIN_CONTAINER_WIDGET_ID),
  );
  const minWidthPercentage = ((minWidth || 0) * 100) / parentWidth;

  const dimensionMap = useSelector(getDimensionMap);
  const {
    bottomRow: bottomRowMap,
    leftColumn: leftColumnMap,
    rightColumn: rightColumnMap,
    topRow: topRowMap,
  } = dimensionMap;
  const { computedAlignment, layer, layerWidthInPixels } = useMemo(() => {
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
    const GapBetweenWidgets = 4;
    const layerWidthInPixels = layer.children.reduce(
      (
        width: number,
        eachWidget: {
          id: string;
          align: AlignWidgetTypes;
        },
      ) => {
        const widget = allWidgets[eachWidget.id];
        if (widget) {
          const widgetWidth =
            (isMobile ? widget.mobileWidth || widget.width : widget.width) || 0;
          let widgetWithInPixels = widgetWidth * 0.01 * parentWidth;
          const {
            minWidth,
          }: { [key in keyof MinMaxSize]: number | undefined } =
            getWidgetMinMaxDimensionsInPixel(
              { type: widget.type },
              mainCanvasWidth || 1,
            );
          if (widgetWithInPixels < (minWidth || 0)) {
            widgetWithInPixels = minWidth || 0;
          }
          width += widgetWithInPixels;
        }
        return width;
      },
      (layer.children.length - 1) * GapBetweenWidgets,
    );
    return { computedAlignment, layer, layerWidthInPixels };
  }, [allWidgets, leftColumnMap, isMobile, mainCanvasWidth]);
  const widget = allWidgets[widgetId];
  const widgetWidthInPixels = componentWidth * 0.01 * parentWidth;
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
      getResizedPositions(resizedPositions);
    const canResize = canResizeHorizontally || canResizeVertically;
    if (canResize) {
      set((prevState) => {
        let newRect = { ...rect };
        // ToDo(Ashok): need to add limits
        const canVerticalMove = true,
          canHorizontalMove = true;
        const hasReachedMaxWidthLimit = !(
          layerWidthInPixels < parentWidth &&
          layerWidthInPixels + rect.width <= parentWidth
        );
        const isIncreasingWidth = newRect.width > 0;
        const setMaxLimitAsWidth =
          !isMobile && hasReachedMaxWidthLimit && isIncreasingWidth;
        minWidthPercentage;
        const hasReachedMimWidthLimit =
          widgetWidthInPixels + rect.width <= (minWidth || 0);
        const setMinLimitAsWidth =
          !isIncreasingWidth && hasReachedMimWidthLimit;
        const minWidthDiff = Math.max(widgetWidthInPixels - (minWidth || 0), 0);
        if (setMaxLimitAsWidth) {
          const maxWidthDiff = parentWidth - layerWidthInPixels;
          newRect = {
            ...newRect,
            width: maxWidthDiff,
            x: maxWidthDiff,
            X: maxWidthDiff,
          };
        } else if (setMinLimitAsWidth) {
          newRect = {
            ...newRect,
            width: -minWidthDiff,
            x: -minWidthDiff,
            X: -minWidthDiff,
          };
        } else {
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
        height: componentHeight,
        x: 0,
        y: 0,
        reset: true,
      };
    });
  }, [componentHeight, componentWidth, isResizing]);

  const handles = [];
  const resizedPositions = {
    left: widget[leftColumnMap],
    right: widget[rightColumnMap],
    top: widget[topRowMap],
    bottom: widget[bottomRowMap],
    id: widget?.widgetId,
  };
  if (widget[leftColumnMap] !== 0 && handlesToRender.left) {
    handles.push({
      dragCallback: (x: number) => {
        let dimensionUpdates = {
          reflectDimension: true,
          reflectPosition: false,
          y: newDimensions.y,
          direction: ReflowDirection.LEFT,
          X: x,
          height: newDimensions.height,
          width: componentWidth,
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
      component: handlesToRender.left,
      handleDirection: ReflowDirection.LEFT,
    });
  }

  if (
    !(
      !isFillWidget &&
      widget[leftColumnMap] !== 0 &&
      widget[rightColumnMap] === GridDefaults.DEFAULT_GRID_COLUMNS
    ) &&
    handlesToRender.right
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
          width: componentWidth,
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
      component: handlesToRender.right,
      handleDirection: ReflowDirection.RIGHT,
    });
  }

  if (handlesToRender.bottom) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        setNewDimensions({
          width: newDimensions.width,
          height: componentHeight + y,
          x: newDimensions.x,
          y: newDimensions.y,
          direction: ReflowDirection.BOTTOM,
          Y: y,
          reflectDimension: true,
          reflectPosition: true,
        });
      },
      component: handlesToRender.bottom,
      handleDirection: ReflowDirection.BOTTOM,
    });
  }

  if (handlesToRender.bottomRight) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        let dimensionUpdates = {
          reflectDimension: true,
          reflectPosition: false,
          y: newDimensions.y,
          width: componentWidth + x,
          height: componentHeight + y,
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
      component: handlesToRender.bottomRight,
      handleDirection: ReflowDirection.BOTTOMRIGHT,
      affectsWidth: true,
    });
  }

  if (handlesToRender.bottomLeft) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        let dimensionUpdates = {
          reflectDimension: true,
          reflectPosition: false,
          x: x,
          width: componentWidth - x,
          height: componentHeight + y,
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
      component: handlesToRender.bottomLeft,
      handleDirection: ReflowDirection.BOTTOMLEFT,
      affectsWidth: true,
    });
  }

  const onResizeStop = () => {
    togglePointerEvents(true);
    const widthChange = (newDimensions.width * 100) / parentWidth;
    const newlyComputedWidth = Math.min(
      Math.max(componentWidth + widthChange, minWidthPercentage),
      100,
    );
    //ToDo: Ashok need to add check to update widgets only when needed
    onStop({
      width: newlyComputedWidth,
      height: newDimensions.height,
    });
    setResizing(false);
  };

  const renderHandles = handles.map((handle, index) => {
    let disableResizing = !enableResizing;

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
      );
    }

    return (
      <ResizableHandle
        {...handle}
        allowResize={allowResize && !handle?.affectsWidth && !disableResizing}
        checkForCollision={checkForCollision}
        direction={handle.handleDirection}
        disableDot={disableResizing}
        isHovered={isHovered}
        key={index}
        onStart={() => {
          togglePointerEvents(false);
          onStart();
          setResizing(true);
        }}
        onStop={onResizeStop}
        scrollParent={resizableRef.current}
        snapGrid={AutoLayoutSnapGrid}
      />
    );
  });

  const resizeWrapperStyle: CSSProperties = getWrapperStyle(
    false,
    showResizeBoundary,
    !isResizing && allowResize,
    isHovered,
  );

  const wrapperClassName = useMemo(() => {
    return `${className} resize-wrapper ${
      showResizeBoundary ? "show-boundary" : ""
    } ${pointerEvents ? "" : "pointer-event-none"}`;
  }, [className, pointerEvents, showResizeBoundary]);
  const computedParentWidth = getWidgetCssWidth(
    hasAutoWidth,
    responsiveBehavior,
    componentWidth,
    parentWidth,
  );
  return (
    <ResizeWrapper
      className={wrapperClassName}
      id={`resize-${widgetId}`}
      ref={resizableRef}
      style={{
        ...resizeWrapperStyle,
        ...{
          width:
            hasAutoWidth || !isResizing
              ? "100%"
              : isResizing &&
                `calc(${computedParentWidth} + ${newDimensions.width}px)`,
          height:
            hasAutoHeight || !isResizing ? "100%" : `${newDimensions.height}px`,
        },
      }}
    >
      {children}
      {enableResizing && renderHandles}
    </ResizeWrapper>
  );
}

export default AutoLayoutResizer;
