import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { Rect } from "utils/WidgetPropsUtils";
import {
  CollidingSpace,
  CollidingSpaceMap,
  CollisionAccessors,
  CollisionTree,
  GridProps,
  HORIZONTAL_RESIZE_LIMIT,
  MathComparators,
  ReflowDirection,
  ReflowedSpace,
  ReflowedSpaceMap,
  SpaceAttributes,
  SpaceMovement,
  VERTICAL_RESIZE_LIMIT,
} from "./reflowTypes";

/**
 * Get if the space moved horizontally
 *
 * @param newPositions
 * @param prevPositions
 * @returns boolean
 */
export function getIsHorizontalMove(
  newPositions: OccupiedSpace,
  prevPositions?: OccupiedSpace,
) {
  if (
    prevPositions?.left !== newPositions.left ||
    prevPositions?.right !== newPositions.right
  ) {
    return true;
  }

  return false;
}

/**
 * method to determine if the newly calculated MovementValue should replace an old value of the same Space Id
 *
 * @param oldMovement
 * @param newMovement
 * @param direction
 * @returns boolean
 */
export function shouldReplaceOldMovement(
  oldMovement: ReflowedSpace,
  newMovement: ReflowedSpace,
  direction: ReflowDirection,
) {
  if (!oldMovement) return true;

  const { directionIndicator, isHorizontal } = getAccessor(direction);

  const distanceKey = isHorizontal ? "X" : "Y";

  const oldDistance = oldMovement[distanceKey],
    newDistance = newMovement[distanceKey];

  if (oldDistance === undefined || newDistance === undefined) {
    return false;
  }

  return compareNumbers(oldDistance, newDistance, directionIndicator < 0);
}

/**
 * method to get resized dimensions of the Space to determine the Spaces colliding with this Space
 *
 * @param collisionTree
 * @param distanceBeforeCollision
 * @param emptySpaces
 * @param accessors
 * @returns resized Direction
 */
export function getResizedDimensions(
  collisionTree: CollisionTree,
  distanceBeforeCollision: number,
  emptySpaces: number,
  { direction }: CollisionAccessors,
) {
  const reflowedPosition = { ...collisionTree, children: [] };

  const newDimension = distanceBeforeCollision + emptySpaces;
  reflowedPosition[direction] -= newDimension;

  return reflowedPosition;
}

/**
 * sort the collidingSpaces with respect to the distance from the staticPosition
 *
 * @param collidingSpaces
 * @param staticPosition
 * @param isAscending
 */
export function sortCollidingSpacesByDistance(
  collidingSpaces: CollidingSpace[],
  staticPosition: OccupiedSpace,
  isAscending = true,
) {
  const distanceComparator = getDistanceComparator(staticPosition, isAscending);
  collidingSpaces.sort(distanceComparator);
}

/**
 * Returns a comparator bound to the
 *
 * @param staticPosition
 * @param isAscending
 * @returns negative or positive indicator
 */
function getDistanceComparator(
  staticPosition: OccupiedSpace,
  isAscending = true,
) {
  return function(spaceA: CollidingSpace, spaceB: CollidingSpace) {
    const accessorA = getAccessor(spaceA.direction);
    const accessorB = getAccessor(spaceB.direction);

    const distanceA = Math.abs(
      staticPosition[accessorA.direction] - spaceA[accessorA.oppositeDirection],
    );
    const distanceB = Math.abs(
      staticPosition[accessorB.direction] - spaceB[accessorB.oppositeDirection],
    );
    return isAscending ? distanceA - distanceB : distanceB - distanceA;
  };
}

/**
 * To Get Indicators if the static widget can continue to reflow without Overlapping
 *
 * @param staticPosition
 * @param delta
 * @param beforeLimit
 * @returns object with a boolean each for vertical and horizontal direction
 */
