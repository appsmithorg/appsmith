import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { GridDefaults } from "constants/WidgetConstants";
import _ from "lodash";
import { isEmpty } from "lodash";
import {
  CollidingSpace,
  CollidingSpaceMap,
  CollisionAccessors,
  CollisionMap,
  CollisionTree,
  Delta,
  DirectionalMovement,
  GridProps,
  HORIZONTAL_RESIZE_LIMIT,
  ReflowDirection,
  ReflowedSpaceMap,
  SecondaryCollisionMap,
  SpaceMap,
  SpaceMovementMap,
  VERTICAL_RESIZE_LIMIT,
} from "./reflowTypes";
import {
  filterCommonSpaces,
  flattenArrayToCollisionMap,
  getAccessor,
  getCollidingSpacesInDirection,
  getMaxX,
  getMaxY,
  getModifiedOccupiedSpacesMap,
  getReflowDistance,
  getResizedDimension,
  getResizedDimensions,
  shouldReplaceOldMovement,
  sortCollidingSpacesByDistance,
} from "./reflowUtils";

/**
 * returns movement map of all the cascading colliding spaces
 * @param occupiedSpaces array of all the occupied spaces on the canvas
 * @param newPositions new/current positions of the space/block
 * @param collidingSpaceMap Map of Colliding spaces of the dragging/resizing space
 * @param gridProps properties of the canvas's grid
 * @param delta X and Y coordinate displacement of the newPosition from the original position
 * @param shouldResize boolean to indicate if colliding spaces should resize
 * @returns movement map of all the cascading colliding spaces
 */
export function getMovementMap(
  occupiedSpaces: OccupiedSpace[],
  OccupiedSpacesMap: SpaceMap,
  OGOccupiedSpacesMap: SpaceMap,
  collidingSpaces: CollidingSpace[],
  collidingSpaceMap: CollisionMap,
  secondaryCollisionMap: SecondaryCollisionMap,
  gridProps: GridProps,
  delta = { X: 0, Y: 0 },
  shouldResize = true,
  movingSpacesArray: OccupiedSpace[], //can be named changedSpace
  globalDirection: ReflowDirection,
  globalIsHorizontal: boolean,
  movingSpaceMap: SpaceMap,
  prevCollidingSpaceMap: CollidingSpaceMap,
  prevSpacesMap?: SpaceMap,
  prevMovementMap?: ReflowedSpaceMap,
  prevSecondaryCollisionMap?: SecondaryCollisionMap,
  firstMovementMap?: ReflowedSpaceMap,
) {
  const movementMap: ReflowedSpaceMap = { ...firstMovementMap };
  const collisionTree = getCollisionTree(
    occupiedSpaces,
    OccupiedSpacesMap,
    OGOccupiedSpacesMap,
    collidingSpaces,
    secondaryCollisionMap,
    globalDirection,
    globalIsHorizontal,
    movingSpacesArray,
    collidingSpaceMap,
    prevCollidingSpaceMap,
    gridProps,
    prevSpacesMap,
    prevMovementMap,
    prevSecondaryCollisionMap,
  );

  if (!collisionTree || collisionTree.length <= 0) {
    return {};
  }

  const directionalVariables: {
    [key: string]: {
      [direction: string]: [
        number,
        number,
        CollisionAccessors,
        ReflowDirection,
      ];
    };
  } = {};

  for (let i = 0; i < collisionTree.length; i++) {
    const childNode = collisionTree[i];
    const childDirection = childNode.direction;
    const directionalAccessors = getAccessor(childDirection);
    //eslint-disable-next-line
    //const childCollisionSpace = collidingSpaceMap[childNode.id];

    const distanceBeforeCollision =
      childNode[directionalAccessors.oppositeDirection] -
      childNode.collidingValue;

    const { depth, occupiedSpace } = getMovementMapHelper(
      collisionTree,
      i,
      childNode,
      movementMap,
      delta,
      gridProps,
      directionalAccessors,
      childDirection,
      0,
      childNode[directionalAccessors.direction],
      distanceBeforeCollision,
      shouldResize,
    );

    let staticDepth = 0,
      maxOccupiedSpace = 0;
    if (!directionalVariables[childNode.collidingId])
      directionalVariables[childNode.collidingId] = {};
    if (directionalVariables[childNode.collidingId][childDirection]) {
      [staticDepth, maxOccupiedSpace] = directionalVariables[
        childNode.collidingId
      ][childDirection];
    }
    staticDepth = Math.max(staticDepth, depth);
    maxOccupiedSpace = Math.max(maxOccupiedSpace, occupiedSpace);
    directionalVariables[childNode.collidingId][childDirection] = [
      staticDepth,
      maxOccupiedSpace,
      directionalAccessors,
      childDirection,
    ];
  }
  const movingSpaceIds = Object.keys(directionalVariables);
  const movementVariablesMap: SpaceMovementMap = {};
  for (const movingSpaceId of movingSpaceIds) {
    if (!movingSpaceMap[movingSpaceId]) continue;
    const movementVariables = directionalVariables[movingSpaceId];
    const directionalKeys = Object.keys(movementVariables);
    const directionalMovements: DirectionalMovement[] = [];
    for (const directionKey of directionalKeys) {
      const [
        staticDepth,
        maxOccupiedSpace,
        accessors,
        reflowDirection,
      ] = movementVariables[directionKey];
      const maxMethod = accessors.isHorizontal ? getMaxX : getMaxY;
      const gridDistance = accessors.isHorizontal
        ? gridProps.parentColumnSpace
        : gridProps.parentRowSpace;
      const coordinateKey = accessors.isHorizontal ? "X" : "Y";
      const maxMovement =
        maxMethod(
          movingSpaceMap[movingSpaceId] as CollisionTree,
          gridProps,
          reflowDirection,
          staticDepth,
          maxOccupiedSpace,
          shouldResize,
        ) +
        delta[coordinateKey] +
        accessors.directionIndicator * gridDistance;
      directionalMovements.push({
        maxMovement,
        directionalIndicator: accessors.directionIndicator,
        coordinateKey,
        isHorizontal: accessors.isHorizontal,
      });
    }
    movementVariablesMap[movingSpaceId] = directionalMovements;
  }

  //eslint-disable-next-line
  console.log(
    "Reflow Object",
    _.cloneDeep({
      collidingSpaces,
      collidingSpaceMap,
      collisionTree,
      movementMap,
    }),
  );
  return {
    movementVariablesMap,
    movementMap,
  };
}

