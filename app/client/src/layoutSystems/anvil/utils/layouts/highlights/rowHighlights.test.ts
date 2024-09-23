import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import {
  LayoutComponentTypes,
  type AnvilHighlightInfo,
  type GetDimensions,
  type LayoutComponentProps,
  type LayoutProps,
  type WidgetLayoutProps,
} from "../../anvilTypes";
import {
  checkIntersection,
  deriveRowHighlights,
  extractMetaInformation,
  getHighlightsForRow,
  type RowMetaInformation,
} from "./rowHighlights";
import { HIGHLIGHT_SIZE } from "../../constants";
import { generateLayoutComponentMock } from "mocks/layoutComponents/layoutComponentMock";
import type { LayoutElementPositions } from "layoutSystems/common/types";
import { getRelativeDimensions } from "./dimensionUtils";
import { registerLayoutComponents } from "../layoutUtils";
import ButtonWidget from "widgets/ButtonWidget/widget";

describe("rowHighlights tests", () => {
  beforeAll(() => {
    registerLayoutComponents();
  });
  const baseProps: LayoutProps = {
    layoutId: "layoutID",
    layout: [],
    layoutType: LayoutComponentTypes.WIDGET_ROW,
  };

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
        {
          widgetId: "1",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "2",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "3",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
      ];
      const dimensions: LayoutElementPositions = {
        "0": {
          top: 0,
          left: 0,
          width: 200,
          height: 200,
          offsetLeft: 0,
          offsetTop: 0,
        },
        "1": {
          top: 0,
          left: 4,
          width: 100,
          height: 40,
          offsetLeft: 4,
          offsetTop: 0,
        },
        "2": {
          top: 0,
          left: 110,
          width: 100,
          height: 60,
          offsetLeft: 110,
          offsetTop: 0,
        },
        "3": {
          top: 30,
          left: 220,
          width: 100,
          height: 30,
          offsetLeft: 220,
          offsetTop: 30,
        },
      };
      const getDimensions: GetDimensions = getRelativeDimensions(dimensions);
      const res: RowMetaInformation = extractMetaInformation(
        data,
        getDimensions,
      );

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
        {
          widgetId: "1",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "2",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "3",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "4",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
      ];
      const dimensions: LayoutElementPositions = {
        "0": {
          top: 0,
          left: 0,
          width: 300,
          height: 200,
          offsetLeft: 0,
          offsetTop: 0,
        },
        "1": {
          top: 0,
          left: 4,
          width: 100,
          height: 40,
          offsetLeft: 4,
          offsetTop: 0,
        },
        "2": {
          top: 0,
          left: 110,
          width: 100,
          height: 60,
          offsetLeft: 110,
          offsetTop: 0,
        },
        "3": {
          top: 70,
          left: 10,
          width: 100,
          height: 30,
          offsetLeft: 10,
          offsetTop: 70,
        },
        "4": {
          top: 70,
          left: 110,
          width: 100,
          height: 80,
          offsetLeft: 110,
          offsetTop: 70,
        },
      };
      const getDimensions: GetDimensions = getRelativeDimensions(dimensions);
      const res: RowMetaInformation = extractMetaInformation(
        data,
        getDimensions,
      );

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
        {
          widgetId: "1",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "2",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "3",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "4",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
      ];
      const dimensions: LayoutElementPositions = {
        "0": {
          top: 0,
          left: 0,
          width: 200,
          height: 200,
          offsetLeft: 0,
          offsetTop: 0,
        },
        "1": {
          top: 70,
          left: 4,
          width: 100,
          height: 40,
          offsetLeft: 4,
          offsetTop: 70,
        },
        "2": {
          top: 70,
          left: 110,
          width: 100,
          height: 60,
          offsetLeft: 110,
          offsetTop: 70,
        },
        "3": {
          top: 0,
          left: 10,
          width: 100,
          height: 30,
          offsetLeft: 10,
          offsetTop: 0,
        },
        "4": {
          top: 0,
          left: 110,
          width: 100,
          height: 80,
          offsetLeft: 110,
          offsetTop: 0,
        },
      };
      const getDimensions: GetDimensions = getRelativeDimensions(dimensions);
      const res: RowMetaInformation = extractMetaInformation(
        data,
        getDimensions,
      );

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
      layoutId: "",
      alignment: FlexLayerAlignment.Start,
      canvasId: "",
      height: 0,
      isVertical: true,
      layoutOrder: ["1"],
      posX: 0,
      posY: 0,
      rowIndex: 0,
      width: HIGHLIGHT_SIZE,
      edgeDetails: {
        bottom: false,
        left: false,
        right: false,
        top: false,
      },
    };

    it("should derive highlights for a row", () => {
      const data: WidgetLayoutProps[] = [
        {
          widgetId: "1",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "2",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "3",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
      ];
      const dimensions: LayoutElementPositions = {
        layoutID: {
          top: 0,
          left: 0,
          width: 340,
          height: 100,
          offsetLeft: 0,
          offsetTop: 0,
        },
        "1": {
          top: 0,
          left: 4,
          width: 100,
          height: 40,
          offsetLeft: 4,
          offsetTop: 0,
        },
        "2": {
          top: 0,
          left: 110,
          width: 100,
          height: 60,
          offsetLeft: 110,
          offsetTop: 0,
        },
        "3": {
          top: 30,
          left: 220,
          width: 100,
          height: 30,
          offsetLeft: 220,
          offsetTop: 30,
        },
      };
      const getDimensions: GetDimensions = getRelativeDimensions(dimensions);
      const res: RowMetaInformation = extractMetaInformation(
        data,
        getDimensions,
      );
      const highlights = getHighlightsForRow(
        res.metaData[0],
        res.tallestWidgets[0],
        { ...baseProps, layout: data },
        baseHighlight,
        [],
        getDimensions,
      );

      expect(highlights.length).toEqual(data.length + 1);
      // Height of all highlights in the row should be equal to the tallest widget.
      expect(highlights[0].height).toEqual(
        dimensions[res.tallestWidgets[0].widgetId].height,
      );
      expect(highlights[1].height).toEqual(
        dimensions[res.tallestWidgets[0].widgetId].height,
      );
    });
  });
  describe("deriveRowHighlights", () => {
    it("should derive highlights for a row", () => {
      const data: WidgetLayoutProps[] = [
        {
          widgetId: "1",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "2",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "3",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
      ];
      const dimensions: LayoutElementPositions = {
        layoutID: {
          top: 0,
          left: 0,
          width: 340,
          height: 100,
          offsetLeft: 0,
          offsetTop: 0,
        },
        "1": {
          top: 0,
          left: 4,
          width: 100,
          height: 40,
          offsetLeft: 4,
          offsetTop: 0,
        },
        "2": {
          top: 0,
          left: 110,
          width: 100,
          height: 60,
          offsetLeft: 110,
          offsetTop: 0,
        },
        "3": {
          top: 30,
          left: 220,
          width: 100,
          height: 30,
          offsetLeft: 220,
          offsetTop: 30,
        },
      };
      const getDimensions: GetDimensions = getRelativeDimensions(dimensions);
      const res: RowMetaInformation = extractMetaInformation(
        data,
        getDimensions,
      );
      const { highlights } = deriveRowHighlights(
        { ...baseProps, layout: data },
        "0",
        [],
        "layoutID",
      )(dimensions, [
        {
          widgetId: "10",
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);

      expect(highlights.length).toEqual(data.length + 1);
      // Height of all highlights in the row should be equal to the tallest widget.
      expect(highlights[0].height).toEqual(
        dimensions[res.tallestWidgets[0].widgetId].height,
      );
      expect(highlights[1].height).toEqual(
        dimensions[res.tallestWidgets[0].widgetId].height,
      );
    });
    it("should derive highlights for a wrapped row", () => {
      const data: WidgetLayoutProps[] = [
        {
          widgetId: "1",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "2",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "3",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
      ];
      const dimensions: LayoutElementPositions = {
        layoutID: {
          top: 0,
          left: 0,
          width: 230,
          height: 100,
          offsetLeft: 0,
          offsetTop: 0,
        },
        "1": {
          top: 0,
          left: 4,
          width: 100,
          height: 40,
          offsetLeft: 4,
          offsetTop: 0,
        },
        "2": {
          top: 0,
          left: 110,
          width: 100,
          height: 60,
          offsetLeft: 110,
          offsetTop: 0,
        },
        "3": {
          top: 70,
          left: 10,
          width: 100,
          height: 30,
          offsetLeft: 10,
          offsetTop: 70,
        },
      };

      const { highlights } = deriveRowHighlights(
        { ...baseProps, layout: data },
        "0",
        [],
        "layoutID",
      )(dimensions, [
        {
          widgetId: "10",
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);

      /**
       * As the layout is wrapped into two rows.
       * There should be two extra highlights to mark the right most drop position in each row.
       */
      expect(highlights.length).toEqual(data.length + 2);
      // Height of all highlights in the row should be equal to the tallest widget.
      expect(highlights[0].height).toEqual(dimensions["2"].height);
      expect(highlights[4].height).toEqual(dimensions["3"].height);

      // Starting rowIndex of second row should be the same as ending rowIndex of the first row as they point to the same space.
      expect(highlights[2].rowIndex).toEqual(highlights[3].rowIndex);
    });
    it("should derive highlights for a reverse wrapped row", () => {
      const data: WidgetLayoutProps[] = [
        {
          widgetId: "1",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "2",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
        {
          widgetId: "3",
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
      ];
      const dimensions: LayoutElementPositions = {
        layoutID: {
          top: 0,
          left: 0,
          width: 230,
          height: 100,
          offsetLeft: 0,
          offsetTop: 0,
        },
        "1": {
          top: 40,
          left: 4,
          width: 100,
          height: 40,
          offsetLeft: 4,
          offsetTop: 40,
        },
        "2": {
          top: 40,
          left: 110,
          width: 100,
          height: 60,
          offsetLeft: 110,
          offsetTop: 40,
        },
        "3": {
          top: 0,
          left: 10,
          width: 100,
          height: 30,
          offsetLeft: 10,
          offsetTop: 0,
        },
      };

      const { highlights } = deriveRowHighlights(
        { ...baseProps, layout: data },
        "0",
        [],
        "layoutID",
      )(dimensions, [
        {
          widgetId: "10",
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);

      /**
       * As the layout is wrapped into two rows.
       * There should be two extra highlights to mark the right most drop position in each row.
       */
      expect(highlights.length).toEqual(data.length + 2);
      // Height of all highlights in the row should be equal to the tallest widget.
      expect(highlights[0].height).toEqual(dimensions["2"].height);
      expect(highlights[4].height).toEqual(dimensions["3"].height);

      // Starting rowIndex of second row should be the same as ending rowIndex of the first row as they point to the same space.
      expect(highlights[2].rowIndex).toEqual(highlights[3].rowIndex);
      // Reverse wrapping
      expect(highlights[4].posY).toBeLessThan(highlights[0].posY);
    });
  });
  describe("initial highlights", () => {
    it("should derive highlights for empty drop target layouts", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layout: [],
      }).layout as LayoutComponentProps;
      const positions: LayoutElementPositions = {
        [layout.layoutId]: {
          height: 100,
          left: 10,
          top: 10,
          width: 500,
          offsetLeft: 0,
          offsetTop: 0,
        },
      };
      const { highlights: res } = deriveRowHighlights(
        layout,
        "0",
        [],
        layout.layoutId,
      )(positions, [
        {
          widgetId: "1",
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);

      expect(res[0].posY).toEqual(0);
      expect(res[0].alignment).toEqual(FlexLayerAlignment.Start);
      expect(res[0].posX).toEqual(0);
      expect(res[0].height).toEqual(positions[layout.layoutId].height);
      expect(res[0].width).toEqual(HIGHLIGHT_SIZE);
    });
    it("should derive highlights for empty center aligned, drop target layouts", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layout: [],
        layoutStyle: {
          justifyContent: "center",
        },
      }).layout as LayoutComponentProps;
      const positions: LayoutElementPositions = {
        [layout.layoutId]: {
          height: 100,
          left: 10,
          top: 10,
          width: 500,
          offsetLeft: 0,
          offsetTop: 0,
        },
      };
      const { highlights: res } = deriveRowHighlights(
        layout,
        "0",
        [],
        layout.layoutId,
      )(positions, [
        {
          widgetId: "1",
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);

      const posX: number =
        (positions[layout.layoutId].width - HIGHLIGHT_SIZE) / 2;

      expect(res[0].posY).toEqual(0);
      expect(res[0].alignment).toEqual(FlexLayerAlignment.Center);
      expect(res[0].posX).toEqual(posX);
      expect(res[0].height).toEqual(positions[layout.layoutId].height);
      expect(res[0].width).toEqual(HIGHLIGHT_SIZE);
    });
    it("should derive highlights for empty end aligned, drop target layouts", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layout: [],
        layoutStyle: {
          justifyContent: "end",
        },
      }).layout as LayoutComponentProps;
      const positions: LayoutElementPositions = {
        [layout.layoutId]: {
          height: 100,
          left: 10,
          top: 10,
          width: 500,
          offsetLeft: 0,
          offsetTop: 0,
        },
      };
      const { highlights: res } = deriveRowHighlights(
        layout,
        "0",
        [],
        layout.layoutId,
      )(positions, [
        {
          widgetId: "1",
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);
      const posX: number = positions[layout.layoutId].width - HIGHLIGHT_SIZE;

      expect(res).toBeDefined();
      expect(res[0].posY).toEqual(0);
      expect(res[0].alignment).toEqual(FlexLayerAlignment.End);
      expect(res[0].posX).toEqual(posX);
      expect(res[0].height).toEqual(positions[layout.layoutId].height);
      expect(res[0].width).toEqual(HIGHLIGHT_SIZE);
    });
  });
  describe("getHighlightsForLayoutRow", () => {
    it("should derive and collate highlights for child layouts", () => {
      /**
       * Create a drop target (DT) layout with two child widgets.
       *
       * Row (R1)
       *  Button (B1)
       *  Input (I1)
       */
      const layoutOne: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: false,
      }).layout as LayoutComponentProps;
      const button1: string = (layoutOne.layout[0] as WidgetLayoutProps)
        .widgetId;
      const input1: string = (layoutOne.layout[1] as WidgetLayoutProps)
        .widgetId;
      /**
       * Create another drop target (DT) layout with two child widgets.
       *
       * Row (R2)
       *  Button (B2)
       *  Input (I2)
       */
      const layoutTwo: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: false,
      }).layout as LayoutComponentProps;
      const button2: string = (layoutTwo.layout[0] as WidgetLayoutProps)
        .widgetId;
      const input2: string = (layoutTwo.layout[1] as WidgetLayoutProps)
        .widgetId;
      /**
       * Create a parent layout with two child layouts.
       *
       * Row (R3) (not Drop Target)
       *  R1
       *  R2
       */
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {
          isDropTarget: true,
          layout: [layoutOne, layoutTwo],
        },
        false,
      ).layout as LayoutComponentProps;
      /**
       * Create a map of widget positions.
       */
      const positions: LayoutElementPositions = {
        [layoutOne.layoutId]: {
          height: 100,
          left: 10,
          top: 10,
          width: 500,
          offsetLeft: 10,
          offsetTop: 10,
        },
        [button1]: {
          height: 40,
          left: 10,
          top: 10,
          width: 100,
          offsetLeft: 10,
          offsetTop: 10,
        },
        [input1]: {
          height: 100,
          left: 60,
          top: 10,
          width: 430,
          offsetLeft: 60,
          offsetTop: 10,
        },
        [layoutTwo.layoutId]: {
          height: 100,
          left: 510,
          top: 10,
          width: 500,
          offsetLeft: 510,
          offsetTop: 10,
        },
        [button2]: {
          height: 40,
          left: 10,
          top: 10,
          width: 100,
          offsetLeft: 10,
          offsetTop: 10,
        },
        [input2]: {
          height: 100,
          left: 60,
          top: 10,
          width: 430,
          offsetLeft: 60,
          offsetTop: 10,
        },
        [layout.layoutId]: {
          height: 100,
          left: 0,
          top: 0,
          width: 1020,
          offsetLeft: 0,
          offsetTop: 0,
        },
      };
      const { highlights: res } = deriveRowHighlights(
        layout,
        "0",
        [],
        layout.layoutId,
      )(positions, [
        {
          widgetId: "1",
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);

      /**
       * Algorithm with calculate highlights for each child Row layout and combine them together.
       * Each row has 2 widgets => 3 highlights each.
       */
      expect(res).toBeDefined();
      expect(res.length).toBe(9);
      expect(res[1].layoutOrder[0]).toEqual(layoutOne.layoutId);
      expect(res[5].layoutOrder[0]).toEqual(layoutTwo.layoutId);
    });
    it("should have existingPositionHighlight prop for highlights of dragged child widgets in highlights calculation", () => {
      /**
       * Create a drop target (DT) layout with two child widgets.
       *
       * Row (R1)
       *  Button (B1)
       *  Input (I1)
       */
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
      }).layout as LayoutComponentProps;
      const button1: string = (layout.layout[0] as WidgetLayoutProps).widgetId;
      const input1: string = (layout.layout[1] as WidgetLayoutProps).widgetId;
      /**
       * Create a map of widget positions.
       */
      const positions: LayoutElementPositions = {
        [layout.layoutId]: {
          height: 100,
          left: 0,
          top: 10,
          width: 500,
          offsetLeft: 0,
          offsetTop: 10,
        },
        [button1]: {
          height: 40,
          left: 10,
          top: 10,
          width: 100,
          offsetLeft: 10,
          offsetTop: 10,
        },
        [input1]: {
          height: 100,
          left: 120,
          top: 10,
          width: 370,
          offsetLeft: 120,
          offsetTop: 10,
        },
      };

      /**
       * Calculate highlights when the first child widget is being dragged.
       */
      const { highlights: res } = deriveRowHighlights(
        layout,
        "0",
        [],
        layout.layoutId,
      )(positions, [
        {
          widgetId: button1,
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);

      expect(res.length).toEqual(3);
      // First highlight should be placed before dragged widget
      expect(res[0].posX).toBeLessThan(positions[button1].left);
      // highlights on both sides of the dragged widget should be have existingPositionHighlight true
      expect(res[0].existingPositionHighlight).toBeTruthy();
      expect(res[1].existingPositionHighlight).toBeTruthy();
      expect(res[2].existingPositionHighlight).toBeFalsy();
    });
  });
});
