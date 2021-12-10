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

export function getIsHorizontalMove(
  newPositions: OccupiedSpace,
  prevPositions?: OccupiedSpace,
) {
  if (
    prevPositions?.left !== newPositions.left ||
    prevPositions?.right !== newPositions.right
  )
    return true;

  return false;
}

export function shouldReplaceOldMovement(
  oldMovement: ReflowedSpace,
  newMovement: ReflowedSpace,
  direction: ReflowDirection,
) {
  if (!oldMovement) return true;

  const { directionIndicator, isHorizontal } = getAccessor(direction);

  const distanceKey = isHorizontal ? "X" : "Y";

  if (
    oldMovement[distanceKey] === undefined ||
    newMovement[distanceKey] === undefined
  )
    return;

  return compareNumbers(
    //eslint-disable-next-line
    oldMovement[distanceKey]!,
    //eslint-disable-next-line
    newMovement[distanceKey]!,
    directionIndicator < 0,
  );
}

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

export function sortCollidingSpacesByDistance(
  occupiedSpaces: CollidingSpace[],
  newPositions: OccupiedSpace,
  isAscending = true,
) {
  const distanceComparator = getDistanceComparator(newPositions, isAscending);
  occupiedSpaces.sort(distanceComparator);
}

export function getDistanceComparator(
  newPositions: OccupiedSpace,
  isAscending = true,
) {
  return function(spaceA: CollidingSpace, spaceB: CollidingSpace) {
    const accessorA = getAccessor(spaceA.direction);
    const accessorB = getAccessor(spaceB.direction);

    const distanceA = Math.abs(
      newPositions[accessorA.direction] - spaceA[accessorA.oppositeDirection],
    );
    const distanceB = Math.abs(
      newPositions[accessorB.direction] - spaceB[accessorB.oppositeDirection],
    );
    return isAscending ? distanceA - distanceB : distanceB - distanceA;
  };
}

