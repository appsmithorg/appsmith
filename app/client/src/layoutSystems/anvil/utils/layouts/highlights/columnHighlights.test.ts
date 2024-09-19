import { generateLayoutComponentMock } from "mocks/layoutComponents/layoutComponentMock";
import {
  LayoutComponentTypes,
  type LayoutComponentProps,
  type WidgetLayoutProps,
  type DraggedWidget,
} from "../../anvilTypes";
import {
  DEFAULT_VERTICAL_HIGHLIGHT_HEIGHT,
  HIGHLIGHT_SIZE,
} from "../../constants";
import { registerLayoutComponents } from "../layoutUtils";
import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { deriveColumnHighlights } from "./columnHighlights";
import type { LayoutElementPositions } from "layoutSystems/common/types";

describe("columnHighlights", () => {
  const draggedHugWidget: DraggedWidget[] = [
    {
      widgetId: "1",
      type: "BUTTON_WIDGET",
      responsiveBehavior: ResponsiveBehavior.Hug,
    },
  ];
  const draggedFillWidget: DraggedWidget[] = [
    {
      widgetId: "2",
      type: "INPUT_WIDGET",
      responsiveBehavior: ResponsiveBehavior.Fill,
    },
  ];

  beforeAll(() => {
    registerLayoutComponents();
  });
  describe("widget highlights", () => {
    it("should derive highlights for a column", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        layoutType: LayoutComponentTypes.WIDGET_COLUMN,
      }).layout as LayoutComponentProps;
      const buttonId: string = (layout.layout[0] as WidgetLayoutProps).widgetId;
      const inputId: string = (layout.layout[1] as WidgetLayoutProps).widgetId;
      const positions: LayoutElementPositions = {
        [layout.layoutId]: {
          height: 500,
          left: 0,
          top: 0,
          width: 300,
          offsetLeft: 0,
          offsetTop: 0,
        },
        [buttonId]: {
          height: 40,
          left: 10,
          top: 10,
          width: 120,
          offsetLeft: 10,
          offsetTop: 10,
        },
        [inputId]: {
          height: 70,
          left: 10,
          top: 60,
          width: 290,
          offsetLeft: 10,
          offsetTop: 60,
        },
      };
      const { highlights: res } = deriveColumnHighlights(
        layout,
        "111",
        [],
        layout.layoutId,
      )(positions, draggedHugWidget);

      expect(res.length).toEqual(3);
      // highlights should be horizontal.
      expect(res[0].width).toBeGreaterThan(res[0].height);
      expect(res[0].isVertical).toBeFalsy();
      // Width of all horizontal highlights should be the same.
      expect(res[0].width).toEqual(positions[layout.layoutId].width);
      expect(res[1].width).toEqual(positions[layout.layoutId].width);
      expect(res[2].width).toEqual(positions[layout.layoutId].width);

      expect(res[0].height).toEqual(HIGHLIGHT_SIZE);

      // highlights should be placed before every widget
      expect(res[0].posY).toBe(positions[buttonId].top);
      expect(res[1].posY).toBeLessThan(positions[inputId].top);
      // and at the bottom of the last widget
      expect(res[2].posY).toBeGreaterThanOrEqual(
        positions[inputId].top + positions[inputId].height,
      );
    });
    it("should discount dragged child widgets from highlight calculation", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        layoutType: LayoutComponentTypes.WIDGET_COLUMN,
      }).layout as LayoutComponentProps;
      const buttonId: string = (layout.layout[0] as WidgetLayoutProps).widgetId;
      const inputId: string = (layout.layout[1] as WidgetLayoutProps).widgetId;
      const positions: LayoutElementPositions = {
        [layout.layoutId]: {
          height: 500,
          left: 0,
          top: 0,
          width: 300,
          offsetLeft: 0,
          offsetTop: 0,
        },
        [buttonId]: {
          height: 40,
          left: 10,
          top: 10,
          width: 120,
          offsetLeft: 10,
          offsetTop: 10,
        },
        [inputId]: {
          height: 70,
          left: 10,
          top: 60,
          width: 290,
          offsetLeft: 10,
          offsetTop: 60,
        },
      };
      const { highlights: res } = deriveColumnHighlights(
        layout,
        "111",
        [],
        layout.layoutId,
      )(positions, [
        ...draggedHugWidget,
        {
          widgetId: buttonId,
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);

      // One highlight is discounted on account of child button widget being dragged.
      expect(res.length).toEqual(2);
      // First highlight should be placed before input widget
      expect(res[0].posY).toBe(positions[inputId].top);
      expect(res[0].rowIndex).toEqual(0);
      // Second highlight should be placed after input widget
      expect(res[1].posY).toBeGreaterThanOrEqual(
        positions[inputId].top + positions[inputId].height,
      );
      expect(res[1].rowIndex).toEqual(1);
    });
  });
  describe("initial highlights", () => {
    it("should return a correct highlight for empty canvas for hug widget", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layoutType: LayoutComponentTypes.WIDGET_COLUMN,
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
      const { highlights: res } = deriveColumnHighlights(
        layout,
        "0",
        [],
        layout.layoutId,
      )(positions, draggedHugWidget);

      expect(res[0].height).toEqual(HIGHLIGHT_SIZE);
      expect(res[0].alignment).toEqual(FlexLayerAlignment.Start);
      expect(res[0].posY).toEqual(0);
    });
    it("should return a correct highlight for empty canvas for fill widget", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layoutType: LayoutComponentTypes.WIDGET_COLUMN,
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
      const { highlights: res } = deriveColumnHighlights(
        layout,
        "0",
        [],
        layout.layoutId,
      )(positions, draggedFillWidget);

      expect(res[0].height).toEqual(HIGHLIGHT_SIZE);
      expect(res[0].width).toEqual(positions[layout.layoutId].width);
      expect(res[0].posY).toEqual(0);
    });
    it("should return a highlight with the correct dimensions", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layoutType: LayoutComponentTypes.WIDGET_COLUMN,
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
      const { highlights: res } = deriveColumnHighlights(
        layout,
        "111",
        [],
        layout.layoutId,
      )(positions, draggedHugWidget);

      expect(res[0].height).toEqual(DEFAULT_VERTICAL_HIGHLIGHT_HEIGHT);
      expect(res[0].alignment).toEqual(FlexLayerAlignment.Start);
      expect(res[0].posY).toEqual(0);
    });
    it("should return a highlight with the correct dimensions for a center aligned empty drop target column", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layoutType: LayoutComponentTypes.WIDGET_COLUMN,
        layout: [],
        layoutStyle: {
          justifyContent: "center",
        },
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
      const { highlights: res } = deriveColumnHighlights(
        layout,
        "111",
        [],
        layout.layoutId,
      )(positions, draggedHugWidget);

      expect(res).toBeDefined();
      expect(res[0].height).toEqual(DEFAULT_VERTICAL_HIGHLIGHT_HEIGHT);
      expect(res[0].posY).toEqual(0);
    });
    it("should return a highlight with the correct dimensions for a end aligned empty drop target column", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isDropTarget: true,
        layoutType: LayoutComponentTypes.WIDGET_COLUMN,
        layout: [],
        layoutStyle: {
          justifyContent: "end",
        },
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
      const { highlights: res } = deriveColumnHighlights(
        layout,
        "111",
        [],
        layout.layoutId,
      )(positions, draggedHugWidget);

      expect(res[0].width).toEqual(HIGHLIGHT_SIZE);
      expect(res[0].posY).toEqual(0);
    });
  });
  describe("layout highlights", () => {
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
       * Create a Column layout that will parent the two rows.
       */
      const column: LayoutComponentProps = generateLayoutComponentMock(
        {
          layout: [row1, row2],
          layoutType: LayoutComponentTypes.LAYOUT_COLUMN,
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
       * Get highlights for the column layout.
       */
      const { highlights: res } = deriveColumnHighlights(
        column,
        "111",
        [],
        column.layoutId,
      )(dimensions, draggedHugWidget);

      /**
       * # of highlights:
       * Row 1 - 3 (before every widget and after the last one)
       * Row 2 - 3 (before every widget and after the last one)
       * Column - 3 (before every layout and after the last one)
       */
      expect(res.length).toEqual(9);
      // First a horizontal highlight to mark the vertical position above the first child layout.
      expect(res[0].isVertical).toBeFalsy();
      // Then highlights from the child layout.
      expect(res[1].isVertical).toBeTruthy();
      expect(res[3].isVertical).toBeTruthy();

      expect(res[0].posY).toEqual(dimensions[row1.layoutId].top);
    });
  });
});
