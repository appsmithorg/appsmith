import { reflowMoveAction, stopReflowAction } from "actions/reflowActions";
import {
  isHandleResizeAllowed,
  isResizingDisabled,
} from "layoutSystems/common/resizer/ResizableUtils";
import type { OccupiedSpace } from "constants/CanvasEditorConstants";
import { GridDefaults, WIDGET_PADDING } from "constants/WidgetConstants";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spring } from "react-spring";
import type {
  MovementLimitMap,
  ReflowedSpace,
  ReflowedSpaceMap,
} from "reflow/reflowTypes";
import { ReflowDirection } from "reflow/reflowTypes";
import {
  ResizableHandle,
  RESIZE_BORDER_BUFFER,
  ResizeWrapper,
  getWrapperStyle,
} from "layoutSystems/common/resizer/common";
import type {
  DimensionUpdateProps,
  ResizableProps,
} from "layoutSystems/common/resizer/common";
import { getWidget, getWidgets } from "sagas/selectors";
import {
  getContainerOccupiedSpacesSelectorWhileResizing,
  getDimensionMap,
} from "selectors/editorSelectors";
import { getReflowSelector } from "selectors/widgetReflowSelectors";
import {
  getFillWidgetLengthForLayer,
  getLayerIndexOfWidget,
} from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { useReflow } from "utils/hooks/useReflow";
import WidgetFactory from "WidgetProvider/factory";
import { isDropZoneOccupied } from "utils/WidgetPropsUtils";
import { isFunction } from "lodash";
import type { AppState } from "ee/reducers";

/**
 * AutoLayoutResizable
 *
 * AutoLayoutResizableComponent is dependent on the app state of the widget(List widget items) so on delete it crashes the app
 * so adding this component to render auto-layout resize only when the widget does have an app state
 *
 */

export function AutoLayoutResizable(props: ResizableProps) {
  // auto-layouts resizable is dependent on the app state of the widget so on delete it crashes the app
  // so adding this check to render auto-layout resize only when the widget does have an app state.
  const widget = useSelector((state: AppState) =>
    getWidget(state, props.widgetId),
  );

  return widget ? <AutoLayoutResizableComponent {...props} /> : null;
}

/**
 * AutoLayoutResizableComponent
 *
 * Component that renders the resizing handles of a widget in Auto Layout Editor.
 * It also handles the component dimension and position updation based on where it is aligned in the parent layer(AutoLayoutLayer).
 *
 */

