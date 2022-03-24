import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { GridDefaults } from "constants/WidgetConstants";
import { isEmpty } from "lodash";
import {
  CollidingSpace,
  CollidingSpaceMap,
  CollisionAccessors,
  CollisionTree,
  Delta,
  DirectionalMovement,
  GridProps,
  HORIZONTAL_RESIZE_LIMIT,
  ReflowDirection,
  ReflowedSpaceMap,
  VERTICAL_RESIZE_LIMIT,
} from "./reflowTypes";
import {
  getAccessor,
  getCollidingSpacesInDirection,
  getMaxX,
  getMaxY,
  getReflowDistance,
  getResizedDimension,
  getResizedDimensions,
  shouldReplaceOldMovement,
  sortCollidingSpacesByDistance,
} from "./reflowUtils";

/**
 * returns movement map of all the cascading colliding spaces
 * @param occupiedSpaces array of all the occupied spaces on the canvas
 * @param newPositions new/current positions of the space/block
 * @param collidingSpaceMap Map of Colliding spaces of the dragging/resizing space
 * @param gridProps properties of the canvas's grid
 * @param delta X and Y coordinate displacement of the newPosition from the original position
 * @param shouldResize boolean to indicate if colliding spaces should resize
 * @returns movement map of all the cascading colliding spaces
 */
export function getMovementMap(
  occupiedSpaces: OccupiedSpace[],
  newPositions: OccupiedSpace,
  collidingSpaceMap: CollidingSpaceMap,
  gridProps: GridProps,
  delta = { X: 0, Y: 0 },
  shouldResize = true,
) {
  const movementMap: ReflowedSpaceMap = {};
  const collisionTree = getCollisionTree(
    occupiedSpaces,
    newPositions,
    collidingSpaceMap,
  );

  if (
    !collisionTree ||
    !collisionTree.children ||
    Object.keys(collisionTree.children).length <= 0
  ) {
    return {};
  }

  const childrenKeys = Object.keys(collisionTree.children);

  const directionalVariables: {
    [direction: string]: [number, number, CollisionAccessors, ReflowDirection];
  } = {};

  for (const childKey of childrenKeys) {
    const childNode = collisionTree.children[childKey];
    const childDirection = collidingSpaceMap[childNode.id].direction;
    const directionalAccessors = getAccessor(childDirection);

    const distanceBeforeCollision =
      childNode[directionalAccessors.oppositeDirection] -
      newPositions[directionalAccessors.direction];

    const { depth, occupiedSpace } = getMovementMapHelper(
      childNode,
      movementMap,
      delta,
      gridProps,
      directionalAccessors,
      childDirection,
      0,
      childNode[directionalAccessors.direction],
      distanceBeforeCollision,
      shouldResize,
    );

    let staticDepth = 0,
      maxOccupiedSpace = 0;
    if (directionalVariables[childDirection]) {
      [staticDepth, maxOccupiedSpace] = directionalVariables[childDirection];
    }
    staticDepth = Math.max(staticDepth, depth);
    maxOccupiedSpace = Math.max(maxOccupiedSpace, occupiedSpace);
    directionalVariables[childDirection] = [
      staticDepth,
      maxOccupiedSpace,
      directionalAccessors,
      childDirection,
    ];
  }

  const directionalKeys = Object.keys(directionalVariables);

  const directionalMovements: DirectionalMovement[] = [];

  for (const directionKey of directionalKeys) {
    const [
      staticDepth,
      maxOccupiedSpace,
      accessors,
      reflowDirection,
    ] = directionalVariables[directionKey];
    const maxMethod = accessors.isHorizontal ? getMaxX : getMaxY;
    const gridDistance = accessors.isHorizontal
      ? gridProps.parentColumnSpace
      : gridProps.parentRowSpace;
    const coordinateKey = accessors.isHorizontal ? "X" : "Y";
    const maxMovement =
      maxMethod(
        collisionTree,
        gridProps,
        reflowDirection,
        staticDepth,
        maxOccupiedSpace,
        shouldResize,
      ) +
      delta[coordinateKey] +
      accessors.directionIndicator * gridDistance;
    directionalMovements.push({
      maxMovement,
      directionalIndicator: accessors.directionIndicator,
      coordinateKey,
      isHorizontal: accessors.isHorizontal,
    });
  }
  const newPositionsMovement = {
    id: collisionTree.id,
    directionalMovements,
  };

  return {
    newPositionsMovement,
    movementMap,
  };
}

