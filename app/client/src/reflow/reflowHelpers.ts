import type { OccupiedSpace } from "constants/CanvasEditorConstants";
import { GridDefaults } from "constants/WidgetConstants";
import { isEmpty } from "lodash";
import type {
  CollidingSpace,
  CollisionAccessors,
  CollisionMap,
  CollisionTree,
  CollisionTreeCache,
  Delta,
  DirectionalMovement,
  DirectionalVariables,
  GridProps,
  PrevReflowState,
  ReflowedSpaceMap,
  SecondOrderCollisionMap,
  SpaceMap,
  SpaceMovementMap,
} from "./reflowTypes";
import {
  HORIZONTAL_RESIZE_MIN_LIMIT,
  ReflowDirection,
  VERTICAL_RESIZE_MIN_LIMIT,
} from "./reflowTypes";
import {
  checkReCollisionWithOtherNewSpacePositions,
  filterCommonSpaces,
  buildArrayToCollisionMap,
  getAccessor,
  getCollidingSpacesInDirection,
  getMaxX,
  getMaxY,
  getModifiedOccupiedSpacesMap,
  getReflowDistance,
  getReflowedDimension,
  getResizedDimensions,
  shouldReplaceOldMovement,
  sortCollidingSpacesByDistance,
  getModifiedCollidingSpace,
  checkProcessNodeForTree,
  getRelativeCollidingValue,
} from "./reflowUtils";

/**
 * returns movement map of all the cascading colliding spaces
 * Movement map has X, Y, width and height of each reflowed spaces in absolute values
 *
 * @param newSpacePositions new/current positions array of the space/block
 * @param newSpacePositionsMap new/current positions map of the space/block
 * @param occupiedSpaces array of all the occupied spaces on the canvas
 * @param occupiedSpacesMap map of all the occupied spaces on the canvas
 * @param OGOccupiedSpacesMap map of all the original occupied spaces on the canvas before modification based on orientation
 * @param collidingSpaces array of Colliding spaces of the dragging/resizing space
 * @param collidingSpaceMap Map of Colliding spaces of the dragging/resizing space
 * @param gridProps properties of the canvas's grid
 * @param delta X and Y coordinate displacement of the newPosition from the original position
 * @param shouldResize boolean to indicate if colliding spaces should resize
 * @param globalDirection ReflowDirection, direction of reflow
 * @param globalIsHorizontal boolean to identify if the current orientation is horizontal
 * @param prevReflowState this contains a map of reference to the key values of previous reflow method call to back trace widget movements
 * @param primaryMovementMap movement map/information from previous run of the algorithm
 * @returns movement map of all the cascading colliding spaces
 */
