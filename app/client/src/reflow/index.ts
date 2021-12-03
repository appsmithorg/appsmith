import { OccupiedSpace } from "constants/editorConstants";
import { getMovementMap } from "./reflowHelpers";
import { CollidingSpaceMap, GridProps, ReflowDirection } from "./reflowTypes";
import {
  getCollidingSpaces,
  getDelta,
  getIsHorizontalMove,
  getShouldResize,
} from "./reflowUtils";

export function reflow(
  newPositions: OccupiedSpace,
  OGPositions: OccupiedSpace,
  occupiedSpaces: OccupiedSpace[],
  direction: ReflowDirection,
  gridProps: GridProps,
  shouldResize = false,
  prevPositions?: OccupiedSpace,
  prevCollidingSpaces?: CollidingSpaceMap,
) {
  const isHorizontalMove = getIsHorizontalMove(newPositions, prevPositions);

  const { collidingSpaceMap, isColliding } = getCollidingSpaces(
    newPositions,
    direction,
    occupiedSpaces,
    isHorizontalMove,
    prevPositions,
    prevCollidingSpaces,
  );

  if (!isColliding || !OGPositions || direction === ReflowDirection.UNSET) {
    return {
      movementLimit: {
        canHorizontalMove: true,
        canVerticalMove: true,
      },
    };
  }

  const delta = getDelta(OGPositions, newPositions, direction);

  const { movementMap, newPositionsMovement } = getMovementMap(
    occupiedSpaces,
    newPositions,
    collidingSpaceMap,
    gridProps,
    delta,
    shouldResize,
  );

  const movementLimit = getShouldResize(newPositionsMovement, delta);

  return {
    movementLimit,
    movementMap,
    newPositionsMovement,
    collidingSpaceMap,
  };
}