/**
 * Recursively create a tree of Space collisions
 * @param occupiedSpaces array of all the occupied spaces on the canvas
 * @param newPositions new/current positions of the space/block
 * @param collidingSpaceMap Map of Colliding spaces of the dragging/resizing space
 * @returns Collisions in a tree structure
 */
function getCollisionTree(
  occupiedSpaces: OccupiedSpace[],
  newPositions: OccupiedSpace,
  collidingSpaceMap: CollidingSpaceMap,
) {
  const collisionTree: CollisionTree = {
    ...newPositions,
    children: {},
  };

  const collidingSpaces = Object.values(collidingSpaceMap);
  sortCollidingSpacesByDistance(collidingSpaces, newPositions, false);

  const globalCompletedTree: { [key: string]: boolean } = {
    [newPositions.id]: true,
  };
  for (const collidingSpace of collidingSpaces) {
    const directionalAccessors = getAccessor(collidingSpace.direction);

    if (!globalCompletedTree[collidingSpace.id]) {
      const currentCollisionTree = getCollisionTreeHelper(
        occupiedSpaces,
        collidingSpace,
        directionalAccessors,
        collidingSpace[directionalAccessors.oppositeDirection] -
          collisionTree[directionalAccessors.direction],
        collidingSpace.direction,
        globalCompletedTree,
      );

      if (currentCollisionTree && collisionTree.children) {
        collisionTree.children[collidingSpace.id] = { ...currentCollisionTree };
      }
    }
  }

  return collisionTree;
}

function getCollisionTreeHelper(
  occupiedSpaces: OccupiedSpace[],
  collidingSpace: CollidingSpace,
  accessors: CollisionAccessors,
  distanceBeforeCollision: number,
  direction: ReflowDirection,
  globalProcessedNodes: { [key: string]: boolean },
  emptySpaces = 0,
  processedNodes: { [key: string]: boolean } = {},
) {
  if (!collidingSpace) return;
  const collisionTree: CollisionTree = { ...collidingSpace, children: {} };

  const resizedDimensions = getResizedDimensions(
    collisionTree,
    distanceBeforeCollision,
    emptySpaces,
    accessors,
  );

  const {
    collidingSpaces,
    occupiedSpacesInDirection,
  } = getCollidingSpacesInDirection(
    resizedDimensions,
    direction,
    occupiedSpaces,
  );

  sortCollidingSpacesByDistance(collidingSpaces, collisionTree);

  const currentProcessedNodes: { [key: string]: boolean } = {};
  for (const currentCollidingSpace of collidingSpaces) {
    const nextEmptySpaces =
      emptySpaces +
      currentCollidingSpace[accessors.oppositeDirection] -
      collisionTree[accessors.direction];

    if (!currentProcessedNodes[currentCollidingSpace.id]) {
      const currentCollisionTree = getCollisionTreeHelper(
        occupiedSpacesInDirection,
        currentCollidingSpace,
        accessors,
        distanceBeforeCollision,
        direction,
        globalProcessedNodes,
        nextEmptySpaces,
        currentProcessedNodes,
      );

      currentProcessedNodes[currentCollidingSpace.id] = true;

      if (currentCollisionTree && collisionTree.children) {
        collisionTree.children[currentCollidingSpace.id] = {
          ...currentCollisionTree,
        };
      }
    }
  }

  const currentProcessedNodesKeys = Object.keys(currentProcessedNodes);
  for (const key of currentProcessedNodesKeys) processedNodes[key] = true;
  globalProcessedNodes[collisionTree.id] = true;
  return collisionTree;
}

