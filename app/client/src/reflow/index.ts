import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { getMovementMap } from "./reflowHelpers";
import { CollidingSpaceMap, GridProps, ReflowDirection } from "./reflowTypes";
import {
  filterSpaceById,
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
  const filteredOccupiedSpace = filterSpaceById(
    newPositions.id,
    occupiedSpaces,
  );

  const { collidingSpaceMap, isColliding } = getCollidingSpaces(
    newPositions,
    direction,
    filteredOccupiedSpace,
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
    filteredOccupiedSpace,
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
