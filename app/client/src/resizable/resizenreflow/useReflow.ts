import { reflowMove, startReflow, stopReflow } from "actions/reflowActions";
import { DropTargetContext } from "components/editorComponents/DropTargetComponent";
import { GridDefaults } from "constants/WidgetConstants";
import { UIElementSize } from "components/editorComponents/ResizableUtils";
import { ceil, cloneDeep } from "lodash";
import { RefObject, useRef, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CollidingWidgets,
  Reflow,
  reflowWidgets,
  StaticReflowWidget,
} from "reducers/uiReducers/reflowReducer";
import { DimensionProps, ResizeDirection } from "resizable/resizenreflow";
import { getOccupiedSpaces } from "selectors/editorSelectors";
import { generateClassName } from "utils/generators";
import { XYCord } from "utils/hooks/useCanvasDragging";
import {
  getSnapColumns,
  isDropZoneOccupied,
  Rect,
} from "utils/WidgetPropsUtils";
import { WidgetRowCols } from "widgets/BaseWidget";
import { getReflowWidgetSelector } from "selectors/widgetReflowSelectors";
import { OccupiedSpace } from "constants/CanvasEditorConstants";

type WidgetCollisionGraph = OccupiedSpace & {
  children?: {
    [key: string]: WidgetCollisionGraph;
  };
};

const HORIZONTAL_RESIZE_LIMIT = 2;
const VERTICAL_RESIZE_LIMIT = 4;

const computeRowCols = (
  delta: UIElementSize,
  position: XYCord,
  widgetPosition: OccupiedSpace,
  widgetParentSpaces: WidgetParentSpaces,
) => {
  return {
    leftColumn: Math.round(
      widgetPosition.left + position.x / widgetParentSpaces.parentColumnSpace,
    ),
    topRow: Math.round(
      widgetPosition.top + position.y / widgetParentSpaces.parentRowSpace,
    ),
    rightColumn: Math.round(
      widgetPosition.right +
        (delta.width + position.x) / widgetParentSpaces.parentColumnSpace,
    ),
    bottomRow: Math.round(
      widgetPosition.bottom +
        (delta.height + position.y) / widgetParentSpaces.parentRowSpace,
    ),
  };
};

export type WidgetParentSpaces = {
  parentColumnSpace: number;
  parentRowSpace: number;
  paddingOffset: number;
};

enum widgetDimensions {
  top = "top",
  bottom = "bottom",
  left = "left",
  right = "right",
}

enum MathComparators {
  min = "min",
  max = "max",
}

type CollisionAccessors = {
  direction: widgetDimensions;
  oppositeDirection: widgetDimensions;
  perpendicularMax: widgetDimensions;
  perpendicularMin: widgetDimensions;
  parallelMax: widgetDimensions;
  parallelMin: widgetDimensions;
  mathComparator: MathComparators;
  directionIndicator: number;
  isHorizontal: boolean;
};

