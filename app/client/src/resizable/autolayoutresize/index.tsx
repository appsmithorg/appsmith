import { reflowMoveAction, stopReflowAction } from "actions/reflowActions";
import { isHandleResizeAllowed } from "components/editorComponents/ResizableUtils";
import { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  GridDefaults,
  WidgetHeightLimits,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spring } from "react-spring";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  MovementLimitMap,
  ReflowDirection,
  ReflowedSpace,
  ReflowedSpaceMap,
} from "reflow/reflowTypes";
import {
  DimensionUpdateProps,
  ResizableHandle,
  ResizableProps,
  ResizeWrapper,
  RESIZE_BORDER_BUFFER,
} from "resizable/common";
import { getWidgets } from "sagas/selectors";
import {
  getContainerOccupiedSpacesSelectorWhileResizing,
  getCurrentAppPositioningType,
} from "selectors/editorSelectors";
import { getReflowSelector } from "selectors/widgetReflowSelectors";
import {
  getFillWidgetLengthForLayer,
  getLayerIndexOfWidget,
} from "utils/autoLayout/AutoLayoutUtils";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { useReflow } from "utils/hooks/useReflow";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { isDropZoneOccupied } from "utils/WidgetPropsUtils";

export function ReflowResizable(props: ResizableProps) {
  const resizableRef = useRef<HTMLDivElement>(null);
  const [isResizing, setResizing] = useState(false);
  const isAutoLayout =
    useSelector(getCurrentAppPositioningType) === AppPositioningTypes.AUTO;
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
    false,
  );

  useEffect(() => {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.SHOW_RESIZE_HANDLES,
    );
  }, []);
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
  const widgetAlignment = allWidgets[props.widgetId].alignment || "start";
  const dispatch = useDispatch();
  const layer = useMemo(() => {
    const { widgetId } = props;
    const widget = allWidgets[widgetId];
    if (!widget || !widget.parentId) return {};
    const parent = allWidgets[widget.parentId];
    if (!parent) return {};
    const flexLayers = parent.flexLayers;
    const layerIndex = getLayerIndexOfWidget(flexLayers, widgetId);
    if (layerIndex === -1) return {};
    return flexLayers[layerIndex];
  }, [props, allWidgets]);
  const hasFillChild =
    !!layer &&
    layer.children.some((each: any) => {
      const widget = allWidgets[each.id];
      return widget && widget.responsiveBehavior === ResponsiveBehavior.Fill;
    });
  const triggerAutoLayoutBasedReflow = (resizedPositions: OccupiedSpace) => {
    let canHorizontalMove = false;
    const widgets = {
      ...allWidgets,
      [props.widgetId]: {
        ...allWidgets[props.widgetId],
        leftColumn: resizedPositions.left,
        rightColumn: resizedPositions.right,
        topRow: resizedPositions.top,
        bottomRow: resizedPositions.bottom,
      },
    };
    const fillWidgetsLength = getFillWidgetLengthForLayer(layer, widgets);
    if (fillWidgetsLength) {
      let correctedMovementMap: ReflowedSpaceMap = {};
      for (const child of layer.children) {
        const childWidget = allWidgets[child.id];
        const updatedWidth = fillWidgetsLength * widget.parentColumnSpace;
        if (
          childWidget &&
          childWidget.responsiveBehavior === ResponsiveBehavior.Fill &&
          (childWidget.rightColumn - childWidget.leftColumn) *
            childWidget.parentColumnSpace !==
            updatedWidth
        ) {
          canHorizontalMove = true;
          correctedMovementMap = {
            ...correctedMovementMap,
            [child.id]: {
              width: fillWidgetsLength * widget.parentColumnSpace,
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
    const {
      canResizeHorizontally,
      canResizeVertically,
    } = props.getResizedPositions(resizedPositions);
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
        if (isAutoLayout && hasFillChild) {
          canHorizontalMove = triggerAutoLayoutBasedReflow(resizedPositions);
        }

        //if it should not resize horizontally, we keep keep the previous horizontal dimensions
        if (!canHorizontalMove || !canResizeHorizontally) {
          console.log("I cannot move", { resizedPositions });
          newRect = {
            ...newRect,
            width: prevState.width,
            x: prevState.x,
            X: prevState.X,
          };
        } else {
          console.log("I can move", { resizedPositions });
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

        console.log({ newRect });
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
  const widget = allWidgets[props.widgetId];
  const resizedPositions = {
    left: widget.leftColumn,
    right: widget.rightColumn,
    top: widget.topRow,
    bottom: widget.bottomRow,
    id: widget.widgetId,
  };
  if (!(isAutoLayout && widget.leftColumn === 0) && props.handles.left) {
    handles.push({
      dragCallback: (x: number) => {
        const updatedPositions = { ...resizedPositions };
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
        if (isAutoLayout) {
          if (widgetAlignment === "start" || hasFillChild) {
            updatedPositions.right =
              widget.rightColumn - x / widget.parentColumnSpace;
            dimensionUpdates = {
              ...dimensionUpdates,
              width: props.componentWidth - x,
              x: 0,
            };
          } else if (widgetAlignment === "center") {
            updatedPositions.right =
              widget.rightColumn - x / widget.parentColumnSpace;
            updatedPositions.left =
              widget.leftColumn - x / widget.parentColumnSpace;
            dimensionUpdates = {
              ...dimensionUpdates,
              width: props.componentWidth - 2 * x,
              x: 0,
              reflectDimension: true,
              reflectPosition: true,
            };
          } else {
            updatedPositions.left =
              widget.leftColumn + x / widget.parentColumnSpace;
            dimensionUpdates = {
              ...dimensionUpdates,
              width: props.componentWidth - x,
              x,
            };
          }
          setNewDimensions(
            ReflowDirection.LEFT,
            updatedPositions,
            dimensionUpdates,
          );
        }
      },
      component: props.handles.left,
      handleDirection: ReflowDirection.LEFT,
    });
  }

  if (
    !(
      isAutoLayout &&
      widget.leftColumn !== 0 &&
      widget.rightColumn === GridDefaults.DEFAULT_GRID_COLUMNS
    ) &&
    props.handles.right
  ) {
    handles.push({
      dragCallback: (x: number) => {
        const updatedPositions = { ...resizedPositions };
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
        if (isAutoLayout) {
          if (widgetAlignment === "start" || hasFillChild) {
            updatedPositions.right =
              widget.rightColumn + x / widget.parentColumnSpace;
            dimensionUpdates = {
              ...dimensionUpdates,
              width: props.componentWidth + x,
              x: 0,
            };
          } else if (widgetAlignment === "center") {
            updatedPositions.right =
              widget.rightColumn + x / widget.parentColumnSpace;
            updatedPositions.left =
              widget.leftColumn + x / widget.parentColumnSpace;
            dimensionUpdates = {
              ...dimensionUpdates,
              width: props.componentWidth + 2 * x,
              x: 0,
              reflectDimension: true,
              reflectPosition: true,
            };
          } else {
            updatedPositions.left =
              widget.leftColumn - x / widget.parentColumnSpace;
            dimensionUpdates = {
              ...dimensionUpdates,
              width: props.componentWidth + x,
              x: 0,
            };
          }
          setNewDimensions(
            ReflowDirection.RIGHT,
            updatedPositions,
            dimensionUpdates,
          );
        }
      },
      component: props.handles.right,
      handleDirection: ReflowDirection.RIGHT,
    });
  }

  if (props.handles.bottom) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        const updatedPositions = { ...resizedPositions };
        updatedPositions.bottom = widget.bottomRow + x / widget.parentRowSpace;
        setNewDimensions(ReflowDirection.RIGHT, updatedPositions, {
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
        const updatedPositions = { ...resizedPositions };
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
        if (isAutoLayout) {
          if (widgetAlignment === "start" || hasFillChild) {
            updatedPositions.right =
              widget.rightColumn + x / widget.parentColumnSpace;
            dimensionUpdates = {
              ...dimensionUpdates,
              width: props.componentWidth + x,
              x: 0,
            };
          } else if (widgetAlignment === "center") {
            updatedPositions.right =
              widget.rightColumn + x / widget.parentColumnSpace;
            updatedPositions.left =
              widget.leftColumn + x / widget.parentColumnSpace;
            dimensionUpdates = {
              ...dimensionUpdates,
              width: props.componentWidth + 2 * x,
              x: 0,
              reflectDimension: true,
              reflectPosition: true,
            };
          } else {
            updatedPositions.left =
              widget.leftColumn - x / widget.parentColumnSpace;
            dimensionUpdates = {
              ...dimensionUpdates,
              width: props.componentWidth + x,
              x: 0,
            };
          }
          setNewDimensions(
            ReflowDirection.BOTTOMRIGHT,
            updatedPositions,
            dimensionUpdates,
          );
        }
      },
      component: props.handles.bottomRight,
      affectsWidth: true,
    });
  }

  if (props.handles.bottomLeft) {
    handles.push({
      dragCallback: (x: number, y: number) => {
        const updatedPositions = { ...resizedPositions };
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
        if (isAutoLayout) {
          if (widgetAlignment === "start" || hasFillChild) {
            updatedPositions.right =
              widget.rightColumn - x / widget.parentColumnSpace;
            dimensionUpdates = {
              ...dimensionUpdates,
              width: props.componentWidth - x,
              x: 0,
            };
          } else if (widgetAlignment === "center") {
            updatedPositions.right =
              widget.rightColumn - x / widget.parentColumnSpace;
            updatedPositions.left =
              widget.leftColumn - x / widget.parentColumnSpace;
            dimensionUpdates = {
              ...dimensionUpdates,
              width: props.componentWidth - 2 * x,
              x: 0,
              reflectDimension: true,
              reflectPosition: true,
            };
          } else {
            updatedPositions.left =
              widget.leftColumn + x / widget.parentColumnSpace;
            dimensionUpdates = {
              ...dimensionUpdates,
              width: props.componentWidth - x,
              x,
            };
          }
          setNewDimensions(
            ReflowDirection.BOTTOMLEFT,
            updatedPositions,
            dimensionUpdates,
          );
        }
      },
      component: props.handles.bottomLeft,
      affectsWidth: true,
    });
  }
  const onResizeStop = () => {
    togglePointerEvents(true);
    if (isAutoLayout) {
      dispatch(stopReflowAction());
    }
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
      props.isFlexChild,
      props.responsiveBehavior,
    );
    return (
      <ResizableHandle
        {...handle}
        allowResize={
          props.allowResize &&
          !(
            props.responsiveBehavior === ResponsiveBehavior.Fill &&
            handle?.affectsWidth
          )
        }
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
  const bufferForBoundary = props.showResizeBoundary ? RESIZE_BORDER_BUFFER : 0;
  const widgetWidth =
    (reflowedPosition?.width === undefined
      ? newDimensions.width
      : reflowedPosition.width - 2 * WIDGET_PADDING) + bufferForBoundary;
  const widgetHeight =
    (reflowedPosition?.height === undefined
      ? newDimensions.height
      : reflowedPosition.height - 2 * WIDGET_PADDING) + bufferForBoundary;
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
        transform: `translate3d(${(newDimensions.reflectPosition
          ? newDimensions.x
          : 0) -
          bufferForBoundary / 2}px,${(newDimensions.reflectPosition
          ? newDimensions.y
          : 0) -
          bufferForBoundary / 2}px,0)`,
      }}
    >
      {(_props) => (
        <ResizeWrapper
          $prevents={pointerEvents}
          className={props.className}
          id={`resize-${props.widgetId}`}
          isHovered={props.isHovered}
          ref={resizableRef}
          showBoundaries={props.showResizeBoundary}
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
