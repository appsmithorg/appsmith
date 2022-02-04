import { OccupiedSpace } from "constants/CanvasEditorConstants";
import _ from "lodash";
import { getMovementMap } from "./reflowHelpers";
import {
  CollidingSpaceMap,
  GridProps,
  ReflowDirection,
  SpaceMap,
} from "./reflowTypes";
import {
  changeExitContainerDirection,
  compareNumbers,
  filterCommonSpaces,
  flattenArrayToCollidingSpaceMap,
  getAccessor,
  getCollidingSpaces,
  getCollisionKey,
  getDelta,
  getSpacesMapFromArray,
} from "./reflowUtils";

/**
 * Reflow method that returns the displacement metrics of all other colliding spaces
 *
 * @param newPositions new/current positions of the space/block
 * @param OGPositions original positions of the space before movement
 * @param occupiedSpaces array of all the occupied spaces on the canvas
 * @param direction direction of movement of the moving space
 * @param gridProps properties of the canvas's grid
 * @param forceDirection boolean to force the direction on certain scenarios
 * @param shouldResize boolean to indicate if colliding spaces should resize
 * @param immediateExitContainer boolean to indicate if the space exited a nested canvas
 * @param prevPositions last known position of the space
 * @param prevCollidingSpaces last known colliding spaces of the dragging/resizing space
 * @returns movement information of the dragging/resizing space and other colliding spaces
 */
export function reflow(
  newPositionsArray: OccupiedSpace[],
  OGPositionsArray: OccupiedSpace[],
  occupiedSpacesArray: OccupiedSpace[],
  direction: ReflowDirection,
  gridProps: GridProps,
  forceDirection = false,
  shouldResize = true,
  immediateExitContainer?: string,
  prevSpacesArray?: OccupiedSpace[],
  prevCollidingSpaces?: CollidingSpaceMap,
) {
  const newPositionsMap = getSpacesMapFromArray(newPositionsArray);
  const OGPositionsMap = getSpacesMapFromArray(OGPositionsArray);
  const OccupiedSpacesMap = getSpacesMapFromArray(occupiedSpacesArray);
  const prevSpacesMap = getSpacesMapFromArray(prevSpacesArray);

  const currentDirection = getCalculatedDirection(
    newPositionsMap,
    prevSpacesMap,
    direction,
  );

  const { direction: directionAccessor, isHorizontal } = getAccessor(
    currentDirection,
  );

  filterCommonSpaces(newPositionsMap, OccupiedSpacesMap);

  const filteredOccupiedSpaces = Object.values(OccupiedSpacesMap);

  const newSpacesArray = newPositionsArray
    .sort((a, b) => {
      return a[directionAccessor] - b[directionAccessor];
    })
    .map((a) => {
      return { ...a, order: true };
    });
  filteredOccupiedSpaces.sort((a, b) => {
    return a[directionAccessor] - b[directionAccessor];
  });

  const { collidingSpaceMap, isColliding } = getCollidingSpaces(
    newSpacesArray,
    direction,
    filteredOccupiedSpaces,
    isHorizontal,
    prevSpacesMap,
    prevCollidingSpaces,
    forceDirection,
  );

  const collidingSpacesArray = Object.values(collidingSpaceMap);
  collidingSpacesArray.sort((a, b) => {
    const collisionKeyA = getCollisionKey(a.collidingId, a.id);
    const collisionKeyB = getCollisionKey(b.collidingId, b.id);

    if (prevCollidingSpaces) {
      if (
        prevCollidingSpaces[collisionKeyA] &&
        prevCollidingSpaces[collisionKeyB]
      ) {
        return (
          prevCollidingSpaces[collisionKeyA].order -
          prevCollidingSpaces[collisionKeyB].order
        );
      } else if (prevCollidingSpaces[collisionKeyA]) return -1;
      else if (prevCollidingSpaces[collisionKeyB]) return 1;
    }

    return a.order - b.order;
  });

  if (
    !isColliding ||
    !OGPositionsArray ||
    direction === ReflowDirection.UNSET
  ) {
    return {
      movementLimit: {
        canHorizontalMove: true,
        canVerticalMove: true,
      },
    };
  }

  changeExitContainerDirection(
    collidingSpaceMap,
    immediateExitContainer,
    direction,
  );

  const tempId = newSpacesArray[0].id;
  const delta = getDelta(
    OGPositionsMap[tempId],
    newPositionsMap[tempId],
    direction,
  );

  const { movementMap } = getMovementMap(
    filteredOccupiedSpaces,
    collidingSpacesArray,
    collidingSpaceMap,
    gridProps,
    delta,
    shouldResize,
    newSpacesArray,
    currentDirection,
    prevCollidingSpaces,
    prevSpacesMap,
  );

  const movementLimit = { canVerticalMove: true, canHorizontalMove: true }; //getShouldReflow(newPositionsMovement, delta);

  //eslint-disable-next-line
  console.log(
    "reflow Post",
    _.cloneDeep({
      currentDirection,
      collidingSpaceMap: flattenArrayToCollidingSpaceMap(collidingSpacesArray),
    }),
  );
  return {
    movementLimit,
    movementMap,
    collidingSpaceMap: flattenArrayToCollidingSpaceMap(collidingSpacesArray),
  };
}

function getCalculatedDirection(
  newSpacesMap: SpaceMap,
  prevSpacesMap: SpaceMap,
  passedDirection: ReflowDirection,
) {
  for (const key in newSpacesMap) {
    if (newSpacesMap[key] && prevSpacesMap[key]) {
      const { left: newLeft, top: newTop } = newSpacesMap[key];
      const { left: prevLeft, top: prevTop } = prevSpacesMap[key];

      if (newTop !== prevTop)
        return compareNumbers(newTop, prevTop, true)
          ? ReflowDirection.BOTTOM
          : ReflowDirection.TOP;
      if (newLeft !== prevLeft)
        return compareNumbers(newLeft, prevLeft, true)
          ? ReflowDirection.RIGHT
          : ReflowDirection.LEFT;

      return passedDirection;
    }
  }
  return passedDirection;
}