export const useReflow = (
  widgetId: string,
  parentId: string,
  widgetPosition: OccupiedSpace,
  resizableRef: RefObject<HTMLDivElement>,
  ignoreCollision: boolean,
  widgetParentSpaces: WidgetParentSpaces,
) => {
  const occupiedSpaces = useSelector(getOccupiedSpaces);
  const widgetReflowSelector = getReflowWidgetSelector(widgetId);
  const reflowState = useSelector(widgetReflowSelector);
  const positions = useRef({ X: 0, Y: 0 });
  const occupiedSpacesBySiblingWidgets = useMemo(() => {
    return occupiedSpaces && parentId && occupiedSpaces[parentId]
      ? occupiedSpaces[parentId]
      : undefined;
  }, [occupiedSpaces, parentId]);

  const prevResizedPositions = useRef(
    occupiedSpacesBySiblingWidgets?.find(
      (position) => position.id === widgetId,
    ),
  );

  const { updateDropTargetRows } = useContext(DropTargetContext);

  const dispatch = useDispatch();

  // Resize bound's className - defaults to body
  // ResizableContainer accepts the className of the element,
  // whose clientRect will act as the bounds for resizing.
  // Note, if there are many containers with the same className
  // the bounding container becomes the nearest parent with the className
  const boundingElementClassName = generateClassName(parentId);
  const possibleBoundingElements = document.getElementsByClassName(
    boundingElementClassName,
  );
  const boundingElement =
    possibleBoundingElements.length > 0
      ? possibleBoundingElements[0]
      : undefined;

  // Calculate the dimensions of the widget,
  // The ResizableContainer's size prop is controlled
  const dimensions: UIElementSize = {
    width:
      (widgetPosition.right - widgetPosition.left) *
        widgetParentSpaces.parentColumnSpace -
      2 * widgetParentSpaces.paddingOffset,
    height:
      (widgetPosition.bottom - widgetPosition.top) *
        widgetParentSpaces.parentRowSpace -
      2 * widgetParentSpaces.paddingOffset,
  };

  const isColliding = (newDimensions: UIElementSize, position: XYCord) => {
    // Moving the bounding element calculations inside
    // to make this expensive operation only whne
    const boundingElementClientRect = boundingElement
      ? boundingElement.getBoundingClientRect()
      : undefined;

    const bottom =
      widgetPosition.top +
      position.y / widgetParentSpaces.parentRowSpace +
      newDimensions.height / widgetParentSpaces.parentRowSpace;
    // Make sure to calculate collision IF we don't update the main container's rows
    let updated = false;
    if (updateDropTargetRows) {
      updated = !!updateDropTargetRows(widgetId, bottom);
      // const el = resizableRef.current;
      // if (el) {
      //   const { height } = el?.getBoundingClientRect();
      //   const scrollParent = getNearestParentCanvas(resizableRef.current);
      //   scrollElementIntoParentCanvasView(
      //     {
      //       top: 40,
      //       height,
      //     },
      //     scrollParent,
      //     el,
      //   );
      // }
    }

    const delta: UIElementSize = {
      height: newDimensions.height - dimensions.height,
      width: newDimensions.width - dimensions.width,
    };
    const newRowCols: WidgetRowCols | false = computeRowCols(
      delta,
      position,
      widgetPosition,
      widgetParentSpaces,
    );

    if (newRowCols.rightColumn > getSnapColumns()) {
      newRowCols.rightColumn = getSnapColumns();
    }

    // Minimum row and columns to be set to a widget.
    if (
      newRowCols.rightColumn - newRowCols.leftColumn < 2 ||
      newRowCols.bottomRow - newRowCols.topRow < 4
    ) {
      return { isColliding: true };
    }

    if (
      boundingElementClientRect &&
      newRowCols.rightColumn * widgetParentSpaces.parentColumnSpace >
        ceil(boundingElementClientRect.width)
    ) {
      newRowCols.rightColumn = Math.floor(
        boundingElementClientRect.width / widgetParentSpaces.parentColumnSpace,
      );
    }

    if (newRowCols && newRowCols.leftColumn < 0) {
      newRowCols.leftColumn = 0;
    }

    if (!updated) {
      if (
        boundingElementClientRect &&
        newRowCols.bottomRow * widgetParentSpaces.parentRowSpace >
          ceil(boundingElementClientRect.height)
      ) {
        newRowCols.bottomRow = Math.floor(
          boundingElementClientRect.height / widgetParentSpaces.parentRowSpace,
        );
      }

      if (newRowCols && newRowCols.topRow < 0) {
        newRowCols.topRow = 0;
      }
    }

    // this is required for list widget so that template have no collision
    if (ignoreCollision) return { isColliding: false };

    const resizedPositions = {
      left: newRowCols.leftColumn,
      top: newRowCols.topRow,
      bottom: newRowCols.bottomRow,
      right: newRowCols.rightColumn,
    };

    // Check if new row cols are occupied by sibling widgets
    return {
      resizedPositions,
      isColliding: isDropZoneOccupied(
        resizedPositions,
        widgetId,
        occupiedSpacesBySiblingWidgets,
      ),
    };
  };

  const reflow = (
    dimensions: DimensionProps,
  ): { verticalMove: boolean; horizontalMove: boolean } => {
    const { direction, height, width, x, X = 0, y, Y = 0 } = dimensions;

    const { isColliding: isWidgetsColliding, resizedPositions } = isColliding(
      { width, height },
      { x, y },
    );

    const isHorizontalMove = getIsHorizontalMove(positions.current, {
      X,
      Y,
    });

    const newWidgetPosition = {
      ...widgetPosition,
      ...resizedPositions,
    };

    const { collidingWidgets } = getCollidingWidgets(
      newWidgetPosition,
      widgetId,
      direction,
      isHorizontalMove,
      occupiedSpacesBySiblingWidgets,
      prevResizedPositions.current,
      reflowState?.reflow?.initialCollidingWidgets,
    );

    prevResizedPositions.current = newWidgetPosition;

    if (!isWidgetsColliding && reflowState?.isReflowing) {
      dispatch(stopReflow());
      positions.current = { X, Y };
      return {
        horizontalMove: true,
        verticalMove: true,
      };
    }

    let currentDirection = direction;
    if (direction.indexOf("|") > -1) {
      const directions = direction.split("|");
      currentDirection = isHorizontalMove
        ? (directions[1] as ResizeDirection)
        : (directions[0] as ResizeDirection);
    }

    if (
      direction === ResizeDirection.UNSET ||
      !isWidgetsColliding ||
      !occupiedSpacesBySiblingWidgets
    ) {
      positions.current = { X, Y };
      return {
        horizontalMove: true,
        verticalMove: true,
      };
    }

    let newStaticWidget = reflowState?.reflow?.staticWidget;
    if (!reflowState?.isReflowing) {
      let widgetReflow: Reflow = {
        staticWidgetId: newWidgetPosition.id,
        resizeDirections: direction,
        initialCollidingWidgets: collidingWidgets,
      };
      const widgetMovementMap: reflowWidgets = {};
      newStaticWidget = getMovementMapInDirection(
        widgetMovementMap,
        occupiedSpacesBySiblingWidgets,
        newWidgetPosition,
        collidingWidgets,
        currentDirection,
        widgetParentSpaces,
        { X, Y },
      );
      widgetReflow = {
        ...widgetReflow,
        reflowingWidgets: widgetMovementMap,
        staticWidget: newStaticWidget,
      };
      dispatch(startReflow(widgetReflow));
    } else if (reflowState.reflow && reflowState.reflow.reflowingWidgets) {
      const reflowing = { ...reflowState.reflow };
      let horizontalMove = true,
        verticalMove = true;
      //eslint-disable-next-line
      const reflowingWidgets = reflowing.reflowingWidgets!;
      const affectedwidgetIds = Object.keys(reflowingWidgets);
      ({ horizontalMove, verticalMove } = getShouldResize(newStaticWidget, {
        X,
        Y,
      }));
      const widgetMovementMap: reflowWidgets = {};
      newStaticWidget = getMovementMapInDirection(
        widgetMovementMap,
        occupiedSpacesBySiblingWidgets,
        newWidgetPosition,
        collidingWidgets,
        currentDirection,
        widgetParentSpaces,
        { X, Y },
        reflowingWidgets,
      );

      const allReflowKeys = Object.keys(widgetMovementMap);
      const keysToDelete = affectedwidgetIds.filter(
        (key) => allReflowKeys.indexOf(key) < 0,
      );

      for (const keyToDelete of keysToDelete) {
        delete reflowingWidgets[keyToDelete];
      }

      if (allReflowKeys.length > 0) {
        for (const key of allReflowKeys) {
          const reflowWidget = widgetMovementMap[key];
          if (!reflowingWidgets[key]) {
            reflowingWidgets[key] = reflowWidget;
          } else {
            reflowingWidgets[key].maxOccupiedSpace =
              reflowWidget.maxOccupiedSpace;
            reflowingWidgets[key].depth = reflowWidget.depth;
            reflowingWidgets[key].whiteSpaces = reflowWidget.whiteSpaces;
            if (reflowWidget.maxX)
              reflowingWidgets[key].maxX = reflowWidget.maxX;
            if (reflowWidget.maxY)
              reflowingWidgets[key].maxY = reflowWidget.maxY;
          }
        }
      }
      for (const affectedwidgetId of affectedwidgetIds) {
        if (reflowingWidgets && reflowingWidgets[affectedwidgetId]) {
          if (horizontalMove) reflowingWidgets[affectedwidgetId].x = X;
          if (verticalMove) reflowingWidgets[affectedwidgetId].y = Y;
        }
      }
      reflowing.reflowingWidgets = { ...reflowingWidgets };
      reflowing.staticWidget = newStaticWidget;
      reflowing.initialCollidingWidgets = collidingWidgets;
      dispatch(reflowMove(reflowing));
      positions.current = { X, Y };
      return {
        horizontalMove,
        verticalMove,
      };
    }
    positions.current = { X, Y };

    return {
      horizontalMove: true,
      verticalMove: true,
    };
  };

  return reflow;
};

