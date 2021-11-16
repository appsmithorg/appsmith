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
      reflowState?.current?.reflow?.initialCollidingWidgets,
    );

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
      if (direction.indexOf("|") > -1) {
        const isHorizontalMove = getIsHorizontalMove(positions.current, {
          X,
          Y,
        });

        if (isHorizontalMove === undefined)
          return {
            horizontalMove: true,
            verticalMove: true,
            reflowingWidgets:
              reflowState.current?.reflow.reflowingWidgets || {},
          };

        const directions = direction.split("|");
        const currentDirection = isHorizontalMove
          ? directions[1]
          : directions[0];
        if (currentDirection === "RIGHT") {
          currentDirection;
        }
        //eslint-disable-next-line
        console.log(currentDirection, positions.current, { X, Y });
        const widgetMovementMap: reflowWidgets = {};
        newStaticWidget = getMovementMapInDirection(
          widgetMovementMap,
          occupiedSpacesBySiblingWidgets,
          newWidgetPosition,
          collidingWidgets,
          currentDirection as ResizeDirection,
          widgetParentSpaces,
          { X, Y },
        );
        widgetReflow = {
          ...widgetReflow,
          reflowingWidgets: widgetMovementMap,
          staticWidget: newStaticWidget,
          initialCollidingWidgets: collidingWidgets,
        };
      } else {
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
      }
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
      if (direction.indexOf("|") > -1) {
        const isHorizontalMove = getIsHorizontalMove(positions.current, {
          X,
          Y,
        });

        if (isHorizontalMove === undefined)
          return {
            horizontalMove: true,
            verticalMove: true,
            reflowingWidgets:
              reflowState.current?.reflow.reflowingWidgets || {},
          };

        const { reflowingWidgets, staticWidget } = reflowState.current.reflow;
        newStaticWidget = getCompositeMovementMap(
          occupiedSpacesBySiblingWidgets,
          collidingWidgets,
          { ...newWidgetPosition, ...resizedPositions },
          direction,
          widgetParentSpaces,
          { X, Y },
          reflowingWidgets,
          staticWidget,
          isHorizontalMove,
        );

        ({ horizontalMove, verticalMove } = getShouldResize(newStaticWidget, {
          X,
          Y,
        }));
        const affectedwidgetIds = Object.keys(reflowingWidgets);
        for (const affectedwidgetId of affectedwidgetIds) {
          if (reflowingWidgets && reflowingWidgets[affectedwidgetId]) {
            if (horizontalMove) reflowingWidgets[affectedwidgetId].x = X;
            if (verticalMove) reflowingWidgets[affectedwidgetId].y = Y;
          }
        }
        reflowing.reflowingWidgets = { ...reflowingWidgets };
        reflowing.staticWidget = newStaticWidget;
      } else {
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
            const reflowWidget = widgetMovementMap[key];
            if (true) {
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
        reflowing.initialCollidingWidgets = { ...collidingWidgets };
      }
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

  const collidingWidgetsInDirection = collidingWidgets.filter(
    (widgetDetails) => {
      if (widgetDetails.id === widgetPosition.id) return false;

      // if (
      //   widgetDetails[accessors.perpendicularMax] <=
      //   widgetCollisionGraph[accessors.perpendicularMin]
      // )
      //   return false;
      // if (
      //   widgetDetails[accessors.perpendicularMin] >=
      //   widgetCollisionGraph[accessors.perpendicularMax]
      // )
      //   return false;

      return true;
    },
  );
  if (collidingWidgetsInDirection.length <= 0) return;
  for (const collidingWidget of collidingWidgetsInDirection) {
    const collidingWidgetGraph = { ...collidingWidget, children: {} };
    const directionalAccessors = getAccessor(collidingWidget.direction);
    getWidgetCollisionGraph(
      occupiedSpacesBySiblingWidgets,
      collidingWidgetGraph,
      directionalAccessors,
      collidingWidget.direction,
      dimensions,
      collidingWidgetGraph[directionalAccessors.oppositeDirection] -
        widgetCollisionGraph[directionalAccessors.direction],
      widgetParentSpaces,
    );
    if (widgetCollisionGraph.children)
      widgetCollisionGraph.children[
        collidingWidgetGraph.id
      ] = collidingWidgetGraph;
    else
      widgetCollisionGraph.children = {
        [collidingWidgetGraph.id]: collidingWidgetGraph,
      };
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
  //eslint-disable-next-line
  //console.log(newDimensions);
  const { collidingWidgets: collidingWidgetsMap } = getCollidingWidgets(
    newDimensions,
    widgetCollisionGraph.id,
    direction,
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
      direction,
      dimensions,
      dimensionBeforeCollision,
      widgetParentSpaces,
      whiteSpaces +
        currentWidgetCollisionGraph[accessors.oppositeDirection] -
        widgetCollisionGraph[accessors.direction],
    );

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

function getCompositeMovementMap(
  occupiedSpacesBySiblingWidgets: OccupiedSpace[],
  collidingWidgetsMap: CollidingWidgets,
  widgetPosition: WidgetCollisionGraph,
  direction: ResizeDirection,
  widgetParentSpaces: WidgetParentSpaces,
  dimensions = { X: 0, Y: 0 },
  reflowWidgets: reflowWidgets,
  staticWidget: StaticReflowWidget | undefined,
  isHorizontalMove: boolean,
) {
  const directions = direction.split("|");
  const { horizontalKeys, verticalKeys } = getDirectionalKeysFromWidgets(
    reflowWidgets,
  );
  const horizontalOccupiedSpaces = occupiedSpacesBySiblingWidgets.filter(
    (widgetDetail) => verticalKeys.indexOf(widgetDetail.id) < 0,
  );
  const verticalOccupiedSpaces = occupiedSpacesBySiblingWidgets.filter(
    (widgetDetail) => horizontalKeys.indexOf(widgetDetail.id) < 0,
  );

  const collidingWidgets = Object.values(collidingWidgetsMap);
  const horizontalCollidingWidgets = collidingWidgets.filter((widgetDetail) =>
    getAccessor(widgetDetail.direction),
  );
  const verticalCollidingWidgets = collidingWidgets.filter(
    (widgetDetail) => !getAccessor(widgetDetail.direction).isHorizontal,
  );

  let primaryDirection, secondaryDirection;
  let primaryOccupiedSpaces, secondaryOccupiedSpaces;
  let primaryCollidingWidgets, secondaryCollidingWidgets;
  if (isHorizontalMove) {
    primaryDirection = directions[1];
    secondaryDirection = directions[0];
    primaryOccupiedSpaces = horizontalOccupiedSpaces;
    secondaryOccupiedSpaces = verticalOccupiedSpaces;
    primaryCollidingWidgets = horizontalCollidingWidgets;
    secondaryCollidingWidgets = verticalCollidingWidgets;
  } else {
    primaryDirection = directions[0];
    secondaryDirection = directions[1];
    primaryOccupiedSpaces = verticalOccupiedSpaces;
    secondaryOccupiedSpaces = horizontalOccupiedSpaces;
    primaryCollidingWidgets = verticalCollidingWidgets;
    secondaryCollidingWidgets = horizontalCollidingWidgets;
  }
  const primaryWidgetMovementMap: reflowWidgets = {};
  const primaryStaticWidget = getMovementMapInDirection(
    primaryWidgetMovementMap,
    primaryOccupiedSpaces,
    widgetPosition,
    primaryCollidingWidgets.reduce((a, o) => ({ ...a, [o.id]: o }), {}),
    primaryDirection as ResizeDirection,
    widgetParentSpaces,
    dimensions,
    reflowWidgets,
  );

  const primaryCollidingKeys = Object.keys(primaryWidgetMovementMap || {});
  const reflowWidgetKeys = Object.keys(reflowWidgets);

  secondaryOccupiedSpaces = secondaryOccupiedSpaces.filter(
    (widgetDetail) => primaryCollidingKeys.indexOf(widgetDetail.id) < 0,
  );
  secondaryCollidingWidgets = secondaryCollidingWidgets.filter(
    (widgetDetail) => primaryCollidingKeys.indexOf(widgetDetail.id) < 0,
  );
  delete widgetPosition.children;

  const secondaryWidgetMovementMap: reflowWidgets = {};
  getMovementMapInDirection(
    secondaryWidgetMovementMap,
    secondaryOccupiedSpaces,
    widgetPosition,
    secondaryCollidingWidgets.reduce((a, o) => ({ ...a, [o.id]: o }), {}),
    secondaryDirection as ResizeDirection,
    widgetParentSpaces,
    dimensions,
    reflowWidgets,
  );

  const secondaryCollidingKeys = Object.keys(secondaryWidgetMovementMap || {});

  const allReflowKeys: string[] = primaryCollidingKeys.concat(
    secondaryCollidingKeys,
  );

  const keysToDelete = reflowWidgetKeys.filter(
    (key) => allReflowKeys.indexOf(key) < 0,
  );

  for (const keyToDelete of keysToDelete) {
    delete reflowWidgets[keyToDelete];
  }

  if (primaryCollidingKeys.length > 0 || secondaryCollidingKeys.length > 0) {
    for (const key of allReflowKeys) {
      const reflowWidget =
        primaryWidgetMovementMap[key] || secondaryWidgetMovementMap[key];
      if (!reflowWidgets[key]) {
        reflowWidgets[key] = reflowWidget;
      } else {
        reflowWidgets[key].maxOccupiedSpace = reflowWidget.maxOccupiedSpace;
        reflowWidgets[key].depth = reflowWidget.depth;
        reflowWidgets[key].whiteSpaces = reflowWidget.whiteSpaces;
        if (reflowWidget.maxX) reflowWidgets[key].maxX = reflowWidget.maxX;
        if (reflowWidget.maxY) reflowWidgets[key].maxY = reflowWidget.maxY;
      }
    }
  }
  //eslint-disable-next-line
  console.log(cloneDeep({ widgets: reflowWidgets, direction }));
  if (primaryCollidingKeys.length > 0 && secondaryCollidingKeys.length <= 0) {
    return primaryStaticWidget;
  } else if (primaryCollidingKeys.length > 0) {
    return {
      ...staticWidget,
      ...primaryStaticWidget,
    };
  }

  return {
    ...staticWidget,
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
      collidingWidgets,
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

function getIsHorizontalMove(
  prevPositions: { X: number; Y: number },
  positions: { X: number; Y: number },
) {
  if (prevPositions.X !== positions.X) {
    return true;
  } else if (prevPositions.Y !== positions.Y) {
    return false;
  }

  return undefined;
}

function getDirectionalKeysFromWidgets(
  reflowWidgets: reflowWidgets,
): { horizontalKeys: string[]; verticalKeys: string[] } {
  const horizontalKeys: string[] = [],
    verticalKeys: string[] = [];
  if (!reflowWidgets) return { horizontalKeys, verticalKeys };

  const reflowWidgetIds = Object.keys(reflowWidgets);

  for (const reflowWidgetId of reflowWidgetIds) {
    if (reflowWidgets[reflowWidgetId]?.maxX !== undefined) {
      horizontalKeys.push(reflowWidgetId);
    } else if (reflowWidgets[reflowWidgetId]?.maxY !== undefined) {
      verticalKeys.push(reflowWidgetId);
    }
  }
  return { horizontalKeys, verticalKeys };
}

function getCollidingWidgets(
  offset: Rect,
  widgetId: string,
  direction: ResizeDirection,
  occupied?: OccupiedSpace[],
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
      if (areIntersecting(occupied[i], offset)) {
        isColliding = true;
        const currentWidgetId = occupied[i].id;
        const movementDirection =
          prevCollidingWidgets && prevCollidingWidgets[currentWidgetId]
            ? prevCollidingWidgets[currentWidgetId].direction
            : direction;
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