export function getMovementMap(
  newSpacePositions: OccupiedSpace[],
  newSpacePositionsMap: SpaceMap,
  occupiedSpaces: OccupiedSpace[],
  occupiedSpacesMap: SpaceMap,
  OGOccupiedSpacesMap: SpaceMap,
  collidingSpaces: CollidingSpace[],
  collidingSpaceMap: CollisionMap,
  gridProps: GridProps,
  delta = { X: 0, Y: 0 },
  shouldResize = true,
  globalDirection: ReflowDirection,
  globalIsHorizontal: boolean,
  prevReflowState: PrevReflowState,
  primaryMovementMap?: ReflowedSpaceMap,
  primarySecondOrderCollisionMap?: SecondOrderCollisionMap,
) {
  const movementMap: ReflowedSpaceMap = { ...primaryMovementMap };
  //create a tree structure of collision
  const { collisionTrees, secondOrderCollisionMap } = getCollisionTree(
    newSpacePositions,
    occupiedSpaces,
    occupiedSpacesMap,
    OGOccupiedSpacesMap,
    collidingSpaces,
    globalDirection,
    globalIsHorizontal,
    collidingSpaceMap,
    gridProps,
    primaryMovementMap || prevReflowState.prevMovementMap,
    prevReflowState,
    !!primaryMovementMap,
    primarySecondOrderCollisionMap,
  );

  if (!collisionTrees || collisionTrees.length <= 0) {
    return {};
  }

  const directionalVariables: DirectionalVariables = {};

  //globalProcessedNodes are the global cache to not generate the collision tree for spaces processed unnecessarily
  //this is done for the sake of performance
  const globalProcessedNodes: CollisionTreeCache = {};

  //solve the tree structure to get the movement values
  for (let i = 0; i < collisionTrees.length; i++) {
    const childNode = collisionTrees[i];
    const childDirection = childNode.direction;
    const directionalAccessors = getAccessor(childDirection);

    const distanceBeforeCollision =
      childNode[directionalAccessors.oppositeDirection] -
      childNode.collidingValue;

    const { occupiedLength, occupiedSpace } = getMovementMapHelper(
      childNode,
      movementMap,
      delta,
      gridProps,
      childDirection,
      directionalAccessors,
      childNode[directionalAccessors.direction],
      distanceBeforeCollision,
      collisionTrees,
      i,
      0,
      shouldResize,
      globalProcessedNodes,
    );

    let staticOccupiedLength = 0,
      maxOccupiedSpace = 0;

    if (!directionalVariables[childNode.collidingId]) {
      directionalVariables[childNode.collidingId] = {};
    }

    if (directionalVariables[childNode.collidingId][childDirection]) {
      [staticOccupiedLength, maxOccupiedSpace] =
        directionalVariables[childNode.collidingId][childDirection];
    }

    staticOccupiedLength = Math.max(staticOccupiedLength, occupiedLength);
    maxOccupiedSpace = Math.max(maxOccupiedSpace, occupiedSpace);
    directionalVariables[childNode.collidingId][childDirection] = [
      staticOccupiedLength,
      maxOccupiedSpace,
      directionalAccessors,
      childDirection,
    ];
  }

  //based on the movement values and the occupiedLength of the dragging space from the borders, movement limits are calculated
  const movementVariablesMap = getMovementVariables(
    newSpacePositionsMap,
    directionalVariables,
    delta,
    gridProps,
    shouldResize,
  );

  return {
    movementVariablesMap,
    movementMap,
    secondOrderCollisionMap,
  };
}

/**
 * Collision tree is an Object containing the spaces and it's colliding spaces in a tree form
 * eg, if a spaces are colliding with root space, then they are added as children of root space.
 * children spaces further check the spaces colliding with them and then add them as their children, so on
 *
 * @param newSpacePositions new/current positions array of the space/block
 * @param occupiedSpaces array of all the occupied spaces on the canvas
 * @param occupiedSpacesMap map of all the occupied spaces on the canvas
 * @param OGOccupiedSpacesMap map of all the original occupied spaces on the canvas before modification based on orientation
 * @param collidingSpaces array of Colliding spaces of the dragging/resizing space
 * @param globalDirection ReflowDirection, direction of reflow
 * @param globalIsHorizontal boolean to identify if the current orientation is horizontal
 * @param gridProps properties of the canvas's grid
 * @param prevMovementMap is previous run's movement map if this is the first orientation, or is primary orientation's movement map if it is the second orientation run
 * @param prevReflowState this contains a map of reference to the key values of previous reflow method call to back trace widget movements
 * @param isSecondRun boolean to indicate if it is being run for the second time
 * @returns array of collision Tree
 */