function getShouldResize(
  staticWidget: StaticReflowWidget | undefined,
  dimensions = { X: 0, Y: 0 },
): { verticalMove: boolean; horizontalMove: boolean } {
  if (!staticWidget)
    return {
      horizontalMove: false,
      verticalMove: false,
    };

  let horizontalMove = true,
    verticalMove = true;
  const { mathXComparator, mathYComparator, maxX, maxY } = staticWidget;
  if (mathXComparator) {
    horizontalMove =
      Math[mathXComparator as MathComparators](
        dimensions.X,
        //eslint-disable-next-line
        maxX!,
      ) !==
      //eslint-disable-next-line
      maxX!;
  }
  if (mathYComparator) {
    verticalMove =
      Math[mathYComparator as MathComparators](
        dimensions.Y,
        //eslint-disable-next-line
        maxY!,
      ) !==
      //eslint-disable-next-line
      maxY!;
  }

  return {
    horizontalMove,
    verticalMove,
  };
}

function getWidgetCollisionGraphInDirection(
  occupiedSpacesBySiblingWidgets: OccupiedSpace[],
  widgetPosition: WidgetCollisionGraph,
  collidingWidgetMap: CollidingWidgets,
  accessors: CollisionAccessors,
  dimensions = { X: 0, Y: 0 },
  reflowedWidgets: reflowWidgets,
  widgetParentSpaces: WidgetParentSpaces,
) {
  const widgetCollisionGraph: WidgetCollisionGraph = {
    ...widgetPosition,
    children: {},
  };
  const collidingWidgets = Object.values(collidingWidgetMap);
  collidingWidgets.sort(function(a, b) {
    const accessorA = getAccessor(a.direction);
    const accessorB = getAccessor(b.direction);

    const distanceA = Math.abs(
      widgetPosition[accessorA.direction] - a[accessorA.oppositeDirection],
    );
    const distanceB = Math.abs(
      widgetPosition[accessorB.direction] - b[accessorB.oppositeDirection],
    );
    return distanceB - distanceA;
  });
  let processedNodes: { [key: string]: boolean } = {
    [widgetPosition.id]: true,
  };
  for (const collidingWidget of collidingWidgets) {
    const collidingWidgetGraph = { ...collidingWidget, children: {} };
    const directionalAccessors = getAccessor(collidingWidget.direction);
    const currentProcessedNodes = {};
    if (!processedNodes[collidingWidget.id]) {
      getWidgetCollisionGraph(
        occupiedSpacesBySiblingWidgets,
        collidingWidgetGraph,
        directionalAccessors,
        dimensions,
        collidingWidgetGraph[directionalAccessors.oppositeDirection] -
          widgetCollisionGraph[directionalAccessors.direction],
        widgetParentSpaces,
        collidingWidget.direction,
        currentProcessedNodes,
      );
      if (widgetCollisionGraph.children)
        widgetCollisionGraph.children[
          collidingWidgetGraph.id
        ] = collidingWidgetGraph;
      else
        widgetCollisionGraph.children = {
          [collidingWidgetGraph.id]: collidingWidgetGraph,
        };
      processedNodes = {
        ...processedNodes,
        ...currentProcessedNodes,
      };
    }
  }

  return widgetCollisionGraph;
}

