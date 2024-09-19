import { GridDefaults } from "constants/WidgetConstants";
import {
  HORIZONTAL_RESIZE_MIN_LIMIT,
  ReflowDirection,
  VERTICAL_RESIZE_MIN_LIMIT,
} from "reflow/reflowTypes";
import {
  getEdgeDirection,
  getMoveDirection,
  getReflowedSpaces,
  modifyBlockDimension,
  modifyDrawingRectangles,
  updateRectanglesPostReflow,
} from "./canvasDraggingUtils";

describe("test canvasDraggingUtils Methods", () => {
  describe("test getEdgeDirection method", () => {
    it("should return RIGHT if closest to left edge", () => {
      expect(getEdgeDirection(5, 10, 100, ReflowDirection.UNSET)).toEqual(
        ReflowDirection.RIGHT,
      );
    });
    it("should return BOTTOM if closest to left edge", () => {
      expect(getEdgeDirection(10, 5, 100, ReflowDirection.UNSET)).toEqual(
        ReflowDirection.BOTTOM,
      );
    });
    it("should return LEFT if closest to left edge", () => {
      expect(getEdgeDirection(95, 10, 100, ReflowDirection.UNSET)).toEqual(
        ReflowDirection.LEFT,
      );
    });
    it("should return current direction if width is undefined", () => {
      expect(getEdgeDirection(5, 10, undefined, ReflowDirection.UNSET)).toEqual(
        ReflowDirection.UNSET,
      );
    });
  });

  it("test getReflowedSpaces method, should return reflowed spaces", () => {
    const occupiedSpace = {
      id: "id",
      left: 10,
      top: 10,
      right: 50,
      bottom: 70,
    };

    const reflowingWidgets = {
      id: {
        X: 30,
        Y: 40,
        width: 300,
        height: 500,
      },
    };

    const reflowedSpace = {
      id: "id",
      left: 13,
      top: 14,
      right: 43,
      bottom: 64,
    };

    expect(getReflowedSpaces(occupiedSpace, reflowingWidgets, 10, 10)).toEqual(
      reflowedSpace,
    );
  });

  it("test modifyDrawingRectangles method, should return widgetDraggingBlock with dimensions of the space widget", () => {
    const drawingRectangles = {
      left: 104,
      top: 102,
      width: 600,
      height: 900,
      columnWidth: 60,
      rowHeight: 90,
      widgetId: "id",
      isNotColliding: true,
      type: "CANVAS_WIDGET",
    };
    const spaceMap = {
      id: {
        left: 25,
        top: 30,
        right: 65,
        bottom: 80,
        id: "id",
      },
    };
    const modifiedRectangle = {
      left: 254,
      top: 302,
      width: 400,
      height: 500,
      columnWidth: 40,
      rowHeight: 50,
      widgetId: "id",
      isNotColliding: true,
      type: "CANVAS_WIDGET",
    };

    expect(
      modifyDrawingRectangles([drawingRectangles], spaceMap, 10, 10),
    ).toEqual([modifiedRectangle]);
  });

  describe("test getMoveDirection method", () => {
    const prevPosition = {
      id: "id",
      left: 10,
      top: 20,
      right: 30,
      bottom: 40,
    };

    it("should return RIGHT when moved to Right", () => {
      const currentPosition = {
        id: "id",
        left: 11,
        top: 20,
        right: 31,
        bottom: 40,
      };

      expect(
        getMoveDirection(prevPosition, currentPosition, ReflowDirection.UNSET),
      ).toEqual(ReflowDirection.RIGHT);
    });
    it("should return BOTTOM when moved to bottom", () => {
      const currentPosition = {
        id: "id",
        left: 10,
        top: 21,
        right: 30,
        bottom: 41,
      };

      expect(
        getMoveDirection(prevPosition, currentPosition, ReflowDirection.UNSET),
      ).toEqual(ReflowDirection.BOTTOM);
    });
    it("should return LEFT when moved to left", () => {
      const currentPosition = {
        id: "id",
        left: 9,
        top: 20,
        right: 29,
        bottom: 40,
      };

      expect(
        getMoveDirection(prevPosition, currentPosition, ReflowDirection.UNSET),
      ).toEqual(ReflowDirection.LEFT);
    });
    it("should return TOP when moved to top", () => {
      const currentPosition = {
        id: "id",
        left: 10,
        top: 19,
        right: 30,
        bottom: 39,
      };

      expect(
        getMoveDirection(prevPosition, currentPosition, ReflowDirection.UNSET),
      ).toEqual(ReflowDirection.TOP);
    });
  });

  describe("test modifyBlockDimension method", () => {
    it("should return resized dragging blocks while colliding with canvas edges, for top Left", () => {
      const draggingBlock = {
        left: -300,
        top: -700,
        width: 600,
        height: 900,
        columnWidth: 60,
        rowHeight: 90,
        widgetId: "id",
        isNotColliding: true,
        type: "CANVAS_WIDGET",
      };
      const modifiedBlock = {
        left: 0,
        top: 0,
        width: 300,
        height: 200,
        columnWidth: 30,
        rowHeight: 20,
        widgetId: "id",
        isNotColliding: true,
        type: "CANVAS_WIDGET",
      };

      expect(
        modifyBlockDimension(draggingBlock, 10, 10, 100, true, false),
      ).toEqual(modifiedBlock);
    });

    it("should return resized dragging blocks while colliding with canvas edges to it's limits, for top Left", () => {
      const draggingBlock = {
        left: -300,
        top: -700,
        width: 310,
        height: 720,
        columnWidth: 31,
        rowHeight: 72,
        widgetId: "id",
        isNotColliding: true,
        type: "CANVAS_WIDGET",
      };
      const modifiedBlock = {
        left: -10,
        top: -20,
        width: HORIZONTAL_RESIZE_MIN_LIMIT * 10,
        height: VERTICAL_RESIZE_MIN_LIMIT * 10,
        columnWidth: HORIZONTAL_RESIZE_MIN_LIMIT,
        rowHeight: VERTICAL_RESIZE_MIN_LIMIT,
        widgetId: "id",
        isNotColliding: true,
        type: "CANVAS_WIDGET",
      };

      expect(
        modifyBlockDimension(draggingBlock, 10, 10, 100, true, false),
      ).toEqual(modifiedBlock);
    });

    it("should return resized dragging blocks while colliding with canvas edges, for bottom right", () => {
      const draggingBlock = {
        left: 400,
        top: 600,
        width: 600,
        height: 900,
        columnWidth: 60,
        rowHeight: 90,
        widgetId: "id",
        isNotColliding: true,
        type: "CANVAS_WIDGET",
      };
      const modifiedBlock = {
        left: 400,
        top: 600,
        width: GridDefaults.DEFAULT_GRID_COLUMNS * 10 - 400,
        height: 400,
        columnWidth: GridDefaults.DEFAULT_GRID_COLUMNS - 40,
        rowHeight: 40,
        widgetId: "id",
        isNotColliding: true,
        type: "CANVAS_WIDGET",
      };

      expect(
        modifyBlockDimension(draggingBlock, 10, 10, 100, false, false),
      ).toEqual(modifiedBlock);
    });

    it("should return resized dragging blocks while colliding with canvas edges to it's limits, for bottom right", () => {
      const draggingBlock = {
        left: 630,
        top: 600,
        width: 600,
        height: 900,
        columnWidth: 60,
        rowHeight: 90,
        widgetId: "id",
        isNotColliding: true,
        fixedHeight: 90,
        type: "CANVAS_WIDGET",
      };
      const modifiedBlock = {
        left: 630,
        top: 600,
        width: HORIZONTAL_RESIZE_MIN_LIMIT * 10,
        height: 900,
        columnWidth: HORIZONTAL_RESIZE_MIN_LIMIT,
        rowHeight: 90,
        widgetId: "id",
        isNotColliding: true,
        fixedHeight: 90,
        type: "CANVAS_WIDGET",
      };

      expect(
        modifyBlockDimension(draggingBlock, 10, 10, 100, false, false),
      ).toEqual(modifiedBlock);
    });
  });

  describe("should test updateRectanglesPostReflow method", () => {
    it("should update noCollision properties based on respective rectangles", () => {
      const rectanglesToDraw = [
        {
          left: -10,
          top: 200,
          width: 600,
          height: 900,
          columnWidth: 60,
          rowHeight: 90,
          widgetId: "1",
          isNotColliding: true,
          type: "CANVAS_WIDGET",
        },
        {
          left: 100,
          top: 200,
          width: 700,
          height: 950,
          columnWidth: 70,
          rowHeight: 95,
          widgetId: "2",
          isNotColliding: true,
          type: "CANVAS_WIDGET",
        },
        {
          left: 300,
          top: 100,
          width: 200,
          height: 340,
          columnWidth: 20,
          rowHeight: 34,
          widgetId: "3",
          isNotColliding: true,
          type: "CANVAS_WIDGET",
        },
        {
          left: 400,
          top: 500,
          width: 200,
          height: 120,
          columnWidth: 20,
          rowHeight: 12,
          widgetId: "4",
          isNotColliding: true,
          type: "CANVAS_WIDGET",
        },
      ];

      const result = [
        {
          left: -10,
          top: 200,
          width: 600,
          height: 900,
          columnWidth: 60,
          rowHeight: 90,
          widgetId: "1",
          isNotColliding: false,
          type: "CANVAS_WIDGET",
        },
        {
          left: 100,
          top: 200,
          width: 700,
          height: 950,
          columnWidth: 70,
          rowHeight: 95,
          widgetId: "2",
          isNotColliding: false,
          type: "CANVAS_WIDGET",
        },
        {
          left: 300,
          top: 100,
          width: 200,
          height: 340,
          columnWidth: 20,
          rowHeight: 34,
          widgetId: "3",
          isNotColliding: false,
          type: "CANVAS_WIDGET",
        },
        {
          left: 400,
          top: 500,
          width: 200,
          height: 120,
          columnWidth: 20,
          rowHeight: 12,
          widgetId: "4",
          isNotColliding: true,
          type: "CANVAS_WIDGET",
        },
      ];

      const movementLimitMap = {
        "1": {
          canHorizontalMove: true,
          canVerticalMove: true,
        },
        "2": {
          canHorizontalMove: true,
          canVerticalMove: true,
        },
        "3": {
          canHorizontalMove: true,
          canVerticalMove: false,
        },
        "4": {
          canHorizontalMove: true,
          canVerticalMove: true,
        },
      };

      expect(
        updateRectanglesPostReflow(
          movementLimitMap,
          rectanglesToDraw,
          10,
          10,
          2000,
        ),
      ).toEqual(result);
    });
  });
});
