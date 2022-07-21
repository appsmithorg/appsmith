import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { cloneDeep, isUndefined } from "lodash";
import { Rect } from "utils/WidgetPropsUtils";
import {
  CollidingSpace,
  CollidingSpaceMap,
  CollisionAccessors,
  CollisionMap,
  CollisionTree,
  CollisionTreeCache,
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
 * This method is used while calculating MovementMap of the reflowed spaces,
 * if a particular space's movement is already calculated once, this method returns a boolean
 * if the current calculation should replace the previous calculation
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
  const dimensionKey = isHorizontal ? "width" : "height";

  const oldDistance = oldMovement[distanceKey],
    newDistance = newMovement[distanceKey];

  const oldDimension = oldMovement[dimensionKey] || 0,
    newDimension = newMovement[dimensionKey] || 0;

  //if either one is undefined and other one is a number, or if both are undefined it should replace
  if (
    (oldDistance === undefined && newDistance !== undefined) ||
    (oldDistance !== undefined && newDistance === undefined) ||
    (oldDistance === undefined && newDistance === undefined)
  )
    return true;

  if (oldDistance === undefined || newDistance === undefined) {
    return false;
  }

  // if old movement is in the opposite direction return false
  if (oldDistance > 0 !== newDistance > 0) return false;

  return newDistance === oldDistance
    ? compareNumbers(newDimension, oldDimension, directionIndicator > 0)
    : compareNumbers(newDistance, oldDistance, directionIndicator > 0);
}

/**
 * for calculating all the spaces a particular space is colliding with,
 * we have to resize the space through out it's movement in the direction
 * for example, if a space is moved by 2 rows in the BOTTOM direction,
 * then the space's bottom dimension is increased by 2 rows
 *
 * @param space
 * @param accessors
 * @returns resized Dimensions of the space
 */
export function getResizedDimensions(
  space: CollidingSpace,
  {
    direction,
    directionIndicator,
    parallelMax,
    parallelMin,
  }: CollisionAccessors,
) {
  const reflowedPosition = { ...space, children: [] };

  reflowedPosition[direction] =
    reflowedPosition.collidingValue +
    directionIndicator *
      (reflowedPosition[parallelMax] - reflowedPosition[parallelMin]);

  return reflowedPosition;
}

/**
 * sort the collidingSpaces with respect to the distance from the newSpacePositions
 * eg, for the colliding spaces of dragging/moving spaces,
 * it is sorted by distance from dragging/moving spaces
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
 * This is a comparator for colliding spaces to sort them by distance from dragging/moving spaces
 *
 * @param isAscending
 * @returns comparator function
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
 * Method to generate object map with canHorizontalMove and canVerticalMove for every Dragging/MovingSpace
 *
 * @param existingMovementLimits
 * @param spaceMovementMap
 * @param delta
 * @param beforeLimit
 * @returns object map with canHorizontalMove and canVerticalMove for every Dragging/MovingSpace
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
 * initializes canHorizontalMove and canVerticalMove as true for all moving/resizing spaces
 *
 * @param newSpacePositions
 * @returns object map with canHorizontalMove and canVerticalMove for every Dragging/MovingSpace
 */
export function initializeMovementLimitMap(
  newSpacePositions: OccupiedSpace[],
): MovementLimitMap {
  const movementLimitMap: MovementLimitMap = {};

  for (const spacePosition of newSpacePositions) {
    movementLimitMap[spacePosition.id] = {
      canHorizontalMove: true,
      canVerticalMove: true,
    };
  }

  return movementLimitMap;
}