export function getCollisionTree(
  newSpacePositions: OccupiedSpace[],
  occupiedSpaces: OccupiedSpace[],
  occupiedSpacesMap: SpaceMap,
  OGOccupiedSpacesMap: SpaceMap,
  collidingSpaces: CollidingSpace[],
  globalDirection: ReflowDirection,
  globalIsHorizontal: boolean,
  collidingSpaceMap: CollisionMap,
  gridProps: GridProps,
  prevMovementMap: ReflowedSpaceMap,
  prevReflowState: PrevReflowState,
  isSecondRun: boolean,
  primarySecondOrderCollisionMap?: SecondOrderCollisionMap,
) {
  //To calculate the tree, you iterate over the directly colliding spaces
  const collisionTrees: CollisionTree[] = [];
  const secondOrderCollisionMap: SecondOrderCollisionMap = {
    ...primarySecondOrderCollisionMap,
  };

  //globalProcessedNodes are the global cache to not generate the collision tree for spaces processed unnecessarily
  //this is done for the sake of performance
  const globalProcessedNodes: CollisionTreeCache = {};

  for (let i = 0; i < collidingSpaces.length; i++) {
    const collidingSpace = collidingSpaces[i];

    if (
      checkProcessNodeForTree(collidingSpace, globalProcessedNodes)
        .shouldProcessNode
    ) {
      // This is required if we suddenly switch orientations, like from horizontal to vertical or vice versa
      const {
        currentAccessors,
        currentCollidingSpace,
        currentDirection,
        currentOccSpaces,
        currentOccSpacesMap,
      } = getModifiedArgumentsForCollisionTree(
        collidingSpace,
        occupiedSpaces,
        occupiedSpacesMap,
        OGOccupiedSpacesMap,
        ReflowDirection.UNSET,
        globalIsHorizontal,
        prevMovementMap,
        gridProps,
      );

      // this method recursively builds the tree structure
      const { collisionTree: currentCollisionTree, occupiedLength } =
        getCollisionTreeHelper(
          newSpacePositions,
          currentOccSpaces,
          currentOccSpacesMap,
          OGOccupiedSpacesMap,
          currentCollidingSpace,
          globalDirection,
          currentDirection,
          currentAccessors,
          collidingSpaces,
          collidingSpaceMap,
          gridProps,
          i,
          prevMovementMap,
          prevReflowState,
          true,
          isSecondRun,
          globalProcessedNodes,
          secondOrderCollisionMap,
        );
      //To get colliding Value of the space relative to the Canvas edges
      const relativeCollidingValue = getRelativeCollidingValue(
        currentAccessors,
        currentCollidingSpace.collidingValue,
        currentDirection,
        gridProps,
        occupiedLength,
      );

      if (currentCollisionTree) {
        collisionTrees.push({
          ...currentCollisionTree,
          collidingValue: relativeCollidingValue,
          collidingId: currentCollidingSpace.collidingId,
        });

        //initialize if undefined
        if (!globalProcessedNodes[currentCollidingSpace.id]) {
          globalProcessedNodes[currentCollidingSpace.id] = {};
        }

        //add value to cache
        globalProcessedNodes[currentCollidingSpace.id][
          currentCollidingSpace.direction
        ] = {
          value: relativeCollidingValue,
          childNode: {
            ...currentCollisionTree,
            collidingValue: relativeCollidingValue,
            collidingId: currentCollidingSpace.collidingId,
          },
        };
      }
    }
  }

  return { collisionTrees, secondOrderCollisionMap };
}

/**
 * generates a collision tree recursively
 * if a occupiedSpaces are colliding with collidingSpace, then they are added as children of collidingSpace space.
 * children spaces further check the spaces colliding with them and then add them as their children, so on
 * This is done recursively
 *
 * @param newSpacePositions new/current positions array of the space/block
 * @param occupiedSpaces array of all the occupied spaces on the canvas
 * @param occupiedSpacesMap map of all the occupied spaces on the canvas
 * @param OGOccupiedSpacesMap map of all the original occupied spaces on the canvas before modification based on orientation
 * @param collidingSpace current colliding space of which collision tree is returned
 * @param globalDirection ReflowDirection, global direction of reflow
 * @param direction ReflowDirection, direction of reflow of the colliding space
 * @param accessors accessors to access dimensions of spaces in a direction
 * @param globalCollidingSpaces array of initial colliding widgets
 * @param collidingSpaceMap Map of Colliding spaces of the dragging/resizing space
 * @param gridProps properties of the canvas's grid
 * @param insertionIndex current index at which any new direct collision of new space positions will be added
 * @param prevMovementMap is previous run's movement map if this is the first orientation, or is primary orientation's movement map if it is the second orientation run
 * @param prevReflowState this contains a map of reference to the key values of previous reflow method call to back trace widget movements
 * @param isDirectCollidingSpace boolean if the space is direct collision of the new space positions
 * @param isSecondRun boolean to indicate if it is being run for the second time
 * @param globalProcessedNodes cache to make sure to not generate a tree for the same space in the getCollision Tree
 * @param secondOrderCollisionMap collision map of the direct collisions of the initial direct collisions
 * @param processedNodes cache to make sure to not generate a tree for the same space of all the widgets below the colliding space
 * @returns collision tree of a particular in a direction
 */