function getWidgetCollisionGraph(
  occupiedSpacesBySiblingWidgets: OccupiedSpace[],
  widgetCollisionGraph: WidgetCollisionGraph,
  accessors: CollisionAccessors,
  dimensions = { X: 0, Y: 0 },
  dimensionBeforeCollision: number,
  widgetParentSpaces: WidgetParentSpaces,
  direction: ResizeDirection,
  processedNodes: { [key: string]: boolean },
  whiteSpaces = 0,
) {
  if (!widgetCollisionGraph) return;

  const possiblyAffectedWidgets = occupiedSpacesBySiblingWidgets.filter(
    (widgetDetails) => {
      const directionalComparator =
        accessors.directionIndicator < 0
          ? widgetDetails[accessors.oppositeDirection] <
            widgetCollisionGraph[accessors.oppositeDirection]
          : widgetDetails[accessors.oppositeDirection] >
            widgetCollisionGraph[accessors.oppositeDirection];
      return (
        widgetDetails.id !== widgetCollisionGraph.id && directionalComparator
      );
    },
  );

  const affectedWidgets = possiblyAffectedWidgets.filter((widgetDetails) => {
    if (
      widgetDetails[accessors.perpendicularMax] <=
      widgetCollisionGraph[accessors.perpendicularMin]
    )
      return false;
    if (
      widgetDetails[accessors.perpendicularMin] >=
      widgetCollisionGraph[accessors.perpendicularMax]
    )
      return false;

    return true;
  });

  const newDimensions = getResizedDimensions(
    widgetCollisionGraph,
    dimensionBeforeCollision,
    whiteSpaces,
    widgetParentSpaces,
    dimensions,
    accessors,
  );
  const { collidingWidgets: collidingWidgetsMap } = getCollidingWidgets(
    newDimensions,
    widgetCollisionGraph.id,
    direction,
    accessors.isHorizontal,
    affectedWidgets,
  );

  const collidingWidgets = Object.values(collidingWidgetsMap);
  while (collidingWidgets.length > 0) {
    const currentWidgetCollisionGraph = {
      ...collidingWidgets.shift(),
    } as WidgetCollisionGraph;

    if (!currentWidgetCollisionGraph) break;
    getWidgetCollisionGraph(
      possiblyAffectedWidgets,
      currentWidgetCollisionGraph,
      accessors,
      dimensions,
      dimensionBeforeCollision,
      widgetParentSpaces,
      direction,
      processedNodes,
      whiteSpaces +
        currentWidgetCollisionGraph[accessors.oppositeDirection] -
        widgetCollisionGraph[accessors.direction],
    );
    processedNodes[currentWidgetCollisionGraph.id] = true;

    if (widgetCollisionGraph.children)
      widgetCollisionGraph.children[currentWidgetCollisionGraph.id] = {
        ...currentWidgetCollisionGraph,
      };
    else
      widgetCollisionGraph.children = {
        [currentWidgetCollisionGraph.id]: { ...currentWidgetCollisionGraph },
      };
  }
}

