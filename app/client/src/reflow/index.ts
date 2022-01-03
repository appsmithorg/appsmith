import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { cloneDeep } from "lodash";
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
  const consolelog = cloneDeep({
    newPositions,
    OGPositions,
    occupiedSpaces,
    direction,
    gridProps,
    forceDirection,
    shouldResize,
    immediateExitContainer,
    prevPositions,
    prevCollidingSpaces,
  });

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
  //eslint-disable-next-line
  console.log("reflow input", consolelog);

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
