import { ReflowDirection } from "reflow/reflowTypes";
import { getAccessor } from "reflow/reflowUtils";
import {
  getCollisionTree,
  getMovementMap,
  getModifiedArgumentsForCollisionTree,
  getHorizontalSpaceMovement,
  getVerticalSpaceMovement,
} from "../reflowHelpers";

describe("Test reflow helper methods", () => {
  describe("Test getCollisionTree method", () => {
    const occupiedSpacesMap = {
      "1": {
        top: 30,
        left: 20,
        right: 80,
        bottom: 50,
        id: "1",
      },
      "2": {
        top: 50,
        left: 40,
        right: 90,
        bottom: 70,
        id: "2",
      },
      "3": {
        top: 50,
        left: 10,
        right: 40,
        bottom: 70,
        id: "3",
      },
      "4": {
        top: 75,
        left: 20,
        right: 60,
        bottom: 95,
        id: "4",
      },
      "5": {
        top: 95,
        left: 20,
        right: 80,
        bottom: 130,
        id: "5",
      },
      "6": {
        id: "6",
        top: 5,
        left: 70,
        right: 110,
        bottom: 25,
      },
    };
    const gridProps = {
      parentRowSpace: 10,
      parentColumnSpace: 10,
      maxGridColumns: 200,
    };
    it("it should return a collision Tree for multiple directions", () => {
      const newSpacePositions = [
        {
          id: "0",
          top: 10,
          left: 20,
          right: 80,
          bottom: 40,
        },
      ];
      const collidingSpacesMap = {
        "1": {
          top: 30,
          left: 20,
          right: 80,
          bottom: 50,
          id: "1",
          collidingValue: 35,
          collidingId: "0",
          direction: ReflowDirection.BOTTOM,
        },
        "6": {
          id: "6",
          top: 5,
          left: 70,
          right: 110,
          bottom: 25,
          collidingValue: 80,
          collidingId: "0",
          direction: ReflowDirection.RIGHT,
        },
      };
      const collisionTrees = [
        {
          bottom: 50,
          children: {
            "2": {
              bottom: 70,
              children: {},
              collidingId: "1",
              collidingValue: 55,
              direction: ReflowDirection.BOTTOM,
              id: "2",
              isHorizontal: false,
              left: 40,
              order: 1,
              right: 90,
              top: 50,
            },
            "3": {
              bottom: 70,
              children: {},
              collidingId: "1",
              collidingValue: 55,
              direction: ReflowDirection.BOTTOM,
              id: "3",
              isHorizontal: false,
              left: 10,
              order: 2,
              right: 40,
              top: 50,
            },
          },
          collidingId: "0",
          collidingValue: 35,
          direction: ReflowDirection.BOTTOM,
          id: "1",
          left: 20,
          right: 80,
          top: 30,
        },
        {
          id: "6",
          top: 5,
          left: 70,
          right: 110,
          children: {},
          bottom: 25,
          collidingValue: 80,
          collidingId: "0",
          direction: ReflowDirection.RIGHT,
        },
      ];
      expect(
        getCollisionTree(
          newSpacePositions,
          Object.values(occupiedSpacesMap),
          occupiedSpacesMap,
          occupiedSpacesMap,
          Object.values(collidingSpacesMap),
          ReflowDirection.BOTTOM,
          false,
          collidingSpacesMap,
          gridProps,
          {},
          {},
        ).collisionTrees,
      ).toEqual(collisionTrees);
    });
    it("it should return a collision Tree for multiple dragging spaces, It should create a new branch in tree if one of the branch nodes are overlapping with another dragging space", () => {
      const newSpacePositions = [
        {
          id: "0",
          top: 10,
          left: 20,
          right: 80,
          bottom: 40,
        },
        {
          id: "0.5",
          top: 85,
          left: 20,
          right: 80,
          bottom: 110,
        },
      ];
      const collidingSpacesMap = {
        "1": {
          top: 30,
          left: 20,
          right: 80,
          bottom: 50,
          id: "1",
          collidingValue: 40,
          collidingId: "0",
          direction: ReflowDirection.BOTTOM,
        },
      };
      const collisionTrees = [
        {
          bottom: 50,
          children: {
            "2": {
              bottom: 70,
              children: {},
              collidingId: "1",
              collidingValue: 60,
              direction: ReflowDirection.BOTTOM,
              id: "2",
              isHorizontal: false,
              left: 40,
              order: 1,
              right: 90,
              top: 50,
            },
            "3": {
              bottom: 70,
              children: {},
              collidingId: "1",
              collidingValue: 60,
              direction: ReflowDirection.BOTTOM,
              id: "3",
              isHorizontal: false,
              left: 10,
              order: 2,
              right: 40,
              top: 50,
            },
          },
          collidingId: "0",
          collidingValue: 40,
          direction: ReflowDirection.BOTTOM,
          id: "1",
          left: 20,
          right: 80,
          top: 30,
        },
        {
          bottom: 95,
          children: {
            "5": {
              bottom: 130,
              children: {},
              collidingId: "4",
              collidingValue: 130,
              direction: "BOTTOM",
              id: "5",
              isHorizontal: false,
              left: 20,
              order: 1,
              right: 80,
              top: 95,
            },
          },
          collidingId: "0.5",
          collidingValue: 110,
          direction: "BOTTOM",
          id: "4",
          isHorizontal: false,
          left: 20,
          order: 0,
          right: 60,
          top: 75,
        },
      ];
      expect(
        getCollisionTree(
          newSpacePositions,
          Object.values(occupiedSpacesMap),
          occupiedSpacesMap,
          occupiedSpacesMap,
          Object.values(collidingSpacesMap),
          ReflowDirection.BOTTOM,
          false,
          collidingSpacesMap,
          gridProps,
          {},
          {},
        ).collisionTrees,
      ).toEqual(collisionTrees);
    });
  });
  describe("test getMovementMap method", () => {
    const occupiedSpacesMap = {
      "1": {
        top: 30,
        left: 20,
        right: 80,
        bottom: 50,
        id: "1",
      },
      "2": {
        top: 50,
        left: 40,
        right: 90,
        bottom: 70,
        id: "2",
      },
      "3": {
        top: 50,
        left: 10,
        right: 40,
        bottom: 70,
        id: "3",
      },
      "4": {
        top: 75,
        left: 20,
        right: 60,
        bottom: 95,
        id: "4",
      },
      "5": {
        top: 95,
        left: 20,
        right: 80,
        bottom: 130,
        id: "5",
      },
      "6": {
        id: "6",
        top: 5,
        left: 70,
        right: 110,
        bottom: 25,
      },
    };
    const gridProps = {
      parentRowSpace: 10,
      parentColumnSpace: 10,
      maxGridColumns: 200,
    };
    const delta = {
      X: 20,
      Y: 20,
    };
    it("should return movement map", () => {
      const newSpacePositionMap = {
        "0": {
          id: "0",
          top: 10,
          left: 20,
          right: 80,
          bottom: 40,
        },
      };
      const collidingSpacesMap = {
        "1": {
          top: 30,
          left: 20,
          right: 80,
          bottom: 50,
          id: "1",
          collidingValue: 35,
          collidingId: "0",
          direction: ReflowDirection.BOTTOM,
        },
        "6": {
          id: "6",
          top: 5,
          left: 70,
          right: 110,
          bottom: 25,
          collidingValue: 80,
          collidingId: "0",
          direction: ReflowDirection.RIGHT,
        },
      };
      const movementMap = {
        "1": {
          Y: 50,
          dimensionYBeforeCollision: -5,
          directionY: "BOTTOM",
          height: 200,
          maxY: Infinity,
          verticalDepth: 1,
          verticalEmptySpaces: 0,
          verticalMaxOccupiedSpace: 20,
        },
        "2": {
          Y: 50,
          dimensionYBeforeCollision: -5,
          directionY: "BOTTOM",
          height: 200,
          maxY: Infinity,
          verticalDepth: 0,
          verticalEmptySpaces: 0,
          verticalMaxOccupiedSpace: 0,
        },
        "3": {
          Y: 50,
          dimensionYBeforeCollision: -5,
          directionY: "BOTTOM",
          height: 200,
          maxY: Infinity,
          verticalDepth: 0,
          verticalEmptySpaces: 0,
          verticalMaxOccupiedSpace: 0,
        },
        "6": {
          X: 100,
          dimensionXBeforeCollision: -10,
          directionX: "RIGHT",
          horizontalDepth: 0,
          horizontalEmptySpaces: -46,
          horizontalMaxOccupiedSpace: 0,
          maxX: 900,
          width: 400,
        },
      };
      expect(
        getMovementMap(
          Object.values(newSpacePositionMap),
          newSpacePositionMap,
          Object.values(occupiedSpacesMap),
          occupiedSpacesMap,
          occupiedSpacesMap,
          Object.values(collidingSpacesMap),
          collidingSpacesMap,
          gridProps,
          delta,
          true,
          ReflowDirection.BOTTOM,
          false,
          {},
        ).movementMap,
      ).toEqual(movementMap);
    });
  });
  describe("test getModifiedArgumentsForCollisionTree method", () => {
    const occupiedSpacesMap = {
      "1": {
        top: 30,
        left: 20,
        right: 80,
        bottom: 50,
        id: "1",
      },
      "2": {
        top: 50,
        left: 40,
        right: 90,
        bottom: 70,
        id: "2",
      },
      "3": {
        top: 50,
        left: 10,
        right: 40,
        bottom: 70,
        id: "3",
      },
      "4": {
        top: 75,
        left: 20,
        right: 60,
        bottom: 95,
        id: "4",
      },
      "5": {
        top: 95,
        left: 20,
        right: 80,
        bottom: 130,
        id: "5",
      },
    };
    const collidingSpace = {
      top: 30,
      left: 20,
      right: 80,
      bottom: 50,
      id: "1",
      collidingValue: 40,
      collidingId: "0",
      direction: ReflowDirection.BOTTOM,
    };
    const gridProps = {
      parentRowSpace: 10,
      parentColumnSpace: 10,
      maxGridCOLUMNS: 200,
    };
    it("should return the same values if colliding in the same direction as parent", () => {
      const currentAccessors = getAccessor(ReflowDirection.BOTTOM),
        currentDirection = ReflowDirection.BOTTOM;
      expect(
        getModifiedArgumentsForCollisionTree(
          collidingSpace,
          Object.values(occupiedSpacesMap),
          occupiedSpacesMap,
          occupiedSpacesMap,
          currentDirection,
          false,
        ),
      ).toEqual({
        currentOccSpacesMap: occupiedSpacesMap,
        currentAccessors,
        currentDirection,
        currentOccSpaces: Object.values(occupiedSpacesMap),
        currentCollidingSpace: collidingSpace,
      });
    });
    it("should return modified values for other direction, based on previous movementMap", () => {
      const currentAccessors = getAccessor(ReflowDirection.BOTTOM),
        currentDirection = ReflowDirection.BOTTOM;
      const prevMovementMap = {
        "1": {
          Y: 250,
          height: 200,
        },
        "3": {
          X: 100,
          width: 300,
        },
        "5": {
          X: 170,
          Y: 210,
          width: 400,
          height: 300,
        },
      };
      const currentOccSpacesMap = {
        ...occupiedSpacesMap,
        "3": {
          ...occupiedSpacesMap["3"],
          left: 20,
          right: 50,
        },
        "5": {
          ...occupiedSpacesMap["5"],
          left: 37,
          right: 77,
        },
      };
      expect(
        getModifiedArgumentsForCollisionTree(
          collidingSpace,
          Object.values(occupiedSpacesMap),
          occupiedSpacesMap,
          occupiedSpacesMap,
          ReflowDirection.RIGHT,
          true,
          prevMovementMap,
          gridProps,
        ),
      ).toEqual({
        currentOccSpacesMap,
        currentAccessors,
        currentDirection,
        currentOccSpaces: Object.values(currentOccSpacesMap),
        currentCollidingSpace: collidingSpace,
      });
    });
  });
  describe("test getHorizontalSpaceMovement and getVerticalSpaceMovement methods", () => {
    const collisionTree = {
        top: 30,
        left: 20,
        right: 50,
        bottom: 50,
        id: "1",
        collidingValue: 40,
        collidingId: "0",
        direction: ReflowDirection.BOTTOM,
      },
      gridProps = {
        parentRowSpace: 10,
        parentColumnSpace: 10,
        maxGridColumns: 64,
      },
      delta = {
        X: 20,
        Y: 20,
      };
    it("should return Horizontal Movement Metrics", () => {
      expect(
        getHorizontalSpaceMovement(
          collisionTree,
          gridProps,
          ReflowDirection.RIGHT,
          20,
          3,
          -10,
          7,
          7,
          delta,
          true,
        ),
      ).toEqual({
        X: 30,
        dimensionXBeforeCollision: -10,
        directionX: "RIGHT",
        horizontalDepth: 3,
        horizontalEmptySpaces: 7,
        horizontalMaxOccupiedSpace: 20,
        maxX: 80,
        width: 300,
      });
    });
    it("should return Vertical Movement Metrics", () => {
      expect(
        getVerticalSpaceMovement(
          collisionTree,
          gridProps,
          ReflowDirection.BOTTOM,
          20,
          3,
          -10,
          7,
          7,
          delta,
          true,
        ),
      ).toEqual({
        Y: 30,
        dimensionYBeforeCollision: -10,
        directionY: "BOTTOM",
        height: 200,
        maxY: Infinity,
        verticalDepth: 3,
        verticalEmptySpaces: 7,
        verticalMaxOccupiedSpace: 20,
      });
    });
  });
});