function getWidgetMovementMap(
  widgetPosition: WidgetCollisionGraph,
  widgetMovementMap: reflowWidgets,
  dimensions = { X: 0, Y: 0 },
  widgetParentSpaces: WidgetParentSpaces,
  accessors: CollisionAccessors,
  direction: ResizeDirection,
  whiteSpace = 0,
  prevWidgetdistance: number,
  dimensionBeforeCollision = 0,
  first = false,
) {
  let maxOccupiedSpace = 0,
    depth = 0;
  const childrenCount = Object.keys(widgetPosition.children || {}).length;
  let currentWhiteSpace = whiteSpace;
  if (widgetPosition.children && childrenCount > 0) {
    const childNodes = Object.values(widgetPosition.children);
    for (const childNode of childNodes) {
      let currentDimensionBeforeCollision = dimensionBeforeCollision;
      let nextWhiteSpaces = 0;
      if (!first) {
        nextWhiteSpaces =
          whiteSpace +
          Math.abs(prevWidgetdistance - childNode[accessors.oppositeDirection]);
      } else {
        currentDimensionBeforeCollision =
          childNode[accessors.oppositeDirection] - prevWidgetdistance;
      }
      const {
        currentWhiteSpace: childWhiteSpace,
        depth: widgetDepth,
        occupiedSpace,
      } = getWidgetMovementMap(
        childNode,
        widgetMovementMap,
        dimensions,
        widgetParentSpaces,
        accessors,
        direction,
        nextWhiteSpaces,
        childNode[accessors.direction],
        currentDimensionBeforeCollision,
      );
      if (maxOccupiedSpace < occupiedSpace) currentWhiteSpace = childWhiteSpace;
      maxOccupiedSpace = Math.max(maxOccupiedSpace, occupiedSpace || 0);
      depth = Math.max(depth, widgetDepth);
    }
  } else {
    if (direction === ResizeDirection.RIGHT)
      currentWhiteSpace +=
        GridDefaults.DEFAULT_GRID_COLUMNS - widgetPosition.right;
    else if (direction !== ResizeDirection.BOTTOM)
      currentWhiteSpace += widgetPosition[accessors.direction];
  }

  if (
    widgetMovementMap[widgetPosition.id] &&
    (widgetMovementMap[widgetPosition.id].depth || 0) > depth
  ) {
    return {
      occupiedSpace:
        (widgetMovementMap[widgetPosition.id].maxOccupiedSpace || 0) +
        widgetPosition[accessors.parallelMax] -
        widgetPosition[accessors.parallelMin],
      depth: (widgetMovementMap[widgetPosition.id].depth || 0) + 1,
      currentWhiteSpace: widgetMovementMap[widgetPosition.id].whiteSpaces || 0,
    };
  }

  if (accessors.isHorizontal) {
    const maxX =
      direction === ResizeDirection.RIGHT
        ? (GridDefaults.DEFAULT_GRID_COLUMNS -
            widgetPosition[accessors.direction] -
            depth * HORIZONTAL_RESIZE_LIMIT) *
          widgetParentSpaces.parentColumnSpace
        : (widgetPosition[accessors.direction] -
            depth * HORIZONTAL_RESIZE_LIMIT) *
          widgetParentSpaces.parentColumnSpace;
    widgetMovementMap[widgetPosition.id] = {
      x: dimensions.X,
      maxX: accessors.directionIndicator * maxX,
      maxOccupiedSpace,
      depth,
      dimensionXBeforeCollision:
        dimensions.X +
        (dimensionBeforeCollision + whiteSpace * accessors.directionIndicator) *
          widgetParentSpaces.parentColumnSpace,
      whiteSpaces: currentWhiteSpace,
      collisionWhiteSpaces: whiteSpace,
      get X() {
        const originalWidth =
          (widgetPosition[accessors.parallelMax] -
            widgetPosition[accessors.parallelMin]) *
          widgetParentSpaces.parentColumnSpace;
        const value =
          this.x !== undefined
            ? this.x - (this.dimensionXBeforeCollision || 0)
            : 0;
        const maxValue = Math[accessors.mathComparator](value, this.maxX || 0);
        return accessors.directionIndicator < 0
          ? maxValue
          : maxValue + originalWidth - (this.width || 0);
      },
      get width() {
        const originalWidth =
          widgetPosition[accessors.parallelMax] -
          widgetPosition[accessors.parallelMin];
        const max = (this.maxX || 0) + (this.dimensionXBeforeCollision || 0);
        const resizeLimit =
          max +
          (originalWidth - HORIZONTAL_RESIZE_LIMIT) *
            widgetParentSpaces.parentColumnSpace *
            accessors.directionIndicator;
        let X = 0;
        const shouldResize =
          accessors.directionIndicator > 0
            ? (this.x || 0) >= max
            : (this.x || 0) <= max;
        if (shouldResize) {
          X = Math[accessors.mathComparator](this.x || 0, resizeLimit);
          X = X - max;
        }

        return (
          originalWidth * widgetParentSpaces.parentColumnSpace - Math.abs(X)
        );
      },
    };
  } else {
    const maxY =
      direction === ResizeDirection.BOTTOM
        ? Infinity
        : (widgetPosition[accessors.direction] -
            depth * VERTICAL_RESIZE_LIMIT) *
          widgetParentSpaces.parentRowSpace;
    widgetMovementMap[widgetPosition.id] = {
      y: dimensions.Y,
      maxY: accessors.directionIndicator * maxY,
      maxOccupiedSpace,
      depth,
      dimensionYBeforeCollision:
        dimensions.Y +
        (dimensionBeforeCollision + whiteSpace * accessors.directionIndicator) *
          widgetParentSpaces.parentRowSpace,
      whiteSpaces: currentWhiteSpace,
      collisionWhiteSpaces: whiteSpace,
      get Y() {
        const value =
          this.y !== undefined
            ? this.y - (this.dimensionYBeforeCollision || 0)
            : 0;
        const maxValue = Math[accessors.mathComparator](value, this.maxY || 0);
        return maxValue;
      },
      get height() {
        const originalHeight =
          widgetPosition[accessors.parallelMax] -
          widgetPosition[accessors.parallelMin];
        const max = (this.maxY || 0) + (this.dimensionYBeforeCollision || 0);
        const resizeLimit =
          max +
          (originalHeight - VERTICAL_RESIZE_LIMIT) *
            widgetParentSpaces.parentRowSpace *
            accessors.directionIndicator;
        let Y = 0;
        const shouldResize =
          accessors.directionIndicator > 0
            ? (this.y || 0) >= max
            : (this.y || 0) <= max;
        if (shouldResize) {
          Y = Math[accessors.mathComparator](this.y || 0, resizeLimit);
          Y = Y - max;
        }

        return originalHeight * widgetParentSpaces.parentRowSpace - Math.abs(Y);
      },
    };
  }

  return {
    occupiedSpace:
      maxOccupiedSpace +
      widgetPosition[accessors.parallelMax] -
      widgetPosition[accessors.parallelMin],
    depth: depth + 1,
    currentWhiteSpace,
  };
}

