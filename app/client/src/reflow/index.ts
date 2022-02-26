import { OccupiedSpace } from "constants/CanvasEditorConstants";
import _ from "lodash";
import { getMovementMap } from "./reflowHelpers";
import {
  CollidingSpaceMap,
  CollisionMap,
  GridProps,
  MovementLimitMap,
  OrientationAccessors,
  PrevReflowState,
  ReflowDirection,
  ReflowedSpaceMap,
  SecondOrderCollisionMap,
  SpaceAttributes,
  SpaceMap,
} from "./reflowTypes";
import {
  changeExitContainerDirection,
  filterCommonSpaces,
  buildArrayToCollisionMap,
  getAccessor,
  getCollidingSpaceMap,
  getDelta,
  getMaxSpaceAttributes,
  getModifiedOccupiedSpacesMap,
  getOrientationAccessors,
  getShouldReflow,
  getSpacesMapFromArray,
  getSortedOccupiedSpaces,
  getSortedNewPositions,
  getSortedCollidingSpaces,
  getCalculatedDirection,
  getOrientationAccessor,
} from "./reflowUtils";

/**
 * Reflow method that returns the displacement metrics of all other colliding spaces
 *
 * @param newSpacePositions new/current positions array of the space/block
 * @param OGSpacePositions original positions array of the space before movement
 * @param occupiedSpaces array of all the occupied spaces on the canvas
 * @param direction direction of movement of the moving space
 * @param gridProps properties of the canvas's grid
 * @param forceDirection boolean to force the direction on certain scenarios
 * @param shouldResize boolean to indicate if colliding spaces should resize
 * @param prevReflowState this contains a map of reference to the key values of previous reflow method call to back trace widget movements
 * @param exitContainerId sting, Id of recent exit container
 * @returns movement information of the dragging/resizing space and other colliding spaces
 */
export function reflow(
  newSpacePositions: OccupiedSpace[],
  OGSpacePositions: OccupiedSpace[],
  occupiedSpaces: OccupiedSpace[],
  direction: ReflowDirection,
  gridProps: GridProps,
  forceDirection = false,
  shouldResize = true,
  prevReflowState: PrevReflowState = {} as PrevReflowState,
  exitContainerId?: string,
) {
  const newSpacePositionsMap = getSpacesMapFromArray(newSpacePositions);
  const OGSpacePositionsMap = getSpacesMapFromArray(OGSpacePositions);
  const occupiedSpacesMap = getSpacesMapFromArray(occupiedSpaces);

  const [primaryDirection, secondaryDirection] = getCalculatedDirection(
    newSpacePositionsMap,
    prevReflowState.prevSpacesMap,
    direction,
  );

  const movementLimitMap: MovementLimitMap = {};
  const globalCollidingSpaces: CollidingSpaceMap = {
    horizontal: {},
    vertical: {},
  };

  if (!OGSpacePositionsMap || direction === ReflowDirection.UNSET) {
    return {
      movementMap: prevReflowState.prevMovementMap,
      movementLimit: {
        canHorizontalMove: true,
        canVerticalMove: true,
      },
    };
  }

  let currentDirection = forceDirection ? direction : primaryDirection;

  const currentAccessor = getAccessor(currentDirection);
  const { isHorizontal } = currentAccessor;

  //filter out the newSpacePositions from the occupiedSpacesMap
  filterCommonSpaces(newSpacePositionsMap, occupiedSpacesMap);

  const maxSpaceAttributes = getMaxSpaceAttributes(currentAccessor);

  const orientation: OrientationAccessors = getOrientationAccessors(
    isHorizontal,
  );

  const delta = getDelta(newSpacePositionsMap, OGSpacePositionsMap, direction);

  //Reflow in the current orientation
  const {
    collidingSpaces: primaryCollidingSpaces,
    isColliding: primaryIsColliding,
    movementMap: primaryMovementMap,
    movementVariablesMap: primaryMovementVariablesMap,
    secondOrderCollisionMap: primarySecondOrderCollisionMap,
  } = getOrientationalMovementInfo(
    newSpacePositionsMap,
    occupiedSpacesMap,
    currentDirection,
    isHorizontal,
    gridProps,
    delta,
    shouldResize,
    forceDirection,
    exitContainerId,
    maxSpaceAttributes.primary,
    prevReflowState,
  );

  globalCollidingSpaces[orientation.primary] = buildArrayToCollisionMap(
    primaryCollidingSpaces,
  );
  getShouldReflow(movementLimitMap, primaryMovementVariablesMap, delta);

  //Reflow in the opposite orientation
  if (!forceDirection && secondaryDirection)
    currentDirection = secondaryDirection;
  const {
    collidingSpaces: secondaryCollidingSpaces,
    isColliding: secondaryIsColliding,
    movementMap,
    movementVariablesMap: secondaryMovementVariablesMap,
    secondOrderCollisionMap,
  } = getOrientationalMovementInfo(
    newSpacePositionsMap,
    occupiedSpacesMap,
    currentDirection,
    !isHorizontal,
    gridProps,
    delta,
    shouldResize,
    forceDirection,
    exitContainerId,
    maxSpaceAttributes.secondary,
    prevReflowState,
    primaryMovementMap || {},
    globalCollidingSpaces[orientation.primary],
    primarySecondOrderCollisionMap,
  );

  if (secondaryIsColliding) {
    globalCollidingSpaces[orientation.secondary] = buildArrayToCollisionMap(
      secondaryCollidingSpaces,
    );
    getShouldReflow(movementLimitMap, secondaryMovementVariablesMap, delta);
  }

  if (!primaryIsColliding && !secondaryIsColliding) {
    return {
      movementLimit: {
        canHorizontalMove: true,
        canVerticalMove: true,
      },
    };
  }

  return {
    movementLimitMap,
    movementMap: movementMap || primaryMovementMap,
    collidingSpaceMap: globalCollidingSpaces,
    secondOrderCollisionMap:
      secondOrderCollisionMap || primarySecondOrderCollisionMap,
  };
}