function getCollisionTreeHelper(
  newSpacePositions: OccupiedSpace[],
  occupiedSpaces: OccupiedSpace[],
  occupiedSpacesMap: SpaceMap,
  OGOccupiedSpacesMap: SpaceMap,
  collidingSpace: CollidingSpace,
  globalDirection: ReflowDirection,
  direction: ReflowDirection,
  accessors: CollisionAccessors,
  globalCollidingSpaces: CollidingSpace[],
  collidingSpaceMap: CollisionMap,
  gridProps: GridProps,
  insertionIndex: number,
  prevMovementMap: ReflowedSpaceMap,
  prevReflowState: PrevReflowState,
  isDirectCollidingSpace: boolean,
  isSecondRun: boolean,
  globalProcessedNodes: CollisionTreeCache,
  secondOrderCollisionMap?: SecondOrderCollisionMap,
) {
  if (!collidingSpace) return {};

  let occupiedLength = 0;
  const collisionTree: CollisionTree = { ...collidingSpace, children: {} };

  // we resize the space to either increase the width or height based on movement
  // for the sake of finding all the colliding spaces
  //for example, if a space is moved by 2 rows in the BOTTOM direction,
  //then the space's bottom dimension is increased by 2 rows
  const resizedDimensions = getResizedDimensions(collisionTree, accessors);

  const filteredNewSpacePositions = newSpacePositions.filter(
    (a) => a.id !== collidingSpace.collidingId,
  );

  // check if the space again collides with other dragging spaces in group widget scenario
  if (
    checkReCollisionWithOtherNewSpacePositions(
      resizedDimensions,
      collidingSpace,
      globalDirection,
      direction,
      filteredNewSpacePositions,
      globalCollidingSpaces,
      insertionIndex,
      globalProcessedNodes,
      collidingSpaceMap,
      prevReflowState,
      isSecondRun,
    )
  )
    return {};

  // to get it's colliding spaces
  const { collidingSpaces, occupiedSpacesInDirection } =
    getCollidingSpacesInDirection(
      resizedDimensions,
      collidingSpace,
      globalDirection,
      direction,
      gridProps,
      prevReflowState,
      collidingSpaceMap,
      occupiedSpaces,
      isDirectCollidingSpace,
    );

  if (isDirectCollidingSpace && secondOrderCollisionMap) {
    //initialize if undefined
    if (!secondOrderCollisionMap[collidingSpace.id]) {
      secondOrderCollisionMap[collidingSpace.id] = {
        ...occupiedSpacesMap[collidingSpace.id],
        children: {},
      };
    }

    secondOrderCollisionMap[collidingSpace.id].children = {
      ...secondOrderCollisionMap[collidingSpace.id].children,
      ...buildArrayToCollisionMap(collidingSpaces),
    };
  }

  sortCollidingSpacesByDistance(collidingSpaces);

  for (const currentCollidingSpace of collidingSpaces) {
    // If in case it changes orientation
    const {
      currentAccessors,
      currentCollidingSpace: modifiedCollidingSpace,
      currentDirection,
      currentOccSpaces,
      currentOccSpacesMap,
    } = getModifiedArgumentsForCollisionTree(
      currentCollidingSpace,
      occupiedSpacesInDirection,
      occupiedSpacesMap,
      OGOccupiedSpacesMap,
      direction,
      accessors.isHorizontal,
      prevMovementMap,
      gridProps,
    );
    const { currentChildNode, shouldProcessNode } = checkProcessNodeForTree(
      modifiedCollidingSpace,
      globalProcessedNodes,
    );

    if (shouldProcessNode) {
      //Recursively call to build the tree
      const {
        collisionTree: currentCollisionTree,
        occupiedLength: currentOccupiedLength,
      } = getCollisionTreeHelper(
        filteredNewSpacePositions,
        currentOccSpaces,
        currentOccSpacesMap,
        OGOccupiedSpacesMap,
        modifiedCollidingSpace,
        globalDirection,
        currentDirection,
        currentAccessors,
        globalCollidingSpaces,
        collidingSpaceMap,
        gridProps,
        insertionIndex,
        prevMovementMap,
        prevReflowState,
        false,
        isSecondRun,
        globalProcessedNodes,
        secondOrderCollisionMap,
      );

      //initialize if undefined
      if (!globalProcessedNodes[modifiedCollidingSpace.id]) {
        globalProcessedNodes[modifiedCollidingSpace.id] = {};
      }

      if (currentCollisionTree) {
        //To get colliding Value of the space relative to the Canvas edges
        const relativeCollidingValue = getRelativeCollidingValue(
          currentAccessors,
          modifiedCollidingSpace.collidingValue,
          currentDirection,
          gridProps,
          currentOccupiedLength,
        );

        //add value to cache
        globalProcessedNodes[modifiedCollidingSpace.id][
          modifiedCollidingSpace.direction
        ] = {
          value: relativeCollidingValue,
          childNode: {
            ...currentCollisionTree,
          },
        };

        if (collisionTree.children) {
          collisionTree.children[currentCollidingSpace.id] = {
            ...currentCollisionTree,
          };
        }
      }

      //store overall maximum travel
      if (currentOccupiedLength)
        occupiedLength = Math.max(occupiedLength, currentOccupiedLength);
    } else if (currentChildNode && collisionTree.children) {
      collisionTree.children[currentChildNode.id] = {
        ...currentChildNode,
      };
    }
  }

  return {
    collisionTree,
    occupiedLength:
      occupiedLength +
      (accessors.isHorizontal
        ? HORIZONTAL_RESIZE_MIN_LIMIT
        : collidingSpace.fixedHeight && accessors.directionIndicator < 0
          ? collidingSpace.fixedHeight
          : VERTICAL_RESIZE_MIN_LIMIT),
  };
}

