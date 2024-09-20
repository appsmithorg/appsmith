import {
  getDraggingSpacesFromBlocks,
  getMousePositionsOnCanvas,
} from "./WidgetPropsUtils";
import type { WidgetDraggingBlock } from "layoutSystems/common/canvasArenas/ArenaTypes";

describe("WidgetProps tests", () => {
  it("should convert WidgetDraggingBlocks to occupied Spaces", () => {
    const draggingBlocks: WidgetDraggingBlock[] = [
      {
        left: 100,
        top: 100,
        width: 210,
        height: 220,
        widgetId: "1",
        isNotColliding: true,
        columnWidth: 10,
        rowHeight: 10,
        type: "",
      },
      {
        left: 310,
        top: 120,
        width: 70,
        height: 80,
        widgetId: "2",
        isNotColliding: true,
        columnWidth: 10,
        rowHeight: 10,
        type: "",
      },
    ];
    const draggingSpaces = [
      {
        left: 10,
        top: 10,
        right: 31,
        bottom: 32,
        id: "1",
      },
      {
        left: 31,
        top: 12,
        right: 38,
        bottom: 20,
        id: "2",
      },
    ];
    const snapColumnSpace = 10,
      snapRowSpace = 10;

    expect(
      getDraggingSpacesFromBlocks(
        draggingBlocks,
        snapColumnSpace,
        snapRowSpace,
      ),
    ).toEqual(draggingSpaces);
  });
  it("getMousePositionsOnCanvas should Return Mouse Position relative to Canvas", () => {
    const gridProps = {
      parentColumnSpace: 10,
      parentRowSpace: 10,
      maxGridColumns: 64,
    };
    const mouseEvent = {
      offsetX: 500,
      offsetY: 600,
    } as unknown as MouseEvent;

    expect(getMousePositionsOnCanvas(mouseEvent, gridProps)).toEqual({
      id: "mouse",
      top: 59,
      left: 49,
      bottom: 60,
      right: 50,
    });
  });

  it("getMousePositionsOnCanvas should even return negative Mouse Position relative to Canvas", () => {
    const gridProps = {
      parentColumnSpace: 10,
      parentRowSpace: 10,
      maxGridColumns: 64,
    };
    const mouseEvent = {
      offsetX: 2,
      offsetY: 5,
    } as unknown as MouseEvent;

    expect(getMousePositionsOnCanvas(mouseEvent, gridProps)).toEqual({
      id: "mouse",
      top: -1,
      left: -1,
      bottom: 0,
      right: 0,
    });
  });
});