/**
 * Reflow method that returns the movement variables in a particular orientation, like "horizontal" or "vertical"
 *
 * @param newSpacePositionsMap new/current positions map of the space/block
 * @param occupiedSpacesMap all the occupied spaces map on the canvas
 * @param direction direction of movement of the moving space
 * @param isHorizontal boolean to indicate if the orientation is horizontal
 * @param gridProps properties of the canvas's grid
 * @param delta X and Y distance from original positions
 * @param shouldResize boolean to indicate if colliding spaces should resize
 * @param forceDirection boolean to force the direction on certain scenarios
 * @param exitContainerId string, Id of recent exit container
 * @param maxSpaceAttributes object containing accessors for maximum and minimum dimensions in a particular direction
 * @param prevReflowState this contains a map of reference to the key values of previous reflow method call to back trace widget movements
 * @param primaryMovementMap movement map/information from previous run of the algorithm
 * @param primaryCollisionMap direct collision spaces map on the previous run of the algorithm
 * @returns movement information of the dragging/resizing space and other colliding spaces
 */
function getOrientationalMovementInfo(
  newSpacePositionsMap: SpaceMap,
  occupiedSpacesMap: SpaceMap,
  direction: ReflowDirection,
  isHorizontal: boolean,
  gridProps: GridProps,
  delta = { X: 0, Y: 0 },
  shouldResize: boolean,
  forceDirection: boolean,
  exitContainerId: string | undefined,
  maxSpaceAttributes: { max: SpaceAttributes; min: SpaceAttributes },
  prevReflowState: PrevReflowState,
  primaryMovementMap?: ReflowedSpaceMap,
  primaryCollisionMap?: CollisionMap,
  primarySecondOrderCollisionMap?: SecondOrderCollisionMap,
) {
  const {
    prevCollidingSpaceMap,
    prevMovementMap,
    prevSpacesMap,
  } = prevReflowState;
  const accessors = getAccessor(direction);
  const orientationAccessor = getOrientationAccessor(isHorizontal);

  const orientationOccupiedSpacesMap = getModifiedOccupiedSpacesMap(
    occupiedSpacesMap,
    primaryMovementMap || prevMovementMap,
    isHorizontal,
    gridProps,
    maxSpaceAttributes.max,
    maxSpaceAttributes.min,
  );

  const sortedOccupiedSpaces = getSortedOccupiedSpaces(
    orientationOccupiedSpacesMap,
    accessors,
  );
  const newSpacePositions = getSortedNewPositions(
    newSpacePositionsMap,
    accessors,
  );
  const prevCollisionMap =
    (prevCollidingSpaceMap && prevCollidingSpaceMap[orientationAccessor]) || {};

  const { collidingSpaceMap, isColliding } = getCollidingSpaceMap(
    newSpacePositions,
    sortedOccupiedSpaces,
    direction,
    prevCollidingSpaceMap,
    isHorizontal,
    prevSpacesMap,
    forceDirection,
    primaryCollisionMap,
  );

  const collidingSpaces = getSortedCollidingSpaces(
    collidingSpaceMap,
    isHorizontal,
    prevCollisionMap,
  );

  if (!collidingSpaces || !collidingSpaces.length) return {};

  if (!primaryMovementMap) {
    changeExitContainerDirection(collidingSpaceMap, exitContainerId, direction);
  }
  const {
    movementMap,
    movementVariablesMap,
    secondOrderCollisionMap,
  } = getMovementMap(
    newSpacePositions,
    newSpacePositionsMap,
    sortedOccupiedSpaces,
    orientationOccupiedSpacesMap,
    occupiedSpacesMap,
    collidingSpaces,
    collidingSpaceMap,
    gridProps,
    delta,
    shouldResize,
    direction,
    isHorizontal,
    prevReflowState,
    primaryMovementMap,
    primarySecondOrderCollisionMap,
  );

  return {
    movementMap,
    movementVariablesMap,
    secondOrderCollisionMap,
    isColliding,
    collidingSpaces,
  };
}
