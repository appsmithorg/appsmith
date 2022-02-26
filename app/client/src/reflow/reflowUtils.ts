import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { cloneDeep } from "lodash";
import { Rect } from "utils/WidgetPropsUtils";
import {
  CollidingSpace,
  CollidingSpaceMap,
  CollisionAccessors,
  CollisionMap,
  CollisionTree,
  GridProps,
  HORIZONTAL_RESIZE_LIMIT,
  MathComparators,
  MovementLimitMap,
  OrientationAccessors,
  PrevReflowState,
  ReflowDirection,
  ReflowedSpace,
  ReflowedSpaceMap,
  SecondOrderCollisionMap,
  SpaceAttributes,
  SpaceMap,
  SpaceMovementMap,
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
  newSpacePositions: OccupiedSpace[],
  prevPositions?: OccupiedSpace[],
) {
  if (!prevPositions || !prevPositions[0]) return true;

  if (
    prevPositions[0].left !== newSpacePositions[0].left ||
    prevPositions[0].right !== newSpacePositions[0].right
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

  if (oldDistance === undefined && newDistance !== undefined) return true;
  if (oldDistance !== undefined && newDistance === undefined) return true;

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
 * @returns resized Dimension
 */
export function getResizedDimensions(
  collisionTree: CollisionTree,
  {
    direction,
    directionIndicator,
    parallelMax,
    parallelMin,
  }: CollisionAccessors,
) {
  const reflowedPosition = { ...collisionTree, children: [] };

  reflowedPosition[direction] =
    reflowedPosition.collidingValue +
    directionIndicator *
      (reflowedPosition[parallelMax] - reflowedPosition[parallelMin]);

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
  isAscending = true,
) {
  const distanceComparator = getDistanceComparator(isAscending);
  collidingSpaces.sort(distanceComparator);
}

/**
 * Returns a comparator to compare the distance of the spaces
 * @param isAscending
 * @returns negative or positive indicator
 */
function getDistanceComparator(isAscending = true) {
  return function(spaceA: CollidingSpace, spaceB: CollidingSpace) {
    const accessorA = getAccessor(spaceA.direction);
    const accessorB = getAccessor(spaceB.direction);

    const distanceA = Math.abs(
      spaceA.collidingValue - spaceA[accessorA.oppositeDirection],
    );
    const distanceB = Math.abs(
      spaceB.collidingValue - spaceB[accessorB.oppositeDirection],
    );
    return isAscending ? distanceB - distanceA : distanceA - distanceB;
  };
}

/**
 * To Get Indicators if the new space positions can continue to reflow without Overlapping
 *
 * @param existingMovementLimits
 * @param spaceMovementMap
 * @param delta
 * @param beforeLimit
 * @returns object map with a boolean each for vertical and horizontal direction
 */
export function getShouldReflow(
  existingMovementLimits: MovementLimitMap,
  spaceMovementMap: SpaceMovementMap | undefined,
  delta = { X: 0, Y: 0 },
  beforeLimit = false,
) {
  if (!spaceMovementMap) return;

  const movementKeys = Object.keys(spaceMovementMap || {});

  for (const movementKey of movementKeys) {
    const spaceMovements = spaceMovementMap[movementKey];

    let canHorizontalMove = true,
      canVerticalMove = true;
    for (const movementLimit of spaceMovements) {
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
    let prevCanHorizontalMove = true,
      prevCanVerticalMove = true;
    if (existingMovementLimits[movementKey]) {
      ({
        canHorizontalMove: prevCanHorizontalMove,
        canVerticalMove: prevCanVerticalMove,
      } = existingMovementLimits[movementKey]);
    }
    existingMovementLimits[movementKey] = {
      canVerticalMove: canVerticalMove && prevCanVerticalMove,
      canHorizontalMove: canHorizontalMove && prevCanHorizontalMove,
    };
  }
}

/**
 * Should return X and Y coordinates of movement from Original SpacePositions to newSpacePositions
 *
 * @param OGSpacePositionsMap
 * @param newSpacePositionsMap
 * @param direction
 * @returns Object with X, Y
 */
export function getDelta(
  OGSpacePositionsMap: SpaceMap,
  newSpacePositionsMap: SpaceMap,
  direction: ReflowDirection,
) {
  const tempId = Object.keys(OGSpacePositionsMap)[0];
  const OGSpacePosition = OGSpacePositionsMap[tempId];
  const newSpacePosition = newSpacePositionsMap[tempId];
  let X = OGSpacePosition.left - newSpacePosition.left,
    Y = OGSpacePosition.top - newSpacePosition.top;

  if (direction.indexOf("|") > 0) {
    const [verticalDirection, horizontalDirection] = direction.split("|");
    const { direction: xDirection } = getAccessor(
      horizontalDirection as ReflowDirection,
    );
    const { direction: yDirection } = getAccessor(
      verticalDirection as ReflowDirection,
    );
    X = OGSpacePosition[xDirection] - newSpacePosition[xDirection];
    Y = OGSpacePosition[yDirection] - newSpacePosition[yDirection];
    return { X, Y };
  }

  const { direction: directionalAccessor, isHorizontal } = getAccessor(
    direction,
  );
  const diff =
    OGSpacePosition[directionalAccessor] -
    newSpacePosition[directionalAccessor];

  if (isHorizontal) X = diff;
  else Y = diff;

  return { X, Y };
}

/**
 * returns Colliding Spaces map with the directions of each collision
 *
 * @param newSpacePositions
 * @param occupiedSpaces
 * @param direction
 * @param prevCollidingSpaceMap
 * @param isHorizontalMove
 * @param prevSpacesMap
 * @param forceDirection
 * @param primaryCollisionMap
 * @returns collision spaces Map
 */
export function getCollidingSpaceMap(
  newSpacePositions: OccupiedSpace[],
  occupiedSpaces: OccupiedSpace[],
  direction: ReflowDirection,
  prevCollidingSpaceMap: CollidingSpaceMap,
  isHorizontalMove?: boolean,
  prevSpacesMap?: SpaceMap,
  forceDirection = false,
  primaryCollisionMap?: CollisionMap,
) {
  let isColliding = false;
  const collidingSpaceMap: CollisionMap = {};
  let order = 1;
  const orientationalAccessor = getOrientationAccessor(isHorizontalMove);
  const oppositeOrientationalAccessor = getOrientationAccessor(
    !isHorizontalMove,
  );

  for (const newSpacePosition of newSpacePositions) {
    for (const occupiedSpace of occupiedSpaces) {
      if (areIntersecting(occupiedSpace, newSpacePosition)) {
        isColliding = true;
        const currentSpaceId = occupiedSpace.id;

        let movementDirection = getCorrectedDirection(
          occupiedSpace,
          prevSpacesMap && prevSpacesMap[newSpacePosition.id]
            ? prevSpacesMap[newSpacePosition.id]
            : undefined,
          direction,
          forceDirection,
          prevCollidingSpaceMap && prevCollidingSpaceMap[orientationalAccessor],
          isHorizontalMove,
        );
        if (
          primaryCollisionMap &&
          primaryCollisionMap[occupiedSpace.id] &&
          primaryCollisionMap[occupiedSpace.id].collidingId ===
            newSpacePosition.id
        )
          movementDirection = primaryCollisionMap[occupiedSpace.id].direction;
        if (
          prevCollidingSpaceMap &&
          prevCollidingSpaceMap[oppositeOrientationalAccessor] &&
          prevCollidingSpaceMap[oppositeOrientationalAccessor][
            occupiedSpace.id
          ] &&
          prevCollidingSpaceMap[oppositeOrientationalAccessor][occupiedSpace.id]
            .collidingId === newSpacePosition.id
        )
          movementDirection =
            prevCollidingSpaceMap[oppositeOrientationalAccessor][
              occupiedSpace.id
            ].direction;
        const {
          direction: directionAccessor,
          directionIndicator,
          isHorizontal,
        } = getAccessor(movementDirection);

        if (isHorizontal !== isHorizontalMove) continue;

        const currentCollidingSpace = collidingSpaceMap[currentSpaceId];
        if (
          !currentCollidingSpace ||
          (currentCollidingSpace &&
            compareNumbers(
              newSpacePosition[directionAccessor],
              currentCollidingSpace.collidingValue,
              directionIndicator > 0,
            ))
        ) {
          collidingSpaceMap[currentSpaceId] = {
            ...occupiedSpace,
            direction: movementDirection,
            collidingValue: newSpacePosition[directionAccessor],
            collidingId: newSpacePosition.id,
            isHorizontal,
            order,
          };
          order++;
        }
      }
    }
  }
  return {
    isColliding,
    collidingSpaceMap,
  };
}

/**
 * returns Colliding Spaces map in a particular direction
 * @param newSpacePosition
 * @param OGPosition
 * @param globalDirection
 * @param direction
 * @param gridProps
 * @param prevReflowState
 * @param occupiedSpaces
 * @param occupiedSpaces
 * @param isSecondaryCollidingWidget
 * @returns Colliding Spaces Array
 */
export function getCollidingSpacesInDirection(
  newSpacePosition: CollidingSpace,
  OGPosition: OccupiedSpace,
  globalDirection: ReflowDirection,
  direction: ReflowDirection,
  gridProps: GridProps,
  prevReflowState: PrevReflowState,
  occupiedSpaces?: OccupiedSpace[],
  isSecondaryCollidingWidget = false,
) {
  const collidingSpaces: CollidingSpace[] = [];
  const occupiedSpacesInDirection = filterSpaceByDirection(
    newSpacePosition,
    occupiedSpaces,
    direction,
  );
  const accessor = getAccessor(direction);

  const { prevMovementMap, prevSecondOrderCollisionMap } = prevReflowState;

  let order = 1;
  for (const occupiedSpace of occupiedSpacesInDirection) {
    const {
      changedDirection,
      collidingValue,
      isHorizontal,
      shouldAddToArray,
    } = ShouldAddToCollisionSpacesArray(
      newSpacePosition,
      OGPosition,
      occupiedSpace,
      direction,
      accessor,
      isSecondaryCollidingWidget,
      gridProps,
      globalDirection,
      prevMovementMap,
      prevSecondOrderCollisionMap,
    );

    let currentDirection = direction,
      currentCollidingValue = newSpacePosition[accessor.direction],
      isCurrentHorizontal = accessor.isHorizontal;

    if (collidingValue !== undefined && changedDirection) {
      currentDirection = changedDirection;
      currentCollidingValue = collidingValue;
      isCurrentHorizontal = !!isHorizontal;
    }

    if (shouldAddToArray) {
      collidingSpaces.push({
        ...occupiedSpace,
        direction: currentDirection,
        collidingValue: currentCollidingValue,
        collidingId: newSpacePosition.id,
        isHorizontal: isCurrentHorizontal,
        order,
      });
      order++;
    }
  }

  return {
    collidingSpaces,
    occupiedSpacesInDirection,
    skipCollisionTree: false,
  };
}

/**
 * boolean if the occupied space is to be added to array, also mentions if there is a change in direction
 * @param newSpacePosition
 * @param OGPosition
 * @param collidingSpace
 * @param direction
 * @param accessor
 * @param isSecondaryCollidingWidget
 * @param gridProps
 * @param globalDirection
 * @param prevMovementMap
 * @param prevSecondOrderCollisionMap
 * @returns object with boolean if the occupied space is to be added to array, also mentions if there is a change in direction
 */
function ShouldAddToCollisionSpacesArray(
  newSpacePosition: CollidingSpace,
  OGPosition: OccupiedSpace,
  collidingSpace: OccupiedSpace,
  direction: ReflowDirection,
  accessor: CollisionAccessors,
  isSecondaryCollidingWidget: boolean,
  gridProps: GridProps,
  globalDirection: ReflowDirection,
  prevMovementMap?: ReflowedSpaceMap,
  prevSecondOrderCollisionMap?: SecondOrderCollisionMap,
) {
  if (!areIntersecting(collidingSpace, newSpacePosition))
    return { shouldAddToArray: false };

  const {
    direction: directionAccessor,
    directionIndicator,
    isHorizontal,
    oppositeDirection,
    parallelMax,
    parallelMin,
  } = accessor;

  const prevCollisionMap: {
    children: {
      [key: string]: any;
    };
  } = (prevSecondOrderCollisionMap &&
    prevSecondOrderCollisionMap[newSpacePosition.id]) || {
    children: {},
  };

  if (prevCollisionMap.children[collidingSpace.id]) {
    return getCollisionStatusBasedOnPrevValue(
      newSpacePosition,
      collidingSpace,
      direction,
      accessor,
      gridProps,
      prevCollisionMap,
      prevMovementMap,
    );
  }

  const movementDirectionAccessor = accessor.isHorizontal
    ? "directionX"
    : "directionY";

  if (
    prevMovementMap &&
    prevMovementMap[collidingSpace.id] &&
    prevMovementMap[collidingSpace.id][movementDirectionAccessor]
  ) {
    const prevDirection =
      prevMovementMap[collidingSpace.id][movementDirectionAccessor];
    const shouldAddToArray = prevDirection === direction;
    return { shouldAddToArray };
  }

  if (!isSecondaryCollidingWidget) return { shouldAddToArray: true };

  if (!prevSecondOrderCollisionMap) return { shouldAddToArray: true };

  if (!prevMovementMap || !prevMovementMap[newSpacePosition.id])
    return { shouldAddToArray: true };

  const { [OGPosition.id]: prevStaticSpace } = getModifiedOccupiedSpacesMap(
    { [OGPosition.id]: { ...OGPosition } },
    prevMovementMap,
    !isHorizontal,
    gridProps,
    parallelMax,
    parallelMin,
  );

  const shouldAddToArray = compareNumbers(
    collidingSpace[oppositeDirection],
    prevStaticSpace[directionAccessor],
    directionIndicator > 0,
    true,
  );

  const currentStaticSpace = {
    ...newSpacePosition,
    [oppositeDirection]: newSpacePosition.collidingValue,
  };
  if (
    !shouldAddToArray &&
    areIntersecting(collidingSpace, currentStaticSpace)
  ) {
    const correctedDirection = getCorrectedDirection(
      collidingSpace,
      prevStaticSpace,
      globalDirection,
    );
    const correctedAccessor = getAccessor(correctedDirection);
    let collidingValue = newSpacePosition.collidingValue;
    if (isHorizontal !== correctedAccessor.isHorizontal) {
      collidingValue = currentStaticSpace[correctedAccessor.direction];
    }
    return {
      shouldAddToArray: true,
      changedDirection: correctedDirection,
      collidingValue: collidingValue,
      isHorizontal: correctedAccessor.isHorizontal,
    };
  }
  return { shouldAddToArray };
}

/**
 * method to filter spaces to be after a particular space in a particular direction
 * @param newSpacePosition
 * @param occupiedSpaces
 * @param direction
 * @returns filtered array of occupied space
 */
export function filterSpaceByDirection(
  newSpacePosition: OccupiedSpace,
  occupiedSpaces: OccupiedSpace[] | undefined,
  direction: ReflowDirection,
): OccupiedSpace[] {
  let filteredSpaces: OccupiedSpace[] = [];

  const {
    direction: directionAccessor,
    directionIndicator,
    oppositeDirection,
  } = getAccessor(direction);

  if (occupiedSpaces) {
    filteredSpaces = occupiedSpaces.filter((occupiedSpace) => {
      if (
        occupiedSpace.id === newSpacePosition.id ||
        occupiedSpace.parentId === newSpacePosition.id
      ) {
        return false;
      }

      return compareNumbers(
        occupiedSpace[directionAccessor],
        newSpacePosition[oppositeDirection],
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

/**
 * filters out a space with an id and returns the filtered Spaces
 * @param id
 * @param occupiedSpaces
 * @returns filtered occupied spaces
 */
export function filterCommonSpaces(
  newSpacePositionsMap: { [key: string]: any },
  occupiedSpaceMap: SpaceMap,
) {
  const keysToFilter = Object.keys(newSpacePositionsMap);
  for (const key of keysToFilter) {
    if (occupiedSpaceMap[key]) {
      delete occupiedSpaceMap[key];
    }
  }
}

/**
 * easily the most important method in the algorithm
 *
 * @param r1 space1
 * @param r2 space 2
 * @returns boolean if it is colliding
 */
function areIntersecting(r1: Rect, r2: Rect) {
  return !(
    r2.left >= r1.right ||
    r2.right <= r1.left ||
    r2.top >= r1.bottom ||
    r2.bottom <= r1.top
  );
}

/**
 * to get the direction of the two spaces, by determining in what way two spaces can collide
 * @param collidingSpace
 * @param prevPositions
 * @param direction
 * @param forceDirection
 * @param prevCollidingSpaces
 * @param isHorizontalMove
 * @returns direction
 */
function getCorrectedDirection(
  collidingSpace: OccupiedSpace,
  prevPositions: OccupiedSpace | undefined,
  direction: ReflowDirection,
  forceDirection = false,
  prevCollidingSpaces?: CollisionMap,
  isHorizontalMove?: boolean,
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

/**
 * if spaces cannot possibly collide in certain direction,
 * this method provides the direction it is most likely to collide in
 * @param collidingSpace
 * @param prevPositions
 * @param direction
 * @param isHorizontalMove
 * @returns direction
 */
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
        plane: "horizontal",
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
        plane: "horizontal",
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
        plane: "vertical",
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
        plane: "vertical",
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
    plane: "vertical",
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
  const resizeThreshold = maxDistance + currentDistanceBeforeCollision;
  const resizeLimit =
    resizeThreshold +
    (originalDimension - minDimension) *
      snapGridSpace *
      accessors.directionIndicator;

  let shrink = 0;
  const canResize = compareNumbers(
    travelDistance,
    resizeThreshold,
    accessors.directionIndicator > 0,
    true,
  );

  if (canResize) {
    shrink = Math[accessors.mathComparator](travelDistance, resizeLimit);
    shrink = shrink - resizeThreshold;
  }

  return originalDimension * snapGridSpace - Math.abs(shrink);
}

/**
 * check the limits of each movement map
 * and replace with previous run's movement values if it cant move
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

/**
 * replace movement in particular orientation
 * @param movementMap
 * @param prevMovementMap
 * @param replaceHorizontal
 * @returns
 */
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
 * on Container exit, the exited container and the widgets behind it should reflow in opposite direction
 * @param collidingSpaceMap
 * @param exitContainerId
 * @param direction
 * changes reference of collidingSpaceMap
 */
export function changeExitContainerDirection(
  collidingSpaceMap: CollisionMap,
  exitContainerId: string | undefined,
  direction: ReflowDirection,
) {
  if (!exitContainerId || !collidingSpaceMap[exitContainerId]) {
    return;
  }

  const oppDirection = getOppositeDirection(direction);
  const { directionIndicator, oppositeDirection } = getAccessor(oppDirection);

  const collidingSpaces: CollidingSpace[] = Object.values(collidingSpaceMap);
  //eslint-disable-next-line
  const oppositeFrom = collidingSpaceMap[exitContainerId][oppositeDirection];

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
    //eslint-disable-next-line
    collidingSpaceMap[spaceId].direction = oppDirection;
  }
}

/**
 * Convert an array of spaces to spaceMap
 * @param spacesArray
 * @returns space map
 */
export function getSpacesMapFromArray(
  spacesArray: OccupiedSpace[] | undefined,
) {
  if (!spacesArray) return {};
  const spacesMap: SpaceMap = {};
  for (const space of spacesArray) {
    spacesMap[space.id] = space;
  }
  return spacesMap;
}

/**
 * build a collision array to Collision map structure
 * @param spacesArray
 * @returns space map
 */
export function buildArrayToCollisionMap(
  collidingSpaces: CollidingSpace[] | undefined,
) {
  if (!collidingSpaces) return {};

  const collidingSpaceMap: CollisionMap = {};

  let order = 1;
  for (const collidingSpace of collidingSpaces) {
    const { directionIndicator } = getAccessor(collidingSpace.direction);
    const prevCollidingSpace = collidingSpaceMap[collidingSpace.id];

    if (
      !prevCollidingSpace ||
      (prevCollidingSpace &&
        prevCollidingSpace.direction === collidingSpace.direction &&
        compareNumbers(
          collidingSpace.collidingValue,
          prevCollidingSpace.collidingValue,
          directionIndicator > 0,
        ))
    ) {
      collidingSpaceMap[collidingSpace.id] = { ...collidingSpace, order };
      order++;
    }
  }
  return collidingSpaceMap;
}

/**
 * move the occupied spaces to previous opposite orientation run's position only in a particular orientation
 *
 * @param occupiedSpacesMap
 * @param prevMovementMap
 * @param isHorizontal
 * @param gridProps
 * @param directionMax
 * @param directionMin
 * @returns modified occupied space map
 */
export function getModifiedOccupiedSpacesMap(
  occupiedSpacesMap: SpaceMap,
  prevMovementMap: ReflowedSpaceMap | undefined,
  isHorizontal: boolean,
  gridProps: GridProps,
  directionMax: SpaceAttributes,
  directionMin: SpaceAttributes,
) {
  if (!prevMovementMap) return cloneDeep(occupiedSpacesMap);

  const spaceKeys = Object.keys(occupiedSpacesMap);
  const directionalOccupiedSpacesMap: SpaceMap = {};
  const displaceMentAccessor = isHorizontal ? "Y" : "X";
  const dimensionAccessor = isHorizontal ? "height" : "width";
  const gridGap = isHorizontal
    ? gridProps.parentRowSpace
    : gridProps.parentColumnSpace;

  for (const key of spaceKeys) {
    const movement =
      (prevMovementMap[key] && prevMovementMap[key][displaceMentAccessor]) || 0;
    const dimension =
      prevMovementMap[key] && prevMovementMap[key][dimensionAccessor];
    const currentSpace = occupiedSpacesMap[key];
    directionalOccupiedSpacesMap[key] = {
      ...currentSpace,
      [directionMin]:
        currentSpace[directionMin] + Math.round(movement / gridGap),
      [directionMax]: dimension
        ? currentSpace[directionMin] +
          Math.round((movement + dimension) / gridGap)
        : currentSpace[directionMax] + Math.round(movement / gridGap),
    };
  }
  return directionalOccupiedSpacesMap;
}

/**
 * Check if the new CollidingSpaces are colliding with the new Space positions,
 * if so it is to be added to the Collision map of that new Space position's colliding map
 * @param collidingSpace
 * @param OGCollidingSpacePosition
 * @param globalDirection
 * @param direction
 * @param newSpacePositions
 * @param globalCollidingSpaces
 * @param insertionIndex
 * @param globalProcessedNodes
 * @param collidingSpaceMap
 * @param prevReflowState
 * @param isSecondRun boolean to indicate if it is being run for the second time
 * @returns boolean to stop moving any further
 */
export function checkReCollisionWithOtherNewSpacePositions(
  collidingSpace: CollidingSpace,
  OGCollidingSpacePosition: OccupiedSpace,
  globalDirection: ReflowDirection,
  direction: ReflowDirection,
  newSpacePositions: OccupiedSpace[],
  globalCollidingSpaces: CollidingSpace[],
  insertionIndex: number,
  globalProcessedNodes: { [key: string]: boolean },
  collidingSpaceMap: CollisionMap,
  prevReflowState: PrevReflowState,
  isSecondRun: boolean,
): boolean {
  const accessor = getAccessor(direction);
  const { isHorizontal: globalIsHorizontal } = getAccessor(globalDirection);
  const { prevCollidingSpaceMap, prevSpacesMap } = prevReflowState;
  const orientationalAccessor = getOrientationAccessor(globalIsHorizontal);
  const oppositeOrientationalAccessor = getOrientationAccessor(
    !globalIsHorizontal,
  );
  let stopCollisionCheck = false;

  for (const newSpacePosition of newSpacePositions) {
    if (areIntersecting(newSpacePosition, collidingSpace)) {
      let currentDirection = getCorrectedDirection(
        collidingSpace,
        prevSpacesMap && prevSpacesMap[newSpacePosition.id],
        globalDirection,
        false,
        prevCollidingSpaceMap && prevCollidingSpaceMap[orientationalAccessor],
        globalIsHorizontal,
      );

      //this is to check if the same two widgets collide again it should be in the same direction even if they have opposite orientation
      if (
        prevCollidingSpaceMap &&
        prevCollidingSpaceMap[oppositeOrientationalAccessor] &&
        prevCollidingSpaceMap[oppositeOrientationalAccessor][
          collidingSpace.id
        ] &&
        prevCollidingSpaceMap[oppositeOrientationalAccessor][collidingSpace.id]
          .collidingId === newSpacePosition.id
      ) {
        currentDirection =
          prevCollidingSpaceMap[oppositeOrientationalAccessor][
            collidingSpace.id
          ].direction;
      }

      if (isSecondRun) currentDirection = direction;

      const currentAccessors = getAccessor(currentDirection);
      const currentCollidingSpace: CollidingSpace = {
        ...OGCollidingSpacePosition,
        direction: currentDirection,
        collidingId: newSpacePosition.id,
        collidingValue: newSpacePosition[currentAccessors.direction],
        isHorizontal: currentAccessors.isHorizontal,
        order: 0,
      };

      if (currentDirection === direction) {
        if (
          compareNumbers(
            currentCollidingSpace.collidingValue,
            collidingSpace.collidingValue,
            accessor.directionIndicator > 0,
          )
        ) {
          stopCollisionCheck = true;
          collidingSpaceMap[collidingSpace.id] = currentCollidingSpace;
          globalCollidingSpaces.splice(
            insertionIndex + 1,
            0,
            currentCollidingSpace,
          );
          delete globalProcessedNodes[collidingSpace.id];
        }
      }
    }
  }
  return stopCollisionCheck;
}

/**
 * If exact same spaces collide with each other agin in the current run and previous run
 * calculate the direction they collide in
 * @param staticSpace
 * @param collidingSpace
 * @param direction
 * @param accessor
 * @param gridProps
 * @param prevCollisionMap
 * @param prevMovementMap
 * @returns
 */
function getCollisionStatusBasedOnPrevValue(
  staticSpace: CollidingSpace,
  collidingSpace: OccupiedSpace,
  direction: ReflowDirection,
  accessor: CollisionAccessors,
  gridProps: GridProps,
  prevCollisionMap: {
    children: {
      [key: string]: any;
    };
  },
  prevMovementMap: ReflowedSpaceMap | undefined,
): {
  shouldAddToArray: boolean;
  changedDirection?: ReflowDirection;
  collidingValue?: number;
  isHorizontal?: boolean;
} {
  if (prevCollisionMap.children[collidingSpace.id].processed)
    return { shouldAddToArray: false };

  prevCollisionMap.children[collidingSpace.id].processed = true;
  const prevCollisionSpace = prevCollisionMap.children[collidingSpace.id];

  if (prevCollisionSpace.direction === direction) {
    return { shouldAddToArray: true };
  } else if (
    prevCollisionSpace.isHorizontal === accessor.isHorizontal &&
    compareNumbers(
      staticSpace.collidingValue,
      collidingSpace[accessor.direction],
      accessor.directionIndicator > 0,
    )
  ) {
    return {
      shouldAddToArray: false,
    };
  } else if (prevCollisionSpace.isHorizontal === accessor.isHorizontal) {
    return {
      shouldAddToArray: true,
      changedDirection: prevCollisionSpace.direction,
      collidingValue: staticSpace.collidingValue,
      isHorizontal: prevCollisionSpace.isHorizontal,
    };
  } else {
    const localAccessor = getAccessor(prevCollisionSpace.direction);
    const dimensionAccessor = localAccessor.isHorizontal ? "width" : "height";
    const gridGap = localAccessor.isHorizontal
      ? gridProps.parentColumnSpace
      : gridProps.parentRowSpace;

    const dimension =
      prevMovementMap &&
      prevMovementMap[staticSpace.id] &&
      prevMovementMap[staticSpace.id][dimensionAccessor] !== undefined
        ? Math.round(
            (prevMovementMap[staticSpace.id][dimensionAccessor] || 0) / gridGap,
          )
        : staticSpace[localAccessor.parallelMax] -
          staticSpace[localAccessor.parallelMin];

    const orientationalDimension = localAccessor.directionIndicator * dimension;
    return {
      shouldAddToArray: true,
      changedDirection: prevCollisionSpace.direction,
      collidingValue:
        staticSpace[localAccessor.oppositeDirection] + orientationalDimension,
      isHorizontal: prevCollisionSpace.isHorizontal,
    };
  }
}

/**
 * get orientation accessor for first and second run
 * @param isHorizontal
 * @returns orientation object
 */
export function getOrientationAccessors(
  isHorizontal: boolean,
): OrientationAccessors {
  return isHorizontal
    ? { primary: "horizontal", secondary: "vertical" }
    : { primary: "vertical", secondary: "horizontal" };
}

/**
 * get maximum and minimum space attributes in both orientation
 * @param accessor
 * @returns
 */
export function getMaxSpaceAttributes(accessor: CollisionAccessors) {
  const {
    parallelMax,
    parallelMin,
    perpendicularMax,
    perpendicularMin,
  } = accessor;

  return {
    primary: { max: perpendicularMax, min: perpendicularMin },
    secondary: { max: parallelMax, min: parallelMin },
  };
}

/**
 * get a particular orientation accessor based on orientation
 * @param isHorizontal
 * @returns horizontal or vertical
 */
export function getOrientationAccessor(isHorizontal?: boolean) {
  return isHorizontal ? "horizontal" : "vertical";
}

/**
 * method to get sorted occupied spaces based on direction
 *
 * @param occupiedSpacesMap all the occupied spaces map on the canvas
 * @param accessors collision accessors to access the space's/block's data based on direction
 * @returns array, sorted occupied spaces based on direction
 */
export function getSortedOccupiedSpaces(
  occupiedSpacesMap: SpaceMap,
  accessors: CollisionAccessors,
) {
  const sortedOccupiedSpaces = Object.values(occupiedSpacesMap);

  sortedOccupiedSpaces.sort((a, b) => {
    return a[accessors.direction] - b[accessors.direction];
  });
  return sortedOccupiedSpaces;
}

/**
 * method to get sorted new spaces based on direction
 *
 * @param newSpacePositions new/current positions array of the space/block
 * @param accessors collision accessors to access the space's/block's data based on direction
 * @returns array, sorted new spaces based on direction
 */
export function getSortedNewPositions(
  newSpacePositionsMap: SpaceMap,
  accessors: CollisionAccessors,
) {
  const newSpacePositions = Object.values(newSpacePositionsMap);
  newSpacePositions
    .sort((a, b) => {
      return a[accessors.direction] - b[accessors.direction];
    })
    .map((a) => {
      return { ...a, order: true };
    });
  return newSpacePositions;
}

/**
 * method to get sorted colliding spaces based on previous collision order
 *
 * @param collidingSpaceMap direct collision spaces map of the current new space positions
 * @param isHorizontal boolean to indicate if the orientation is horizontal
 * @param primaryCollisionMap direct collision spaces map on the previous run of the algorithm
 * @returns array, sorted occupied spaces based on direction
 */
export function getSortedCollidingSpaces(
  collidingSpaceMap: CollisionMap,
  isHorizontal: boolean,
  prevCollisionMap: CollisionMap,
) {
  const collidingSpaces = Object.values(collidingSpaceMap).filter(
    (a) => a.isHorizontal === isHorizontal,
  );

  if (!collidingSpaces.length) return;

  collidingSpaces.sort((a, b) => {
    const collisionKeyA = a.id,
      collisionKeyB = b.id;
    if (prevCollisionMap) {
      if (prevCollisionMap[collisionKeyA] && prevCollisionMap[collisionKeyB]) {
        return (
          prevCollisionMap[collisionKeyA].order -
          prevCollisionMap[collisionKeyB].order
        );
      } else if (prevCollisionMap[collisionKeyA]) return -1;
      else if (prevCollisionMap[collisionKeyB]) return 1;
    }

    return a.order - b.order;
  });

  return collidingSpaces;
}

/**
 * method to get a calculated direction based on previous space positions
 *
 * @param newSpacePositionsMap new/current positions map of the space/block
 * @param prevSpacesMap previous space positions map of the space/block
 * @param passedDirection ReflowedDirection Passed from the main method
 * @returns calculated direction
 */
export function getCalculatedDirection(
  newSpacePositionsMap: SpaceMap,
  prevSpacesMap: SpaceMap,
  passedDirection: ReflowDirection,
) {
  if (passedDirection.indexOf("|") >= 0) return [passedDirection];
  for (const key in newSpacePositionsMap) {
    if (newSpacePositionsMap[key] && prevSpacesMap[key]) {
      const { left: newLeft, top: newTop } = newSpacePositionsMap[key];
      const { left: prevLeft, top: prevTop } = prevSpacesMap[key];

      if (newTop !== prevTop && newLeft !== prevLeft) {
        return [
          compareNumbers(newTop, prevTop, true)
            ? ReflowDirection.BOTTOM
            : ReflowDirection.TOP,
          compareNumbers(newLeft, prevLeft, true)
            ? ReflowDirection.RIGHT
            : ReflowDirection.LEFT,
        ];
      }
      if (newTop !== prevTop)
        return compareNumbers(newTop, prevTop, true)
          ? [ReflowDirection.BOTTOM]
          : [ReflowDirection.TOP];
      if (newLeft !== prevLeft)
        return compareNumbers(newLeft, prevLeft, true)
          ? [ReflowDirection.RIGHT]
          : [ReflowDirection.LEFT];

      return [passedDirection];
    }
  }
  return [passedDirection];
}