function getMovementMapHelper(
  collisionTree: CollisionTree,
  movementMap: ReflowedSpaceMap,
  dimensions = { X: 0, Y: 0 },
  gridProps: GridProps,
  accessors: CollisionAccessors,
  direction: ReflowDirection,
  emptySpaces = 0,
  prevWidgetdistance: number,
  distanceBeforeCollision = 0,
  shouldResize: boolean,
) {
  let maxOccupiedSpace = 0,
    depth = 0;
  let currentEmptySpaces = emptySpaces;

  if (collisionTree.children && !isEmpty(collisionTree.children)) {
    const childNodes = Object.values(collisionTree.children);

    for (const childNode of childNodes) {
      const nextEmptySpaces =
        emptySpaces +
        Math.abs(prevWidgetdistance - childNode[accessors.oppositeDirection]);

      const {
        currentEmptySpaces: childEmptySpaces,
        depth: currentDepth,
        occupiedSpace,
      } = getMovementMapHelper(
        childNode,
        movementMap,
        dimensions,
        gridProps,
        accessors,
        direction,
        nextEmptySpaces,
        childNode[accessors.direction],
        distanceBeforeCollision,
        shouldResize,
      );

      if (maxOccupiedSpace < occupiedSpace) {
        currentEmptySpaces = childEmptySpaces;
      }

      maxOccupiedSpace = Math.max(maxOccupiedSpace, occupiedSpace || 0);
      depth = Math.max(depth, currentDepth);
    }
  } else {
    if (direction === ReflowDirection.RIGHT) {
      currentEmptySpaces +=
        GridDefaults.DEFAULT_GRID_COLUMNS - collisionTree.right;
    } else if (direction !== ReflowDirection.BOTTOM) {
      currentEmptySpaces += collisionTree[accessors.direction];
    }
  }

  const getSpaceMovement = accessors.isHorizontal
    ? getHorizontalSpaceMovement
    : getVerticalSpaceMovement;
  const movementObj = getSpaceMovement(
    collisionTree,
    gridProps,
    direction,
    maxOccupiedSpace,
    depth,
    distanceBeforeCollision,
    emptySpaces,
    currentEmptySpaces,
    dimensions,
    shouldResize,
  );

  if (
    !shouldReplaceOldMovement(
      movementMap[collisionTree.id],
      movementObj,
      direction,
    )
  ) {
    return {
      occupiedSpace:
        (movementMap[collisionTree.id].maxOccupiedSpace || 0) +
        collisionTree[accessors.parallelMax] -
        collisionTree[accessors.parallelMin],
      depth: (movementMap[collisionTree.id].depth || 0) + 1,
      currentEmptySpaces: movementMap[collisionTree.id].emptySpaces || 0,
    };
  }

  movementMap[collisionTree.id] = { ...movementObj };
  return {
    occupiedSpace:
      maxOccupiedSpace +
      collisionTree[accessors.parallelMax] -
      collisionTree[accessors.parallelMin],
    depth: depth + 1,
    currentEmptySpaces,
  };
}

function getHorizontalSpaceMovement(
  collisionTree: CollisionTree,
  gridProps: GridProps,
  direction: ReflowDirection,
  maxOccupiedSpace: number,
  depth: number,
  distanceBeforeCollision: number,
  emptySpaces: number,
  currentEmptySpaces: number,
  { X }: Delta,
  shouldResize: boolean,
) {
  const maxX = getMaxX(
    collisionTree,
    gridProps,
    direction,
    depth,
    maxOccupiedSpace,
    shouldResize,
  );
  const width = getResizedDimension(
    collisionTree,
    direction,
    X,
    maxX,
    distanceBeforeCollision,
    gridProps.parentColumnSpace,
    emptySpaces,
    HORIZONTAL_RESIZE_LIMIT,
    shouldResize,
  );
  const spaceMovement = {
    X: getReflowDistance(
      collisionTree,
      direction,
      maxX,
      distanceBeforeCollision,
      width,
      emptySpaces,
      gridProps.parentColumnSpace,
    ),
    distanceBeforeCollision,
    maxX,
    width,
    emptySpaces: currentEmptySpaces,
    depth,
    maxOccupiedSpace,
  };

  return spaceMovement;
}

function getVerticalSpaceMovement(
  collisionTree: CollisionTree,
  gridProps: GridProps,
  direction: ReflowDirection,
  maxOccupiedSpace: number,
  depth: number,
  distanceBeforeCollision: number,
  emptySpaces: number,
  currentEmptySpaces: number,
  { Y }: Delta,
  shouldResize: boolean,
) {
  const maxY = getMaxY(
    collisionTree,
    gridProps,
    direction,
    depth,
    maxOccupiedSpace,
    shouldResize,
  );
  const height = getResizedDimension(
    collisionTree,
    direction,
    Y,
    maxY,
    distanceBeforeCollision,
    gridProps.parentRowSpace,
    emptySpaces,
    VERTICAL_RESIZE_LIMIT,
    shouldResize,
  );
  const spaceMovement = {
    Y: getReflowDistance(
      collisionTree,
      direction,
      maxY,
      distanceBeforeCollision,
      height,
      emptySpaces,
      gridProps.parentRowSpace,
      true,
    ),
    distanceBeforeCollision,
    maxY,
    height,
    emptySpaces: currentEmptySpaces,
    depth,
    maxOccupiedSpace,
  };

  return spaceMovement;
}