export function getShouldReflow(
  staticPosition: SpaceMovement | undefined,
  delta = { X: 0, Y: 0 },
  beforeLimit = false,
): { canVerticalMove: boolean; canHorizontalMove: boolean } {
  if (!staticPosition) {
    return {
      canHorizontalMove: false,
      canVerticalMove: false,
    };
  }

  let canHorizontalMove = true,
    canVerticalMove = true;
  const { directionalMovements } = staticPosition;
  for (const movementLimit of directionalMovements) {
    const {
      coordinateKey,
      directionalIndicator,
      isHorizontal,
      maxMovement,
    } = movementLimit;

    const canMove = compareNumbers(
      delta[coordinateKey],
      maxMovement,
      directionalIndicator < 0,
      beforeLimit,
    );

    if (!canMove) {
      if (isHorizontal) canHorizontalMove = false;
      else canVerticalMove = false;
    }
  }

  return {
    canHorizontalMove,
    canVerticalMove,
  };
}
/**
 * Should return X and Y coordinates of movement from OGPositions to newPositions
 * in a particular direction
 *
 * @param OGPositions
 * @param newPositions
 * @param direction
 * @returns
 */
export function getDelta(
  OGPositions: OccupiedSpace,
  newPositions: OccupiedSpace,
  direction: ReflowDirection,
) {
  let X = OGPositions.left - newPositions.left,
    Y = OGPositions.top - newPositions.top;
  if (direction.indexOf("|") > 0) {
    const [verticalDirection, horizontalDirection] = direction.split("|");
    const { direction: xDirection } = getAccessor(
      horizontalDirection as ReflowDirection,
    );
    const { direction: yDirection } = getAccessor(
      verticalDirection as ReflowDirection,
    );
    X = OGPositions[xDirection] - newPositions[xDirection];
    Y = OGPositions[yDirection] - newPositions[yDirection];
    return { X, Y };
  }

  const { direction: directionalAccessor, isHorizontal } = getAccessor(
    direction,
  );
  const diff =
    OGPositions[directionalAccessor] - newPositions[directionalAccessor];

  if (isHorizontal) X = diff;
  else Y = diff;

  return { X, Y };
}

/**
 * returns Collising Spaces map with the direction of collision
 *
 * @param staticPosition
 * @param direction
 * @param occupiedSpaces
 * @param isHorizontalMove
 * @param prevPositions
 * @param prevCollidingSpaces
 * @param forceDirection
 * @returns collision spaces Map
 */
export function getCollidingSpaces(
  staticPosition: OccupiedSpace,
  direction: ReflowDirection,
  occupiedSpaces?: OccupiedSpace[],
  isHorizontalMove?: boolean,
  prevPositions?: OccupiedSpace,
  prevCollidingSpaces?: CollidingSpaceMap,
  forceDirection = false,
) {
  let isColliding = false;
  const collidingSpaceMap: CollidingSpaceMap = {};
  const filteredOccupiedSpaces = filterSpaceById(
    staticPosition.id,
    occupiedSpaces,
  );

  for (const occupiedSpace of filteredOccupiedSpaces) {
    if (areIntersecting(occupiedSpace, staticPosition)) {
      isColliding = true;
      const currentSpaceId = occupiedSpace.id;

      const movementDirection = getCorrectedDirection(
        occupiedSpace,
        prevPositions,
        direction,
        forceDirection,
        isHorizontalMove,
        prevCollidingSpaces,
      );

      collidingSpaceMap[currentSpaceId] = {
        ...occupiedSpace,
        direction: movementDirection,
      };
    }
  }

  return {
    isColliding,
    collidingSpaceMap,
  };
}

/**
 * returns Collising Spaces map in a particular direction
 * @param staticPosition
 * @param direction
 * @param occupiedSpaces
 * @returns Colliding Spaces Array
 */