/**
 * Should return X and Y absolute coordinates of the Dragging/moving spaces relative to the original space positions
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
 * This method checks if the occupied spaces are overlapping with newSpacePositions,
 * and generates a map with the overlapping spaces with the direction of collision
 *
 * @param newSpacePositions Dragging/Moving Spaces
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
      if (areOverlapping(occupiedSpace, newSpacePosition)) {
        isColliding = true;
        const currentSpaceId = occupiedSpace.id;

        //sometimes direction mentioned cannot be trusted a direction is intelligently calculated
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

        // if in case this is a second run of the getMovementMap,
        //direction should be same as first or primary run.
        if (
          primaryCollisionMap &&
          primaryCollisionMap[occupiedSpace.id] &&
          primaryCollisionMap[occupiedSpace.id].collidingId ===
            newSpacePosition.id
        ) {
          movementDirection = primaryCollisionMap[occupiedSpace.id].direction;
        }

        // if incase of the previous run of the entire reflow algorithm, then even though it might be in
        //the opposite orientation of current, we should still consider the previous direction
        if (
          prevCollidingSpaceMap &&
          prevCollidingSpaceMap[oppositeOrientationalAccessor] &&
          prevCollidingSpaceMap[oppositeOrientationalAccessor][
            occupiedSpace.id
          ] &&
          prevCollidingSpaceMap[oppositeOrientationalAccessor][occupiedSpace.id]
            .collidingId === newSpacePosition.id
        ) {
          movementDirection =
            prevCollidingSpaceMap[oppositeOrientationalAccessor][
              occupiedSpace.id
            ].direction;
        }

        const {
          direction: directionAccessor,
          directionIndicator,
          isHorizontal,
        } = getAccessor(movementDirection);

        if (isHorizontal !== isHorizontalMove) continue;

        // If this particular space is already colliding with another dragging space,
        // then the highest in the particular direction will override the lowest value
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
 * This method is used while generating a collision tree,
 * This checks if the newSpacePosition is overlapping with occupiedSpaces
 * and creates a array of those spaces with the direction of collision,
 * This is usually the direction passed down but with some exceptions
 * based on prevReflowState and isDirectCollidingSpace, it can be different
 *
 * @param newSpacePosition
 * @param OGPosition
 * @param globalDirection
 * @param direction
 * @param gridProps
 * @param prevReflowState
 * @param globalCollisionMap
 * @param occupiedSpaces
 * @param occupiedSpaces
 * @param isDirectCollidingSpace
 * @returns Colliding Spaces Array
 */
