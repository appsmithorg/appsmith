import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { getMovementMap } from "./reflowHelpers";
import { CollidingSpaceMap, GridProps, ReflowDirection } from "./reflowTypes";
import {
  changeExitContainerDirection,
  filterSpaceById,
  getCollidingSpaces,
  getDelta,
  getIsHorizontalMove,
  getShouldReflow,
} from "./reflowUtils";

/**
 * Reflow method that returns the displacement metrics of all other colliding spaces
 *
 * @param newPositions new/current positions of the space/block
 * @param OGPositions original positions of the space before movement
 * @param occupiedSpaces array of all the occupied spaces on the canvas
 * @param direction direction of movement of the moving space
 * @param gridProps properties of the canvas's grid
 * @param forceDirection boolean to force the direction on certain scenarioes
 * @param shouldResize boolean to indicate if colliding spaces should resize
 * @param immediateExitContainer boolean to indicate if the space exitted a nested canvas
 * @param prevPositions last known position of the space
 * @param prevCollidingSpaces last known colliding spaces of the dragging/resising space
 * @returns movement information of the dragging/resizing space and other colliding spaces
 */
export function reflow(
  newPositions: OccupiedSpace,
  OGPositions: OccupiedSpace,
  occupiedSpaces: OccupiedSpace[],
  direction: ReflowDirection,
  gridProps: GridProps,
  forceDirection = false,
  shouldResize = true,
  immediateExitContainer?: string,
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
    forceDirection,
  );

  if (!isColliding || !OGPositions || direction === ReflowDirection.UNSET) {
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

  const delta = getDelta(OGPositions, newPositions, direction);

  const { movementMap, newPositionsMovement } = getMovementMap(
    filteredOccupiedSpace,
    newPositions,
    collidingSpaceMap,
    gridProps,
    delta,
    shouldResize,
  );

  const movementLimit = getShouldReflow(newPositionsMovement, delta);

  return {
    movementLimit,
    movementMap,
    newPositionsMovement,
    collidingSpaceMap,
  };
}
