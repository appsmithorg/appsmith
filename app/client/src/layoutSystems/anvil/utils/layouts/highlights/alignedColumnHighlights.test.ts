import { generateLayoutComponentMock } from "mocks/layoutComponents/layoutComponentMock";
import {
  LayoutComponentTypes,
  type LayoutComponentProps,
  type WidgetLayoutProps,
} from "../../anvilTypes";
import { deriveAlignedColumnHighlights } from "./alignedColumnHighlights";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { LayoutElementPositions } from "layoutSystems/common/types";
import { registerLayoutComponents } from "../layoutUtils";

describe("AlignedColumnHighlights tests", () => {
  beforeAll(() => {
    registerLayoutComponents();
  });
  describe("deriveAlignedColumnHighlights", () => {
    it("should return three highlights for an empty layout", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layoutType: LayoutComponentTypes.ALIGNED_WIDGET_COLUMN,
        layout: [],
      }).layout as LayoutComponentProps;
      const positions: LayoutElementPositions = {
        [layout.layoutId]: {
          height: 400,
          left: 0,
          top: 0,
          width: 300,
          offsetLeft: 0,
          offsetTop: 0,
        },
      };
      const { highlights: res } = deriveAlignedColumnHighlights(
        layout,
        "0",
        [],
        layout.layoutId,
      )(positions, [
        {
          widgetId: "random",
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);
      const highlightWidth: number =
        positions[layout.layoutId].width / res.length;

      expect(res.length).toEqual(3);
      // Each highlight should be of equal width.
      expect(res[0].width).toEqual(highlightWidth);
      expect(res[1].width).toEqual(highlightWidth);
      expect(res[2].width).toEqual(highlightWidth);
      // highlights should be placed according to the alignment.
      expect(res[0].posX).toEqual(0);
      expect(res[1].posX).toEqual(
        (positions[layout.layoutId].width - highlightWidth) / 2,
      );
      expect(res[2].posX).toEqual(
        positions[layout.layoutId].width - highlightWidth,
      );
    });
    it("should return a single highlight for Fill widget being dragged over an empty layout", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layoutType: LayoutComponentTypes.ALIGNED_WIDGET_COLUMN,
        layout: [],
      }).layout as LayoutComponentProps;
      const positions: LayoutElementPositions = {
        [layout.layoutId]: {
          height: 400,
          left: 0,
          top: 0,
          width: 300,
          offsetLeft: 0,
          offsetTop: 0,
        },
      };
      const { highlights: res } = deriveAlignedColumnHighlights(
        layout,
        "0",
        [],
        layout.layoutId,
      )(positions, [
        {
          widgetId: "1",
          type: "INPUT_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
      ]);

      expect(res.length).toEqual(1);
      expect(res[0].width).toEqual(positions[layout.layoutId].width);
    });
    it("should derive highlights using widget positions", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layoutType: LayoutComponentTypes.ALIGNED_WIDGET_COLUMN,
      }).layout as LayoutComponentProps;
      const button: string = (layout.layout[0] as WidgetLayoutProps).widgetId;
      const input: string = (layout.layout[1] as WidgetLayoutProps).widgetId;
      const positions: LayoutElementPositions = {
        [layout.layoutId]: {
          height: 400,
          left: 0,
          top: 0,
          width: 300,
          offsetLeft: 0,
          offsetTop: 0,
        },
        [button]: {
          height: 40,
          left: 10,
          top: 10,
          width: 120,
          offsetLeft: 10,
          offsetTop: 10,
        },
        [input]: {
          height: 70,
          left: 10,
          top: 60,
          width: 290,
          offsetLeft: 10,
          offsetTop: 60,
        },
      };
      const { highlights: res } = deriveAlignedColumnHighlights(
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

      expect(res.length).toEqual(9);

      // Highlights should be horizontal
      expect(res[0].height).toBeLessThan(res[0].width);
      expect(res[1].isVertical).toBeFalsy();

      // First set of highlights should be placed before the first widget.
      expect(res[0].posY).toEqual(positions[button].top);
      // Second set of highlights should be placed between the two widgets.
      expect(res[4].posY).toBeLessThanOrEqual(positions[input].top);
      expect(res[4].posY).toBeGreaterThan(
        positions[button].top + positions[button].height,
      );
      // Final set of highlights should be placed after the last widget.
      expect(res[8].posY).toBeGreaterThanOrEqual(
        positions[input].top + positions[input].height,
      );
    });
    it("should calculate highlights properly if a dragged widget is Fill widget", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layoutType: LayoutComponentTypes.ALIGNED_WIDGET_COLUMN,
      }).layout as LayoutComponentProps;
      const button: string = (layout.layout[0] as WidgetLayoutProps).widgetId;
      const input: string = (layout.layout[1] as WidgetLayoutProps).widgetId;
      const positions: LayoutElementPositions = {
        [layout.layoutId]: {
          height: 400,
          left: 0,
          top: 0,
          width: 300,
          offsetLeft: 0,
          offsetTop: 0,
        },
        [button]: {
          height: 40,
          left: 10,
          top: 10,
          width: 120,
          offsetLeft: 10,
          offsetTop: 10,
        },
        [input]: {
          height: 70,
          left: 10,
          top: 60,
          width: 290,
          offsetLeft: 10,
          offsetTop: 60,
        },
      };
      const { highlights: res } = deriveAlignedColumnHighlights(
        layout,
        "0",
        [],
        layout.layoutId,
      )(positions, [
        {
          widgetId: "1",
          type: "INPUT_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
      ]);

      expect(res.length).toEqual(3);
      // First highlight before the first widget.
      expect(res[0].posY).toEqual(positions[button].top);
      // Second highlight before second widget.
      expect(res[1].posY).toBeLessThanOrEqual(positions[input].top);
      expect(res[1].posY).toBeGreaterThanOrEqual(positions[button].top);
      // Final highlight should be placed after the last widget.
      expect(res[2].posY).toBeGreaterThanOrEqual(
        positions[input].top + positions[input].height,
      );
      expect(res[2].posY).toBeLessThanOrEqual(
        positions[layout.layoutId].top + positions[layout.layoutId].height,
      );
    });
    it("1. if an existing child widget is being dragged, then it should be discounted from highlight calculation", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layoutType: LayoutComponentTypes.ALIGNED_WIDGET_COLUMN,
      }).layout as LayoutComponentProps;
      const button: string = (layout.layout[0] as WidgetLayoutProps).widgetId;
      const input: string = (layout.layout[1] as WidgetLayoutProps).widgetId;
      const positions: LayoutElementPositions = {
        [layout.layoutId]: {
          height: 400,
          left: 0,
          top: 0,
          width: 300,
          offsetLeft: 0,
          offsetTop: 0,
        },
        [button]: {
          height: 40,
          left: 10,
          top: 10,
          width: 120,
          offsetLeft: 10,
          offsetTop: 10,
        },
        [input]: {
          height: 70,
          left: 10,
          top: 60,
          width: 290,
          offsetLeft: 10,
          offsetTop: 60,
        },
      };
      /**
       * Second widget (input) is being dragged over it's parent layout.
       */
      const { highlights: res } = deriveAlignedColumnHighlights(
        layout,
        "0",
        [],
        layout.layoutId,
      )(positions, [
        {
          widgetId: input,
          type: "INPUT_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
      ]);

      // Highlight for the dragged widget's position should be discounted.
      expect(res.length).toEqual(2);
      // First highlight before the first widget.
      expect(res[0].posY).toEqual(positions[button].top);
      expect(res[0].rowIndex).toEqual(0);
      // Final highlight should be placed after the last widget.
      expect(res[1].posY).toBeGreaterThanOrEqual(
        positions[input].top + positions[input].height,
      );
      expect(res[1].posY).toBeLessThanOrEqual(
        positions[layout.layoutId].top + positions[layout.layoutId].height,
      );
      expect(res[1].rowIndex).toEqual(1);
    });
    it("2. if an existing child widget is being dragged, then it should be discounted from highlight calculation", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layoutType: LayoutComponentTypes.ALIGNED_WIDGET_COLUMN,
      }).layout as LayoutComponentProps;
      const button: string = (layout.layout[0] as WidgetLayoutProps).widgetId;
      const input: string = (layout.layout[1] as WidgetLayoutProps).widgetId;
      const positions: LayoutElementPositions = {
        [layout.layoutId]: {
          height: 400,
          left: 0,
          top: 0,
          width: 300,
          offsetLeft: 0,
          offsetTop: 0,
        },
        [button]: {
          height: 40,
          left: 10,
          top: 10,
          width: 120,
          offsetLeft: 10,
          offsetTop: 10,
        },
        [input]: {
          height: 70,
          left: 10,
          top: 60,
          width: 290,
          offsetLeft: 10,
          offsetTop: 60,
        },
      };
      /**
       * First widget (button) is being dragged over it's parent layout.
       */
      const { highlights: res } = deriveAlignedColumnHighlights(
        layout,
        "0",
        [],
        layout.layoutId,
      )(positions, [
        {
          widgetId: button,
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);

      // Highlight for the dragged widget's position should be discounted.
      expect(res.length).toEqual(6);
      // First highlight before the first widget.
      expect(res[0].posY).toBeLessThanOrEqual(positions[input].top);
      expect(res[0].posY).toBeGreaterThanOrEqual(
        positions[layout.layoutId].top,
      );
      expect(res[0].rowIndex).toEqual(0);
      // Final highlight should be placed after the last widget.
      expect(res[4].posY).toBeGreaterThanOrEqual(
        positions[input].top + positions[input].height,
      );
      expect(res[4].posY).toBeLessThanOrEqual(
        positions[layout.layoutId].top + positions[layout.layoutId].height,
      );
      expect(res[4].rowIndex).toEqual(1);
    });
    it("1. should combine highlights of child layouts in the final output", () => {
      /**
       * Create 2 rows with two widgets in each of them.
       */
      const row1: LayoutComponentProps = generateLayoutComponentMock()
        .layout as LayoutComponentProps;
      const button1: string = (row1.layout[0] as WidgetLayoutProps).widgetId;
      const input1: string = (row1.layout[1] as WidgetLayoutProps).widgetId;

      const row2: LayoutComponentProps = generateLayoutComponentMock()
        .layout as LayoutComponentProps;
      const button2: string = (row2.layout[0] as WidgetLayoutProps).widgetId;
      const input2: string = (row2.layout[1] as WidgetLayoutProps).widgetId;

      /**
       * Create a AlignedColumn layout that will parent the two rows.
       */
      const column: LayoutComponentProps = generateLayoutComponentMock(
        {
          layout: [row1, row2],
          layoutType: LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN,
        },
        false,
      ).layout as LayoutComponentProps;

      /**
       * Create dimensions data
       */
      const dimensions: LayoutElementPositions = {
        [row1.layoutId]: {
          height: 80,
          left: 10,
          top: 10,
          width: 300,
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
          height: 70,
          left: 120,
          top: 10,
          width: 170,
          offsetLeft: 120,
          offsetTop: 10,
        },
        [row2.layoutId]: {
          height: 80,
          left: 10,
          top: 90,
          width: 300,
          offsetLeft: 10,
          offsetTop: 90,
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
          height: 70,
          left: 120,
          top: 10,
          width: 170,
          offsetLeft: 120,
          offsetTop: 10,
        },
        [column.layoutId]: {
          height: 200,
          left: 0,
          top: 0,
          width: 320,
          offsetLeft: 0,
          offsetTop: 0,
        },
      };

      /**
       * Get highlights for the AlignedColumn layout.
       */
      const { highlights: res } = deriveAlignedColumnHighlights(
        column,
        "0",
        [],
        column.layoutId,
      )(dimensions, [
        {
          widgetId: "1",
          type: "INPUT_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
      ]);

      /**
       * # of highlights:
       * Row 1 - 3 (before every widget and after the last one)
       * Row 2 - 3 (before every widget and after the last one)
       * AlignedColumn - 3 (before every layout and after the last one)
       */
      expect(res.length).toEqual(9);

      // First a horizontal highlight to mark the vertical position above the first child layout.
      expect(res[0].isVertical).toBeFalsy();
      // Then highlights from the child layout.
      expect(res[1].isVertical).toBeTruthy();
      expect(res[3].isVertical).toBeTruthy();

      expect(res[0].posY).toEqual(dimensions[row1.layoutId].top);
    });
    it("2. should skip highlights of non drop target child layouts in the final output", () => {
      /**
       * Create 2 rows with two widgets in each of them.
       */
      const row1: LayoutComponentProps = generateLayoutComponentMock()
        .layout as LayoutComponentProps;
      const button1: string = (row1.layout[0] as WidgetLayoutProps).widgetId;
      const input1: string = (row1.layout[1] as WidgetLayoutProps).widgetId;

      const row2: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
      }).layout as LayoutComponentProps;
      const button2: string = (row2.layout[0] as WidgetLayoutProps).widgetId;
      const input2: string = (row2.layout[1] as WidgetLayoutProps).widgetId;

      /**
       * Create a AlignedColumn layout that will parent the two rows.
       */
      const column: LayoutComponentProps = generateLayoutComponentMock(
        {
          layout: [row1, row2],
          layoutType: LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN,
        },
        false,
      ).layout as LayoutComponentProps;

      /**
       * Create dimensions data
       */
      const dimensions: LayoutElementPositions = {
        [row1.layoutId]: {
          height: 80,
          left: 10,
          top: 10,
          width: 300,
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
          height: 70,
          left: 120,
          top: 10,
          width: 170,
          offsetLeft: 120,
          offsetTop: 10,
        },
        [row2.layoutId]: {
          height: 80,
          left: 10,
          top: 90,
          width: 300,
          offsetLeft: 10,
          offsetTop: 90,
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
          height: 70,
          left: 120,
          top: 10,
          width: 170,
          offsetLeft: 120,
          offsetTop: 10,
        },
        [column.layoutId]: {
          height: 200,
          left: 0,
          top: 0,
          width: 320,
          offsetLeft: 0,
          offsetTop: 0,
        },
      };

      /**
       * Get highlights for the AlignedColumn layout.
       */
      const { highlights: res } = deriveAlignedColumnHighlights(
        column,
        "0",
        [],
        column.layoutId,
      )(dimensions, [
        {
          widgetId: "1",
          type: "INPUT_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
      ]);

      /**
       * # of highlights:
       * Row 1 - 3 (before every widget and after the last one)
       * Row 2 - 3 (before every widget and after the last one)
       * AlignedColumn - 3 (before every layout and after the last one)
       */
      expect(res.length).toEqual(6);
      // First a horizontal highlight to mark the vertical position above the first child layout.
      expect(res[0].isVertical).toBeFalsy();
      // Then highlights from the child layout.
      expect(res[1].isVertical).toBeTruthy();
      expect(res[3].isVertical).toBeTruthy();

      expect(res[0].posY).toEqual(dimensions[row1.layoutId].top);
    });
  });
});