export function getCollidingSpacesInDirection(
  staticPosition: OccupiedSpace,
  direction: ReflowDirection,
  occupiedSpaces?: OccupiedSpace[],
) {
  const collidingSpaces: CollidingSpace[] = [];
  const occupiedSpacesInDirection = filterSpaceByDirection(
    staticPosition,
    occupiedSpaces,
    direction,
  );

  for (const occupiedSpace of occupiedSpacesInDirection) {
    if (areIntersecting(occupiedSpace, staticPosition)) {
      collidingSpaces.push({
        ...occupiedSpace,
        direction,
      });
    }
  }

  return { collidingSpaces, occupiedSpacesInDirection };
}

function filterSpaceByDirection(
  staticPosition: OccupiedSpace,
  occupiedSpaces: OccupiedSpace[] | undefined,
  direction: ReflowDirection,
): OccupiedSpace[] {
  let filteredSpaces: OccupiedSpace[] = [];

  const { directionIndicator, oppositeDirection } = getAccessor(direction);
  if (occupiedSpaces) {
    filteredSpaces = occupiedSpaces.filter((occupiedSpace) => {
      if (
        occupiedSpace.id === staticPosition.id ||
        occupiedSpace.parentId === staticPosition.id
      ) {
        return false;
      }

      return compareNumbers(
        occupiedSpace[oppositeDirection],
        staticPosition[oppositeDirection],
        directionIndicator > 0,
      );
    });
  }

  return filteredSpaces;
}

/**
 * filters out a space with an id and returns the filtered Spaces
 * @param id
 * @param occupiedSpaces
 * @returns filtered occupied spaces
 */
export function filterSpaceById(
  id: string,
  occupiedSpaces: OccupiedSpace[] | undefined,
): OccupiedSpace[] {
  let filteredSpaces: OccupiedSpace[] = [];
  if (occupiedSpaces) {
    filteredSpaces = occupiedSpaces.filter((occupiedSpace) => {
      return occupiedSpace.id !== id && occupiedSpace.parentId !== id;
    });
  }
  return filteredSpaces;
}

function areIntersecting(r1: Rect, r2: Rect) {
  return !(
    r2.left >= r1.right ||
    r2.right <= r1.left ||
    r2.top >= r1.bottom ||
    r2.bottom <= r1.top
  );
}

function getCorrectedDirection(
  collidingSpace: OccupiedSpace,
  prevPositions: OccupiedSpace | undefined,
  direction: ReflowDirection,
  forceDirection = false,
  isHorizontalMove?: boolean,
  prevCollidingSpaces?: CollidingSpaceMap,
): ReflowDirection {
  if (forceDirection) return direction;

  if (prevCollidingSpaces && prevCollidingSpaces[collidingSpace.id]) {
    return prevCollidingSpaces[collidingSpace.id].direction;
  }

  let primaryDirection: ReflowDirection = direction,
    secondaryDirection: ReflowDirection | undefined = undefined;

  if (direction.indexOf("|") >= 0) {
    const directions = direction.split("|");

    if (isHorizontalMove) {
      primaryDirection = directions[1] as ReflowDirection;
      secondaryDirection = directions[0] as ReflowDirection;
    } else {
      primaryDirection = directions[0] as ReflowDirection;
      secondaryDirection = directions[1] as ReflowDirection;
    }
  }

  if (!prevPositions) return primaryDirection;

  const primaryAccessors = getAccessor(primaryDirection);

  const isCorrectDirection = compareNumbers(
    collidingSpace[primaryAccessors.oppositeDirection],
    prevPositions[primaryAccessors.direction],
    primaryAccessors.directionIndicator > 0,
    true,
  );

  if (isCorrectDirection) {
    return primaryDirection;
  } else if (secondaryDirection) {
    return secondaryDirection;
  }

  return getVerifiedDirection(
    collidingSpace,
    prevPositions,
    primaryDirection,
    primaryAccessors.isHorizontal,
  );
}

