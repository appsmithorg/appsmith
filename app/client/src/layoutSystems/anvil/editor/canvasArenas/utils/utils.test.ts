import type { XYCord } from "layoutSystems/common/canvasArenas/ArenaTypes";
import { getViableDropPositions } from "./utils";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

describe("Highlight selection algos", () => {
  describe("getViableDropPositions", () => {
    const highlights: AnvilHighlightInfo[] = [
      {
        layoutId: "",
        isVertical: false,
        posX: 10,
        posY: 2,
        width: 100,
        height: 4,
        alignment: FlexLayerAlignment.Start,
        canvasId: "canvasId",
        rowIndex: 0,
        layoutOrder: [],
        edgeDetails: {
          bottom: false,
          left: false,
          right: false,
          top: false,
        },
      },
      {
        layoutId: "",
        isVertical: true,
        posX: 8,
        posY: 4,
        width: 4,
        height: 50,
        alignment: FlexLayerAlignment.Start,
        canvasId: "canvasId",
        rowIndex: 1,
        layoutOrder: [],
        edgeDetails: {
          bottom: false,
          left: false,
          right: false,
          top: false,
        },
      },
      {
        layoutId: "",
        isVertical: false,
        posX: 10,
        posY: 56,
        width: 100,
        height: 4,
        alignment: FlexLayerAlignment.Start,
        canvasId: "canvasId",
        rowIndex: 0,
        layoutOrder: [],
        edgeDetails: {
          bottom: false,
          left: false,
          right: false,
          top: false,
        },
      },
      // Add other highlights as needed...
    ];

    it("returns only horizontal highlights if pos of mouse is near the upper/lower end of the cell/layout", () => {
      const pos1: XYCord = { x: 10, y: 3 };
      const result1 = getViableDropPositions(highlights, pos1);

      expect(result1).toEqual([highlights[0]]);
      const pos2: XYCord = { x: 10, y: 55 };
      const result2 = getViableDropPositions(highlights, pos2);

      expect(result2).toEqual([highlights[2]]);
    });

    it("returns only vertical highlights if pos of mouse is within the cell and not in horizontal highlights limit radar", () => {
      const pos: XYCord = { x: 10, y: 20 };
      const result = getViableDropPositions(highlights, pos);

      expect(result).toEqual([highlights[1]]);
    });

    it("returns vertical highlight if pos is within the cell but not close enough to horizontal highlight limit radar", () => {
      const pos: XYCord = { x: 10, y: 25 };
      const result = getViableDropPositions(highlights, pos);

      expect(result).toEqual([highlights[1]]);
    });
  });
});
