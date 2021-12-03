import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { GridDefaults } from "constants/WidgetConstants";
import { isEmpty } from "lodash";
import {
  CollidingSpaceMap,
  CollisionAccessors,
  CollisionTree,
  Delta,
  GridProps,
  HORIZONTAL_RESIZE_LIMIT,
  ReflowDirection,
  ReflowedSpaceMap,
  SpaceMovement,
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
  sortCollidingSpacesByDistance,
} from "./reflowUtils";

export function getMovementMap(
  occupiedSpaces: OccupiedSpace[],
  newPositions: OccupiedSpace,
  collidingSpaceMap: CollidingSpaceMap,
  gridProps: GridProps,
  delta = { X: 0, Y: 0 },
  shouldResize = false,
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
  )
    return {};

  const childrenKeys = Object.keys(collisionTree.children);

  let horizontalStaticDepth = 0,
    verticalStaticDepth = 0;
  let horizontalOccupiedSpace = 0,
    verticalOccupiedSpace = 0;
  let horizontalAccessors, verticalAccessors;
  let horizontalDirection, verticalDirection;

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

    if (directionalAccessors.isHorizontal) {
      horizontalStaticDepth = Math.max(horizontalStaticDepth, depth);
      horizontalOccupiedSpace = Math.max(
        horizontalOccupiedSpace,
        occupiedSpace,
      );
      horizontalAccessors = directionalAccessors;
      horizontalDirection = childDirection;
    } else {
      verticalStaticDepth = Math.max(verticalStaticDepth, depth);
      verticalOccupiedSpace = Math.max(verticalOccupiedSpace, occupiedSpace);
      verticalAccessors = directionalAccessors;
      verticalDirection = childDirection;
    }
  }

  let horizontalStaticWidget = {},
    verticalStaticWidget = {};
  let newPositionsMovement: SpaceMovement = {
    id: collisionTree.id,
  };

  if (horizontalAccessors && horizontalDirection) {
    const maxX = getMaxX(
      collisionTree,
      gridProps,
      horizontalDirection,
      horizontalStaticDepth,
      horizontalOccupiedSpace,
      shouldResize,
    );
    horizontalStaticWidget = {
      maxX:
        delta.X +
        maxX +
        horizontalAccessors.directionIndicator * gridProps.parentColumnSpace,
      mathXComparator: horizontalAccessors.mathComparator,
      directionXIndicator: horizontalAccessors.directionIndicator,
    };
  }

  if (verticalAccessors && verticalDirection) {
    const maxY = getMaxY(
      collisionTree,
      gridProps,
      verticalDirection,
      verticalStaticDepth,
      verticalOccupiedSpace,
      shouldResize,
    );
    verticalStaticWidget = {
      maxY:
        verticalDirection === ReflowDirection.BOTTOM
          ? Infinity
          : delta.Y + maxY - gridProps.parentRowSpace,
      mathYComparator: verticalAccessors.mathComparator,
      directionYIndicator: verticalAccessors.directionIndicator,
    };
  }

  newPositionsMovement = {
    ...horizontalStaticWidget,
    ...verticalStaticWidget,
  };

  return {
    newPositionsMovement,
    movementMap,
  };
}

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
  sortCollidingSpacesByDistance(collidingSpaces, newPositions);

  let processedNodes: { [key: string]: boolean } = {
    [newPositions.id]: true,
  };

  for (const collidingSpace of collidingSpaces) {
    const currentCollisionTree = { ...collidingSpace, children: {} };
    const directionalAccessors = getAccessor(collidingSpace.direction);
    const currentProcessedNodes = {};

    if (!processedNodes[collidingSpace.id]) {
      getCollisionTreeHelper(
        occupiedSpaces,
        currentCollisionTree,
        directionalAccessors,
        currentCollisionTree[directionalAccessors.oppositeDirection] -
          collisionTree[directionalAccessors.direction],
        collidingSpace.direction,
        currentProcessedNodes,
      );

      //eslint-disable-next-line
      collisionTree.children![currentCollisionTree.id] = currentCollisionTree;

      processedNodes = {
        ...processedNodes,
        ...currentProcessedNodes,
      };
    }
  }

  return collisionTree;
}

function getCollisionTreeHelper(
  occupiedSpaces: OccupiedSpace[],
  collisionTree: CollisionTree,
  accessors: CollisionAccessors,
  distanceBeforeCollision: number,
  direction: ReflowDirection,
  processedNodes: { [key: string]: boolean },
  emptySpaces = 0,
) {
  if (!collisionTree) return;
  if (!collisionTree.children) collisionTree.children = {};

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

  let childProcessedNodes: { [key: string]: boolean } = {
    [collisionTree.id]: true,
  };

  for (const collidingSpace of collidingSpaces) {
    const currentCollisionTree = {
      ...collidingSpace,
      children: {},
    } as CollisionTree;

    const currentProcessedNodes = {};
    if (!currentCollisionTree || childProcessedNodes[currentCollisionTree.id])
      break;

    const nextEmptySpaces =
      emptySpaces +
      currentCollisionTree[accessors.oppositeDirection] -
      collisionTree[accessors.direction];

    getCollisionTreeHelper(
      occupiedSpacesInDirection,
      currentCollisionTree,
      accessors,
      distanceBeforeCollision,
      direction,
      currentProcessedNodes,
      nextEmptySpaces,
    );

    collisionTree.children[currentCollisionTree.id] = {
      ...currentCollisionTree,
    };

    childProcessedNodes = {
      [currentCollisionTree.id]: true,
      ...childProcessedNodes,
      ...currentProcessedNodes,
    };
  }

  const childProcessedNodeKeys = Object.keys(childProcessedNodes);
  for (const key of childProcessedNodeKeys) processedNodes[key] = true;
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

      if (maxOccupiedSpace < occupiedSpace)
        currentEmptySpaces = childEmptySpaces;
      maxOccupiedSpace = Math.max(maxOccupiedSpace, occupiedSpace || 0);
      depth = Math.max(depth, currentDepth);
    }
  } else {
    if (direction === ReflowDirection.RIGHT)
      currentEmptySpaces +=
        GridDefaults.DEFAULT_GRID_COLUMNS - collisionTree.right;
    else if (direction !== ReflowDirection.BOTTOM)
      currentEmptySpaces += collisionTree[accessors.direction];
  }

  if (
    movementMap[collisionTree.id] &&
    (movementMap[collisionTree.id].depth || 0) > depth
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

  const getSpaceMovement = accessors.isHorizontal
    ? getHorizontalSpaceMovement
    : getVerticalSpaceMovement;
  movementMap[collisionTree.id] = getSpaceMovement(
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
    height,
    emptySpaces: currentEmptySpaces,
    depth,
    maxOccupiedSpace,
  };

  return spaceMovement;
}