function getVerifiedDirection(
  collidingSpace: OccupiedSpace,
  prevPositions: OccupiedSpace,
  direction: ReflowDirection,
  isHorizontalMove: boolean,
) {
  if (isHorizontalMove) {
    if (collidingSpace.bottom <= prevPositions.top) {
      return ReflowDirection.TOP;
    } else if (collidingSpace.top >= prevPositions.bottom) {
      return ReflowDirection.BOTTOM;
    } else if (
      direction !== ReflowDirection.RIGHT &&
      collidingSpace.left >= prevPositions.right
    ) {
      return ReflowDirection.RIGHT;
    } else if (
      direction !== ReflowDirection.LEFT &&
      collidingSpace.right <= prevPositions.left
    ) {
      return ReflowDirection.LEFT;
    }
  } else {
    if (collidingSpace.right <= prevPositions.left) {
      return ReflowDirection.LEFT;
    } else if (collidingSpace.left >= prevPositions.right) {
      return ReflowDirection.RIGHT;
    } else if (
      direction !== ReflowDirection.TOP &&
      collidingSpace.bottom <= prevPositions.top
    ) {
      return ReflowDirection.TOP;
    } else if (
      direction !== ReflowDirection.BOTTOM &&
      collidingSpace.top >= prevPositions.bottom
    ) {
      return ReflowDirection.BOTTOM;
    }
  }

  return direction;
}
/**
 * compares numbers and returns boolean
 * @param numberA
 * @param numberB
 * @param isGreaterThan
 * @param isEqual
 * @returns boolean
 */
export function compareNumbers(
  numberA: number,
  numberB: number,
  isGreaterThan: boolean,
  isEqual = false,
): boolean {
  if (isGreaterThan) {
    if (isEqual) {
      return numberA >= numberB;
    }
    return numberA > numberB;
  }

  if (isEqual) {
    return numberA <= numberB;
  }

  return numberA < numberB;
}

/**
 * gets opposite direction
 * @param direction
 * @returns ReflowDirection
 */
export function getOppositeDirection(
  direction: ReflowDirection,
): ReflowDirection {
  const directionalAccessors = getAccessor(direction);
  return directionalAccessors.oppositeDirection.toUpperCase() as ReflowDirection;
}

/**
 *
 * @param direction
 * @returns accessors
 */
export function getAccessor(direction: ReflowDirection): CollisionAccessors {
  switch (direction) {
    case ReflowDirection.LEFT:
      return {
        direction: SpaceAttributes.left,
        oppositeDirection: SpaceAttributes.right,
        perpendicularMax: SpaceAttributes.bottom,
        perpendicularMin: SpaceAttributes.top,
        parallelMax: SpaceAttributes.right,
        parallelMin: SpaceAttributes.left,
        mathComparator: MathComparators.max,
        directionIndicator: -1,
        isHorizontal: true,
      };
    case ReflowDirection.RIGHT:
      return {
        direction: SpaceAttributes.right,
        oppositeDirection: SpaceAttributes.left,
        perpendicularMax: SpaceAttributes.bottom,
        perpendicularMin: SpaceAttributes.top,
        parallelMax: SpaceAttributes.right,
        parallelMin: SpaceAttributes.left,
        mathComparator: MathComparators.min,
        directionIndicator: 1,
        isHorizontal: true,
      };
    case ReflowDirection.TOP:
      return {
        direction: SpaceAttributes.top,
        oppositeDirection: SpaceAttributes.bottom,
        perpendicularMax: SpaceAttributes.right,
        perpendicularMin: SpaceAttributes.left,
        parallelMax: SpaceAttributes.bottom,
        parallelMin: SpaceAttributes.top,
        mathComparator: MathComparators.max,
        directionIndicator: -1,
        isHorizontal: false,
      };
    case ReflowDirection.BOTTOM:
      return {
        direction: SpaceAttributes.bottom,
        oppositeDirection: SpaceAttributes.top,
        perpendicularMax: SpaceAttributes.right,
        perpendicularMin: SpaceAttributes.left,
        parallelMax: SpaceAttributes.bottom,
        parallelMin: SpaceAttributes.top,
        mathComparator: MathComparators.min,
        directionIndicator: 1,
        isHorizontal: false,
      };
  }
  return {
    direction: SpaceAttributes.bottom,
    oppositeDirection: SpaceAttributes.top,
    perpendicularMax: SpaceAttributes.right,
    perpendicularMin: SpaceAttributes.left,
    parallelMax: SpaceAttributes.bottom,
    parallelMin: SpaceAttributes.top,
    mathComparator: MathComparators.min,
    directionIndicator: 1,
    isHorizontal: false,
  };
}