function getMovementMapInDirection(
  widgetMovementMap: reflowWidgets,
  occupiedSpacesBySiblingWidgets: OccupiedSpace[],
  widgetPosition: WidgetCollisionGraph,
  collidingWidgets: CollidingWidgets,
  direction: ResizeDirection,
  widgetParentSpaces: WidgetParentSpaces,
  dimensions = { X: 0, Y: 0 },
  reflowedWidgets: reflowWidgets = {},
) {
  const accessors = getAccessor(direction);
  const widgetCollisionGraph = getWidgetCollisionGraphInDirection(
    occupiedSpacesBySiblingWidgets,
    widgetPosition,
    collidingWidgets,
    accessors,
    dimensions,
    reflowedWidgets,
    widgetParentSpaces,
  );

  if (
    !widgetCollisionGraph ||
    !widgetCollisionGraph.children ||
    Object.keys(widgetCollisionGraph.children).length <= 0
  )
    return;

  const childrenKeys = Object.keys(widgetCollisionGraph.children || {});
  let horizontalStaticDepth = 0,
    verticalStaticDepth = 0;
  let horizontalAccessors, verticalAccessors;
  let horizontalDirection, verticalDirection;
  for (const childKey of childrenKeys) {
    const childNode = widgetCollisionGraph.children[childKey];
    const childDirection = collidingWidgets[childNode.id].direction;
    const directionalAccessors = getAccessor(childDirection);
    const dimensionBeforeCollision =
      childNode[directionalAccessors.oppositeDirection] -
      widgetPosition[directionalAccessors.direction];
    const { depth } = getWidgetMovementMap(
      childNode,
      widgetMovementMap,
      dimensions,
      widgetParentSpaces,
      directionalAccessors,
      childDirection,
      0,
      childNode[directionalAccessors.direction],
      dimensionBeforeCollision,
      false,
    );
    if (directionalAccessors.isHorizontal) {
      horizontalStaticDepth = Math.max(horizontalStaticDepth, depth);
      horizontalAccessors = directionalAccessors;
      horizontalDirection = childDirection;
    } else {
      verticalStaticDepth = Math.max(verticalStaticDepth, depth);
      verticalAccessors = directionalAccessors;
      verticalDirection = childDirection;
    }
  }

  if (!widgetMovementMap) return {};

  //eslint-disable-next-line
  console.log(
    cloneDeep({
      graph: widgetCollisionGraph,
      map: widgetMovementMap,
      direction,
      accessors,
      collidingWidgets,
    }),
  );

  let horizontalStaticWidget = {},
    verticalStaticWidget = {};
  if (horizontalAccessors && horizontalDirection) {
    const maxX =
      horizontalDirection === ResizeDirection.RIGHT
        ? (GridDefaults.DEFAULT_GRID_COLUMNS -
            widgetPosition[horizontalAccessors.direction] -
            horizontalStaticDepth * HORIZONTAL_RESIZE_LIMIT) *
          widgetParentSpaces.parentColumnSpace
        : (widgetPosition[horizontalAccessors.direction] -
            horizontalStaticDepth * HORIZONTAL_RESIZE_LIMIT) *
          widgetParentSpaces.parentColumnSpace;
    horizontalStaticWidget = {
      maxX:
        dimensions.X +
        horizontalAccessors.directionIndicator *
          (maxX + widgetParentSpaces.parentColumnSpace),
      mathXComparator: horizontalAccessors.mathComparator,
      directionXIndicator: horizontalAccessors.directionIndicator,
    };
  }
  if (verticalAccessors && verticalDirection) {
    const maxY =
      (widgetPosition[verticalAccessors.direction] -
        verticalStaticDepth * VERTICAL_RESIZE_LIMIT) *
      widgetParentSpaces.parentRowSpace;
    verticalStaticWidget = {
      maxY:
        verticalDirection === ResizeDirection.BOTTOM
          ? Infinity
          : dimensions.Y - maxY - widgetParentSpaces.parentRowSpace,
      mathYComparator: verticalAccessors.mathComparator,
      directionYIndicator: verticalAccessors.directionIndicator,
    };
  }

  return {
    id: widgetCollisionGraph.id,
    ...horizontalStaticWidget,
    ...verticalStaticWidget,
  };
}

