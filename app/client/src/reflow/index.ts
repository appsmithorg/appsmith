import { OccupiedSpace } from "constants/CanvasEditorConstants";
import _ from "lodash";
import { getMovementMap } from "./reflowHelpers";
import {
  CollidingSpaceMap,
  GridProps,
  ReflowDirection,
  ReflowedSpaceMap,
  SpaceAttributes,
  SpaceMap,
} from "./reflowTypes";
import {
  changeExitContainerDirection,
  compareNumbers,
  filterCommonSpaces,
  flattenArrayToCollisionMap,
  getAccessor,
  getCollidingSpaces,
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
  prevCollidingSpaces: CollidingSpaceMap = { horizontal: {}, vertical: {} },
  prevMovementMap?: ReflowedSpaceMap,
) {
  const newPositionsMap = getSpacesMapFromArray(newPositionsArray);
  const OGPositionsMap = getSpacesMapFromArray(OGPositionsArray);
  const OccupiedSpacesMap = getSpacesMapFromArray(occupiedSpacesArray);
  const prevSpacesMap = getSpacesMapFromArray(prevSpacesArray);

  const [primaryDirection, secondaryDirection] = getCalculatedDirection(
    newPositionsMap,
    prevSpacesMap,
    direction,
  );

  let currentDirection = forceDirection ? direction : primaryDirection;
  if (!OGPositionsArray || direction === ReflowDirection.UNSET) {
    return {
      movementMap: prevMovementMap,
      movementLimit: {
        canHorizontalMove: true,
        canVerticalMove: true,
      },
    };
  }
  const {
    direction: directionAccessor,
    isHorizontal,
    parallelMax,
    parallelMin,
    perpendicularMax,
    perpendicularMin,
  } = getAccessor(currentDirection);
  filterCommonSpaces(newPositionsMap, OccupiedSpacesMap);
  const globalMovementMap: ReflowedSpaceMap = {};
  const globalCollidingSpaces: CollidingSpaceMap = {
    horizontal: {},
    vertical: {},
  };
  const spaceChanges = {
    first: { max: perpendicularMax, min: perpendicularMin },
    second: { max: parallelMax, min: parallelMin },
  };
  const orientation: {
    first: "horizontal" | "vertical";
    second: "horizontal" | "vertical";
  } = isHorizontal
    ? { first: "horizontal", second: "vertical" }
    : { first: "vertical", second: "horizontal" };
  // First Time
  let directionalOccupiedSpacesMap = getModifiedOccupiedSpacesMap(
    OccupiedSpacesMap,
    prevMovementMap,
    isHorizontal,
    gridProps,
    spaceChanges.first.max,
    spaceChanges.first.min,
  );
  let filteredOccupiedSpaces = Object.values(directionalOccupiedSpacesMap);
  let newSpacesArray = newPositionsArray
    .sort((a, b) => {
      return a[directionAccessor] - b[directionAccessor];
    })
    .map((a) => {
      return { ...a, order: true };
    });
  filteredOccupiedSpaces.sort((a, b) => {
    return a[directionAccessor] - b[directionAccessor];
  });
  const firstPrevCollisionMap =
    (prevCollidingSpaces && prevCollidingSpaces[orientation.first]) || {};
  const { collidingSpaceMap, isColliding } = getCollidingSpaces(
    newSpacesArray,
    currentDirection,
    filteredOccupiedSpaces,
    prevCollidingSpaces,
    isHorizontal,
    prevSpacesMap,
    forceDirection,
  );

  const collidingSpacesArray = Object.values(collidingSpaceMap).filter(
    (a) => a.isHorizontal === isHorizontal,
  );
  let firstMovementMap: ReflowedSpaceMap = {};
  if (collidingSpacesArray.length) {
    collidingSpacesArray.sort((a, b) => {
      const collisionKeyA = a.id,
        collisionKeyB = b.id;
      if (prevCollidingSpaces) {
        if (
          firstPrevCollisionMap[collisionKeyA] &&
          firstPrevCollisionMap[collisionKeyB]
        ) {
          return (
            firstPrevCollisionMap[collisionKeyA].order -
            firstPrevCollisionMap[collisionKeyB].order
          );
        } else if (firstPrevCollisionMap[collisionKeyA]) return -1;
        else if (firstPrevCollisionMap[collisionKeyB]) return 1;
      }

      return a.order - b.order;
    });

    changeExitContainerDirection(
      collidingSpaceMap,
      immediateExitContainer,
      currentDirection,
    );

    const tempId = newSpacesArray[0].id;
    const delta = getDelta(
      OGPositionsMap[tempId],
      newPositionsMap[tempId],
      currentDirection,
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

    globalCollidingSpaces[orientation.first] = flattenArrayToCollisionMap(
      collidingSpacesArray,
    );
    firstMovementMap = { ...movementMap };
  }

  //once more from the top
  if (!forceDirection && secondaryDirection)
    currentDirection = secondaryDirection;
  const secondPrevCollisionMap =
    (prevCollidingSpaces && prevCollidingSpaces[orientation.second]) || {};
  directionalOccupiedSpacesMap = getModifiedOccupiedSpacesMap(
    OccupiedSpacesMap,
    firstMovementMap,
    !isHorizontal,
    gridProps,
    spaceChanges.second.max,
    spaceChanges.second.min,
  );
  filteredOccupiedSpaces = Object.values(directionalOccupiedSpacesMap);
  newSpacesArray = newPositionsArray
    .sort((a, b) => {
      return a[directionAccessor] - b[directionAccessor];
    })
    .map((a) => {
      return { ...a, order: true };
    });
  filteredOccupiedSpaces.sort((a, b) => {
    return a[directionAccessor] - b[directionAccessor];
  });

  const {
    collidingSpaceMap: secondCollidingSpaceMap,
    isColliding: secondIsColliding,
  } = getCollidingSpaces(
    newSpacesArray,
    currentDirection,
    filteredOccupiedSpaces,
    prevCollidingSpaces,
    !isHorizontal,
    prevSpacesMap,
    forceDirection,
    flattenArrayToCollisionMap(collidingSpacesArray),
  );

  const secondCollidingSpacesArray = Object.values(
    secondCollidingSpaceMap,
  ).filter((a) => a.isHorizontal === !isHorizontal);
  let secondMovementMap: ReflowedSpaceMap = {};
  if (secondCollidingSpacesArray.length) {
    secondCollidingSpacesArray.sort((a, b) => {
      const collisionKeyA = a.id,
        collisionKeyB = b.id;
      if (prevCollidingSpaces) {
        if (
          secondPrevCollisionMap[collisionKeyA] &&
          secondPrevCollisionMap[collisionKeyB]
        ) {
          return (
            secondPrevCollisionMap[collisionKeyA].order -
            secondPrevCollisionMap[collisionKeyB].order
          );
        } else if (secondPrevCollisionMap[collisionKeyA]) return -1;
        else if (secondPrevCollisionMap[collisionKeyB]) return 1;
      }

      return a.order - b.order;
    });
    changeExitContainerDirection(
      collidingSpaceMap,
      immediateExitContainer,
      currentDirection,
    );

    const tempId = newSpacesArray[0].id;
    const delta = getDelta(
      OGPositionsMap[tempId],
      newPositionsMap[tempId],
      currentDirection,
    );

    const { movementMap } = getMovementMap(
      filteredOccupiedSpaces,
      secondCollidingSpacesArray,
      secondCollidingSpaceMap,
      gridProps,
      delta,
      shouldResize,
      newSpacesArray,
      currentDirection,
      prevCollidingSpaces,
      prevSpacesMap,
    );
    secondMovementMap = { ...movementMap };
    globalCollidingSpaces[orientation.second] = flattenArrayToCollisionMap(
      secondCollidingSpacesArray,
    );
  }

  if (!isColliding && !secondIsColliding) {
    return {
      movementLimit: {
        canHorizontalMove: true,
        canVerticalMove: true,
      },
    };
  }

  const firstKeys = Object.keys(firstMovementMap || {});
  const secondKeys = Object.keys(secondMovementMap || {});
  const reflowedKeys = _.uniq([...firstKeys, ...secondKeys]);

  for (const key of reflowedKeys) {
    globalMovementMap[key] = {
      ...firstMovementMap[key],
      ...secondMovementMap[key],
    };
  }

  const movementLimit = { canVerticalMove: true, canHorizontalMove: true }; //getShouldReflow(newPositionsMovement, delta);

  //eslint-disable-next-line
  console.log(
    "reflow Post",
    _.cloneDeep({
      direction: [primaryDirection, secondaryDirection, direction],
      collidingSpaceMap: globalCollidingSpaces,
    }),
  );
  return {
    movementLimit,
    movementMap: globalMovementMap,
    collidingSpaceMap: globalCollidingSpaces,
  };
}

function getCalculatedDirection(
  newSpacesMap: SpaceMap,
  prevSpacesMap: SpaceMap,
  passedDirection: ReflowDirection,
) {
  if (passedDirection.indexOf("|") >= 0) return [passedDirection];
  for (const key in newSpacesMap) {
    if (newSpacesMap[key] && prevSpacesMap[key]) {
      const { left: newLeft, top: newTop } = newSpacesMap[key];
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

function getModifiedOccupiedSpacesMap(
  occupiedSpacesMap: SpaceMap,
  prevMovementMap: ReflowedSpaceMap | undefined,
  isHorizontal: boolean,
  gridProps: GridProps,
  directionMax: SpaceAttributes,
  directionMin: SpaceAttributes,
) {
  if (!prevMovementMap) return _.cloneDeep(occupiedSpacesMap);

  const spaceKeys = Object.keys(occupiedSpacesMap);
  const directionalOccupiedSpacesMap: SpaceMap = {};
  const displaceMentAccessor = isHorizontal ? "Y" : "X";
  const gridGap = isHorizontal
    ? gridProps.parentRowSpace
    : gridProps.parentColumnSpace;

  for (const key of spaceKeys) {
    const movement =
      (prevMovementMap[key] && prevMovementMap[key][displaceMentAccessor]) || 0;
    const currentSpace = occupiedSpacesMap[key];
    directionalOccupiedSpacesMap[key] = {
      ...currentSpace,
      [directionMax]:
        currentSpace[directionMax] + Math.round(movement / gridGap),
      [directionMin]:
        currentSpace[directionMin] + Math.round(movement / gridGap),
    };
  }
  return directionalOccupiedSpacesMap;
}