/**
 * get Max X coordinate of the the space
 *
 * @param collisionTree
 * @param gridProps
 * @param direction
 * @param depth
 * @param maxOccupiedSpace
 * @param shouldResize
 * @returns number
 */
export function getMaxX(
  collisionTree: CollisionTree,
  gridProps: GridProps,
  direction: ReflowDirection,
  depth: number,
  maxOccupiedSpace: number,
  shouldResize: boolean,
) {
  const accessors = getAccessor(direction);
  const movementLimit = shouldResize
    ? depth * HORIZONTAL_RESIZE_LIMIT
    : maxOccupiedSpace;

  let maxX = collisionTree[accessors.direction] - movementLimit;

  if (direction === ReflowDirection.RIGHT) {
    maxX =
      gridProps.maxGridColumns -
      collisionTree[accessors.direction] -
      movementLimit;
  }

  return accessors.directionIndicator * maxX * gridProps.parentColumnSpace;
}

/**
 * get Max Y coordinate of the the space
 *
 * @param collisionTree
 * @param gridProps
 * @param direction
 * @param depth
 * @param maxOccupiedSpace
 * @param shouldResize
 * @returns number
 */
export function getMaxY(
  collisionTree: CollisionTree,
  gridProps: GridProps,
  direction: ReflowDirection,
  depth: number,
  maxOccupiedSpace: number,
  shouldResize: boolean,
) {
  const accessors = getAccessor(direction);
  const movementLimit = shouldResize
    ? depth * VERTICAL_RESIZE_LIMIT
    : maxOccupiedSpace;

  let maxY =
    (collisionTree[accessors.direction] - movementLimit) *
    gridProps.parentRowSpace;

  if (direction === ReflowDirection.BOTTOM) {
    maxY = Infinity;
  }

  return accessors.directionIndicator * maxY;
}

/**
 * get X or Y coordinate distance for space
 *
 * @param collisionTree
 * @param direction
 * @param maxDistance
 * @param distanceBeforeCollision
 * @param actualDimension
 * @param emptySpaces
 * @param snapGridSpace
 * @param expandableCanvas
 * @returns distance in number
 */
export function getReflowDistance(
  collisionTree: CollisionTree,
  direction: ReflowDirection,
  maxDistance: number,
  distanceBeforeCollision: number,
  actualDimension: number,
  emptySpaces: number,
  snapGridSpace: number,
  expandableCanvas = false,
) {
  const accessors = getAccessor(direction);

  const originalDimension =
    (collisionTree[accessors.parallelMax] -
      collisionTree[accessors.parallelMin]) *
    snapGridSpace;

  const value =
    (distanceBeforeCollision + emptySpaces * accessors.directionIndicator) *
    snapGridSpace *
    -1;
  const maxValue = Math[accessors.mathComparator](value, maxDistance);

  if (expandableCanvas) {
    return maxValue;
  }

  return accessors.directionIndicator < 0
    ? maxValue
    : maxValue + originalDimension - actualDimension;
}

/**
 * gets the resized dimension of the space along a direction
 *
 * @param collisionTree
 * @param direction
 * @param travelDistance
 * @param maxDistance
 * @param distanceBeforeCollision
 * @param snapGridSpace
 * @param emptySpaces
 * @param minDimension
 * @param shouldResize
 * @returns resized width or height of space
 */
