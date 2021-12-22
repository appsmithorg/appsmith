import { ReflowDirection } from "reflow/reflowTypes";
import {
  getAccessor,
  getIsHorizontalMove,
  shouldReplaceOldMovement,
  getResizedDimensions,
  sortCollidingSpacesByDistance,
  getShouldReflow,
  getDelta,
  getCollidingSpaces,
  getCollidingSpacesInDirection,
  filterSpaceById,
  getMaxX,
  getMaxY,
  getReflowDistance,
  getResizedDimension,
} from "../reflowUtils";
import { HORIZONTAL_RESIZE_LIMIT, VERTICAL_RESIZE_LIMIT } from "../reflowTypes";

const gridProps = {
  parentColumnSpace: 20,
  parentRowSpace: 10,
  maxGridColumns: 100,
};

describe("Test reflow util methods", () => {
  describe("Test getIsHorizontalMove method", () => {
    it("should return true when there is a difference in horizonatal direction coordinates", () => {
      const newPositions = {
          left: 20,
          right: 40,
        },
        oldPositions = {
          left: 10,
          right: 30,
        };
      expect(getIsHorizontalMove(newPositions, oldPositions)).toBe(true);
    });
    it("should return false when there is no difference  horizontal direction coordinates", () => {
      const newPositions = {
          left: 20,
          right: 40,
        },
        oldPositions = {
          left: 20,
          right: 40,
        };
      expect(getIsHorizontalMove(newPositions, oldPositions)).toBe(false);
    });
  });

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
    it("should return Resized Dimensions based on dimensionbeforeCollision and the emptySpaces in between", () => {
      const collisionTree = {
          right: 20,
        },
        distanceBeforeCollision = -20,
        emptySpaces = 10,
        accesssors = getAccessor(ReflowDirection.RIGHT);
      const resizedDimension = {
        right: 30,
      };

      expect(
        getResizedDimensions(
          collisionTree,
          distanceBeforeCollision,
          emptySpaces,
          accesssors,
        ).right,
      ).toBe(resizedDimension.right);
    });
  });

  describe("Test sortCollidingSpacesByDistance method", () => {
    const collisionSpaces = [
        {
          direction: ReflowDirection.RIGHT,
          left: 100,
        },
        {
          direction: ReflowDirection.LEFT,
          right: 30,
        },
        {
          direction: ReflowDirection.BOTTOM,
          top: 110,
        },
        {
          direction: ReflowDirection.TOP,
          bottom: 0,
        },
      ],
      staticPosition = {
        right: 80,
        left: 40,
        bottom: 70,
        top: 30,
      };

    it("should sort the collidingSpaces with respect to the distance from the staticPosition in a Ascending manner", () => {
      const sortedCollisionSpaces = [
        {
          direction: ReflowDirection.LEFT,
          right: 30,
        },
        {
          direction: ReflowDirection.RIGHT,
          left: 100,
        },
        {
          direction: ReflowDirection.TOP,
          bottom: 0,
        },
        {
          direction: ReflowDirection.BOTTOM,
          top: 110,
        },
      ];
      sortCollidingSpacesByDistance(collisionSpaces, staticPosition, true);
      expect(collisionSpaces).toEqual(sortedCollisionSpaces);
    });
    it("should sort the collidingSpaces with respect to the distance from the staticPosition in a descending manner", () => {
      const sortedCollisionSpaces = [
        {
          direction: ReflowDirection.BOTTOM,
          top: 110,
        },
        {
          direction: ReflowDirection.TOP,
          bottom: 0,
        },
        {
          direction: ReflowDirection.RIGHT,
          left: 100,
        },
        {
          direction: ReflowDirection.LEFT,
          right: 30,
        },
      ];
      sortCollidingSpacesByDistance(collisionSpaces, staticPosition, false);
      expect(collisionSpaces).toEqual(sortedCollisionSpaces);
    });
  });

  describe("Test getShouldReflow method", () => {
    const staticPosition = {
      directionalMovements: [
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
      expect(getShouldReflow(staticPosition, { X: 25, Y: 0 })).toEqual({
        canHorizontalMove: true,
        canVerticalMove: true,
      });
      expect(getShouldReflow(staticPosition, { X: 35, Y: 0 })).toEqual({
        canHorizontalMove: false,
        canVerticalMove: true,
      });
      expect(getShouldReflow(staticPosition, { X: -25, Y: 0 })).toEqual({
        canHorizontalMove: true,
        canVerticalMove: true,
      });
      expect(getShouldReflow(staticPosition, { X: -35, Y: 0 })).toEqual({
        canHorizontalMove: false,
        canVerticalMove: true,
      });
      expect(getShouldReflow(staticPosition, { X: 0, Y: 25 })).toEqual({
        canHorizontalMove: true,
        canVerticalMove: true,
      });
      expect(getShouldReflow(staticPosition, { X: 0, Y: 35 })).toEqual({
        canHorizontalMove: true,
        canVerticalMove: false,
      });
      expect(getShouldReflow(staticPosition, { X: 0, Y: -25 })).toEqual({
        canHorizontalMove: true,
        canVerticalMove: true,
      });
      expect(getShouldReflow(staticPosition, { X: 0, Y: -35 })).toEqual({
        canHorizontalMove: true,
        canVerticalMove: false,
      });
    });
  });

  describe("Test getDelta method", () => {
    const OGPositions = {
        id: "1234",
        left: 50,
        top: 50,
        right: 110,
        bottom: 110,
      },
      newPositions = {
        id: "1234",
        left: 40,
        top: 30,
        right: 80,
        bottom: 70,
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
    const newPositions = {
        id: "1234",
        left: 40,
        top: 30,
        right: 80,
        bottom: 70,
      },
      occupiedSpaces = [
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
        },
        "1237": {
          id: "1237",
          left: 10,
          top: 10,
          right: 90,
          bottom: 80,
          direction: "BOTTOM",
        },
      };
      expect(
        getCollidingSpaces(newPositions, ReflowDirection.BOTTOM, occupiedSpaces)
          .collidingSpaceMap,
      ).toEqual(collidingSpaces);
    });

    it("should return collidingSpaces with predicted direction based on Previous positions", () => {
      const collidingSpaces = {
          "1236": {
            id: "1236",
            left: 30,
            top: 20,
            right: 50,
            bottom: 35,
            direction: "LEFT",
          },
          "1237": {
            id: "1237",
            left: 10,
            top: 10,
            right: 90,
            bottom: 80,
            direction: "BOTTOM",
          },
        },
        prevPositions = {
          id: "1234",
          left: 50,
          top: 30,
          right: 90,
          bottom: 70,
        };
      expect(
        getCollidingSpaces(
          newPositions,
          ReflowDirection.BOTTOM,
          occupiedSpaces,
          true,
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
        },
      ];
      expect(
        getCollidingSpacesInDirection(
          newPositions,
          ReflowDirection.LEFT,
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

  describe("Test getResizedDimension method", () => {
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
          getResizedDimension(
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
          getResizedDimension(
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
          getResizedDimension(
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
          getResizedDimension(
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
          getResizedDimension(
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
          getResizedDimension(
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
          getResizedDimension(
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
          getResizedDimension(
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
          getResizedDimension(
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
          getResizedDimension(
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
          getResizedDimension(
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
          getResizedDimension(
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
});