/**
 * Recursively create a tree of Space collisions
 * @param occupiedSpaces array of all the occupied spaces on the canvas
 * @param newPositions new/current positions of the space/block
 * @param collidingSpaceMap Map of Colliding spaces of the dragging/resizing space
 * @returns Collisions in a tree structure
 */
function getCollisionTree(
  occupiedSpaces: OccupiedSpace[],
  OccupiedSpacesMap: SpaceMap,
  OGOccupiedSpacesMap: SpaceMap,
  collidingSpaces: CollidingSpace[],
  secondaryCollisionMap: SecondaryCollisionMap,
  globalDirection: ReflowDirection,
  globalIsHorizontal: boolean,
  movingSpacesArray: OccupiedSpace[],
  collidingSpaceMap: CollisionMap,
  prevCollidingSpaceMap: CollidingSpaceMap,
  gridProps: GridProps,
  prevSpacesMap?: SpaceMap,
  prevMovementMap?: ReflowedSpaceMap,
  prevSecondaryCollisionMap?: SecondaryCollisionMap,
) {
  const collisionTree: CollisionTree[] = [];

  const globalCompletedTree: { [key: string]: boolean } = {};
  let oppositeOrientationOccMap;
  for (let i = 0; i < collidingSpaces.length; i++) {
    const collidingSpace = collidingSpaces[i];
    const directionalAccessors = getAccessor(collidingSpace.direction);
    let directionalOccupiedSpaces = occupiedSpaces;
    let directionalOccupiedSpaceMap = OccupiedSpacesMap;
    if (directionalAccessors.isHorizontal !== globalIsHorizontal) {
      if (!oppositeOrientationOccMap)
        oppositeOrientationOccMap = getModifiedOccupiedSpacesMap(
          OGOccupiedSpacesMap,
          prevMovementMap,
          directionalAccessors.isHorizontal,
          gridProps,
          directionalAccessors.parallelMax,
          directionalAccessors.parallelMin,
        );
      directionalOccupiedSpaceMap = { ...oppositeOrientationOccMap };
      filterCommonSpaces(
        { ...globalCompletedTree },
        directionalOccupiedSpaceMap,
      );
      directionalOccupiedSpaces = Object.values(directionalOccupiedSpaceMap);
      directionalOccupiedSpaces.sort((a, b) => {
        return (
          a[directionalAccessors.direction] - b[directionalAccessors.direction]
        );
      });
    }

    if (!globalCompletedTree[collidingSpace.id]) {
      const currentCollisionTree = getCollisionTreeHelper(
        directionalOccupiedSpaces,
        directionalOccupiedSpaceMap,
        OGOccupiedSpacesMap,
        collidingSpace,
        directionalAccessors,
        collidingSpace.direction,
        globalCompletedTree,
        movingSpacesArray,
        collidingSpace.collidingValue,
        globalDirection,
        i,
        collidingSpaces,
        collidingSpaceMap,
        prevCollidingSpaceMap,
        true,
        gridProps,
        prevSpacesMap,
        prevMovementMap,
        secondaryCollisionMap,
        prevSecondaryCollisionMap,
      );

      if (currentCollisionTree) {
        collisionTree.push({
          ...currentCollisionTree,
          collidingValue: collidingSpace.collidingValue,
          collidingId: collidingSpace.collidingId,
        });
      }
    }
  }

  return collisionTree;
}