export function getCollidingSpacesInDirection(
  newSpacePosition: CollidingSpace,
  OGPosition: OccupiedSpace,
  globalDirection: ReflowDirection,
  direction: ReflowDirection,
  gridProps: GridProps,
  prevReflowState: PrevReflowState,
  globalCollisionMap: CollisionMap,
  occupiedSpaces?: OccupiedSpace[],
  isDirectCollidingSpace = false,
) {
  const collidingSpaces: CollidingSpace[] = [];
  const occupiedSpacesInDirection = filterSpaceByDirection(
    newSpacePosition,
    occupiedSpaces,
    direction,
  );

  const currentOccupiedSpaces = filterSpaceByDirection(
    newSpacePosition,
    occupiedSpaces,
    getOppositeDirection(direction),
  );
  const accessor = getAccessor(direction);

  const { prevMovementMap, prevSecondOrderCollisionMap } = prevReflowState;

  let order = 1;
  for (const occupiedSpace of currentOccupiedSpaces) {
    // determines if the space acn be added to the list of colliding spaces, if so in what direction
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
      isDirectCollidingSpace,
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

    const currentAccessor = getAccessor(currentDirection);
    const collidingSpace = globalCollisionMap[occupiedSpace.id];

    // If the space already collides with a moving/dragging space and it's collisionValue is farther than current's Then don't add.
    if (
      collidingSpace &&
      collidingSpace.direction === currentDirection &&
      compareNumbers(
        collidingSpace.collidingValue,
        currentCollidingValue,
        currentAccessor.directionIndicator > 0,
      )
    )
      continue;

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
 * Checks if the collidingSpace is overlapping with newSpacePosition
 * and check if collidingSpace should be added to the collidingSpaceArray
 * and return and object with boolean and other variables if there is a change in direction
 *
 * @param newSpacePosition
 * @param OGPosition
 * @param collidingSpace
 * @param direction
 * @param accessor
 * @param isDirectCollidingSpace
 * @param gridProps
 * @param globalDirection
 * @param prevMovementMap
 * @param prevSecondOrderCollisionMap
 * @returns object with boolean if the occupied space is to be added to array, also mentions if there is a change in direction
 */
export function ShouldAddToCollisionSpacesArray(
  newSpacePosition: CollidingSpace,
  OGPosition: OccupiedSpace,
  collidingSpace: OccupiedSpace,
  direction: ReflowDirection,
  accessor: CollisionAccessors,
  isDirectCollidingSpace: boolean,
  gridProps: GridProps,
  globalDirection: ReflowDirection,
  prevMovementMap?: ReflowedSpaceMap,
  prevSecondOrderCollisionMap?: SecondOrderCollisionMap,
) {
  // not intersecting then dont add to array
  if (!areOverlapping(collidingSpace, newSpacePosition))
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

  // if these two spaces previously collided then it calculates how it collided
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

  // if it collided in the previous run in this particular orientation the previous direction is considered
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

  const reflowedSpacePosition = {
    ...newSpacePosition,
    [accessor.oppositeDirection]: newSpacePosition.collidingValue,
  };

  // if it does not collide in it's current reflowed position then it should not be added to the branch
  if (
    !isDirectCollidingSpace &&
    globalDirection !== direction &&
    !areOverlapping(reflowedSpacePosition, collidingSpace)
  )
    return { shouldAddToArray: false };

  // if this particular space does not collide directly with dragging spaces then can directly be added to list
  if (!isDirectCollidingSpace) return { shouldAddToArray: true };

  // next to condition return true if they dont have enough data to move forward because it is the first time reflow algorithm is run
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

  //determines if should be added by comparing previous value to now,
  // for example if previous bottom of dragging space is lesser than top of colliding space,
  //then it should collide in the bottom direction
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

  const correctedDirection = getCorrectedDirection(
    collidingSpace,
    prevStaticSpace,
    globalDirection,
  );
  const correctedAccessor = getAccessor(correctedDirection);

  // if this cant be added in mentioned direction but still intersects, then we determine the correct direction
  // but if it says the currentDirection is same as old one, it should not add
  if (
    !shouldAddToArray &&
    areOverlapping(collidingSpace, currentStaticSpace) &&
    correctedDirection !== direction &&
    correctedAccessor.isHorizontal !== isHorizontal
  ) {
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
 * method to filter occupiedSpaces to be after a newSpacePosition in direction
 * eg, if the direction is BOTTOM, this methods returns all the occupiedSpaces below the newSpacePosition
 *
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
 * filters out occupiedSpaces, and returns array without a space with id
 *
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
 * filters out occupiedSpaceMap and removes spaces with ids of newSpacePositionsMap
 *
 * @param newSpacePositionsMap
 * @param occupiedSpaceMap
 * @mutates occupiedSpaceMap
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
function areOverlapping(r1: Rect, r2: Rect) {
  return !(
    r2.left >= r1.right ||
    r2.right <= r1.left ||
    r2.top >= r1.bottom ||
    r2.bottom <= r1.top
  );
}

/**
 * This method checks if collidingSpace can collide
 * with the moving/dragging spaces in a particular direction
 * if they cant collide in that direction a direction is determined based on prevPositions
 *
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

  // if previously collided in that direction then it should be that direction
  if (prevCollidingSpaces && prevCollidingSpaces[collidingSpace.id]) {
    return prevCollidingSpaces[collidingSpace.id].direction;
  }

  let primaryDirection: ReflowDirection = direction,
    secondaryDirection: ReflowDirection | undefined = undefined;
  // this is for composite directions for resizing while dragging the corner handles
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

  // if first run the return direction
  if (!prevPositions) return primaryDirection;

  const primaryAccessors = getAccessor(primaryDirection);

  // check if they can collide based on previous location of the dragging space
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

  //if all the conditions doesn't match then we have to determine manually
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
 * This is determined by checking the previous positions of the dragging/moving spaces
 * with the dimension of collidingSpace
 *
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
  // determines direction by comparing if it can collide in all the directions
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
 * Accessors are used to access space's dimension based on direction
 * These are string accessors to get the dimension of the space in a direction
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
 * get Max X coordinate of the the space,
 * MaxX is the maximum a reflowed space can move in the X axis before it should start to resize,
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
 * MaxY is the maximum a reflowed space can move in the Y axis before it should start to resize,
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
 * calculates the reflowed distance i.e, X or Y of the reflowed space
 * this distance indicates the absolute value by which the reflowed space has to move rom it's original position
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
 * returns the reflowed dimension (width or height) of the reflowed space
 * It returns the original dimension if it has not reached the canvas borders
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
export function getReflowedDimension(
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
 * and replace with previous run's movement values if it has already reached the limit
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

/**
 * replace movement of the reflowed space with previous run's movement of the reflowed space
 *
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
 * on Container exit, the exited container and the widgets behind it should reflow in opposite direction,
 * So this method checks if that it the case and sets it in the opposite direction
 *
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
    collidingSpaceMap[spaceId].direction = oppDirection;
  }
}

/**
 * Convert an array of spaces to map of spaces
 *
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
 *
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
 * eg, if the current orientation is horizontal, then the occupiedSpacesMap's top and bottom positions are modified
 * to match previously reflowed values
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
 * Modifies a single CollidingSpace to previous opposite orientation run's position only in a particular orientation
 * eg, if the current orientation is horizontal, then the collidingSpace's top and bottom positions are modified
 * to match previously reflowed values
 *
 * @param collidingSpace
 * @param OGOccupiedSpacesMap
 * @param prevMovementMap
 * @param isHorizontal
 * @param gridProps
 * @param directionMax
 * @param directionMin
 * @returns modified collidingSpace positions
 */
export function getModifiedCollidingSpace(
  collidingSpace: CollidingSpace,
  OGOccupiedSpacesMap: SpaceMap,
  prevMovementMap: ReflowedSpaceMap | undefined,
  isHorizontal: boolean,
  gridProps: GridProps,
  directionMax: SpaceAttributes,
  directionMin: SpaceAttributes,
) {
  if (!prevMovementMap) return { ...collidingSpace };

  const displaceMentAccessor = isHorizontal ? "Y" : "X";
  const dimensionAccessor = isHorizontal ? "height" : "width";
  const gridGap = isHorizontal
    ? gridProps.parentRowSpace
    : gridProps.parentColumnSpace;

  const spaceId = collidingSpace.id;
  const OGCollidingSpacePosition = OGOccupiedSpacesMap[spaceId];

  const movement =
    (prevMovementMap[spaceId] &&
      prevMovementMap[spaceId][displaceMentAccessor]) ||
    0;
  const dimension =
    prevMovementMap[spaceId] && prevMovementMap[spaceId][dimensionAccessor];
  const currentCollidingSpace = {
    ...collidingSpace,
    [directionMin]:
      OGCollidingSpacePosition[directionMin] + Math.round(movement / gridGap),
    [directionMax]: dimension
      ? OGCollidingSpacePosition[directionMin] +
        Math.round((movement + dimension) / gridGap)
      : OGCollidingSpacePosition[directionMax] + Math.round(movement / gridGap),
  };

  return currentCollidingSpace;
}

/**
 * Check if the new CollidingSpaces are colliding with the new Space positions,
 * if so it is to be added to the Collision map of that new Space position's colliding map
 *
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
  globalProcessedNodes: CollisionTreeCache,
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
    if (areOverlapping(newSpacePosition, collidingSpace)) {
      //If it is already colliding directly with a moving/Dragging space then no need to check
      if (
        collidingSpaceMap[collidingSpace.id] &&
        collidingSpaceMap[collidingSpace.id].collidingId === newSpacePosition.id
      )
        continue;

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

      //if this is being run for the second orientation, no matter what direction is predicted,
      //it has to collide in the passed direction
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

      if (
        currentDirection === direction &&
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
  return stopCollisionCheck;
}

/**
 * If exact same spaces collide with each other again in the current run and previous run
 * calculate the direction they collide in
 *
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
  const prevCollisionSpace = prevCollisionMap.children[collidingSpace.id];
  const reflowedSpacePosition = {
    ...staticSpace,
    [accessor.oppositeDirection]: staticSpace.collidingValue,
  };

  // If it previously as well collided in the current direction, then add to the Colliding spaces List
  if (prevCollisionSpace.direction === direction) {
    return { shouldAddToArray: true };
  } //if it is previously collided in the same orientation but current colliding value is lesser the dont add
  else if (
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
  } //if it is previously collided in the same orientation but current colliding value is greater then add in the previous direction
  else if (prevCollisionSpace.isHorizontal === accessor.isHorizontal) {
    return {
      shouldAddToArray: true,
      changedDirection: prevCollisionSpace.direction,
      collidingValue: staticSpace.collidingValue,
      isHorizontal: prevCollisionSpace.isHorizontal,
    };
  } else if (!areOverlapping(reflowedSpacePosition, collidingSpace)) {
    return { shouldAddToArray: false };
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
 * eg, if primary orientation is horizontal the,
 * primary max is bottom, min is top and
 * secondary max is right, min is left
 *
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

  if (!collidingSpaces.length) return [];

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

/**
 * Returns the bottom most row among all the widget
 * @param newPositions
 * @returns number, the bottom most row
 */
export function getBottomMostRow(newPositions: OccupiedSpace[]): number {
  let maxBottomRow = 0;
  for (const newPosition of newPositions) {
    maxBottomRow = Math.max(maxBottomRow, newPosition.bottom);
  }
  return maxBottomRow;
}

/**
 * Returns a boolean to indicate if the colliding Space is to be processed if it is already processed once
 *
 * @param collidingSpace
 * @param globalProcessedNodes
 * @returns boolean, if true will process the colliding Space while generating a Tree.
 */
export function checkProcessNodeForTree(
  collidingSpace: CollidingSpace,
  globalProcessedNodes: CollisionTreeCache,
) {
  if (!globalProcessedNodes[collidingSpace.id])
    return { shouldProcessNode: true };

  const direction = collidingSpace.direction;
  const oppositeDirection = getOppositeDirection(direction);

  // If the current node is already processed in the opposite direction the return false
  if (!isUndefined(globalProcessedNodes[collidingSpace.id][oppositeDirection]))
    return { shouldProcessNode: false };

  const { directionIndicator } = getAccessor(direction);

  // if the current node is not processed return true or if it is processed but
  // the current colliding value is greater than previous' return true
  if (
    isUndefined(
      globalProcessedNodes[collidingSpace.id][collidingSpace.direction],
    ) ||
    compareNumbers(
      collidingSpace.collidingValue,
      globalProcessedNodes[collidingSpace.id][direction].value,
      directionIndicator > 0,
    )
  )
    return { shouldProcessNode: true };

  //if collision values are equal, return the cached values to be used in calculation
  const {
    childNode,
    currentEmptySpaces,
    depth,
    occupiedSpace,
    value,
  } = globalProcessedNodes[collidingSpace.id][direction];
  if (collidingSpace.collidingValue === value)
    return {
      shouldProcessNode: false,
      currentChildNode: childNode,
      depth,
      occupiedSpace,
      currentEmptySpaces,
    };

  return {
    shouldProcessNode: false,
  };
}

/**
 * This is to get the colliding value relative to the edge of the canvas.
 * eg, If a widget is colliding with another, near the ege of the canvas.
 * After the point where the widget resizes full and can'yt move or resize, then the colliding value also should not increase
 *
 * @param depth
 * @param accessors
 * @param collidingValue
 * @param direction
 * @param gridProps
 * @returns number, colliding value to the edge of canvas
 */
export function getRelativeCollidingValue(
  accessors: CollisionAccessors,
  collidingValue: number,
  direction: ReflowDirection,
  { maxGridColumns }: GridProps,
  depth?: number,
): number {
  if (direction === ReflowDirection.BOTTOM || !depth) return collidingValue;

  let calculatedCollidingValue =
    (accessors.isHorizontal ? HORIZONTAL_RESIZE_LIMIT : VERTICAL_RESIZE_LIMIT) *
    depth;

  if (direction === ReflowDirection.RIGHT)
    calculatedCollidingValue = maxGridColumns - calculatedCollidingValue;

  // return the maximum or minimum based on the direction
  return Math[accessors.mathComparator](
    calculatedCollidingValue,
    collidingValue,
  );
}
