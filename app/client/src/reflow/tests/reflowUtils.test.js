import { ReflowDirection, SpaceAttributes } from "reflow/reflowTypes";
import {
  getAccessor,
  shouldReplaceOldMovement,
  getResizedDimensions,
  sortCollidingSpacesByDistance,
  getShouldReflow,
  getDelta,
  getCollidingSpacesInDirection,
  filterSpaceById,
  getMaxX,
  getMaxY,
  getReflowDistance,
  getReflowedDimension,
  getCollidingSpaceMap,
  ShouldAddToCollisionSpacesArray,
  filterSpaceByDirection,
  filterCommonSpaces,
  getSpacesMapFromArray,
  buildArrayToCollisionMap,
  getModifiedOccupiedSpacesMap,
  getModifiedCollidingSpace,
  checkReCollisionWithOtherNewSpacePositions,
  getCalculatedDirection,
  getBottomMostRow,
  initializeMovementLimitMap,
  checkProcessNodeForTree,
  getRelativeCollidingValue,
} from "../reflowUtils";
import { HORIZONTAL_RESIZE_LIMIT, VERTICAL_RESIZE_LIMIT } from "../reflowTypes";

const gridProps = {
  parentColumnSpace: 20,
  parentRowSpace: 10,
  maxGridColumns: 100,
};