export function getShouldResize(
  newPositions: SpaceMovement | undefined,
  { X, Y } = { X: 0, Y: 0 },
  beforeLimit = false,
): { canVerticalMove: boolean; canHorizontalMove: boolean } {
  if (!newPositions)
    return {
      canHorizontalMove: false,
      canVerticalMove: false,
    };

  let canHorizontalMove = true,
    canVerticalMove = true;
  const { directionXIndicator, directionYIndicator, maxX, maxY } = newPositions;
  if (directionXIndicator && maxX !== undefined) {
    canHorizontalMove = compareNumbers(
      X,
      maxX,
      directionXIndicator < 0,
      beforeLimit,
    );
  }
  if (directionYIndicator && maxY !== undefined) {
    canVerticalMove = compareNumbers(
      Y,
      maxY,
      directionYIndicator < 0,
      beforeLimit,
    );
  }

  return {
    canHorizontalMove,
    canVerticalMove,
  };
}
export function getDelta(
  OGPositions: OccupiedSpace,
  newPositions: OccupiedSpace,
  direction: ReflowDirection,
) {
  let X = OGPositions.left - newPositions.left,
    Y = OGPositions.top - newPositions.top;
  if (direction.indexOf("|") < 0) {
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

export function getCollidingSpaces(
  newPositions: OccupiedSpace,
  direction: ReflowDirection,
  occupiedSpaces?: OccupiedSpace[],
  isHorizontalMove?: boolean,
  prevPositions?: OccupiedSpace,
  prevCollidingSpaces?: CollidingSpaceMap,
) {
  let isColliding = false;
  const collidingSpaceMap: CollidingSpaceMap = {};
  const filteredOccupiedSpaces = filterSpaceById(
    newPositions.id,
    occupiedSpaces,
  );

  for (const occupiedSpace of filteredOccupiedSpaces) {
    if (areIntersecting(occupiedSpace, newPositions)) {
      isColliding = true;
      const currentSpaceId = occupiedSpace.id;

      const movementDirection = getCorrectedDirection(
        occupiedSpace,
        prevPositions,
        direction,
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

export function getCollidingSpacesInDirection(
  newPositions: OccupiedSpace,
  direction: ReflowDirection,
  occupiedSpaces?: OccupiedSpace[],
) {
  const collidingSpaces: CollidingSpace[] = [];
  const occupiedSpacesInDirection = filterSpaceByDirection(
    newPositions,
    occupiedSpaces,
    direction,
  );

  for (const occupiedSpace of occupiedSpacesInDirection) {
    if (areIntersecting(occupiedSpace, newPositions)) {
      collidingSpaces.push({
        ...occupiedSpace,
        direction,
      });
    }
  }

  return { collidingSpaces, occupiedSpacesInDirection };
}

export function filterSpaceByDirection(
  newPositions: OccupiedSpace,
  occupiedSpaces: OccupiedSpace[] | undefined,
  direction: ReflowDirection,
): OccupiedSpace[] {
  let filteredSpaces: OccupiedSpace[] = [];

  const { directionIndicator, oppositeDirection } = getAccessor(direction);
  if (occupiedSpaces) {
    filteredSpaces = occupiedSpaces.filter((occupiedSpace) => {
      if (
        occupiedSpace.id === newPositions.id ||
        occupiedSpace.parentId === newPositions.id
      )
        return false;

      return compareNumbers(
        occupiedSpace[oppositeDirection],
        newPositions[oppositeDirection],
        directionIndicator > 0,
      );
    });
  }

  return filteredSpaces;
}

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
  isHorizontalMove?: boolean,
  prevCollidingSpaces?: CollidingSpaceMap,
): ReflowDirection {
  if (prevCollidingSpaces && prevCollidingSpaces[collidingSpace.id])
    return prevCollidingSpaces[collidingSpace.id].direction;

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

  if (isCorrectDirection) return primaryDirection;
  else if (secondaryDirection) return secondaryDirection;

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
    if (collidingSpace.bottom <= prevPositions.top) return ReflowDirection.TOP;
    else if (collidingSpace.top >= prevPositions.bottom)
      return ReflowDirection.BOTTOM;
    else if (
      direction !== ReflowDirection.RIGHT &&
      collidingSpace.left >= prevPositions.right
    )
      return ReflowDirection.RIGHT;
    else if (
      direction !== ReflowDirection.LEFT &&
      collidingSpace.right <= prevPositions.left
    )
      return ReflowDirection.LEFT;
  } else {
    if (collidingSpace.right <= prevPositions.left) return ReflowDirection.LEFT;
    else if (collidingSpace.left >= prevPositions.right)
      return ReflowDirection.RIGHT;
    else if (
      direction !== ReflowDirection.TOP &&
      collidingSpace.bottom <= prevPositions.top
    )
      return ReflowDirection.TOP;
    else if (
      direction !== ReflowDirection.BOTTOM &&
      collidingSpace.top >= prevPositions.bottom
    )
      return ReflowDirection.BOTTOM;
  }

  return direction;
}

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

export function getAccessor(direction: ReflowDirection) {
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

  if (direction === ReflowDirection.RIGHT)
    maxX =
      gridProps.maxGrirdColumns -
      collisionTree[accessors.direction] -
      movementLimit;

  return accessors.directionIndicator * maxX * gridProps.parentColumnSpace;
}

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

  if (direction === ReflowDirection.BOTTOM) maxY = Infinity;

  return accessors.directionIndicator * maxY;
}

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

  if (expandableCanvas) return maxValue;

  return accessors.directionIndicator < 0
    ? maxValue
    : maxValue + originalDimension - actualDimension;
}

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

  if (!shouldResize) return originalDimension * snapGridSpace;
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

export function getLimitedMovementMap(
  movementMap: ReflowedSpaceMap | undefined,
  prevMovementMap: ReflowedSpaceMap,
  movementLimit: { canVerticalMove: boolean; canHorizontalMove: boolean },
): ReflowedSpaceMap {
  if (!movementMap) return {};
  const { canHorizontalMove, canVerticalMove } = movementLimit;

  if (!canVerticalMove && !canHorizontalMove) return prevMovementMap;

  if (!canVerticalMove)
    return replaceMovementMapByDirection(movementMap, prevMovementMap, false);

  if (!canHorizontalMove)
    return replaceMovementMapByDirection(movementMap, prevMovementMap, true);

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