export function getResizedDimension(
  collisionTree: CollisionTree,
  direction: ReflowDirection,
  travelDistance: number,
  maxDistance: number,
  distanceBeforeCollision: number,
  snapGridSpace: number,
  emptySpaces: number,
  minDimension: number,
  shouldResize: boolean,
) {
  const accessors = getAccessor(direction);

  const currentDistanceBeforeCollision =
    travelDistance +
    (distanceBeforeCollision + emptySpaces * accessors.directionIndicator) *
      snapGridSpace;

  const originalDimension =
    collisionTree[accessors.parallelMax] - collisionTree[accessors.parallelMin];

  if (!shouldResize) {
    return originalDimension * snapGridSpace;
  }
  const resizeTreshold = maxDistance + currentDistanceBeforeCollision;
  const resizeLimit =
    resizeTreshold +
    (originalDimension - minDimension) *
      snapGridSpace *
      accessors.directionIndicator;

  let shrink = 0;
  const canResize = compareNumbers(
    travelDistance,
    resizeTreshold,
    accessors.directionIndicator > 0,
    true,
  );

  if (canResize) {
    shrink = Math[accessors.mathComparator](travelDistance, resizeLimit);
    shrink = shrink - resizeTreshold;
  }

  return originalDimension * snapGridSpace - Math.abs(shrink);
}

/**
 *
 * @param movementMap
 * @param prevMovementMap
 * @param movementLimit
 * @returns
 */
export function getLimitedMovementMap(
  movementMap: ReflowedSpaceMap | undefined,
  prevMovementMap: ReflowedSpaceMap,
  movementLimit: { canVerticalMove: boolean; canHorizontalMove: boolean },
): ReflowedSpaceMap {
  if (!movementMap) return {};
  const { canHorizontalMove, canVerticalMove } = movementLimit;

  if (!canVerticalMove && !canHorizontalMove) {
    return prevMovementMap;
  }

  if (!canVerticalMove) {
    return replaceMovementMapByDirection(movementMap, prevMovementMap, false);
  }

  if (!canHorizontalMove) {
    return replaceMovementMapByDirection(movementMap, prevMovementMap, true);
  }

  return movementMap;
}

function replaceMovementMapByDirection(
  movementMap: ReflowedSpaceMap,
  prevMovementMap: ReflowedSpaceMap,
  replaceHorizontal: boolean,
): ReflowedSpaceMap {
  const checkKey = replaceHorizontal ? "X" : "Y";
  const currentMovementMap = { ...movementMap };
  const movementMapIds = Object.keys(movementMap);

  for (const spaceId of movementMapIds) {
    if (currentMovementMap[spaceId][checkKey] !== undefined) {
      delete currentMovementMap[spaceId];

      if (prevMovementMap[spaceId]) {
        currentMovementMap[spaceId] = { ...prevMovementMap[spaceId] };
      }
    }
  }

  return currentMovementMap;
}

/**
 * on Container exit, the exitted container and the widgets behind it should reflow in opposite direction
 * @param collidingSpaceMap
 * @param immediateExitContainer
 * @param direction
 * changes reference of collidingSpaceMap
 */
export function changeExitContainerDirection(
  collidingSpaceMap: CollidingSpaceMap,
  immediateExitContainer: string | undefined,
  direction: ReflowDirection,
) {
  if (!immediateExitContainer || !collidingSpaceMap[immediateExitContainer]) {
    return;
  }

  const oppDirection = getOppositeDirection(direction);
  const { directionIndicator, oppositeDirection } = getAccessor(oppDirection);

  const collidingSpaces: CollidingSpace[] = Object.values(collidingSpaceMap);
  const oppositeFrom =
    collidingSpaceMap[immediateExitContainer][oppositeDirection];

  const oppositeSpaceIds = collidingSpaces
    .filter((collidingSpace: CollidingSpace) => {
      return compareNumbers(
        collidingSpace[oppositeDirection],
        oppositeFrom,
        directionIndicator > 0,
        true,
      );
    })
    .map((collidingSpace: CollidingSpace) => collidingSpace.id);

  for (const spaceId of oppositeSpaceIds) {
    collidingSpaceMap[spaceId].direction = oppDirection;
  }
}