describe("Test reflow util methods", () => {
  describe("Test shouldReplaceOldMovement method", () => {
    it("should return true when Space's new movement coordinate is farther than the olds'", () => {
      const newMovement = {
          X: 20,
        },
        oldMovement = {
          X: 10,
        };
      expect(
        shouldReplaceOldMovement(
          oldMovement,
          newMovement,
          ReflowDirection.RIGHT,
        ),
      ).toBe(true);
    });
    it("should return false when Space's new movement coordinate is not farther than the olds'", () => {
      const newMovement = {
          X: 10,
        },
        oldMovement = {
          X: 20,
        };
      expect(
        shouldReplaceOldMovement(oldMovement, newMovement, ReflowDirection.TOP),
      ).toBe(true);
    });
  });

  describe("Test getResizedDimensions method", () => {
    it("should return Resized Dimensions based on dimensionBeforeCollision and the emptySpaces in between", () => {
      const collisionTree = {
          right: 20,
          collidingValue: 10,
          left: 0,
        },
        accessors = getAccessor(ReflowDirection.RIGHT);
      const resizedDimension = {
        right: 30,
      };

      expect(getResizedDimensions(collisionTree, accessors).right).toBe(
        resizedDimension.right,
      );
    });
  });

  describe("Test sortCollidingSpacesByDistance method", () => {
    const collisionSpaces = [
      {
        direction: ReflowDirection.RIGHT,
        left: 100,
        collidingValue: 80,
      },
      {
        direction: ReflowDirection.LEFT,
        right: 30,
        collidingValue: 40,
      },
      {
        direction: ReflowDirection.BOTTOM,
        top: 110,
        collidingValue: 70,
      },
      {
        direction: ReflowDirection.TOP,
        bottom: 0,
        collidingValue: 30,
      },
    ];

    it("should sort the collidingSpaces with respect to the distance from the staticPosition in a Ascending manner", () => {
      const sortedCollisionSpaces = [
        {
          direction: ReflowDirection.BOTTOM,
          top: 110,
          collidingValue: 70,
        },
        {
          direction: ReflowDirection.TOP,
          bottom: 0,
          collidingValue: 30,
        },
        {
          direction: ReflowDirection.RIGHT,
          left: 100,
          collidingValue: 80,
        },
        {
          direction: ReflowDirection.LEFT,
          right: 30,
          collidingValue: 40,
        },
      ];
      sortCollidingSpacesByDistance(collisionSpaces, true);
      expect(collisionSpaces).toEqual(sortedCollisionSpaces);
    });
    it("should sort the collidingSpaces with respect to the distance from the staticPosition in a descending manner", () => {
      const sortedCollisionSpaces = [
        {
          direction: ReflowDirection.LEFT,
          right: 30,
          collidingValue: 40,
        },
        {
          direction: ReflowDirection.RIGHT,
          left: 100,
          collidingValue: 80,
        },
        {
          direction: ReflowDirection.TOP,
          bottom: 0,
          collidingValue: 30,
        },
        {
          direction: ReflowDirection.BOTTOM,
          top: 110,
          collidingValue: 70,
        },
      ];
      sortCollidingSpacesByDistance(collisionSpaces, false);
      expect(collisionSpaces).toEqual(sortedCollisionSpaces);
    });
  });

  describe("Test getShouldReflow method", () => {
    const spaceMovementMap = {
      "1234": [
        {
          maxMovement: 30,
          directionalIndicator: 1,
          coordinateKey: "X",
          isHorizontal: true,
        },
        {
          maxMovement: 30,
          directionalIndicator: 1,
          coordinateKey: "Y",
          isHorizontal: false,
        },
        {
          maxMovement: -30,
          directionalIndicator: -1,
          coordinateKey: "X",
          isHorizontal: true,
        },
        {
          maxMovement: -30,
          directionalIndicator: -1,
          coordinateKey: "Y",
          isHorizontal: false,
        },
      ],
    };

    it("should check canHorizontalMove or canVerticalMove when either direction movement has reached limit", () => {
      let movementLimit = {};
      getShouldReflow(movementLimit, spaceMovementMap, {
        X: 25,
        Y: 0,
      });
      expect(movementLimit["1234"]).toEqual({
        canHorizontalMove: true,
        canVerticalMove: true,
      });
      movementLimit = {};
      getShouldReflow(movementLimit, spaceMovementMap, {
        X: 35,
        Y: 0,
      });
      expect(movementLimit["1234"]).toEqual({
        canHorizontalMove: false,
        canVerticalMove: true,
      });
      movementLimit = {};
      getShouldReflow(movementLimit, spaceMovementMap, {
        X: -25,
        Y: 0,
      });
      expect(movementLimit["1234"]).toEqual({
        canHorizontalMove: true,
        canVerticalMove: true,
      });
      movementLimit = {};
      getShouldReflow(movementLimit, spaceMovementMap, {
        X: -35,
        Y: 0,
      });
      expect(movementLimit["1234"]).toEqual({
        canHorizontalMove: false,
        canVerticalMove: true,
      });
      movementLimit = {};
      getShouldReflow(movementLimit, spaceMovementMap, {
        X: 0,
        Y: 25,
      });
      expect(movementLimit["1234"]).toEqual({
        canHorizontalMove: true,
        canVerticalMove: true,
      });
      movementLimit = {};
      getShouldReflow(movementLimit, spaceMovementMap, {
        X: 0,
        Y: 35,
      });
      expect(movementLimit["1234"]).toEqual({
        canHorizontalMove: true,
        canVerticalMove: false,
      });
      movementLimit = {};
      getShouldReflow(movementLimit, spaceMovementMap, {
        X: 0,
        Y: -25,
      });
      expect(movementLimit["1234"]).toEqual({
        canHorizontalMove: true,
        canVerticalMove: true,
      });
      movementLimit = {};
      getShouldReflow(movementLimit, spaceMovementMap, {
        X: 0,
        Y: -35,
      });
      expect(movementLimit["1234"]).toEqual({
        canHorizontalMove: true,
        canVerticalMove: false,
      });
    });
  });

  describe("Test getDelta method", () => {
    const OGPositions = {
        "1234": {
          id: "1234",
          left: 50,
          top: 50,
          right: 110,
          bottom: 110,
        },
      },
      newPositions = {
        "1234": { id: "1234", left: 40, top: 30, right: 80, bottom: 70 },
      };

    it("should check X and Y Coordinates for constant direction", () => {
      expect(getDelta(OGPositions, newPositions, ReflowDirection.LEFT)).toEqual(
        {
          X: 10,
          Y: 20,
        },
      );
      expect(getDelta(OGPositions, newPositions, ReflowDirection.TOP)).toEqual({
        X: 10,
        Y: 20,
      });
      expect(
        getDelta(OGPositions, newPositions, ReflowDirection.RIGHT),
      ).toEqual({
        X: 30,
        Y: 20,
      });
      expect(
        getDelta(OGPositions, newPositions, ReflowDirection.BOTTOM),
      ).toEqual({
        X: 10,
        Y: 40,
      });
    });

    it("should check X and Y Coordinates for composite direction", () => {
      expect(
        getDelta(OGPositions, newPositions, ReflowDirection.TOPLEFT),
      ).toEqual({
        X: 10,
        Y: 20,
      });
      expect(
        getDelta(OGPositions, newPositions, ReflowDirection.TOPRIGHT),
      ).toEqual({
        X: 30,
        Y: 20,
      });
      expect(
        getDelta(OGPositions, newPositions, ReflowDirection.BOTTOMLEFT),
      ).toEqual({
        X: 10,
        Y: 40,
      });
      expect(
        getDelta(OGPositions, newPositions, ReflowDirection.BOTTOMRIGHT),
      ).toEqual({
        X: 30,
        Y: 40,
      });
    });
  });

  describe("Test getCollidingSpaces and getCollidingSpacesInDirection method", () => {
    const newPositions = [
        {
          id: "1234",
          left: 40,
          top: 30,
          right: 80,
          bottom: 70,
        },
      ],
      occupiedSpaces = [
        {
          id: "1235",
          left: 10,
          top: 10,
          right: 35,
          bottom: 25,
        },
        {
          id: "1236",
          left: 30,
          top: 20,
          right: 50,
          bottom: 35,
        },
        {
          id: "1237",
          left: 10,
          top: 10,
          right: 90,
          bottom: 80,
        },
      ];

    it("should return collidingSpaces with direction", () => {
      const collidingSpaces = {
        "1236": {
          id: "1236",
          left: 30,
          top: 20,
          right: 50,
          bottom: 35,
          direction: "BOTTOM",
          collidingId: "1234",
          collidingValue: 70,
          isHorizontal: false,
          order: 1,
        },
        "1237": {
          id: "1237",
          left: 10,
          top: 10,
          right: 90,
          bottom: 80,
          direction: "BOTTOM",
          collidingId: "1234",
          collidingValue: 70,
          isHorizontal: false,
          order: 2,
        },
      };
      expect(
        getCollidingSpaceMap(
          newPositions,
          occupiedSpaces,
          ReflowDirection.BOTTOM,
          { horizontal: {}, vertical: {} },
          false,
        ).collidingSpaceMap,
      ).toEqual(collidingSpaces);
    });

    it("should return collidingSpaces with predicted direction based on Previous positions", () => {
      const collidingSpaces = {
          "1237": {
            id: "1237",
            left: 10,
            top: 10,
            right: 90,
            bottom: 80,
            direction: "BOTTOM",
            collidingId: "1234",
            collidingValue: 70,
            isHorizontal: false,
            order: 1,
          },
        },
        prevPositions = {
          "1234": {
            id: "1234",
            left: 50,
            top: 30,
            right: 90,
            bottom: 70,
          },
        };
      expect(
        getCollidingSpaceMap(
          newPositions,
          occupiedSpaces,
          ReflowDirection.BOTTOM,
          { horizontal: {}, vertical: {} },
          false,
          prevPositions,
        ).collidingSpaceMap,
      ).toEqual(collidingSpaces);
    });

    it("should return collidingSpaces In a particular direction", () => {
      const collidingSpaces = [
        {
          id: "1236",
          left: 30,
          top: 20,
          right: 50,
          bottom: 35,
          direction: "LEFT",
          collidingId: "1234",
          collidingValue: 40,
          isHorizontal: true,
          order: 1,
        },
        {
          id: "1237",
          left: 10,
          top: 10,
          right: 90,
          bottom: 80,
          direction: "LEFT",
          collidingId: "1234",
          collidingValue: 40,
          isHorizontal: true,
          order: 2,
        },
      ];
      expect(
        getCollidingSpacesInDirection(
          newPositions[0],
          newPositions,
          ReflowDirection.LEFT,
          ReflowDirection.LEFT,
          {},
          {},
          {},
          occupiedSpaces,
        ).collidingSpaces,
      ).toEqual(collidingSpaces);
    });
  });

  describe("Test filterSpaceById method", () => {
    const occupiedSpaces = [
      {
        id: "1234",
        left: 40,
        top: 30,
        right: 80,
        bottom: 70,
      },
      {
        id: "1235",
        left: 10,
        top: 10,
        right: 35,
        bottom: 25,
      },
      {
        id: "1236",
        left: 30,
        top: 20,
        right: 50,
        bottom: 35,
      },
    ];

    it("should return filtered Spaces", () => {
      const filteredSpaces = occupiedSpaces.slice(1);
      expect(filterSpaceById("1234", occupiedSpaces)).toEqual(filteredSpaces);
    });
  });

  describe("Test getMaxX method", () => {
    const collisionTree = {
      id: "1234",
      left: 40,
      top: 30,
      right: 60,
      bottom: 70,
      children: [],
    };

    it("should return max number for LEFT Direction when not Resizing", () => {
      const depth = 2;
      expect(
        getMaxX(
          collisionTree,
          gridProps,
          ReflowDirection.LEFT,
          depth,
          30,
          false,
        ),
      ).toBe(-1 * 10 * gridProps.parentColumnSpace);
    });
    it("should return max number for LEFT Direction when Resizing", () => {
      const depth = 2;
      expect(
        getMaxX(
          collisionTree,
          gridProps,
          ReflowDirection.LEFT,
          depth,
          30,
          true,
        ),
      ).toBe(
        -1 *
          (collisionTree.left - depth * HORIZONTAL_RESIZE_LIMIT) *
          gridProps.parentColumnSpace,
      );
    });
    it("should return max number for RIGHT Direction when not Resizing", () => {
      const depth = 2;
      expect(
        getMaxX(
          collisionTree,
          gridProps,
          ReflowDirection.RIGHT,
          depth,
          30,
          false,
        ),
      ).toBe(
        (gridProps.maxGridColumns - collisionTree.right - 30) *
          gridProps.parentColumnSpace,
      );
    });
    it("should return max number for RIGHT Direction when Resizing", () => {
      const depth = 2;
      expect(
        getMaxX(
          collisionTree,
          gridProps,
          ReflowDirection.RIGHT,
          depth,
          30,
          true,
        ),
      ).toBe(
        (gridProps.maxGridColumns -
          collisionTree.right -
          depth * HORIZONTAL_RESIZE_LIMIT) *
          gridProps.parentColumnSpace,
      );
    });
  });

  describe("Test getMaxY method", () => {
    const collisionTree = {
      id: "1234",
      left: 40,
      top: 30,
      right: 60,
      bottom: 70,
      children: [],
    };

    it("should return max number for TOP Direction when not Resizing", () => {
      const depth = 2;
      expect(
        getMaxY(
          collisionTree,
          gridProps,
          ReflowDirection.TOP,
          depth,
          20,
          false,
        ),
      ).toBe(-1 * 10 * gridProps.parentRowSpace);
    });
    it("should return max number for TOP Direction when Resizing", () => {
      const depth = 2;
      expect(
        getMaxY(collisionTree, gridProps, ReflowDirection.TOP, depth, 20, true),
      ).toBe(
        -1 *
          (collisionTree.top - depth * VERTICAL_RESIZE_LIMIT) *
          gridProps.parentRowSpace,
      );
    });
    it("should return max number for BOTTOM Direction with or without Resizing", () => {
      const depth = 2;
      expect(
        getMaxY(
          collisionTree,
          gridProps,
          ReflowDirection.BOTTOM,
          depth,
          230,
          false,
        ),
      ).toBe(Infinity);
    });
  });

  describe("Test getReflowDistance method", () => {
    const collisionTree = {
        id: "1234",
        left: 90,
        top: 100,
        right: 150,
        bottom: 140,
        children: [],
      },
      width =
        (collisionTree.right - collisionTree.left) *
        gridProps.parentColumnSpace,
      height =
        (collisionTree.bottom - collisionTree.top) * gridProps.parentRowSpace;

    it("should return distance for space in TOP direction", () => {
      //before it reaches max limit
      let dimensionBeforeCollision = 40,
        emptySpaces = 20,
        maxDistance = -60 * gridProps.parentRowSpace;
      expect(
        getReflowDistance(
          collisionTree,
          ReflowDirection.TOP,
          maxDistance,
          dimensionBeforeCollision,
          height,
          emptySpaces,
          gridProps.parentRowSpace,
        ),
      ).toBe(
        -1 *
          (dimensionBeforeCollision - emptySpaces) *
          gridProps.parentRowSpace,
      );

      //reflowing past max limit
      dimensionBeforeCollision = 90;
      expect(
        getReflowDistance(
          collisionTree,
          ReflowDirection.TOP,
          maxDistance,
          dimensionBeforeCollision,
          height,
          emptySpaces,
          gridProps.parentRowSpace,
        ),
      ).toBe(maxDistance);
    });

    it("should return distance for space in LEFT direction", () => {
      //before it reaches max limit
      let dimensionBeforeCollision = 40,
        emptySpaces = 20,
        maxDistance = -60 * gridProps.parentRowSpace;
      expect(
        getReflowDistance(
          collisionTree,
          ReflowDirection.LEFT,
          maxDistance,
          dimensionBeforeCollision,
          height,
          emptySpaces,
          gridProps.parentRowSpace,
        ),
      ).toBe(
        -1 *
          (dimensionBeforeCollision - emptySpaces) *
          gridProps.parentRowSpace,
      );

      //reflowing past max limit
      dimensionBeforeCollision = 90;
      expect(
        getReflowDistance(
          collisionTree,
          ReflowDirection.LEFT,
          maxDistance,
          dimensionBeforeCollision,
          height,
          emptySpaces,
          gridProps.parentRowSpace,
        ),
      ).toBe(maxDistance);
    });

    it("should return distance for space in RIGHT direction", () => {
      //before it reaches max limit
      let dimensionBeforeCollision = -40,
        emptySpaces = 20,
        maxDistance = 60 * gridProps.parentRowSpace;
      expect(
        getReflowDistance(
          collisionTree,
          ReflowDirection.RIGHT,
          maxDistance,
          dimensionBeforeCollision,
          width,
          emptySpaces,
          gridProps.parentColumnSpace,
        ),
      ).toBe(
        -1 *
          (dimensionBeforeCollision + emptySpaces) *
          gridProps.parentColumnSpace,
      );

      //reflowing past max limit
      dimensionBeforeCollision = -90;
      expect(
        getReflowDistance(
          collisionTree,
          ReflowDirection.RIGHT,
          maxDistance,
          dimensionBeforeCollision,
          width,
          emptySpaces,
          gridProps.parentColumnSpace,
        ),
      ).toBe(maxDistance);
    });
  });

  describe("Test getReflowedDimension method", () => {
    const collisionTree = {
        id: "1234",
        left: 90,
        top: 100,
        right: 150,
        bottom: 140,
        children: [],
      },
      width =
        (collisionTree.right - collisionTree.left) *
        gridProps.parentColumnSpace,
      height =
        (collisionTree.bottom - collisionTree.top) * gridProps.parentRowSpace;

    describe("should return resized height in TOP direction", () => {
      let dimensionBeforeCollision = 40,
        emptySpaces = 20,
        maxDistance = -60 * gridProps.parentRowSpace,
        travelDistance = -50;

      it("should return height when resize is off", () => {
        expect(
          getReflowedDimension(
            collisionTree,
            ReflowDirection.TOP,
            travelDistance * gridProps.parentRowSpace,
            maxDistance,
            dimensionBeforeCollision,
            gridProps.parentRowSpace,
            emptySpaces,
            VERTICAL_RESIZE_LIMIT,
          ),
        ).toBe(height);
      });

      it("should return height before resize threshold", () => {
        expect(
          getReflowedDimension(
            collisionTree,
            ReflowDirection.TOP,
            travelDistance * gridProps.parentRowSpace,
            maxDistance,
            dimensionBeforeCollision,
            gridProps.parentRowSpace,
            emptySpaces,
            VERTICAL_RESIZE_LIMIT,
            true,
          ),
        ).toBe(height);
      });
      it("should return resized height after resize threshold before min height", () => {
        dimensionBeforeCollision = 100;
        const resizedHeight =
          maxDistance +
          (dimensionBeforeCollision - emptySpaces) * gridProps.parentRowSpace;
        expect(
          getReflowedDimension(
            collisionTree,
            ReflowDirection.TOP,
            travelDistance * gridProps.parentRowSpace,
            maxDistance,
            dimensionBeforeCollision,
            gridProps.parentRowSpace,
            emptySpaces,
            VERTICAL_RESIZE_LIMIT,
            true,
          ),
        ).toBe(resizedHeight);
      });
      it("should return min height after resize threshold after reaching min height", () => {
        dimensionBeforeCollision = 130;
        expect(
          getReflowedDimension(
            collisionTree,
            ReflowDirection.TOP,
            travelDistance * gridProps.parentRowSpace,
            maxDistance,
            dimensionBeforeCollision,
            gridProps.parentRowSpace,
            emptySpaces,
            VERTICAL_RESIZE_LIMIT,
            true,
          ),
        ).toBe(VERTICAL_RESIZE_LIMIT * gridProps.parentRowSpace);
      });
    });

    describe("should return resized width in LEFT direction", () => {
      let dimensionBeforeCollision = 40,
        emptySpaces = 20,
        maxDistance = -60 * gridProps.parentColumnSpace,
        travelDistance = -50;

      it("should return width when resize is off", () => {
        expect(
          getReflowedDimension(
            collisionTree,
            ReflowDirection.LEFT,
            travelDistance * gridProps.parentColumnSpace,
            maxDistance,
            dimensionBeforeCollision,
            gridProps.parentColumnSpace,
            emptySpaces,
            HORIZONTAL_RESIZE_LIMIT,
          ),
        ).toBe(width);
      });

      it("should return width before resize threshold", () => {
        expect(
          getReflowedDimension(
            collisionTree,
            ReflowDirection.LEFT,
            travelDistance * gridProps.parentColumnSpace,
            maxDistance,
            dimensionBeforeCollision,
            gridProps.parentColumnSpace,
            emptySpaces,
            HORIZONTAL_RESIZE_LIMIT,
            true,
          ),
        ).toBe(width);
      });

      it("should return resized width after resize threshold before min width", () => {
        dimensionBeforeCollision = 110;
        const resizedWidth =
          maxDistance +
          (dimensionBeforeCollision - emptySpaces) *
            gridProps.parentColumnSpace;
        expect(
          getReflowedDimension(
            collisionTree,
            ReflowDirection.LEFT,
            travelDistance * gridProps.parentColumnSpace,
            maxDistance,
            dimensionBeforeCollision,
            gridProps.parentColumnSpace,
            emptySpaces,
            HORIZONTAL_RESIZE_LIMIT,
            true,
          ),
        ).toBe(resizedWidth);
      });
      it("should return min width after resize threshold after reaching min width", () => {
        dimensionBeforeCollision = 150;
        expect(
          getReflowedDimension(
            collisionTree,
            ReflowDirection.LEFT,
            travelDistance * gridProps.parentColumnSpace,
            maxDistance,
            dimensionBeforeCollision,
            gridProps.parentColumnSpace,
            emptySpaces,
            HORIZONTAL_RESIZE_LIMIT,
            true,
          ),
        ).toBe(HORIZONTAL_RESIZE_LIMIT * gridProps.parentColumnSpace);
      });
    });

    describe("should return resized width in RIGHT direction", () => {
      let dimensionBeforeCollision = -40,
        emptySpaces = 20,
        maxDistance = 60 * gridProps.parentColumnSpace,
        travelDistance = 50;

      it("should return width when resize is off", () => {
        expect(
          getReflowedDimension(
            collisionTree,
            ReflowDirection.RIGHT,
            travelDistance * gridProps.parentColumnSpace,
            maxDistance,
            dimensionBeforeCollision,
            gridProps.parentColumnSpace,
            emptySpaces,
            HORIZONTAL_RESIZE_LIMIT,
          ),
        ).toBe(width);
      });

      it("should return width before resize threshold", () => {
        expect(
          getReflowedDimension(
            collisionTree,
            ReflowDirection.RIGHT,
            travelDistance * gridProps.parentColumnSpace,
            maxDistance,
            dimensionBeforeCollision,
            gridProps.parentColumnSpace,
            emptySpaces,
            HORIZONTAL_RESIZE_LIMIT,
            true,
          ),
        ).toBe(width);
      });

      it("should return resized width after resize threshold before min width", () => {
        dimensionBeforeCollision = -110;
        const resizedWidth =
          -1 *
            (dimensionBeforeCollision + emptySpaces) *
            gridProps.parentColumnSpace -
          maxDistance;
        expect(
          getReflowedDimension(
            collisionTree,
            ReflowDirection.RIGHT,
            travelDistance * gridProps.parentColumnSpace,
            maxDistance,
            dimensionBeforeCollision,
            gridProps.parentColumnSpace,
            emptySpaces,
            HORIZONTAL_RESIZE_LIMIT,
            true,
          ),
        ).toBe(resizedWidth);
      });
      it("should return min width after resize threshold after reaching min width", () => {
        dimensionBeforeCollision = -150;
        expect(
          getReflowedDimension(
            collisionTree,
            ReflowDirection.RIGHT,
            travelDistance * gridProps.parentColumnSpace,
            maxDistance,
            dimensionBeforeCollision,
            gridProps.parentColumnSpace,
            emptySpaces,
            HORIZONTAL_RESIZE_LIMIT,
            true,
          ),
        ).toBe(HORIZONTAL_RESIZE_LIMIT * gridProps.parentColumnSpace);
      });
    });
  });
  describe("Test ShouldAddToCollisionSpacesArray method", () => {
    const newSpacePosition = {
      id: "1234",
      left: 40,
      top: 30,
      right: 60,
      bottom: 90,
      children: [],
    };
    const OGPosition = {
      id: "1234",
      left: 40,
      top: 30,
      right: 60,
      bottom: 70,
      children: [],
    };
    const collidingSpace = {
      id: "1235",
      left: 30,
      top: 80,
      right: 50,
      bottom: 110,
      children: [],
    };
    const gridProps = {
      parentRowSpace: 10,
      parentRowSpace: 10,
    };
    const accessors = getAccessor(ReflowDirection.BOTTOM);

    it("should return false if not intersecting", () => {
      const localCollidingSpace = {
        id: "1235",
        left: 30,
        top: 90,
        right: 50,
        bottom: 110,
        children: [],
      };
      expect(
        ShouldAddToCollisionSpacesArray(
          newSpacePosition,
          OGPosition,
          localCollidingSpace,
          ReflowDirection.BOTTOM,
        ).shouldAddToArray,
      ).toBe(false);
    });
    it("should return true while intersecting after confirming with previous movement map", () => {
      const prevMovementMap = {
        "1235": {
          directionY: ReflowDirection.BOTTOM,
        },
      };
      expect(
        ShouldAddToCollisionSpacesArray(
          newSpacePosition,
          OGPosition,
          collidingSpace,
          ReflowDirection.BOTTOM,
          accessors,
          true,
          gridProps,
          ReflowDirection.BOTTOM,
          prevMovementMap,
        ).shouldAddToArray,
      ).toBe(true);
    });
    it("should return false while intersecting after failing confirmation with previous movement map", () => {
      const prevMovementMap = {
        "1235": {
          directionY: ReflowDirection.TOP,
        },
      };
      expect(
        ShouldAddToCollisionSpacesArray(
          newSpacePosition,
          OGPosition,
          collidingSpace,
          ReflowDirection.BOTTOM,
          accessors,
          true,
          gridProps,
          ReflowDirection.BOTTOM,
          prevMovementMap,
        ).shouldAddToArray,
      ).toBe(false);
    });
    it("should return true while intersecting with isSecondaryCollidingWidget as false", () => {
      expect(
        ShouldAddToCollisionSpacesArray(
          newSpacePosition,
          OGPosition,
          collidingSpace,
          ReflowDirection.BOTTOM,
          accessors,
          false,
          gridProps,
          ReflowDirection.BOTTOM,
        ).shouldAddToArray,
      ).toBe(true);
    });

    it("should return true while intersecting with isSecondaryCollidingWidget as true and no prevSecondOrderCollisionMap", () => {
      expect(
        ShouldAddToCollisionSpacesArray(
          newSpacePosition,
          OGPosition,
          collidingSpace,
          ReflowDirection.BOTTOM,
          accessors,
          true,
          gridProps,
          ReflowDirection.BOTTOM,
          {},
        ).shouldAddToArray,
      ).toBe(true);
    });
    it("should return true while intersecting with isSecondaryCollidingWidget as true, no prevMovementMap but with prevSecondOrderCollisionMap", () => {
      expect(
        ShouldAddToCollisionSpacesArray(
          newSpacePosition,
          OGPosition,
          collidingSpace,
          ReflowDirection.BOTTOM,
          accessors,
          true,
          gridProps,
          ReflowDirection.BOTTOM,
          {},
          {},
        ).shouldAddToArray,
      ).toBe(true);
    });
  });
  describe("Test filterSpaceByDirection and filterCommonSpaces method", () => {
    const occupiedSpaceMap = {
      "1235": {
        id: "1235",
        left: 10,
        top: 10,
        right: 35,
        bottom: 25,
      },
      "1236": {
        id: "1236",
        left: 30,
        top: 20,
        right: 50,
        bottom: 35,
      },
      "1237": {
        id: "1237",
        left: 40,
        top: 10,
        right: 40,
        bottom: 55,
      },
      "1238": {
        id: "1238",
        left: 90,
        top: 60,
        right: 130,
        bottom: 90,
      },
    };
    const filteredSpaceMap = {
      "1237": {
        id: "1237",
        left: 40,
        top: 10,
        right: 40,
        bottom: 55,
      },
      "1238": {
        id: "1238",
        left: 90,
        top: 60,
        right: 130,
        bottom: 90,
      },
    };
    it("filters spaces in a BOTTOM direction", () => {
      const spaceToFilterFrom = {
        id: "1234",
        left: 40,
        top: 50,
        right: 80,
        bottom: 70,
      };

      expect(
        filterSpaceByDirection(
          spaceToFilterFrom,
          Object.values(occupiedSpaceMap),
          ReflowDirection.BOTTOM,
        ),
      ).toEqual(Object.values(filteredSpaceMap));
    });

    it("filters out common spaces", () => {
      const spacesToFilter = {
        "1236": {},
        "1235": {},
      };
      filterCommonSpaces(spacesToFilter, occupiedSpaceMap);
      expect(occupiedSpaceMap).toEqual(filteredSpaceMap);
    });
  });
  describe("Test getSpacesMapFromArray method", () => {
    const occupiedSpaceMap = {
      "1235": {
        id: "1235",
        left: 10,
        top: 10,
        right: 35,
        bottom: 25,
      },
      "1236": {
        id: "1236",
        left: 30,
        top: 20,
        right: 50,
        bottom: 35,
      },
      "1237": {
        id: "1237",
        left: 40,
        top: 10,
        right: 40,
        bottom: 55,
      },
      "1238": {
        id: "1238",
        left: 90,
        top: 60,
        right: 130,
        bottom: 90,
      },
    };
    it("should return an map from array", () => {
      expect(getSpacesMapFromArray(Object.values(occupiedSpaceMap))).toEqual(
        occupiedSpaceMap,
      );
    });
  });
  describe("Test buildArrayToCollisionMap method", () => {
    const collidingSpaces = [
      {
        id: "1235",
        left: 10,
        top: 10,
        right: 35,
        bottom: 25,
        collidingValue: 20,
        direction: ReflowDirection.BOTTOM,
      },
      {
        id: "1236",
        left: 30,
        top: 20,
        right: 50,
        bottom: 35,
        collidingValue: 10,
        direction: ReflowDirection.LEFT,
      },
      {
        id: "1237",
        left: 40,
        top: 10,
        right: 40,
        bottom: 55,
        collidingValue: 10,
        direction: ReflowDirection.TOP,
      },
      {
        id: "1235",
        left: 10,
        top: 10,
        right: 35,
        bottom: 25,
        collidingValue: 40,
        direction: ReflowDirection.BOTTOM,
      },
      {
        id: "1237",
        left: 40,
        top: 10,
        right: 40,
        bottom: 55,
        collidingValue: 50,
        direction: ReflowDirection.TOP,
      },
      {
        id: "1238",
        left: 90,
        top: 60,
        right: 130,
        bottom: 90,
        collidingValue: 30,
        direction: ReflowDirection.BOTTOM,
      },
    ];
    it("should return an map from array", () => {
      const collidingSpaceMap = {
        "1236": {
          id: "1236",
          left: 30,
          top: 20,
          right: 50,
          bottom: 35,
          collidingValue: 10,
          direction: ReflowDirection.LEFT,
          order: 2,
        },
        "1237": {
          id: "1237",
          left: 40,
          top: 10,
          right: 40,
          bottom: 55,
          collidingValue: 10,
          direction: ReflowDirection.TOP,
          order: 3,
        },
        "1235": {
          id: "1235",
          left: 10,
          top: 10,
          right: 35,
          bottom: 25,
          collidingValue: 40,
          direction: ReflowDirection.BOTTOM,
          order: 4,
        },
        "1238": {
          id: "1238",
          left: 90,
          top: 60,
          right: 130,
          bottom: 90,
          collidingValue: 30,
          direction: ReflowDirection.BOTTOM,
          order: 5,
        },
      };
      expect(buildArrayToCollisionMap(collidingSpaces)).toEqual(
        collidingSpaceMap,
      );
    });
  });
  describe("Test getModifiedOccupiedSpacesMap method", () => {
    const occupiedSpaceMap = {
      "1236": {
        id: "1236",
        left: 30,
        top: 20,
        right: 50,
        bottom: 35,
      },
      "1237": {
        id: "1237",
        left: 40,
        top: 10,
        right: 40,
        bottom: 55,
      },
      "1235": {
        id: "1235",
        left: 10,
        top: 10,
        right: 35,
        bottom: 25,
      },
      "1238": {
        id: "1238",
        left: 90,
        top: 60,
        right: 130,
        bottom: 90,
      },
    };
    const gridProps = {
      parentColumnSpace: 10,
      parentRowSpace: 10,
    };
    const prevMovementMap = {
      "1236": {
        Y: 10,
        height: 150,
      },
      "1237": {
        X: 20,
        width: 180,
      },
      "1238": {
        X: -100,
        Y: -80,
        width: 400,
        height: 200,
      },
    };
    it("should return horizontally modified occupied spaces map", () => {
      const modifiedOccupiedSpacesMap = {
        "1235": {
          id: "1235",
          left: 10,
          top: 10,
          right: 35,
          bottom: 25,
        },
        "1236": {
          id: "1236",
          left: 30,
          top: 20,
          right: 50,
          bottom: 35,
        },
        "1237": {
          id: "1237",
          left: 42,
          top: 10,
          right: 60,
          bottom: 55,
        },
        "1238": {
          id: "1238",
          left: 80,
          top: 60,
          right: 120,
          bottom: 90,
        },
      };
      expect(
        getModifiedOccupiedSpacesMap(
          occupiedSpaceMap,
          prevMovementMap,
          false,
          gridProps,
          SpaceAttributes.right,
          SpaceAttributes.left,
        ),
      ).toEqual(modifiedOccupiedSpacesMap);
    });
    it("should return vertically modified occupied spaces map", () => {
      const modifiedOccupiedSpacesMap = {
        "1235": {
          id: "1235",
          left: 10,
          top: 10,
          right: 35,
          bottom: 25,
        },
        "1236": {
          id: "1236",
          left: 30,
          top: 21,
          right: 50,
          bottom: 36,
        },
        "1237": {
          id: "1237",
          left: 40,
          top: 10,
          right: 40,
          bottom: 55,
        },
        "1238": {
          id: "1238",
          left: 90,
          top: 52,
          right: 130,
          bottom: 72,
        },
      };
      expect(
        getModifiedOccupiedSpacesMap(
          occupiedSpaceMap,
          prevMovementMap,
          true,
          gridProps,
          SpaceAttributes.bottom,
          SpaceAttributes.top,
        ),
      ).toEqual(modifiedOccupiedSpacesMap);
    });
  });
  describe("Test getModifiedCollidingSpace method", () => {
    const collidingSpace = {
      id: "1238",
      left: 90,
      top: 60,
      right: 130,
      bottom: 90,
    };
    const occupiedSpaceMap = {
      "1238": {
        id: "1238",
        left: 90,
        top: 60,
        right: 130,
        bottom: 90,
      },
    };
    const gridProps = {
      parentColumnSpace: 10,
      parentRowSpace: 10,
    };
    const prevMovementMap = {
      "1238": {
        X: -100,
        Y: -80,
        width: 400,
        height: 200,
      },
    };
    it("should return horizontally modified colliding Space", () => {
      const modifiedCollidingSpace = {
        id: "1238",
        left: 80,
        top: 60,
        right: 120,
        bottom: 90,
      };
      expect(
        getModifiedCollidingSpace(
          collidingSpace,
          occupiedSpaceMap,
          prevMovementMap,
          false,
          gridProps,
          SpaceAttributes.right,
          SpaceAttributes.left,
        ),
      ).toEqual(modifiedCollidingSpace);
    });
    it("should return vertically modified colliding Space", () => {
      const modifiedOccupiedSpacesMap = {
        id: "1238",
        left: 90,
        top: 52,
        right: 130,
        bottom: 72,
      };
      expect(
        getModifiedCollidingSpace(
          collidingSpace,
          occupiedSpaceMap,
          prevMovementMap,
          true,
          gridProps,
          SpaceAttributes.bottom,
          SpaceAttributes.top,
        ),
      ).toEqual(modifiedOccupiedSpacesMap);
    });
  });
  describe("Test checkReCollisionWithOtherNewSpacePositions", () => {
    const newSpacePositions = [
      {
        id: "1235",
        left: 10,
        top: 10,
        right: 35,
        bottom: 25,
      },
      {
        id: "1236",
        left: 30,
        top: 20,
        right: 50,
        bottom: 35,
      },
      {
        id: "1237",
        left: 40,
        top: 10,
        right: 60,
        bottom: 55,
      },
    ];
    it("should return false if there is no intersection", () => {
      const collidingSpace = {
        id: "1234",
        left: 110,
        top: 130,
        right: 150,
        bottom: 170,
      };
      expect(
        checkReCollisionWithOtherNewSpacePositions(
          collidingSpace,
          collidingSpace,
          ReflowDirection.BOTTOM,
          ReflowDirection.BOTTOM,
          newSpacePositions,
          [],
          1,
          {},
          {},
          {},
        ),
      ).toBe(false);
    });
    it("should return false when there is intersection but previous direction does not match", () => {
      const collidingSpace = {
        id: "1234",
        left: 40,
        top: 45,
        right: 60,
        bottom: 60,
      };
      const prevCollidingSpaceMap = {
        horizontal: {
          1234: {
            collidingId: "1237",
            direction: ReflowDirection.LEFT,
          },
        },
      };
      expect(
        checkReCollisionWithOtherNewSpacePositions(
          collidingSpace,
          collidingSpace,
          ReflowDirection.BOTTOM,
          ReflowDirection.BOTTOM,
          newSpacePositions,
          [],
          1,
          {},
          {},
          { prevCollidingSpaceMap },
        ),
      ).toBe(false);
    });
    it("should return false when there is intersection and direction matches but colliding value is lesser than before", () => {
      const collidingSpace = {
        id: "1234",
        left: 40,
        top: 45,
        right: 60,
        bottom: 60,
        collidingValue: 60,
      };
      expect(
        checkReCollisionWithOtherNewSpacePositions(
          collidingSpace,
          collidingSpace,
          ReflowDirection.BOTTOM,
          ReflowDirection.BOTTOM,
          newSpacePositions,
          [],
          1,
          {},
          {},
          {},
        ),
      ).toBe(false);
    });
    it("should return true when there is intersection and direction matches but colliding value is greater than before", () => {
      const collidingSpace = {
        id: "1234",
        left: 40,
        top: 45,
        right: 60,
        bottom: 60,
        collidingValue: 50,
      };
      expect(
        checkReCollisionWithOtherNewSpacePositions(
          collidingSpace,
          collidingSpace,
          ReflowDirection.BOTTOM,
          ReflowDirection.BOTTOM,
          newSpacePositions,
          [],
          1,
          {},
          {},
          {},
        ),
      ).toBe(true);
    });
    it("should return true when there is intersection, colliding value is greater than before, previous direction does not match but is second run so it is forced in current direction", () => {
      const collidingSpace = {
        id: "1234",
        left: 40,
        top: 45,
        right: 60,
        bottom: 60,
        collidingValue: 50,
      };
      const prevCollidingSpaceMap = {
        horizontal: {
          1234: {
            collidingId: "1237",
            direction: ReflowDirection.LEFT,
          },
        },
      };
      expect(
        checkReCollisionWithOtherNewSpacePositions(
          collidingSpace,
          collidingSpace,
          ReflowDirection.BOTTOM,
          ReflowDirection.BOTTOM,
          newSpacePositions,
          [],
          1,
          {},
          {},
          { prevCollidingSpaceMap },
          true,
        ),
      ).toBe(true);
    });
  });

  describe("Test getCalculatedDirection method", () => {
    it("should return passed direction for composite direction", () => {
      expect(
        getCalculatedDirection({}, {}, ReflowDirection.BOTTOMLEFT),
      ).toEqual([ReflowDirection.BOTTOMLEFT]);
    });
    it("should return Top direction if moved only in top direction, regardless of passed direction", () => {
      const newSpacePositions = {
        "1234": {
          top: 50,
          left: 70,
        },
      };
      const prevSpacePositions = {
        "1234": {
          top: 55,
          left: 70,
        },
      };
      expect(
        getCalculatedDirection(
          newSpacePositions,
          prevSpacePositions,
          ReflowDirection.BOTTOM,
        ),
      ).toEqual([ReflowDirection.TOP]);
    });
    it("should return right direction if moved only in right direction, regardless of passed direction", () => {
      const newSpacePositions = {
        "1234": {
          top: 50,
          left: 70,
        },
      };
      const prevSpacePositions = {
        "1234": {
          top: 50,
          left: 65,
        },
      };
      expect(
        getCalculatedDirection(
          newSpacePositions,
          prevSpacePositions,
          ReflowDirection.BOTTOM,
        ),
      ).toEqual([ReflowDirection.RIGHT]);
    });
    it("should return bottom and left direction if moved in both bottom and left direction, regardless of passed direction", () => {
      const newSpacePositions = {
        "1234": {
          top: 50,
          left: 70,
        },
      };
      const prevSpacePositions = {
        "1234": {
          top: 45,
          left: 75,
        },
      };
      expect(
        getCalculatedDirection(
          newSpacePositions,
          prevSpacePositions,
          ReflowDirection.BOTTOM,
        ),
      ).toEqual([ReflowDirection.BOTTOM, ReflowDirection.LEFT]);
    });
  });

  describe("test getBottomMostRow", () => {
    const occupiedSpaces = [
      { bottom: 10 },
      { bottom: 15 },
      { bottom: 90 },
      { bottom: 5 },
      { bottom: 67 },
      { bottom: 48 },
      { bottom: 36 },
    ];
    it("should return bottom most row from the array", () => {
      expect(getBottomMostRow(occupiedSpaces)).toBe(90);
    });
  });

  describe("test initializeMovementLimitMap", () => {
    const occupiedSpaces = [
      { id: "12" },
      { id: "13" },
      { id: "14" },
      { id: "15" },
      { id: "16" },
    ];
    const initialMovementLimitMap = {
      "12": {
        canHorizontalMove: true,
        canVerticalMove: true,
      },
      "13": {
        canHorizontalMove: true,
        canVerticalMove: true,
      },
      "14": {
        canHorizontalMove: true,
        canVerticalMove: true,
      },
      "15": {
        canHorizontalMove: true,
        canVerticalMove: true,
      },
      "16": {
        canHorizontalMove: true,
        canVerticalMove: true,
      },
    };
    it("should return a map with all the spaces with canHorizontalMove and canVerticalMove set as true", () => {
      expect(initializeMovementLimitMap(occupiedSpaces)).toEqual(
        initialMovementLimitMap,
      );
    });
  });
  describe("test checkProcessNodeForTree", () => {
    const collidingSpace = {
      id: "1234",
      collidingValue: 10,
      direction: ReflowDirection.BOTTOM,
    };
    it("should be true if the processed nodes object is undefined", () => {
      const processedNodes = {};
      expect(checkProcessNodeForTree(collidingSpace, processedNodes)).toEqual({
        shouldProcessNode: true,
      });
    });
    it("should be false if the current node has a value in the opposite direction", () => {
      const processedNodes = {
        "1234": {
          TOP: {
            value: 15,
          },
        },
      };
      expect(checkProcessNodeForTree(collidingSpace, processedNodes)).toEqual({
        shouldProcessNode: false,
      });
    });
    it("should be true if the current node is not processed in the current direction", () => {
      const processedNodes = {
        "1234": {
          LEFT: {
            value: 15,
          },
        },
      };
      expect(checkProcessNodeForTree(collidingSpace, processedNodes)).toEqual({
        shouldProcessNode: true,
      });
    });
    it("should be false if the current node is processed in the current direction if the current node's colliding value is lesser", () => {
      const processedNodes = {
        "1234": {
          BOTTOM: {
            value: 15,
          },
        },
      };
      expect(checkProcessNodeForTree(collidingSpace, processedNodes)).toEqual({
        shouldProcessNode: false,
      });
    });
    it("should be true if the current node is processed in the current direction if the current node's colliding value is greater", () => {
      const processedNodes = {
        "1234": {
          BOTTOM: { value: 5 },
        },
      };
      expect(checkProcessNodeForTree(collidingSpace, processedNodes)).toEqual({
        shouldProcessNode: true,
      });
    });
    it("should be false and return cached values if colliding values equal each other", () => {
      const processedNodes = {
        "1234": {
          BOTTOM: {
            value: 10,
            depth: 5,
            occupiedSpace: 10,
            currentEmptySpaces: 10,
          },
        },
      };
      expect(checkProcessNodeForTree(collidingSpace, processedNodes)).toEqual({
        shouldProcessNode: false,
        depth: 5,
        occupiedSpace: 10,
        currentEmptySpaces: 10,
      });
    });
  });

  describe("test getRelativeCollidingValue", () => {
    const gridProps = {
      maxGridColumns: 64,
    };
    it("should return original colliding value if direction is Bottom", () => {
      const direction = ReflowDirection.BOTTOM;
      const accessors = getAccessor(direction);
      const collidingValue = 10;
      const depth = 5;
      expect(
        getRelativeCollidingValue(
          accessors,
          collidingValue,
          direction,
          gridProps,
          depth,
        ),
      ).toBe(collidingValue);
    });
    it("should return original colliding value if depth is less compared to colliding value", () => {
      const direction = ReflowDirection.TOP;
      const accessors = getAccessor(direction);
      const collidingValue = 8;
      const depth = 1;
      expect(
        getRelativeCollidingValue(
          accessors,
          collidingValue,
          direction,
          gridProps,
          depth,
        ),
      ).toBe(collidingValue);
    });
    it("should return calculated colliding value if depth is high compared to colliding value in TOP direction", () => {
      const direction = ReflowDirection.TOP;
      const accessors = getAccessor(direction);
      const collidingValue = 8;
      const depth = 3;
      expect(
        getRelativeCollidingValue(
          accessors,
          collidingValue,
          direction,
          gridProps,
          depth,
        ),
      ).toBe(depth * VERTICAL_RESIZE_LIMIT);
    });
    it("should return calculated colliding value if depth is high compared to colliding value in LEFT direction", () => {
      const direction = ReflowDirection.LEFT;
      const accessors = getAccessor(direction);
      const collidingValue = 5;
      const depth = 3;
      expect(
        getRelativeCollidingValue(
          accessors,
          collidingValue,
          direction,
          gridProps,
          depth,
        ),
      ).toBe(depth * HORIZONTAL_RESIZE_LIMIT);
    });
    it("should return calculated colliding value if depth is high compared to colliding value in RIGHT direction", () => {
      const direction = ReflowDirection.RIGHT;
      const accessors = getAccessor(direction);
      const collidingValue = 60;
      const depth = 3;
      expect(
        getRelativeCollidingValue(
          accessors,
          collidingValue,
          direction,
          gridProps,
          depth,
        ),
      ).toBe(gridProps.maxGridColumns - depth * HORIZONTAL_RESIZE_LIMIT);
    });
  });
});