function getCollisionTreeHelper(
  occupiedSpaces: OccupiedSpace[],
  OccupiedSpacesMap: SpaceMap,
  OGOccupiedSpacesMap: SpaceMap,
  collidingSpace: CollidingSpace,
  accessors: CollisionAccessors,
  direction: ReflowDirection,
  globalProcessedNodes: { [key: string]: boolean },
  movingSpacesArray: OccupiedSpace[],
  prevCollidingValue: number,
  globalDirection: ReflowDirection,
  insertionIndex: number,
  globalCollidingSpaces: CollidingSpace[],
  collidingSpaceMap: CollisionMap,
  prevCollidingSpaceMap: CollidingSpaceMap,
  isSecondaryCollidingWidget: boolean,
  gridProps: GridProps,
  prevSpacesMap?: SpaceMap,
  prevMovementMap?: ReflowedSpaceMap,
  secondaryCollisionMap?: SecondaryCollisionMap,
  prevSecondaryCollisionMap?: SecondaryCollisionMap,
  processedNodes: { [key: string]: boolean } = {},
) {
  if (!collidingSpace) return;
  const collisionTree: CollisionTree = { ...collidingSpace, children: {} };

  const resizedDimensions = getResizedDimensions(collisionTree, accessors);

  const filteredMovingSpaces = movingSpacesArray.filter(
    (a) => a.id !== collidingSpace.collidingId,
    // compareNumbers(
    //   a[accessors.direction],
    //   prevCollidingValue,
    //   accessors.directionIndicator > 0,
    //   true,
    // ) && a.id !== collidingSpace.collidingId,
  );
  const {
    collidingSpaces,
    occupiedSpacesInDirection,
    skipCollisionTree,
  } = getCollidingSpacesInDirection(
    resizedDimensions,
    collidingSpace,
    direction,
    globalDirection,
    filteredMovingSpaces,
    globalCollidingSpaces,
    insertionIndex,
    globalProcessedNodes,
    collidingSpaceMap,
    prevCollidingSpaceMap,
    gridProps,
    prevSpacesMap,
    prevMovementMap,
    prevSecondaryCollisionMap,
    occupiedSpaces,
    isSecondaryCollidingWidget,
  );

  if (isSecondaryCollidingWidget && secondaryCollisionMap) {
    if (!secondaryCollisionMap[collidingSpace.id]) {
      secondaryCollisionMap[collidingSpace.id] = {
        ...OccupiedSpacesMap[collidingSpace.id],
        children: {},
      };
    }
    secondaryCollisionMap[collidingSpace.id].children = {
      ...secondaryCollisionMap[collidingSpace.id].children,
      ...flattenArrayToCollisionMap(collidingSpaces),
    };
  }

  if (skipCollisionTree) return;

  sortCollidingSpacesByDistance(collidingSpaces);

  const currentProcessedNodes: {
    [key: string]: boolean;
  } = {};
  for (const currentCollidingSpace of collidingSpaces) {
    if (!currentProcessedNodes[currentCollidingSpace.id]) {
      const currentDirection = currentCollidingSpace.direction;
      const currentAccessors = getAccessor(currentDirection);
      let currentOccSpaces = occupiedSpacesInDirection;
      let clonedOccSpacesMap = { ...OccupiedSpacesMap };
      let localCollidingSpace = { ...currentCollidingSpace };
      if (currentCollidingSpace.direction !== direction) {
        if (currentAccessors.isHorizontal !== accessors.isHorizontal) {
          clonedOccSpacesMap = getModifiedOccupiedSpacesMap(
            clonedOccSpacesMap,
            prevMovementMap,
            currentAccessors.isHorizontal,
            gridProps,
            currentAccessors.parallelMax,
            currentAccessors.parallelMin,
          );
        }
        localCollidingSpace = {
          ...localCollidingSpace,
          ...clonedOccSpacesMap[currentCollidingSpace.id],
        };
        filterCommonSpaces(
          { ...globalProcessedNodes, ...currentProcessedNodes },
          clonedOccSpacesMap,
        );
        currentOccSpaces = Object.values(OccupiedSpacesMap);
        currentOccSpaces.sort((a, b) => {
          return a[currentAccessors.direction] - b[currentAccessors.direction];
        });
      }
      const currentCollisionTree = getCollisionTreeHelper(
        currentOccSpaces,
        clonedOccSpacesMap,
        OGOccupiedSpacesMap,
        localCollidingSpace,
        currentAccessors,
        currentDirection,
        globalProcessedNodes,
        filteredMovingSpaces,
        resizedDimensions[accessors.direction],
        globalDirection,
        insertionIndex,
        globalCollidingSpaces,
        collidingSpaceMap,
        prevCollidingSpaceMap,
        false,
        gridProps,
        prevSpacesMap,
        prevMovementMap,
        secondaryCollisionMap,
        prevSecondaryCollisionMap,
        currentProcessedNodes,
      );

      currentProcessedNodes[currentCollidingSpace.id] = true;

      if (currentCollisionTree && collisionTree.children) {
        collisionTree.children[currentCollidingSpace.id] = {
          ...currentCollisionTree,
        };
      }
    }
  }

  const currentProcessedNodesKeys = Object.keys(currentProcessedNodes);
  for (const key of currentProcessedNodesKeys) processedNodes[key] = true;
  globalProcessedNodes[collisionTree.id] = true;
  return collisionTree;
}