function AutoLayoutResizableComponent(props: ResizableProps) {
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
    false,
  );

  //end
  const [pointerEvents, togglePointerEvents] = useState(true);
  const [newDimensions, set] = useState<DimensionUpdateProps>({
    width: props.componentWidth,
    height: props.componentHeight,
    x: 0,
    y: 0,
    reset: false,
    direction: ReflowDirection.UNSET,
    reflectDimension: true,
    reflectPosition: true,
  });
  const allWidgets = useSelector(getWidgets);
  const dimensionMap = useSelector(getDimensionMap);
  const {
    bottomRow: bottomRowMap,
    leftColumn: leftColumnMap,
    rightColumn: rightColumnMap,
    topRow: topRowMap,
  } = dimensionMap;
  const dispatch = useDispatch();
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const triggerAutoLayoutBasedReflow = (resizedPositions: OccupiedSpace) => {
    let canHorizontalMove = false;
    const widgets = {
      ...allWidgets,
      [props.widgetId]: {
        ...widget,
        leftColumn: resizedPositions.left,
        rightColumn: resizedPositions.right,
        topRow: resizedPositions.top,
        bottomRow: resizedPositions.bottom,
      },
    };
    const fillWidgetsLength = getFillWidgetLengthForLayer(
      layer,
      widgets,
      dimensionMap,
    );
    if (fillWidgetsLength) {
      let correctedMovementMap: ReflowedSpaceMap = {};
      for (const child of layer.children) {
        const childWidget = allWidgets[child.id];
        const updatedWidth =
          fillWidgetsLength * props.gridProps.parentColumnSpace;
        if (
          childWidget &&
          childWidget.responsiveBehavior === ResponsiveBehavior.Fill &&
          (childWidget[rightColumnMap] - childWidget[leftColumnMap]) *
            childWidget.parentColumnSpace !==
            updatedWidth
        ) {
          canHorizontalMove = true;
          correctedMovementMap = {
            ...correctedMovementMap,
            [child.id]: {
              width: fillWidgetsLength * props.gridProps.parentColumnSpace,
            },
          };
        }
      }
      dispatch(reflowMoveAction(correctedMovementMap));
    }
    return canHorizontalMove;
  };

  const setNewDimensions = (
    direction: ReflowDirection,
    resizedPositions: OccupiedSpace,
    rect: DimensionUpdateProps,
  ) => {
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
        if (
          hasFillChild &&
          (resizedPositions.left !== widget[leftColumnMap] ||
            resizedPositions.right !== widget[rightColumnMap])
        ) {
          canHorizontalMove = triggerAutoLayoutBasedReflow(resizedPositions);
        }

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

        if (
          (canResizeHorizontally || hasFillChild) &&
          canResizeVertically &&
          canVerticalMove &&
          canHorizontalMove
        ) {
          updatedPositions.current = resizedPositions;
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
  const resizedPositions = {
    left: widget[leftColumnMap],
    right: widget[rightColumnMap],
    top: widget[topRowMap],
    bottom: widget[bottomRowMap],
    id: widget?.widgetId,
  };
  const updatedPositions = useRef(resizedPositions);
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
        const currentUpdatePositions = { ...updatedPositions.current };
        if (widgetAlignment === "start") {
          currentUpdatePositions.right =
            widget[rightColumnMap] - x / props.gridProps.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth - x,
            x: 0,
          };
        } else if (widgetAlignment === "center") {
          currentUpdatePositions.right =
            widget[rightColumnMap] - x / props.gridProps.parentColumnSpace;
          currentUpdatePositions.left =
            widget[leftColumnMap] + x / props.gridProps.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth - 2 * x,
            x: 0,
            reflectDimension: true,
            reflectPosition: true,
          };
        } else {
          currentUpdatePositions.left =
            widget[leftColumnMap] + x / props.gridProps.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth - x,
            x,
          };
        }
        setNewDimensions(
          ReflowDirection.LEFT,
          currentUpdatePositions,
          dimensionUpdates,
        );
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
        const currentUpdatePositions = { ...updatedPositions.current };
        if (widgetAlignment === "start") {
          currentUpdatePositions.right =
            widget[rightColumnMap] + x / props.gridProps.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth + x,
            x: 0,
          };
        } else if (widgetAlignment === "center") {
          currentUpdatePositions.right =
            widget[rightColumnMap] + x / props.gridProps.parentColumnSpace;
          currentUpdatePositions.left =
            widget[leftColumnMap] - x / props.gridProps.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth + 2 * x,
            x: 0,
            reflectDimension: true,
            reflectPosition: true,
          };
        } else {
          currentUpdatePositions.left =
            widget[leftColumnMap] - x / props.gridProps.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth + x,
            x: 0,
          };
        }
        setNewDimensions(
          ReflowDirection.RIGHT,
          currentUpdatePositions,
          dimensionUpdates,
        );
      },
      component: props.handles.right,
      handleDirection: ReflowDirection.RIGHT,
    });
  }

  if (props.handles.bottom) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        const currentUpdatePositions = { ...updatedPositions.current };
        currentUpdatePositions.bottom =
          widget[bottomRowMap] + y / props.gridProps.parentRowSpace;
        setNewDimensions(ReflowDirection.BOTTOM, currentUpdatePositions, {
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
        const currentUpdatePositions = { ...updatedPositions.current };
        currentUpdatePositions.bottom =
          widget[bottomRowMap] + y / props.gridProps.parentRowSpace;
        if (widgetAlignment === "start") {
          currentUpdatePositions.right =
            widget[rightColumnMap] + x / props.gridProps.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth + x,
            x: 0,
          };
        } else if (widgetAlignment === "center") {
          currentUpdatePositions.right =
            widget[rightColumnMap] + x / props.gridProps.parentColumnSpace;
          currentUpdatePositions.left =
            widget[leftColumnMap] - x / props.gridProps.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth + 2 * x,
            x: 0,
            reflectDimension: true,
            reflectPosition: true,
          };
        } else {
          currentUpdatePositions.left =
            widget[leftColumnMap] - x / props.gridProps.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth + x,
            x: 0,
          };
        }
        setNewDimensions(
          ReflowDirection.BOTTOMRIGHT,
          currentUpdatePositions,
          dimensionUpdates,
        );
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
        const currentUpdatePositions = { ...updatedPositions.current };

        currentUpdatePositions.bottom =
          widget[bottomRowMap] + y / props.gridProps.parentRowSpace;
        if (widgetAlignment === "start") {
          currentUpdatePositions.right =
            widget[rightColumnMap] - x / props.gridProps.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth - x,
            x: 0,
          };
        } else if (widgetAlignment === "center") {
          currentUpdatePositions.right =
            widget[rightColumnMap] - x / props.gridProps.parentColumnSpace;
          currentUpdatePositions.left =
            widget[leftColumnMap] + x / props.gridProps.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth - 2 * x,
            x: 0,
            reflectDimension: true,
            reflectPosition: true,
          };
        } else {
          currentUpdatePositions.left =
            widget[leftColumnMap] + x / props.gridProps.parentColumnSpace;
          dimensionUpdates = {
            ...dimensionUpdates,
            width: props.componentWidth - x,
            x,
          };
        }
        setNewDimensions(
          ReflowDirection.BOTTOMLEFT,
          currentUpdatePositions,
          dimensionUpdates,
        );
      },
      component: props.handles.bottomLeft,
      handleDirection: ReflowDirection.BOTTOMLEFT,
      affectsWidth: true,
    });
  }

  const onResizeStop = () => {
    togglePointerEvents(true);
    dispatch(stopReflowAction());

    props.onStop(
      {
        width:
          props.componentWidth +
          (updatedPositions.current.right - resizedPositions.right) *
            props.gridProps.parentColumnSpace,
        height:
          props.componentHeight +
          (updatedPositions.current.bottom - resizedPositions.bottom) *
            props.gridProps.parentRowSpace,
      },
      {
        x:
          (updatedPositions.current.left - resizedPositions.left) *
          props.gridProps.parentColumnSpace,
        y:
          (updatedPositions.current.top - resizedPositions.top) *
          props.gridProps.parentRowSpace,
      },
      dimensionMap,
    );
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
          updatedPositions.current = resizedPositions;
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
          newDimensions.reflectPosition ? newDimensions.x : 0
        }px,${newDimensions.reflectPosition ? newDimensions.y : 0}px,0)`,
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