/**
 * to get modified arguments of spaces is opposite orientation than the current orientation
 * If while recursing through the collision tree and children is of different direction or orientation than the parent node,
 * then the occupied spaces need to be modified to suit that orientation
 *
 * @param collidingSpace current colliding space of which collision tree is returned
 * @param occupiedSpaces array of all the occupied spaces on the canvas
 * @param occupiedSpacesMap map of all the occupied spaces on the canvas
 * @param OGOccupiedSpacesMap map of all the original occupied spaces on the canvas before modification based on orientation
 * @param direction ReflowDirection, direction of reflow of the colliding space
 * @param isHorizontal boolean indicating if the current orientation is horizontal
 * @param prevMovementMap movement map generate during the previous run
 * @param gridProps properties of the canvas's grid
 * @param globalProcessedNodes cache to make sure to not generate a tree for the same space in the getCollision Tree
 * @param currentProcessedNodes cache to make sure to not generate a tree for the same space of all the widgets below the colliding space
 * @returns collision tree of a particular in a direction
 */
export function getModifiedArgumentsForCollisionTree(
  collidingSpace: CollidingSpace,
  occupiedSpaces: OccupiedSpace[],
  occupiedSpacesMap: SpaceMap,
  OGOccupiedSpacesMap: SpaceMap,
  direction: ReflowDirection,
  isHorizontal: boolean,
  prevMovementMap: ReflowedSpaceMap,
  gridProps: GridProps,
) {
  const currentDirection = collidingSpace.direction;
  const currentAccessors = getAccessor(currentDirection);
  let currentOccSpaces = occupiedSpaces;
  let currentOccSpacesMap = { ...occupiedSpacesMap };
  // modify the collidingSpace position's values to be in the other orientation
  let currentCollidingSpace = getModifiedCollidingSpace(
    collidingSpace,
    OGOccupiedSpacesMap,
    prevMovementMap,
    currentAccessors.isHorizontal,
    gridProps,
    currentAccessors.perpendicularMax,
    currentAccessors.perpendicularMin,
  );

  //modify the occupied spaces to be in the other orientation,
  // if the current orientation of the colliding space is different from the parent space
  if (collidingSpace.direction !== direction) {
    if (currentAccessors.isHorizontal !== isHorizontal) {
      currentOccSpacesMap = getModifiedOccupiedSpacesMap(
        OGOccupiedSpacesMap,
        prevMovementMap,
        currentAccessors.isHorizontal,
        gridProps,
        currentAccessors.perpendicularMax,
        currentAccessors.perpendicularMin,
      );
      currentCollidingSpace = {
        ...currentCollidingSpace,
        ...currentOccSpacesMap[collidingSpace.id],
      };
    }

    filterCommonSpaces(
      {
        [collidingSpace.collidingId]: true,
      },
      currentOccSpacesMap,
    );

    currentOccSpaces = Object.values(currentOccSpacesMap);
    currentOccSpaces.sort((a, b) => {
      return a[currentAccessors.direction] - b[currentAccessors.direction];
    });
  }

  return {
    currentOccSpacesMap,
    currentAccessors,
    currentDirection,
    currentOccSpaces,
    currentCollidingSpace,
  };
}