function getMovementMapHelper(
  globalCollisionTreeArray: CollisionTree[],
  index: number,
  collisionTree: CollisionTree,
  movementMap: ReflowedSpaceMap,
  dimensions = { X: 0, Y: 0 },
  gridProps: GridProps,
  accessors: CollisionAccessors,
  direction: ReflowDirection,
  emptySpaces = 0,
  prevWidgetdistance: number,
  distanceBeforeCollision = 0,
  shouldResize: boolean,
) {
  let maxOccupiedSpace = 0,
    depth = 0;
  let currentEmptySpaces = emptySpaces;

  if (collisionTree.children && !isEmpty(collisionTree.children)) {
    const childNodes = Object.values(collisionTree.children);

    for (const childNode of childNodes) {
      if (childNode.direction !== direction) {
        globalCollisionTreeArray.splice(index + 1, 0, childNode);
        continue;
      }
      const nextEmptySpaces =
        emptySpaces +
        Math.abs(prevWidgetdistance - childNode[accessors.oppositeDirection]);

      const {
        currentEmptySpaces: childEmptySpaces,
        depth: currentDepth,
        occupiedSpace,
      } = getMovementMapHelper(
        globalCollisionTreeArray,
        index,
        childNode,
        movementMap,
        dimensions,
        gridProps,
        accessors,
        direction,
        nextEmptySpaces,
        childNode[accessors.direction],
        distanceBeforeCollision,
        shouldResize,
      );

      if (maxOccupiedSpace < occupiedSpace) {
        currentEmptySpaces = childEmptySpaces;
      }

      maxOccupiedSpace = Math.max(maxOccupiedSpace, occupiedSpace || 0);
      depth = Math.max(depth, currentDepth);
    }
  } else {
    if (direction === ReflowDirection.RIGHT) {
      currentEmptySpaces +=
        GridDefaults.DEFAULT_GRID_COLUMNS - collisionTree.right;
    } else if (direction !== ReflowDirection.BOTTOM) {
      currentEmptySpaces += collisionTree[accessors.direction];
    }
  }

  const getSpaceMovement = accessors.isHorizontal
    ? getHorizontalSpaceMovement
    : getVerticalSpaceMovement;
  const movementObj = getSpaceMovement(
    collisionTree,
    gridProps,
    direction,
    maxOccupiedSpace,
    depth,
    distanceBeforeCollision,
    emptySpaces,
    currentEmptySpaces,
    dimensions,
    shouldResize,
  );

  if (
    !shouldReplaceOldMovement(
      movementMap[collisionTree.id],
      movementObj,
      direction,
    )
  ) {
    const { isHorizontal } = getAccessor(direction);
    // const movementAccessors = isHorizontal
    //   ? {
    //       maxOccupiedSpace: "horizontalMaxOccupiedSpace",
    //       depth: "horizontalDepth",
    //       emptySpaces: "horizontalEmptySpaces",
    //     }
    //   : {
    //       maxOccupiedSpace: "verticalMaxOccupiedSpace",
    //       depth: "verticalDepth",
    //       emptySpaces: "verticalEmptySpaces",
    //     };
    return isHorizontal
      ? {
          occupiedSpace:
            (movementMap[collisionTree.id].horizontalMaxOccupiedSpace || 0) +
            collisionTree[accessors.parallelMax] -
            collisionTree[accessors.parallelMin],
          depth: (movementMap[collisionTree.id].horizontalDepth || 0) + 1,
          currentEmptySpaces:
            (movementMap[collisionTree.id].horizontalEmptySpaces as number) ||
            0,
        }
      : {
          occupiedSpace:
            (movementMap[collisionTree.id].verticalMaxOccupiedSpace || 0) +
            collisionTree[accessors.parallelMax] -
            collisionTree[accessors.parallelMin],
          depth: (movementMap[collisionTree.id].verticalDepth || 0) + 1,
          currentEmptySpaces:
            (movementMap[collisionTree.id].verticalEmptySpaces as number) || 0,
        };
  }

  movementMap[collisionTree.id] = {
    ...movementMap[collisionTree.id],
    ...movementObj,
  };
  return {
    occupiedSpace:
      maxOccupiedSpace +
      collisionTree[accessors.parallelMax] -
      collisionTree[accessors.parallelMin],
    depth: depth + 1,
    currentEmptySpaces,
  };
}

