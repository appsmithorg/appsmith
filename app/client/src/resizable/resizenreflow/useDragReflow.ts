import { reflowMove, startReflow, stopReflow } from "actions/reflowActions";
import { GridDefaults } from "constants/WidgetConstants";
import { OccupiedSpace } from "constants/editorConstants";
import { cloneDeep } from "lodash";
import { RefObject, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
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
  ): { verticalMove: boolean; horizontalMove: boolean } => {
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

    if (!isWidgetsColliding && reflowState.current?.isReflowing) {
      reflowState.current = {
        isReflowing: false,
        reflow: {
          resizeDirections: ResizeDirection.UNSET,
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
          currentDirection as ResizeDirection,
          widgetParentSpaces,
          { X, Y },
        );
        widgetReflow = {
          ...widgetReflow,
          reflowingWidgets: widgetMovementMap,
          staticWidget: newStaticWidget,
        };
      } else {
        const widgetMovementMap: reflowWidgets = {};
        newStaticWidget = getMovementMapInDirection(
          widgetMovementMap,
          occupiedSpacesBySiblingWidgets,
          newWidgetPosition,
          direction,
          widgetParentSpaces,
          { X, Y },
        );
        widgetReflow = {
          ...widgetReflow,
          reflowingWidgets: widgetMovementMap,
          staticWidget: newStaticWidget,
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
          };

        const { reflowingWidgets, staticWidget } = reflowState.current.reflow;
        newStaticWidget = getCompositeMovementMap(
          occupiedSpacesBySiblingWidgets,
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

function getWidgetCollisionGraph(
  occupiedSpacesBySiblingWidgets: OccupiedSpace[],
  widgetCollisionGraph: WidgetCollisionGraph,
  accessors: CollisionAccessors,
  dimensions = { X: 0, Y: 0 },
  reflowedWidgets: reflowWidgets,
  widgetParentSpaces: WidgetParentSpaces,
  isRoot = true,
  processedNodes: { [key: string]: WidgetCollisionGraph } = {},
) {
  if (!widgetCollisionGraph) return;

  const possiblyAffectedWidgets = occupiedSpacesBySiblingWidgets.filter(
    (widgetDetails) => {
      // const directionalComparator =
      //   accessors.directionIndicator < 0
      //     ? widgetDetails[accessors.oppositeDirection] <
      //       widgetCollisionGraph[accessors.oppositeDirection]
      //     : widgetDetails[accessors.oppositeDirection] >
      //       widgetCollisionGraph[accessors.oppositeDirection];
      return widgetDetails.id !== widgetCollisionGraph.id;
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
    reflowedWidgets,
    widgetParentSpaces,
    dimensions,
    accessors,
    isRoot,
  );
  //eslint-disable-next-line
  console.log(newDimensions);
  const collidingWidgets = getCollidingWidgets(newDimensions, affectedWidgets);

  while (collidingWidgets.length > 0) {
    const currentWidgetCollisionGraph = {
      ...collidingWidgets.shift(),
    } as WidgetCollisionGraph;

    if (!currentWidgetCollisionGraph) break;

    if (!processedNodes[currentWidgetCollisionGraph.id]) {
      getWidgetCollisionGraph(
        possiblyAffectedWidgets,
        currentWidgetCollisionGraph,
        accessors,
        dimensions,
        reflowedWidgets,
        widgetParentSpaces,
        false,
        processedNodes,
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
  first = false,
) {
  // if (widgetMovementMap[widgetPosition.id]) {
  //   return {
  //     occupiedSpace:
  //       (widgetMovementMap[widgetPosition.id].maxOccupiedSpace || 0) +
  //       widgetPosition[accessors.parallelMax] -
  //       widgetPosition[accessors.parallelMin],
  //     depth: (widgetMovementMap[widgetPosition.id].depth || 0) + 1,
  //   };
  // }

  let maxOccupiedSpace = 0,
    depth = 0;
  const childrenCount = Object.keys(widgetPosition.children || {}).length;
  let currentWhiteSpace = whiteSpace;
  if (widgetPosition.children && childrenCount > 0) {
    const childNodes = Object.values(widgetPosition.children);
    for (const childNode of childNodes) {
      let nextWhiteSpaces = 0;
      if (!first) {
        nextWhiteSpaces =
          whiteSpace +
          Math.abs(prevWidgetdistance - childNode[accessors.oppositeDirection]);
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
        dimensions.X -
        accessors.directionIndicator * widgetParentSpaces.parentColumnSpace,
      whiteSpaces: currentWhiteSpace,
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
        dimensions.Y -
        accessors.directionIndicator * widgetParentSpaces.parentRowSpace,
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

  let primaryDirection, secondaryDirection;
  let primaryOccupiedSpaces, secondaryOccupiedSpaces;
  if (isHorizontalMove) {
    primaryDirection = directions[1];
    secondaryDirection = directions[0];
    primaryOccupiedSpaces = horizontalOccupiedSpaces;
    secondaryOccupiedSpaces = verticalOccupiedSpaces;
  } else {
    primaryDirection = directions[0];
    secondaryDirection = directions[1];
    primaryOccupiedSpaces = verticalOccupiedSpaces;
    secondaryOccupiedSpaces = horizontalOccupiedSpaces;
  }
  const primaryWidgetMovementMap: reflowWidgets = {};
  const primaryStaticWidget = getMovementMapInDirection(
    primaryWidgetMovementMap,
    primaryOccupiedSpaces,
    widgetPosition,
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
  delete widgetPosition.children;

  const secondaryWidgetMovementMap: reflowWidgets = {};
  getMovementMapInDirection(
    secondaryWidgetMovementMap,
    secondaryOccupiedSpaces,
    widgetPosition,
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
  direction: ResizeDirection,
  widgetParentSpaces: WidgetParentSpaces,
  dimensions = { X: 0, Y: 0 },
  reflowedWidgets: reflowWidgets = {},
) {
  let accessors;
  switch (direction) {
    case ResizeDirection.LEFT:
      accessors = {
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
      break;
    case ResizeDirection.RIGHT:
      accessors = {
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
      break;
    case ResizeDirection.TOP:
      accessors = {
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
      break;
    case ResizeDirection.BOTTOM:
      accessors = {
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
      break;
    default:
      return;
  }
  getWidgetCollisionGraph(
    occupiedSpacesBySiblingWidgets,
    widgetPosition,
    accessors,
    dimensions,
    reflowedWidgets,
    widgetParentSpaces,
  );

  getWidgetMovementMap(
    widgetPosition,
    widgetMovementMap,
    dimensions,
    widgetParentSpaces,
    accessors,
    direction,
    0,
    widgetPosition[accessors.direction],
    true,
  );
  if (!widgetMovementMap && !widgetMovementMap[widgetPosition.id]) return {};

  const staticWidget = widgetMovementMap[widgetPosition.id];

  delete widgetMovementMap[widgetPosition.id];

  //eslint-disable-next-line
  console.log(
    cloneDeep({
      graph: widgetPosition,
      map: widgetMovementMap,
      direction,
      accessors,
    }),
  );

  if (accessors.isHorizontal) {
    return {
      id: widgetPosition.id,
      maxX:
        (staticWidget.maxX || 0) +
        dimensions.X +
        accessors.directionIndicator * widgetParentSpaces.parentColumnSpace,
      mathXComparator: accessors.mathComparator,
      directionXIndicator: accessors.directionIndicator,
    };
  } else {
    return {
      id: widgetPosition.id,
      maxY:
        direction === ResizeDirection.BOTTOM
          ? Infinity
          : (staticWidget.maxY || 0) +
            dimensions.Y -
            widgetParentSpaces.parentRowSpace,
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
  offset: Rect | undefined,
  occupied?: OccupiedSpace[],
) {
  if (!offset) return [];
  const collidingWidgets = [];
  if (occupied) {
    for (let i = 0; i < occupied.length; i++) {
      if (areIntersecting(occupied[i], offset)) {
        collidingWidgets.push({ ...occupied[i] });
      }
    }
  }
  return collidingWidgets;
}

function getResizedDimensions(
  widgetCollisionGraph: WidgetCollisionGraph,
  reflowedWidgets: reflowWidgets,
  widgetParentSpaces: WidgetParentSpaces,
  dimensions: { X: number; Y: number },
  accessors: CollisionAccessors,
  isRoot: boolean,
) {
  const reflowedPositions = { ...widgetCollisionGraph, children: [] };
  const increment = isRoot ? 0 : accessors.directionIndicator * 1;
  if (accessors.isHorizontal) {
    const dimensionXBeforeCollision =
      reflowedWidgets[reflowedPositions.id]?.dimensionXBeforeCollision;
    if (dimensionXBeforeCollision === undefined)
      return {
        ...reflowedPositions,
        [accessors.direction]:
          reflowedPositions[accessors.direction] + increment,
      };
    const newColumn =
      (dimensions.X - dimensionXBeforeCollision) /
      widgetParentSpaces.parentColumnSpace;
    reflowedPositions[accessors.direction] =
      reflowedPositions[accessors.direction] + newColumn;
  } else {
    const dimensionYBeforeCollision =
      reflowedWidgets[reflowedPositions.id]?.dimensionYBeforeCollision;
    if (dimensionYBeforeCollision === undefined)
      return {
        ...reflowedPositions,
        [accessors.direction]:
          reflowedPositions[accessors.direction] + increment,
      };
    const newRow =
      (dimensions.Y - dimensionYBeforeCollision) /
      widgetParentSpaces.parentRowSpace;
    reflowedPositions[accessors.direction] =
      reflowedPositions[accessors.direction] + newRow;
  }

  return reflowedPositions;
}