export const areIntersecting = (r1: Rect, r2: Rect) => {
  return !(
    r2.left >= r1.right ||
    r2.right <= r1.left ||
    r2.top >= r1.bottom ||
    r2.bottom <= r1.top
  );
};

function getIsHorizontalMove(
  prevPositions: { X: number; Y: number },
  positions: { X: number; Y: number },
) {
  if (prevPositions.X !== positions.X) {
    return true;
  } else if (prevPositions.Y !== positions.Y) {
    return false;
  }

  return false;
}

function getCollidingWidgets(
  resizedPosition: Rect,
  widgetId: string,
  direction: ResizeDirection,
  isHorizontalMove: boolean,
  occupied?: OccupiedSpace[],
  prevResizedPosition?: OccupiedSpace,
  prevCollidingWidgets?: CollidingWidgets,
) {
  let isColliding = false;
  const collidingWidgets: CollidingWidgets = {};
  if (occupied) {
    occupied = occupied.filter((widgetDetails) => {
      return (
        widgetDetails.id !== widgetId && widgetDetails.parentId !== widgetId
      );
    });
    for (let i = 0; i < occupied.length; i++) {
      if (areIntersecting(occupied[i], resizedPosition)) {
        isColliding = true;
        const currentWidgetId = occupied[i].id;
        const movementDirection =
          prevCollidingWidgets && prevCollidingWidgets[currentWidgetId]
            ? prevCollidingWidgets[currentWidgetId].direction
            : getDirection(
                occupied[i],
                prevResizedPosition,
                direction,
                isHorizontalMove,
              );
        collidingWidgets[currentWidgetId] = {
          ...occupied[i],
          direction: movementDirection,
        };
      }
    }
  }
  return {
    isColliding,
    collidingWidgets,
  };
}

