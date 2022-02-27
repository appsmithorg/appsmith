import { ReflowDirection } from "reflow/reflowTypes";
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
      ).toBe(false);
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
});
