import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { getMovementMap } from "./reflowHelpers";
import { CollidingSpaceMap, GridProps, ReflowDirection } from "./reflowTypes";
import {
  changeExitContainerDirection,
  filterCommonSpaces,
  flattenCollidingMapToArray,
  getCollidingSpaces,
  getDelta,
  getIsHorizontalMove,
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

  const isHorizontalMove = getIsHorizontalMove(
    newPositionsArray,
    prevSpacesArray,
  );
  filterCommonSpaces(newPositionsMap, OccupiedSpacesMap);
  const filteredOccupiedSpace = Object.values(OccupiedSpacesMap);
  const { collidingSpaceMap, isColliding } = getCollidingSpaces(
    newPositionsArray,
    direction,
    filteredOccupiedSpace,
    isHorizontalMove,
    prevSpacesMap,
    prevCollidingSpaces,
    forceDirection,
  );

  const collidingSpacesArray = flattenCollidingMapToArray(collidingSpaceMap);
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

  const tempId = newPositionsArray[0].id;
  const delta = getDelta(
    OGPositionsMap[tempId],
    newPositionsMap[tempId],
    direction,
  );

  const { movementMap } = getMovementMap(
    filteredOccupiedSpace,
    collidingSpacesArray,
    collidingSpaceMap,
    gridProps,
    delta,
    shouldResize,
  );

  const movementLimit = { canVerticalMove: true, canHorizontalMove: true }; //getShouldReflow(newPositionsMovement, delta);

  return {
    movementLimit,
    movementMap,
    collidingSpaceMap,
  };
}
