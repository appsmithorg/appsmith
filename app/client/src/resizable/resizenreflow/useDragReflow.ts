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
  ): { verticalMove: boolean; horizontalMove: boolean } => {
    const { direction, X = 0, Y = 0 } = dimensions;
    const resizedPositions = {
      left: newDimensions.left,
      top: newDimensions.top,
      right: newDimensions.left + newDimensions.width,
      bottom: newDimensions.top + newDimensions.height,
      id: newDimensions.widgetId,
    };

    const { collidingWidgets } = getCollidingWidgets(
      resizedPositions,
      widgetId,
      direction,
      occupiedSpacesBySiblingWidgets,
      prevResizedPositions.current,
      reflowState.current?.reflow?.initialCollidingWidgets,
    );
    const isWidgetsColliding = !newDimensions.isNotColliding;

    const newWidgetPosition = {
      ...widgetPosition,
      ...resizedPositions,
    };

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
      };
    }

    if (
      direction === ResizeDirection.UNSET ||
      !isWidgetsColliding ||
      !occupiedSpacesBySiblingWidgets
    ) {
      dispatch(stopReflow());
      positions.current = { X, Y };
      return {
        horizontalMove: true,
        verticalMove: true,
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
        {},
        widgetMovementMap,
        occupiedSpacesBySiblingWidgets,
        collidingWidgets,
        newWidgetPosition,
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
      const reflowingWidgets = reflowing.reflowingWidgets || {};
      const affectedwidgetIds = Object.keys(reflowingWidgets);
      ({ horizontalMove, verticalMove } = getShouldResize(newStaticWidget, {
        X,
        Y,
      }));
      const widgetMovementMap: reflowWidgets = {};
      newStaticWidget = getMovementMapInDirection(
        reflowingWidgets,
        widgetMovementMap,
        occupiedSpacesBySiblingWidgets,
        collidingWidgets,
        newWidgetPosition,
        direction,
        widgetParentSpaces,
        { X, Y },
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
          if (true) {
            reflowingWidgets[key] = widgetMovementMap[key];
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
  let processedNodes: { [key: string]: WidgetCollisionGraph } = {};
  for (const collidingWidget of collidingWidgets) {
    const collidingWidgetGraph = { ...collidingWidget, children: {} };
    const directionalAccessors = getAccessor(collidingWidget.direction);
    const currentProcessedNodes = {};
    if (!processedNodes[collidingWidget.id]) {
      getWidgetCollisionGraph(
        occupiedSpacesBySiblingWidgets,
        collidingWidgetGraph,
        currentProcessedNodes,
        directionalAccessors,
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
  processedNodes: { [key: string]: WidgetCollisionGraph } = {},
  accessors: CollisionAccessors,
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

  affectedWidgets.sort((widgetA, widgetB) => {
    return (
      accessors.directionIndicator * -1 * widgetB[accessors.oppositeDirection] +
      accessors.directionIndicator * widgetA[accessors.oppositeDirection]
    );
  });
  const initialCollidingWidget = { ...affectedWidgets[0] };

  while (affectedWidgets.length > 0) {
    const currentWidgetCollisionGraph = {
      ...affectedWidgets.shift(),
    } as WidgetCollisionGraph;

    if (!currentWidgetCollisionGraph) break;

    if (!processedNodes[currentWidgetCollisionGraph.id]) {
      getWidgetCollisionGraph(
        possiblyAffectedWidgets,
        currentWidgetCollisionGraph,
        processedNodes,
        accessors,
      );
      processedNodes[currentWidgetCollisionGraph.id] = {
        ...currentWidgetCollisionGraph,
      };
    }

    if (widgetCollisionGraph.children)
      widgetCollisionGraph.children[currentWidgetCollisionGraph.id] = {
        ...currentWidgetCollisionGraph,
      };
    else
      widgetCollisionGraph.children = {
        [currentWidgetCollisionGraph.id]: { ...currentWidgetCollisionGraph },
      };
  }

  return initialCollidingWidget;
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
  if (widgetMovementMap[widgetPosition.id]) {
    return {
      occupiedSpace:
        (widgetMovementMap[widgetPosition.id].maxOccupiedSpace || 0) +
        widgetPosition[accessors.parallelMax] -
        widgetPosition[accessors.parallelMin],
      depth: (widgetMovementMap[widgetPosition.id].depth || 0) + 1,
      currentWhiteSpace: widgetMovementMap[widgetPosition.id].whiteSpaces || 0,
    };
  }
  let maxOccupiedSpace = 0,
    depth = 0;
  const childrenCount = Object.keys(widgetPosition.children || {}).length;
  let currentWhiteSpace = whiteSpace;
  if (widgetPosition.children && childrenCount > 0) {
    const childNodes = Object.values(widgetPosition.children);
    for (const childNode of childNodes) {
      let nextWhiteSpaces = 0;
      let currentDimensionBeforeCollision = dimensionBeforeCollision;
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
    else if (direction === ResizeDirection.BOTTOM) currentWhiteSpace = Infinity;
    else currentWhiteSpace += widgetPosition[accessors.direction];
  }

  if (accessors.isHorizontal) {
    // const dimensionXBeforeCollision = getDimensionXBeforeCollision(
    //   widgetMovementMap[widgetPosition.id],
    //   dimensions.X,
    //   accessors,
    //   dimensionBeforeCollision,
    //   widgetParentSpaces,
    // );
    const maxX =
      direction === ResizeDirection.RIGHT
        ? (GridDefaults.DEFAULT_GRID_COLUMNS -
            widgetPosition[accessors.direction] -
            maxOccupiedSpace) *
          widgetParentSpaces.parentColumnSpace
        : (widgetPosition[accessors.direction] - maxOccupiedSpace) *
          widgetParentSpaces.parentColumnSpace;
    widgetMovementMap[widgetPosition.id] = {
      x: dimensions.X,
      maxX: accessors.directionIndicator * maxX,
      maxOccupiedSpace,
      depth,
      dimensionXBeforeCollision:
        dimensions.X +
        dimensionBeforeCollision * widgetParentSpaces.parentColumnSpace,
      whiteSpaces: currentWhiteSpace,
      get X() {
        const originalWidth =
          widgetPosition[accessors.parallelMax] -
          widgetPosition[accessors.parallelMin];
        const value =
          this.x !== undefined
            ? this.x - (this.dimensionXBeforeCollision || 0)
            : 0;
        const maxValue = Math[accessors.mathComparator](value, this.maxX || 0);
        const resizeThreshold =
          accessors.directionIndicator *
          (this.whiteSpaces || 0) *
          widgetParentSpaces.parentColumnSpace;
        let resizeTill =
          resizeThreshold +
          accessors.directionIndicator *
            (maxOccupiedSpace - depth * HORIZONTAL_RESIZE_LIMIT) *
            widgetParentSpaces.parentColumnSpace;
        if (direction === ResizeDirection.RIGHT) {
          resizeTill +=
            (originalWidth - HORIZONTAL_RESIZE_LIMIT) *
            widgetParentSpaces.parentColumnSpace;
        }
        const resizeLimit =
          direction === ResizeDirection.RIGHT
            ? (GridDefaults.DEFAULT_GRID_COLUMNS -
                widgetPosition[accessors.direction] +
                originalWidth -
                (depth + 1) * HORIZONTAL_RESIZE_LIMIT) *
              widgetParentSpaces.parentColumnSpace
            : (widgetPosition[accessors.direction] -
                depth * HORIZONTAL_RESIZE_LIMIT) *
              widgetParentSpaces.parentColumnSpace *
              -1;
        if (accessors.directionIndicator < 0) {
          const x =
            value > maxValue
              ? value
              : value <= resizeThreshold && value >= resizeTill
              ? value - resizeThreshold + maxValue
              : value < resizeTill
              ? resizeLimit
              : maxValue;
          return x;
        } else {
          const x =
            value < maxValue
              ? value
              : value >= resizeThreshold && value <= resizeTill
              ? value - resizeThreshold + maxValue
              : value > resizeTill
              ? resizeLimit
              : maxValue;
          return x;
        }
      },
      get width() {
        const originalWidth =
          widgetPosition[accessors.parallelMax] -
          widgetPosition[accessors.parallelMin];
        const max =
          (this.dimensionXBeforeCollision || 0) +
          ((this.whiteSpaces || 0) +
            maxOccupiedSpace -
            depth * HORIZONTAL_RESIZE_LIMIT) *
            widgetParentSpaces.parentColumnSpace *
            accessors.directionIndicator;
        const resizeLimit =
          max +
          (originalWidth - HORIZONTAL_RESIZE_LIMIT) *
            widgetParentSpaces.parentColumnSpace *
            accessors.directionIndicator;
        let X = 0;
        const shouldResize =
          accessors.directionIndicator > 0
            ? (this.x || 0) > max
            : (this.x || 0) < max;
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
    // const dimensionYBeforeCollision = getDimensionYBeforeCollision(
    //   widgetMovementMap[widgetPosition.id],
    //   dimensions.Y,
    //   accessors,
    //   dimensionBeforeCollision,
    //   widgetParentSpaces,
    // );
    const maxY =
      direction === ResizeDirection.BOTTOM
        ? Infinity
        : (widgetPosition[accessors.direction] - maxOccupiedSpace) *
          widgetParentSpaces.parentRowSpace *
          -1;
    widgetMovementMap[widgetPosition.id] = {
      y: dimensions.Y,
      maxY,
      maxOccupiedSpace,
      depth,
      dimensionYBeforeCollision:
        dimensions.Y +
        dimensionBeforeCollision * widgetParentSpaces.parentRowSpace,
      whiteSpaces: currentWhiteSpace,
      get Y() {
        const value =
          this.y !== undefined
            ? this.y - (this.dimensionYBeforeCollision || 0)
            : 0;
        const maxValue = Math[accessors.mathComparator](value, this.maxY || 0);
        const resizeThreshold =
          accessors.directionIndicator *
          (this.whiteSpaces || 0) *
          widgetParentSpaces.parentRowSpace;
        const resizeTill =
          resizeThreshold +
          accessors.directionIndicator *
            (maxOccupiedSpace - depth * VERTICAL_RESIZE_LIMIT) *
            widgetParentSpaces.parentRowSpace;
        const resizeLimit =
          direction === ResizeDirection.BOTTOM
            ? Infinity
            : (widgetPosition[accessors.direction] -
                depth * VERTICAL_RESIZE_LIMIT) *
              widgetParentSpaces.parentRowSpace *
              -1;
        if (accessors.directionIndicator < 0) {
          const y =
            value > maxValue
              ? value
              : value <= resizeThreshold && value >= resizeTill
              ? value - resizeThreshold + maxValue
              : value < resizeTill
              ? resizeLimit
              : maxValue;
          return y;
        } else {
          return value;
        }
      },
      get height() {
        const originalHeight =
          widgetPosition[accessors.parallelMax] -
          widgetPosition[accessors.parallelMin];
        const max =
          (this.dimensionYBeforeCollision || 0) +
          ((this.whiteSpaces || 0) +
            maxOccupiedSpace -
            depth * VERTICAL_RESIZE_LIMIT) *
            widgetParentSpaces.parentRowSpace *
            accessors.directionIndicator;
        const resizeLimit =
          max +
          (originalHeight - VERTICAL_RESIZE_LIMIT) *
            widgetParentSpaces.parentRowSpace *
            accessors.directionIndicator;
        let Y = 0;
        const shouldResize =
          accessors.directionIndicator > 0 ? false : (this.y || 0) < max;
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
  prevWidgetMovementMap: reflowWidgets,
  widgetMovementMap: reflowWidgets,
  occupiedSpacesBySiblingWidgets: OccupiedSpace[],
  collidingWidgets: CollidingWidgets,
  widgetPosition: WidgetCollisionGraph,
  direction: ResizeDirection,
  widgetParentSpaces: WidgetParentSpaces,
  dimensions = { X: 0, Y: 0 },
) {
  const accessors = getAccessor(direction);
  const widgetCollisionGraph = getWidgetCollisionGraphInDirection(
    occupiedSpacesBySiblingWidgets,
    widgetPosition,
    collidingWidgets,
  );

  if (
    !widgetCollisionGraph ||
    !widgetCollisionGraph.children ||
    Object.keys(widgetCollisionGraph.children).length <= 0
  )
    return;

  const childrenKeys = Object.keys(widgetCollisionGraph.children || {});
  let staticDepth = 0;
  for (const childKey of childrenKeys) {
    const childNode = widgetCollisionGraph.children[childKey];
    const childDirection = collidingWidgets[childNode.id].direction;
    const directionalAccessors = getAccessor(childDirection);
    const { depth } = getWidgetMovementMap(
      childNode,
      widgetMovementMap,
      dimensions,
      widgetParentSpaces,
      directionalAccessors,
      childDirection,
      0,
      childNode[directionalAccessors.direction],
      childNode[directionalAccessors.oppositeDirection] -
        widgetPosition[directionalAccessors.direction],
      false,
    );
    staticDepth = Math.max(staticDepth, depth);
  }

  if (!widgetMovementMap) return {};

  //eslint-disable-next-line
  console.log(
    cloneDeep({
      graph: widgetCollisionGraph,
      map: widgetMovementMap,
      direction,
      accessors,
      dimensions,
      collidingWidgets,
      widgetPosition,
    }),
  );

  if (accessors.isHorizontal) {
    const maxX =
      direction === ResizeDirection.RIGHT
        ? (GridDefaults.DEFAULT_GRID_COLUMNS -
            widgetPosition[accessors.direction] -
            staticDepth * HORIZONTAL_RESIZE_LIMIT) *
          widgetParentSpaces.parentColumnSpace
        : (widgetPosition[accessors.direction] -
            staticDepth * HORIZONTAL_RESIZE_LIMIT) *
          widgetParentSpaces.parentColumnSpace;
    return {
      id: widgetCollisionGraph.id,
      maxX:
        dimensions.X +
        accessors.directionIndicator *
          (maxX + widgetParentSpaces.parentColumnSpace),
      mathXComparator: accessors.mathComparator,
      directionXIndicator: accessors.directionIndicator,
    };
  } else {
    const maxY =
      (widgetPosition[accessors.direction] -
        staticDepth * VERTICAL_RESIZE_LIMIT) *
      widgetParentSpaces.parentRowSpace;
    return {
      id: widgetCollisionGraph.id,
      maxY:
        direction === ResizeDirection.BOTTOM
          ? Infinity
          : dimensions.Y - maxY - widgetParentSpaces.parentRowSpace,
      mathYComparator: accessors.mathComparator,
      directionYIndicator: accessors.directionIndicator,
    };
  }
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

// function getDimensionXBeforeCollision(
//   widgetMovement: reflowWidgets[string] | undefined,
//   X: number,
//   accessors: CollisionAccessors,
//   dimensionBeforeCollision: number,
//   widgetParentSpaces: WidgetParentSpaces,
// ) {
//   const dimensionXBeforeCollision =
//     X + dimensionBeforeCollision * widgetParentSpaces.parentColumnSpace;
//   if (!widgetMovement || !widgetMovement.dimensionXBeforeCollision)
//     return dimensionXBeforeCollision;

//   if (accessors.directionIndicator > 0) {
//     return Math.min(
//       dimensionXBeforeCollision,
//       widgetMovement.dimensionXBeforeCollision,
//     );
//   } else {
//     return Math.max(
//       dimensionXBeforeCollision,
//       widgetMovement.dimensionXBeforeCollision,
//     );
//   }
// }

// function getDimensionYBeforeCollision(
//   widgetMovement: reflowWidgets[string] | undefined,
//   Y: number,
//   accessors: CollisionAccessors,
//   dimensionBeforeCollision: number,
//   widgetParentSpaces: WidgetParentSpaces,
// ) {
//   const dimensionYBeforeCollision =
//     Y + dimensionBeforeCollision * widgetParentSpaces.parentRowSpace;
//   if (!widgetMovement || !widgetMovement.dimensionYBeforeCollision)
//     return dimensionYBeforeCollision;

//   if (accessors.directionIndicator > 0) {
//     return Math.min(
//       dimensionYBeforeCollision,
//       widgetMovement.dimensionYBeforeCollision,
//     );
//   } else {
//     return Math.max(
//       dimensionYBeforeCollision,
//       widgetMovement.dimensionYBeforeCollision,
//     );
//   }
// }

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
