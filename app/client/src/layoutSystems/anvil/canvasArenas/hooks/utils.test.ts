import type { XYCord } from "layoutSystems/common/canvasArenas/ArenaTypes";
import {
  isWithinHorizontalDropZone,
  isWithinVerticalDropZone,
  getViableDropPositions,
} from "./utils";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

describe("Highlight selection algos", () => {
  describe("isWithinHorizontalDropZone", () => {
    const highlight: AnvilHighlightInfo = {
      layoutId: "",
      isVertical: true,
      posX: 10,
      posY: 10,
      width: 10,
      height: 10,
      dropZone: { left: 5, right: 5 },
      alignment: FlexLayerAlignment.Start,
      canvasId: "canvasId",
      rowIndex: 0,
      layoutOrder: [],
    };

    it("returns true if pos is within the right drop zone", () => {
      const pos: XYCord = { x: 15, y: 10 };
      expect(isWithinHorizontalDropZone(pos, highlight)).toBe(true);
    });

    it("returns true if pos is within the left drop zone", () => {
      const pos: XYCord = { x: 5, y: 10 };
      expect(isWithinHorizontalDropZone(pos, highlight)).toBe(true);
    });

    it("returns false if pos is not within the drop zone", () => {
      const pos: XYCord = { x: 30, y: 10 };
      expect(isWithinHorizontalDropZone(pos, highlight)).toBe(false);
    });

    it("returns true if pos is not within the drop zone but within the default range", () => {
      const pos: XYCord = { x: 20, y: 10 };
      expect(isWithinHorizontalDropZone(pos, highlight)).toBe(true);
    });
  });
  describe("isWithinVerticalDropZone", () => {
    const highlight: AnvilHighlightInfo = {
      layoutId: "",
      isVertical: false,
      posX: 10,
      posY: 10,
      width: 10,
      height: 10,
      dropZone: { top: 50, bottom: 50 },
      alignment: FlexLayerAlignment.Start,
      canvasId: "canvasId",
      rowIndex: 0,
      layoutOrder: [],
    };

    it("returns true if pos is within the top drop zone and there is a vertical selection", () => {
      const pos: XYCord = { x: 10, y: 5 };
      expect(isWithinVerticalDropZone(pos, highlight, true)).toBe(true);
    });

    it("returns true if pos is within the bottom drop zone and there is a vertical selection", () => {
      const pos: XYCord = { x: 10, y: 15 };
      expect(isWithinVerticalDropZone(pos, highlight, true)).toBe(true);
    });

    it("returns false if pos is within the drop zone but there is a vertical selection", () => {
      const pos: XYCord = { x: 10, y: 40 };
      expect(isWithinVerticalDropZone(pos, highlight, true)).toBe(false);
    });

    it("returns true if pos is within the drop zone and there is no vertical selection", () => {
      const pos: XYCord = { x: 10, y: 40 };
      expect(isWithinVerticalDropZone(pos, highlight, false)).toBe(true);
    });

    it("returns true if pos is not within the default range for a drop zone", () => {
      const pos: XYCord = { x: 10, y: 20 };
      expect(isWithinVerticalDropZone(pos, highlight, true)).toBe(true);
    });
  });

  describe("getViableDropPositions", () => {
    const highlights: AnvilHighlightInfo[] = [
      {
        layoutId: "",
        isVertical: false,
        posX: 10,
        posY: 10,
        width: 10,
        height: 10,
        dropZone: { top: 5, bottom: 15 },
        alignment: FlexLayerAlignment.Start,
        canvasId: "canvasId",
        rowIndex: 0,
        layoutOrder: [],
      },
      {
        layoutId: "",
        isVertical: true,
        posX: 20,
        posY: 20,
        width: 10,
        height: 10,
        dropZone: { left: 5, right: 5 },
        alignment: FlexLayerAlignment.Start,
        canvasId: "canvasId",
        rowIndex: 1,
        layoutOrder: [],
      },
      // Add other highlights as needed...
    ];

    it("returns only horizontal highlights if pos is within their drop zones", () => {
      const pos: XYCord = { x: 10, y: 15 };
      const result = getViableDropPositions(highlights, pos);
      expect(result).toEqual([highlights[0]]);
    });

    it("returns only vertical highlights if pos is within their drop zones", () => {
      const pos: XYCord = { x: 25, y: 20 };
      const result = getViableDropPositions(highlights, pos);
      expect(result).toEqual([highlights[1]]);
    });

    it("returns vertical highlight if pos is within all drop zones but not close enough to horizontal highlight", () => {
      const pos: XYCord = { x: 10, y: 25 };
      const result = getViableDropPositions(highlights, pos);
      expect(result).toEqual([highlights[1]]);
    });

    it("returns an empty array if pos is not within any drop zones", () => {
      const pos: XYCord = { x: 50, y: 40 };
      const result = getViableDropPositions(highlights, pos);
      expect(result).toEqual([]);
    });

    it("uses default drop zone range if drop zone is undefined", () => {
      const pos: XYCord = { x: 10, y: 15 };
      const highlight: AnvilHighlightInfo = { ...highlights[0], dropZone: {} };
      const result = getViableDropPositions([highlight, highlights[1]], pos);
      expect(result).toEqual([highlight]);
    });
  });
});