function getHorizontalSpaceMovement(
  collisionTree: CollisionTree,
  gridProps: GridProps,
  direction: ReflowDirection,
  maxOccupiedSpace: number,
  depth: number,
  distanceBeforeCollision: number,
  emptySpaces: number,
  currentEmptySpaces: number,
  { X }: Delta,
  shouldResize: boolean,
) {
  const maxX = getMaxX(
    collisionTree,
    gridProps,
    direction,
    depth,
    maxOccupiedSpace,
    shouldResize,
  );
  const width = getResizedDimension(
    collisionTree,
    direction,
    X,
    maxX,
    distanceBeforeCollision,
    gridProps.parentColumnSpace,
    emptySpaces,
    HORIZONTAL_RESIZE_LIMIT,
    shouldResize,
  );
  const spaceMovement = {
    X: getReflowDistance(
      collisionTree,
      direction,
      maxX,
      distanceBeforeCollision,
      width,
      emptySpaces,
      gridProps.parentColumnSpace,
    ),
    dimensionXBeforeCollision: distanceBeforeCollision,
    directionX: direction,
    maxX,
    width,
    horizontalEmptySpaces: currentEmptySpaces,
    horizontalDepth: depth,
    horizontalMaxOccupiedSpace: maxOccupiedSpace,
  };

  return spaceMovement;
}

function getVerticalSpaceMovement(
  collisionTree: CollisionTree,
  gridProps: GridProps,
  direction: ReflowDirection,
  maxOccupiedSpace: number,
  depth: number,
  distanceBeforeCollision: number,
  emptySpaces: number,
  currentEmptySpaces: number,
  { Y }: Delta,
  shouldResize: boolean,
) {
  const maxY = getMaxY(
    collisionTree,
    gridProps,
    direction,
    depth,
    maxOccupiedSpace,
    shouldResize,
  );
  const height = getResizedDimension(
    collisionTree,
    direction,
    Y,
    maxY,
    distanceBeforeCollision,
    gridProps.parentRowSpace,
    emptySpaces,
    VERTICAL_RESIZE_LIMIT,
    shouldResize,
  );
  const spaceMovement = {
    Y: getReflowDistance(
      collisionTree,
      direction,
      maxY,
      distanceBeforeCollision,
      height,
      emptySpaces,
      gridProps.parentRowSpace,
      true,
    ),
    dimensionYBeforeCollision: distanceBeforeCollision,
    directionY: direction,
    maxY,
    height,
    verticalEmptySpaces: currentEmptySpaces,
    verticalDepth: depth,
    verticalMaxOccupiedSpace: maxOccupiedSpace,
  };

  return spaceMovement;
}
