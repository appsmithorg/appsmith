/* eslint-disable no-console */
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
  WidgetPositions,
} from "../../anvilTypes";
import {
  checkIntersection,
  deriveRowHighlights,
  extractMetaInformation,
  getHighlightsForRow,
  type RowMetaInformation,
} from "./rowHighlights";
import {
  HIGHLIGHT_SIZE,
  INFINITE_DROP_ZONE,
  VERTICAL_DROP_ZONE_MULTIPLIER,
} from "../../constants";

describe("rowHighlights tests", () => {
  describe("checkIntersection", () => {
    it("returns true if the lines intersect the same space", () => {
      // Lines starting at the same point.
      expect(checkIntersection([0, 1], [0, 2])).toBeTruthy();
      expect(checkIntersection([0, 2], [0, 1])).toBeTruthy();
      // A larger line that can encompass the counterpart.
      expect(checkIntersection([0, 4], [1, 2])).toBeTruthy();
      expect(checkIntersection([1, 2], [0, 4])).toBeTruthy();

      // Lines starting at different points and of different heights.
      expect(checkIntersection([0, 3], [1, 5])).toBeTruthy();
      expect(checkIntersection([1, 5], [0, 3])).toBeTruthy();
    });
    it("returns false if the lines do not intersect the same space", () => {
      expect(checkIntersection([0, 1], [2, 3])).toBeFalsy();
      expect(checkIntersection([2, 3], [0, 1])).toBeFalsy();
      expect(checkIntersection([0, 1], [1, 2])).toBeFalsy();
      expect(checkIntersection([1, 2], [0, 1])).toBeFalsy();
    });
  });
  describe("extractMetaInformation", () => {
    it("should find the tallest widget in a row", () => {
      const data: WidgetLayoutProps[] = [
        { widgetId: "1", alignment: FlexLayerAlignment.Start },
        { widgetId: "2", alignment: FlexLayerAlignment.Start },
        { widgetId: "3", alignment: FlexLayerAlignment.Start },
      ];
      const dimensions: WidgetPositions = {
        "1": { top: 0, left: 4, width: 100, height: 40 },
        "2": { top: 0, left: 110, width: 100, height: 60 },
        "3": { top: 30, left: 220, width: 100, height: 30 },
      };
      const res: RowMetaInformation = extractMetaInformation(data, dimensions);
      // There should be 1 row.
      expect(res.metaData.length).toEqual(1);
      // All three widgets should be in the same row.
      expect(res.metaData[0].length).toEqual(data.length);
      // There should be one tallest widget per row.
      expect(res.tallestWidgets.length).toEqual(res.metaData.length);
      // The tallest widget should be the second widget.
      expect(res.tallestWidgets[0].widgetId).toEqual(data[1].widgetId);
    });
    it("should identify wrapping and determine information for each wrapped row", () => {
      const data: WidgetLayoutProps[] = [
        { widgetId: "1", alignment: FlexLayerAlignment.Start },
        { widgetId: "2", alignment: FlexLayerAlignment.Start },
        { widgetId: "3", alignment: FlexLayerAlignment.Start },
        { widgetId: "4", alignment: FlexLayerAlignment.Start },
      ];
      const dimensions: WidgetPositions = {
        "1": { top: 0, left: 4, width: 100, height: 40 },
        "2": { top: 0, left: 110, width: 100, height: 60 },
        "3": { top: 70, left: 10, width: 100, height: 30 },
        "4": { top: 70, left: 110, width: 100, height: 80 },
      };
      const res: RowMetaInformation = extractMetaInformation(data, dimensions);
      // There should be 2 rows.
      expect(res.metaData.length).toEqual(2);
      // There should two widgets in each row.
      expect(res.metaData[0].length).toEqual(2);
      expect(res.metaData[0].length).toEqual(2);
      // There should be one tallest widget per row.
      expect(res.tallestWidgets.length).toEqual(res.metaData.length);
      // The tallest widget should be the second widget.
      expect(res.tallestWidgets[0].widgetId).toEqual(data[1].widgetId);
      expect(res.tallestWidgets[1].widgetId).toEqual(data[3].widgetId);
    });
    it("should identify reverse wrapping", () => {
      const data: WidgetLayoutProps[] = [
        { widgetId: "1", alignment: FlexLayerAlignment.Start },
        { widgetId: "2", alignment: FlexLayerAlignment.Start },
        { widgetId: "3", alignment: FlexLayerAlignment.Start },
        { widgetId: "4", alignment: FlexLayerAlignment.Start },
      ];
      const dimensions: WidgetPositions = {
        "1": { top: 70, left: 4, width: 100, height: 40 },
        "2": { top: 70, left: 110, width: 100, height: 60 },
        "3": { top: 0, left: 10, width: 100, height: 30 },
        "4": { top: 0, left: 110, width: 100, height: 80 },
      };
      const res: RowMetaInformation = extractMetaInformation(data, dimensions);
      // There should be 2 rows.
      expect(res.metaData.length).toEqual(2);
      // There should two widgets in each row.
      expect(res.metaData[0].length).toEqual(2);
      expect(res.metaData[0].length).toEqual(2);
      // There should be one tallest widget per row.
      expect(res.tallestWidgets.length).toEqual(res.metaData.length);
      // The tallest widget should be the second widget.
      expect(res.tallestWidgets[0].widgetId).toEqual(data[1].widgetId);
      expect(res.tallestWidgets[1].widgetId).toEqual(data[3].widgetId);
    });
  });
  describe("getHighlightsForRow", () => {
    const baseHighlight: AnvilHighlightInfo = {
      alignment: FlexLayerAlignment.Start,
      canvasId: "",
      dropZone: {},
      height: 0,
      layoutOrder: ["1"],
      posX: 0,
      posY: 0,
      rowIndex: 0,
      width: HIGHLIGHT_SIZE,
    };
    it("should derive highlights for a row", () => {
      const data: WidgetLayoutProps[] = [
        { widgetId: "1", alignment: FlexLayerAlignment.Start },
        { widgetId: "2", alignment: FlexLayerAlignment.Start },
        { widgetId: "3", alignment: FlexLayerAlignment.Start },
      ];
      const dimensions: WidgetPositions = {
        "1": { top: 0, left: 4, width: 100, height: 40 },
        "2": { top: 0, left: 110, width: 100, height: 60 },
        "3": { top: 30, left: 220, width: 100, height: 30 },
      };
      const res: RowMetaInformation = extractMetaInformation(data, dimensions);
      const highlights = getHighlightsForRow(
        res.metaData[0],
        res.tallestWidgets[0],
        dimensions,
        baseHighlight,
      );

      expect(highlights.length).toEqual(data.length + 1);
      // Height of all highlights in the row should be equal to the tallest widget.
      expect(highlights[0].height).toEqual(
        dimensions[res.tallestWidgets[0].widgetId].height,
      );
      expect(highlights[1].height).toEqual(
        dimensions[res.tallestWidgets[0].widgetId].height,
      );
      // Drop zone at the end should be maximum
      expect(highlights[0].dropZone.left).toEqual(INFINITE_DROP_ZONE);
      expect(highlights[highlights.length - 1].dropZone.right).toEqual(
        INFINITE_DROP_ZONE,
      );

      // Drop zone on either side of the highlight should extend up to 35% of the gap between itself and it's neighbor in that direction.
      expect(highlights[1].dropZone.left).toEqual(
        (dimensions[res.metaData[0][1].widgetId].left -
          dimensions[res.metaData[0][0].widgetId].left) *
          VERTICAL_DROP_ZONE_MULTIPLIER,
      );
    });
  });
  describe("deriveRowHighlights", () => {
    const baseProps: LayoutProps = {
      layoutId: "1",
      layout: [],
      layoutType: "ROW",
    };
    it("should derive highlights for a row", () => {
      const data: WidgetLayoutProps[] = [
        { widgetId: "1", alignment: FlexLayerAlignment.Start },
        { widgetId: "2", alignment: FlexLayerAlignment.Start },
        { widgetId: "3", alignment: FlexLayerAlignment.Start },
      ];
      const dimensions: WidgetPositions = {
        "1": { top: 0, left: 4, width: 100, height: 40 },
        "2": { top: 0, left: 110, width: 100, height: 60 },
        "3": { top: 30, left: 220, width: 100, height: 30 },
      };
      const res: RowMetaInformation = extractMetaInformation(data, dimensions);
      const highlights = deriveRowHighlights(
        { ...baseProps, layout: data },
        dimensions,
        "0",
      );

      expect(highlights.length).toEqual(data.length + 1);
      // Height of all highlights in the row should be equal to the tallest widget.
      expect(highlights[0].height).toEqual(
        dimensions[res.tallestWidgets[0].widgetId].height,
      );
      expect(highlights[1].height).toEqual(
        dimensions[res.tallestWidgets[0].widgetId].height,
      );
      // Drop zone at the end should be maximum
      expect(highlights[0].dropZone.left).toEqual(INFINITE_DROP_ZONE);
      expect(highlights[highlights.length - 1].dropZone.right).toEqual(
        INFINITE_DROP_ZONE,
      );

      // Drop zone on either side of the highlight should extend up to 35% of the gap between itself and it's neighbor in that direction.
      expect(highlights[1].dropZone.left).toEqual(
        (dimensions[res.metaData[0][1].widgetId].left -
          dimensions[res.metaData[0][0].widgetId].left) *
          VERTICAL_DROP_ZONE_MULTIPLIER,
      );
    });
    it("should derive highlights for a wrapped row", () => {
      const data: WidgetLayoutProps[] = [
        { widgetId: "1", alignment: FlexLayerAlignment.Start },
        { widgetId: "2", alignment: FlexLayerAlignment.Start },
        { widgetId: "3", alignment: FlexLayerAlignment.Start },
      ];
      const dimensions: WidgetPositions = {
        "1": { top: 0, left: 4, width: 100, height: 40 },
        "2": { top: 0, left: 110, width: 100, height: 60 },
        "3": { top: 70, left: 10, width: 100, height: 30 },
      };
      const res: RowMetaInformation = extractMetaInformation(data, dimensions);
      const highlights = deriveRowHighlights(
        { ...baseProps, layout: data },
        dimensions,
        "0",
      );
      console.log(highlights);

      /**
       * As the layout is wrapped into two rows.
       * There should be two extra highlights to mark the right most drop position in each row.
       */
      expect(highlights.length).toEqual(data.length + 2);
      // Height of all highlights in the row should be equal to the tallest widget.
      expect(highlights[0].height).toEqual(dimensions["2"].height);
      expect(highlights[4].height).toEqual(dimensions["3"].height);
      // Drop zone at the end should be maximum
      expect(highlights[0].dropZone.left).toEqual(INFINITE_DROP_ZONE);
      expect(highlights[highlights.length - 1].dropZone.right).toEqual(
        INFINITE_DROP_ZONE,
      );

      // Drop zone on either side of the highlight should extend up to 35% of the gap between itself and it's neighbor in that direction.
      expect(highlights[1].dropZone.left).toEqual(
        (dimensions[res.metaData[0][1].widgetId].left -
          dimensions[res.metaData[0][0].widgetId].left) *
          VERTICAL_DROP_ZONE_MULTIPLIER,
      );

      // Starting rowIndex of second row should be the same as ending rowIndex of the first row as they point to the same space.
      expect(highlights[2].rowIndex).toEqual(highlights[3].rowIndex);
    });
    it("should derive highlights for a reverse wrapped row", () => {
      const data: WidgetLayoutProps[] = [
        { widgetId: "1", alignment: FlexLayerAlignment.Start },
        { widgetId: "2", alignment: FlexLayerAlignment.Start },
        { widgetId: "3", alignment: FlexLayerAlignment.Start },
      ];
      const dimensions: WidgetPositions = {
        "1": { top: 40, left: 4, width: 100, height: 40 },
        "2": { top: 40, left: 110, width: 100, height: 60 },
        "3": { top: 0, left: 10, width: 100, height: 30 },
      };
      const res: RowMetaInformation = extractMetaInformation(data, dimensions);
      const highlights = deriveRowHighlights(
        { ...baseProps, layout: data },
        dimensions,
        "0",
      );
      console.log(highlights);

      /**
       * As the layout is wrapped into two rows.
       * There should be two extra highlights to mark the right most drop position in each row.
       */
      expect(highlights.length).toEqual(data.length + 2);
      // Height of all highlights in the row should be equal to the tallest widget.
      expect(highlights[0].height).toEqual(dimensions["2"].height);
      expect(highlights[4].height).toEqual(dimensions["3"].height);
      // Drop zone at the end should be maximum
      expect(highlights[0].dropZone.left).toEqual(INFINITE_DROP_ZONE);
      expect(highlights[highlights.length - 1].dropZone.right).toEqual(
        INFINITE_DROP_ZONE,
      );

      // Drop zone on either side of the highlight should extend up to 35% of the gap between itself and it's neighbor in that direction.
      expect(highlights[1].dropZone.left).toEqual(
        (dimensions[res.metaData[0][1].widgetId].left -
          dimensions[res.metaData[0][0].widgetId].left) *
          VERTICAL_DROP_ZONE_MULTIPLIER,
      );

      // Starting rowIndex of second row should be the same as ending rowIndex of the first row as they point to the same space.
      expect(highlights[2].rowIndex).toEqual(highlights[3].rowIndex);
      // Reverse wrapping
      expect(highlights[4].posY).toBeLessThan(highlights[0].posY);
    });
  });
});