function getResizedDimensions(
  widgetCollisionGraph: WidgetCollisionGraph,
  dimensionBeforeCollision: number,
  whiteSpaces: number,
  widgetParentSpaces: WidgetParentSpaces,
  dimensions: { X: number; Y: number },
  accessors: CollisionAccessors,
) {
  const reflowedPositions = { ...widgetCollisionGraph, children: [] };
  if (accessors.isHorizontal) {
    const dimensionXBeforeCollision =
      dimensions.X +
      (dimensionBeforeCollision + whiteSpaces) *
        widgetParentSpaces.parentColumnSpace;
    const newColumn =
      (dimensions.X - dimensionXBeforeCollision) /
      widgetParentSpaces.parentColumnSpace;
    reflowedPositions[accessors.direction] =
      reflowedPositions[accessors.direction] + newColumn;
  } else {
    const dimensionYBeforeCollision =
      dimensions.Y +
      (dimensionBeforeCollision + whiteSpaces) *
        widgetParentSpaces.parentRowSpace;
    const newRow =
      (dimensions.Y - dimensionYBeforeCollision) /
      widgetParentSpaces.parentRowSpace;
    reflowedPositions[accessors.direction] =
      reflowedPositions[accessors.direction] + newRow;
  }

  return reflowedPositions;
}

function getDirection(
  collidingWidget: Rect,
  prevResizedPosition: OccupiedSpace | undefined,
  direction: ResizeDirection,
  isHorizontalMove: boolean,
): ResizeDirection {
  if (direction.indexOf("|") < 0) return direction;

  const directions = direction.split("|");
  let primaryDirection: ResizeDirection, secondaryDirection: ResizeDirection;

  if (isHorizontalMove) {
    primaryDirection = directions[1] as ResizeDirection;
    secondaryDirection = directions[0] as ResizeDirection;
  } else {
    primaryDirection = directions[0] as ResizeDirection;
    secondaryDirection = directions[1] as ResizeDirection;
  }

  if (!prevResizedPosition) return primaryDirection;
  const primaryAccessors = getAccessor(primaryDirection);

  if (primaryAccessors.directionIndicator > 0) {
    return collidingWidget[primaryAccessors.oppositeDirection] >=
      prevResizedPosition[primaryAccessors.direction]
      ? primaryDirection
      : secondaryDirection;
  } else {
    return collidingWidget[primaryAccessors.oppositeDirection] <=
      prevResizedPosition[primaryAccessors.direction]
      ? primaryDirection
      : secondaryDirection;
  }
}

function getAccessor(direction: ResizeDirection) {
  switch (direction) {
    case ResizeDirection.LEFT:
      return {
        direction: widgetDimensions.left,
        oppositeDirection: widgetDimensions.right,
        perpendicularMax: widgetDimensions.bottom,
        perpendicularMin: widgetDimensions.top,
        parallelMax: widgetDimensions.right,
        parallelMin: widgetDimensions.left,
        mathComparator: MathComparators.max,
        directionIndicator: -1,
        isHorizontal: true,
      };
    case ResizeDirection.RIGHT:
      return {
        direction: widgetDimensions.right,
        oppositeDirection: widgetDimensions.left,
        perpendicularMax: widgetDimensions.bottom,
        perpendicularMin: widgetDimensions.top,
        parallelMax: widgetDimensions.right,
        parallelMin: widgetDimensions.left,
        mathComparator: MathComparators.min,
        directionIndicator: 1,
        isHorizontal: true,
      };
    case ResizeDirection.TOP:
      return {
        direction: widgetDimensions.top,
        oppositeDirection: widgetDimensions.bottom,
        perpendicularMax: widgetDimensions.right,
        perpendicularMin: widgetDimensions.left,
        parallelMax: widgetDimensions.bottom,
        parallelMin: widgetDimensions.top,
        mathComparator: MathComparators.max,
        directionIndicator: -1,
        isHorizontal: false,
      };
    case ResizeDirection.BOTTOM:
      return {
        direction: widgetDimensions.bottom,
        oppositeDirection: widgetDimensions.top,
        perpendicularMax: widgetDimensions.right,
        perpendicularMin: widgetDimensions.left,
        parallelMax: widgetDimensions.bottom,
        parallelMin: widgetDimensions.top,
        mathComparator: MathComparators.min,
        directionIndicator: 1,
        isHorizontal: false,
      };
  }
  return {
    direction: widgetDimensions.bottom,
    oppositeDirection: widgetDimensions.top,
    perpendicularMax: widgetDimensions.right,
    perpendicularMin: widgetDimensions.left,
    parallelMax: widgetDimensions.bottom,
    parallelMin: widgetDimensions.top,
    mathComparator: MathComparators.min,
    directionIndicator: 1,
    isHorizontal: false,
  };
}