/**
 * Helper method to generate movement map by recursively going over the collision tree
 * This method recursively traverses the collision tree, to calculate from the ends of the tree making it's way to the roots
 * This is calculated in that way to check if the ends of branches are colliding with the boundaries of the canvas.
 *
 * @param collisionTree space and it's colliding spaces in a tree structure
 * @param movementMap map containing reflowed X, Y, width and height of spaces
 * @param gridProps properties of the canvas's grid
 * @param direction ReflowDirection, direction of reflow of the colliding space
 * @param accessors accessors to access dimensions of spaces in a direction
 * @param prevWidgetDistance dimension of the previous colliding widget in the direction
 * @param distanceBeforeCollision point of collision from the previous widget
 * @param globalCollisionTrees Array of collision trees of direct colliding spaces
 * @param index index of insertion if a collision node is of different direction from it's parent
 * @param emptySpaces current number of emptySpaces it's parent ancestors encountered while reflowed
 * @param shouldResize if the reflowed widgets can be reflowed
 * @param globalProcessedNodes cache to make sure to not generate a tree for the same space in the getCollision Tree
 * @returns movement map of current collision tree node
 */
function getMovementMapHelper(
  collisionTree: CollisionTree,
  movementMap: ReflowedSpaceMap,
  dimensions = { X: 0, Y: 0 },
  gridProps: GridProps,
  direction: ReflowDirection,
  accessors: CollisionAccessors,
  prevWidgetDistance: number,
  distanceBeforeCollision = 0,
  globalCollisionTrees: CollisionTree[],
  index: number,
  emptySpaces = 0,
  shouldResize: boolean,
  globalProcessedNodes: CollisionTreeCache,
) {
  let maxOccupiedSpace = 0,
    occupiedLength = 0,
    currentEmptySpaces = emptySpaces;

  if (collisionTree.children && !isEmpty(collisionTree.children)) {
    const childNodes = Object.values(collisionTree.children);

    for (const childNode of childNodes) {
      if (childNode.direction !== direction) {
        globalCollisionTrees.splice(index + 1, 0, childNode);
        continue;
      }

      const nextEmptySpaces =
        emptySpaces +
        Math.abs(prevWidgetDistance - childNode[accessors.oppositeDirection]);

      let {
        currentEmptySpaces: childEmptySpaces,
        occupiedLength: currentOccupiedLength,
        occupiedSpace,
        shouldProcessNode,
      } = checkProcessNodeForTree(childNode, globalProcessedNodes);

      //process the nodes if either one is undefined
      if (
        shouldProcessNode ||
        currentOccupiedLength === undefined ||
        occupiedSpace === undefined ||
        childEmptySpaces === undefined
      ) {
        const movementVariables = getMovementMapHelper(
          childNode,
          movementMap,
          dimensions,
          gridProps,
          direction,
          accessors,
          childNode[accessors.direction],
          distanceBeforeCollision,
          globalCollisionTrees,
          index,
          nextEmptySpaces,
          shouldResize,
          globalProcessedNodes,
        );

        //initialize if undefined
        if (!globalProcessedNodes[childNode.id]) {
          globalProcessedNodes[childNode.id] = {};
        }

        //add value to cache
        globalProcessedNodes[childNode.id][childNode.direction] = {
          value: childNode.collidingValue,
          occupiedLength: movementVariables.occupiedLength,
          occupiedSpace: movementVariables.occupiedSpace,
          currentEmptySpaces: movementVariables.currentEmptySpaces,
        };

        //set current values
        shouldProcessNode = false;
        currentOccupiedLength = movementVariables.occupiedLength;
        occupiedSpace = movementVariables.occupiedSpace;
        childEmptySpaces = movementVariables.currentEmptySpaces;
      }

      if (maxOccupiedSpace < occupiedSpace) {
        currentEmptySpaces = childEmptySpaces;
      }

      //maxOccupiedSpace is the maximum dimension that is occupied by all the spaces above it in the tree
      maxOccupiedSpace = Math.max(maxOccupiedSpace, occupiedSpace || 0);
      // occupiedLength is the sum of minimum occupied lengths of all spaces between collidingSpace and the edge of canvas,
      //useful to calculate resized dimensions for spaces colliding with boundaries
      occupiedLength = Math.max(occupiedLength, currentOccupiedLength);
    }
  } else {
    if (direction === ReflowDirection.RIGHT) {
      currentEmptySpaces +=
        GridDefaults.DEFAULT_GRID_COLUMNS - collisionTree.right;
    } else if (direction !== ReflowDirection.BOTTOM) {
      currentEmptySpaces += collisionTree[accessors.direction];
    }
  }

  //It calculates mainly the X, Y, width, height of the spaces to transform the existing spaces
  const getSpaceMovement = accessors.isHorizontal
    ? getHorizontalSpaceMovement
    : getVerticalSpaceMovement;
  const movementObj = getSpaceMovement(
    collisionTree,
    gridProps,
    direction,
    maxOccupiedSpace,
    occupiedLength,
    distanceBeforeCollision,
    emptySpaces,
    currentEmptySpaces,
    dimensions,
    shouldResize,
  );

  if (
    // If a value already exists in the movement map,
    // this method is used to check if the current one should override the existing movement values of the space
    !shouldReplaceOldMovement(
      movementMap[collisionTree.id],
      movementObj,
      direction,
    )
  ) {
    const { isHorizontal } = getAccessor(direction);

    return isHorizontal
      ? {
          occupiedSpace:
            (movementMap[collisionTree.id].horizontalMaxOccupiedSpace || 0) +
            collisionTree[accessors.parallelMax] -
            collisionTree[accessors.parallelMin],
          occupiedLength:
            (movementMap[collisionTree.id].horizontalOccupiedLength || 0) +
            HORIZONTAL_RESIZE_MIN_LIMIT,
          currentEmptySpaces:
            (movementMap[collisionTree.id].horizontalEmptySpaces as number) ||
            0,
        }
      : {
          occupiedSpace:
            (movementMap[collisionTree.id].verticalMaxOccupiedSpace || 0) +
            collisionTree[accessors.parallelMax] -
            collisionTree[accessors.parallelMin],
          occupiedLength:
            (movementMap[collisionTree.id].verticalOccupiedLength || 0) +
            (collisionTree.fixedHeight && accessors.directionIndicator < 0
              ? collisionTree.fixedHeight
              : VERTICAL_RESIZE_MIN_LIMIT),
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
    occupiedLength:
      occupiedLength +
      (accessors.isHorizontal
        ? HORIZONTAL_RESIZE_MIN_LIMIT
        : collisionTree.fixedHeight && accessors.directionIndicator < 0
          ? collisionTree.fixedHeight
          : VERTICAL_RESIZE_MIN_LIMIT),
    currentEmptySpaces,
  };
}

/**
 * get movement of the collision tree node in horizontal orientation
 * @param collisionTree space and it's colliding spaces in a tree structure
 * @param gridProps properties of the canvas's grid
 * @param direction ReflowDirection, direction of reflow of the colliding space
 * @param maxOccupiedSpace dimension of all the spaces that were occupied
 * @param occupiedLength is the sum of minimum occupied lengths of all spaces between collidingSpace and the edge of canvas
 * @param distanceBeforeCollision point of collision from the previous widget
 * @param emptySpaces total number of emptySpaces it's parent ancestors encountered while reflowed
 * @param currentEmptySpaces current number of emptySpaces this node encountered
 * @param shouldResize if the reflowed widgets can be reflowed
 * @param delta X and Y distance from the original new space positions
 * @param shouldResize if the reflowed widgets can be reflowed
 * @returns movement of the collision tree node in horizontal orientation
 */
export function getHorizontalSpaceMovement(
  collisionTree: CollisionTree,
  gridProps: GridProps,
  direction: ReflowDirection,
  maxOccupiedSpace: number,
  occupiedLength: number,
  distanceBeforeCollision: number,
  emptySpaces: number,
  currentEmptySpaces: number,
  { X }: Delta,
  shouldResize: boolean,
) {
  //maxX is the maximum leeway left for the space before it cannot move anymore in the X axis
  const maxX = getMaxX(
    collisionTree,
    gridProps,
    direction,
    occupiedLength,
    maxOccupiedSpace,
    shouldResize,
  );
  const width = getReflowedDimension(
    collisionTree,
    direction,
    X,
    maxX,
    distanceBeforeCollision,
    gridProps.parentColumnSpace,
    emptySpaces,
    HORIZONTAL_RESIZE_MIN_LIMIT,
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
    horizontalOccupiedLength: occupiedLength,
    horizontalMaxOccupiedSpace: maxOccupiedSpace,
  };

  return spaceMovement;
}

/**
 * get movement of the collision tree node in vertical orientation
 * @param collisionTree space and it's colliding spaces in a tree structure
 * @param gridProps properties of the canvas's grid
 * @param direction ReflowDirection, direction of reflow of the colliding space
 * @param maxOccupiedSpace dimension of all the spaces that were occupied
 * @param occupiedLength is the sum of minimum occupied lengths of all spaces between collidingSpace and the edge of canvas
 * @param distanceBeforeCollision point of collision from the previous widget
 * @param emptySpaces total number of emptySpaces it's parent ancestors encountered while reflowed
 * @param currentEmptySpaces current number of emptySpaces this node encountered
 * @param shouldResize if the reflowed widgets can be reflowed
 * @param delta X and Y distance from the original new space positions
 * @param shouldResize if the reflowed widgets can be reflowed
 * @returns movement of the collision tree node in vertical orientation
 */
export function getVerticalSpaceMovement(
  collisionTree: CollisionTree,
  gridProps: GridProps,
  direction: ReflowDirection,
  maxOccupiedSpace: number,
  occupiedLength: number,
  distanceBeforeCollision: number,
  emptySpaces: number,
  currentEmptySpaces: number,
  { Y }: Delta,
  shouldResize: boolean,
) {
  //maxY is the maximum leeway left for the space before it cannot move anymore in the Y axis
  const maxY = getMaxY(
    collisionTree,
    gridProps,
    direction,
    occupiedLength,
    maxOccupiedSpace,
    shouldResize,
  );
  const height = getReflowedDimension(
    collisionTree,
    direction,
    Y,
    maxY,
    distanceBeforeCollision,
    gridProps.parentRowSpace,
    emptySpaces,
    VERTICAL_RESIZE_MIN_LIMIT,
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
    verticalOccupiedLength: occupiedLength,
    verticalMaxOccupiedSpace: maxOccupiedSpace,
  };

  return spaceMovement;
}

/**
 * to get movement variable to determine the limit of all the new Space Positions,
 * MovementVariables are intermediatory variables to calculate the actual movement Limits of each dragging/resizing space
 *
 * @param newSpacePositionsMap new/current positions map of the space/block
 * @param directionalVariables information required to calculate limits such as occupiedLength, emptySpaces of new space positions
 * @param delta X and Y distance from original positions
 * @param gridProps properties of the canvas's grid
 * @param shouldResize boolean to indicate if colliding spaces should resize
 * @returns movement variable to determine the limit of all the new Space Positions
 */
function getMovementVariables(
  newSpacePositionsMap: SpaceMap,
  directionalVariables: DirectionalVariables,
  delta: Delta,
  gridProps: GridProps,
  shouldResize: boolean,
) {
  const newSpacePositionIds = Object.keys(directionalVariables);
  const movementVariablesMap: SpaceMovementMap = {};

  for (const newSpacePositionId of newSpacePositionIds) {
    if (!newSpacePositionsMap[newSpacePositionId]) continue;

    const movementVariables = directionalVariables[newSpacePositionId];
    const directionalKeys = Object.keys(movementVariables);
    const directionalMovements: DirectionalMovement[] = [];

    for (const directionKey of directionalKeys) {
      const [
        staticOccupiedLength,
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
          newSpacePositionsMap[newSpacePositionId] as CollisionTree,
          gridProps,
          reflowDirection,
          staticOccupiedLength,
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

    movementVariablesMap[newSpacePositionId] = directionalMovements;
  }

  return movementVariablesMap;
}
