import { reflowMove, startReflow, stopReflow } from "actions/reflowActions";
import { GridDefaults } from "constants/WidgetConstants";
import { OccupiedSpace } from "constants/editorConstants";
import { cloneDeep } from "lodash";
import { RefObject, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CollidingWidgets,
  Reflow,
  reflowWidgets,
  StaticReflowWidget,
  widgetReflowState,
} from "reducers/uiReducers/reflowReducer";
import { DimensionProps, ResizeDirection } from "resizable/resizenreflow";
import { getOccupiedSpaces } from "selectors/editorSelectors";
import { Rect } from "utils/WidgetPropsUtils";
import { WidgetDraggingBlock } from "utils/hooks/useBlocksToBeDraggedOnCanvas";

type WidgetCollisionGraph = OccupiedSpace & {
  children?: {
    [key: string]: WidgetCollisionGraph;
  };
};

const HORIZONTAL_RESIZE_LIMIT = 2;
const VERTICAL_RESIZE_LIMIT = 4;

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

export const useDragReflow = (
  widgetId: string,
  parentId: string,
  resizableRef: RefObject<HTMLDivElement>,
  ignoreCollision: boolean,
  widgetParentSpaces: WidgetParentSpaces,
) => {
  const occupiedSpaces = useSelector(getOccupiedSpaces);
  // const widgetReflowSelector = getReflowWidgetSelector(widgetId);
  // const reflowState = useSelector(widgetReflowSelector);
  const reflowState = useRef<widgetReflowState>();
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

  const dispatch = useDispatch();

  const reflow = (
    dimensions: DimensionProps,
    widgetPosition: OccupiedSpace,
    newDimensions: WidgetDraggingBlock,
  ): {
    verticalMove: boolean;
    horizontalMove: boolean;
    reflowingWidgets: reflowWidgets;
  } => {
    const { direction, X = 0, Y = 0 } = dimensions;
    const isWidgetsColliding = !newDimensions.isNotColliding;
    const resizedPositions = {
      left: newDimensions.left,
      top: newDimensions.top,
      right: newDimensions.left + newDimensions.width,
      bottom: newDimensions.top + newDimensions.height,
      id: newDimensions.widgetId,
    };

    const newWidgetPosition = {
      ...widgetPosition,
      ...resizedPositions,
    };

    const { collidingWidgets } = getCollidingWidgets(
      newWidgetPosition,
      widgetId,
      direction,
      occupiedSpacesBySiblingWidgets,
      prevResizedPositions.current,
      reflowState?.current?.reflow?.initialCollidingWidgets,
    );

    prevResizedPositions.current = newWidgetPosition;

    if (!isWidgetsColliding && reflowState.current?.isReflowing) {
      reflowState.current = {
        isReflowing: false,
        reflow: {
          resizeDirections: ResizeDirection.UNSET,
          initialCollidingWidgets: collidingWidgets,
        },
      };
      dispatch(stopReflow());
      positions.current = { X, Y };
      return {
        horizontalMove: true,
        verticalMove: true,
        reflowingWidgets: reflowState.current?.reflow.reflowingWidgets || {},
      };
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
        reflowingWidgets: reflowState.current?.reflow.reflowingWidgets || {},
      };
    }

    let newStaticWidget = reflowState.current?.reflow?.staticWidget;
    if (!reflowState.current?.isReflowing) {
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
        direction,
        widgetParentSpaces,
        { X, Y },
      );
      widgetReflow = {
        ...widgetReflow,
        reflowingWidgets: widgetMovementMap,
        staticWidget: newStaticWidget,
        initialCollidingWidgets: collidingWidgets,
      };
      reflowState.current = {
        isReflowing: true,
        reflow: widgetReflow,
      };
      dispatch(startReflow(widgetReflow));
    } else if (
      reflowState.current.reflow &&
      reflowState.current.reflow.reflowingWidgets
    ) {
      const reflowing = { ...reflowState.current.reflow };
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
        direction,
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
          reflowingWidgets[key] = widgetMovementMap[key];
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
      reflowing.initialCollidingWidgets = { ...collidingWidgets };
      reflowState.current = {
        isReflowing: true,
        reflow: reflowing,
      };
      dispatch(reflowMove(reflowing));
      positions.current = { X, Y };
      return {
        horizontalMove,
        verticalMove,
        reflowingWidgets: reflowState.current?.reflow.reflowingWidgets || {},
      };
    }
    positions.current = { X, Y };

    return {
      horizontalMove: true,
      verticalMove: true,
      reflowingWidgets: reflowState.current?.reflow.reflowingWidgets || {},
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
        collidingWidget.direction,
        dimensions,
        collidingWidgetGraph[directionalAccessors.oppositeDirection] -
          widgetCollisionGraph[directionalAccessors.direction],
        widgetParentSpaces,
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
  direction: ResizeDirection,
  dimensions = { X: 0, Y: 0 },
  dimensionBeforeCollision: number,
  widgetParentSpaces: WidgetParentSpaces,
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
    affectedWidgets,
  );
  const collidingWidgets = Object.values(collidingWidgetsMap);
  collidingWidgets.sort(function(a, b) {
    const accessorA = getAccessor(a.direction);
    const accessorB = getAccessor(b.direction);

    const distanceA = Math.abs(
      widgetCollisionGraph[accessorA.direction] -
        a[accessorA.oppositeDirection],
    );
    const distanceB = Math.abs(
      widgetCollisionGraph[accessorB.direction] -
        b[accessorB.oppositeDirection],
    );
    return distanceB - distanceA;
  });
  let childProcessedNodes: { [key: string]: boolean } = {
    [widgetCollisionGraph.id]: true,
  };
  while (collidingWidgets.length > 0) {
    const currentWidgetCollisionGraph = {
      ...collidingWidgets.shift(),
    } as WidgetCollisionGraph;
    const currentProcessedNodes = {};
    if (
      !currentWidgetCollisionGraph ||
      childProcessedNodes[currentWidgetCollisionGraph.id]
    )
      break;
    getWidgetCollisionGraph(
      possiblyAffectedWidgets,
      currentWidgetCollisionGraph,
      accessors,
      direction,
      dimensions,
      dimensionBeforeCollision,
      widgetParentSpaces,
      currentProcessedNodes,
      whiteSpaces +
        currentWidgetCollisionGraph[accessors.oppositeDirection] -
        widgetCollisionGraph[accessors.direction],
    );
    childProcessedNodes = {
      [currentWidgetCollisionGraph.id]: true,
      ...childProcessedNodes,
      ...currentProcessedNodes,
    };

    if (widgetCollisionGraph.children)
      widgetCollisionGraph.children[currentWidgetCollisionGraph.id] = {
        ...currentWidgetCollisionGraph,
      };
    else
      widgetCollisionGraph.children = {
        [currentWidgetCollisionGraph.id]: { ...currentWidgetCollisionGraph },
      };
  }
  const childProcessedNodeKeys = Object.keys(childProcessedNodes);
  for (const key of childProcessedNodeKeys) processedNodes[key] = true;
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

function getCollidingWidgets(
  resizedPosition: Rect,
  widgetId: string,
  direction: ResizeDirection,
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
            : getDirection(occupied[i], prevResizedPosition, direction);
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

function getDirection(
  collidingWidget: Rect,
  prevResizedPosition: OccupiedSpace | undefined,
  direction: ResizeDirection,
): ResizeDirection {
  const accessors = getAccessor(direction);
  if (!prevResizedPosition) return direction;
  let isDirection = true;
  if (accessors.directionIndicator > 0) {
    isDirection =
      collidingWidget[accessors.oppositeDirection] >=
      prevResizedPosition[accessors.direction];
  } else {
    isDirection =
      collidingWidget[accessors.oppositeDirection] <=
      prevResizedPosition[accessors.direction];
  }
  if (isDirection) return direction;
  if (accessors.isHorizontal) {
    return collidingWidget.bottom <= prevResizedPosition.top
      ? ResizeDirection.TOP
      : ResizeDirection.BOTTOM;
  } else {
    return collidingWidget.right <= prevResizedPosition.left
      ? ResizeDirection.LEFT
      : ResizeDirection.RIGHT;
  }
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
