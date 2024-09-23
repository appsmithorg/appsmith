import { FLEXBOX_PADDING, RenderModes } from "constants/WidgetConstants";
import {
  FlexLayerAlignment,
  ResponsiveBehavior,
  ROW_GAP,
} from "layoutSystems/common/utils/constants";
import { getWidgetHeight } from "./flexWidgetUtils";
import type { VerticalHighlightsPayload } from "./highlightUtils";
import {
  deriveHighlightsFromLayers,
  generateHighlightsForAlignment,
  generateVerticalHighlights,
} from "./highlightUtils";
import type { HighlightInfo } from "layoutSystems/common/utils/types";

describe("test HighlightUtils methods", () => {
  describe("test deriveHighlightsFromLayers method", () => {
    it("should generate horizontal highlights for empty canvas", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 64,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 70,
          type: "CANVAS_WIDGET",
          widgetName: "Canvas1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 1,
          parentRowSpace: 1,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 70,
          mobileLeftColumn: 0,
          mobileRightColumn: 640,
          responsiveBehavior: ResponsiveBehavior.Fill,
          parentId: "",
          flexLayers: [],
          children: [],
        },
      };
      const highlights: HighlightInfo[] = deriveHighlightsFromLayers(
        widgets,
        "1",
        9.875,
      );

      expect(highlights.length).toEqual(3);
      expect(highlights[0].isVertical).toBeFalsy;
      // width of each horizontal highlight = container width / 3 - padding.
      expect(Math.round(highlights[0].width)).toEqual(211);
      expect(highlights[0].height).toEqual(4);
      // x position of each horizontal highlight = (container width / 3) * index + padding.
      expect(Math.round(highlights[1].posX)).toEqual(215);
      expect(Math.round(highlights[2].posX)).toEqual(425);
    });
    it("should add horizontal heights before every layer and below the last layer", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 64,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 70,
          type: "CANVAS_WIDGET",
          widgetName: "Canvas1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 1,
          parentRowSpace: 1,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 70,
          mobileLeftColumn: 0,
          mobileRightColumn: 640,
          responsiveBehavior: ResponsiveBehavior.Fill,
          parentId: "",
          flexLayers: [
            { children: [{ id: "2", align: FlexLayerAlignment.Start }] },
          ],
          children: ["2"],
        },
        "2": {
          widgetId: "2",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 4,
          type: "BUTTON_WIDGET",
          widgetName: "Button1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 1.546875,
          parentRowSpace: 10,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 4,
          mobileLeftColumn: 0,
          mobileRightColumn: 16,
          responsiveBehavior: ResponsiveBehavior.Hug,
          parentId: "1",
        },
      };
      const offsetTop = ROW_GAP;
      const highlights: HighlightInfo[] = deriveHighlightsFromLayers(
        widgets,
        "1",
        10,
      );

      expect(highlights.length).toEqual(10);
      expect(
        highlights[0].isVertical ||
          highlights[1].isVertical ||
          highlights[2].isVertical,
      ).toBeFalsy;
      expect(
        highlights[7].isVertical ||
          highlights[8].isVertical ||
          highlights[9].isVertical,
      ).toBeFalsy;

      expect(highlights[0].posY).toEqual(FLEXBOX_PADDING);
      expect(highlights[7].posY).toEqual(
        highlights[0].posY +
          (widgets["2"].bottomRow - widgets["2"].topRow) *
            widgets["2"].parentRowSpace +
          ROW_GAP -
          offsetTop,
      );

      expect(highlights[0].layerIndex).toEqual(0);
      expect(highlights[0].isNewLayer).toBeTruthy;
      expect(highlights[7].layerIndex).toEqual(1);
      expect(highlights[7].isNewLayer).toBeTruthy;
    });
  });

  describe("test generateHighlightsForAlignment method", () => {
    it("should add vertical highlights before every widget in the alignment, and at the end of the last widget", () => {
      const children = [
        {
          widgetId: "2",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 4,
          type: "BUTTON_WIDGET",
          widgetName: "Button1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 4,
          mobileLeftColumn: 0,
          mobileRightColumn: 16,
          responsiveBehavior: ResponsiveBehavior.Hug,
          parentId: "1",
        },
      ];
      const result: HighlightInfo[] = generateHighlightsForAlignment({
        arr: children,
        childCount: 0,
        layerIndex: 0,
        alignment: FlexLayerAlignment.Start,
        maxHeight: 40,
        offsetTop: 4,
        parentColumnSpace: 10,
        avoidInitialHighlight: false,
        isMobile: false,
        startPosition: 0,
        canvasId: "1",
      });

      expect(result.length).toEqual(2);
      expect(result[0].posX).toEqual(2);
      expect(result[0].posY).toEqual(4);
      expect(result[0].width).toEqual(4);
      expect(result[0].height).toEqual(
        getWidgetHeight(children[0], false) * children[0].parentRowSpace,
      );

      expect(result[1].posX).toEqual(
        children[0].rightColumn * children[0].parentColumnSpace +
          FLEXBOX_PADDING / 2,
      );
      expect(result[1].isNewLayer).toBeFalsy;
      expect(result[1].isVertical).toBeTruthy;
      expect(result[1].layerIndex).toEqual(0);
    });
    it("should create vertical highlights as tall as the tallest child in the row", () => {
      const children = [
        {
          widgetId: "2",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 4,
          type: "BUTTON_WIDGET",
          widgetName: "Button1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 4,
          mobileLeftColumn: 0,
          mobileRightColumn: 16,
          responsiveBehavior: ResponsiveBehavior.Hug,
          parentId: "1",
        },
        {
          widgetId: "3",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 6,
          type: "BUTTON_WIDGET",
          widgetName: "Button2",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 6,
          mobileLeftColumn: 0,
          mobileRightColumn: 16,
          responsiveBehavior: ResponsiveBehavior.Hug,
          parentId: "1",
        },
      ];
      const result: HighlightInfo[] = generateHighlightsForAlignment({
        arr: children,
        childCount: 0,
        layerIndex: 0,
        alignment: FlexLayerAlignment.Start,
        maxHeight:
          getWidgetHeight(children[1], false) * children[1].parentRowSpace,
        offsetTop: 4,
        parentColumnSpace: 10,

        avoidInitialHighlight: false,
        isMobile: false,
        startPosition: 0,
        canvasId: "1",
      });

      expect(result.length).toEqual(3);
      expect(result[0].height).toEqual(
        getWidgetHeight(children[1], false) * children[1].parentRowSpace,
      );
    });
    it("should not render initial highlight is avoidInitialHighlight is true", () => {
      const result: HighlightInfo[] = generateHighlightsForAlignment({
        arr: [],
        childCount: 0,
        layerIndex: 0,
        alignment: FlexLayerAlignment.Start,
        maxHeight: 40,
        offsetTop: 4,
        parentColumnSpace: 10,

        avoidInitialHighlight: true,
        isMobile: false,
        startPosition: 0,
        canvasId: "1",
      });

      expect(result.length).toEqual(0);
    });
  });

  describe("test generateVerticalHighlights method", () => {
    it("should not render initial highlight for an empty center alignment if one of the other alignments are encroaching its space", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 64,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 70,
          type: "CANVAS_WIDGET",
          widgetName: "Canvas1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 1,
          parentRowSpace: 1,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 70,
          mobileLeftColumn: 0,
          mobileRightColumn: 640,
          responsiveBehavior: ResponsiveBehavior.Fill,
          parentId: "",
          flexLayers: [
            {
              children: [
                { id: "2", align: FlexLayerAlignment.Start },
                { id: "3", align: FlexLayerAlignment.Start },
              ],
            },
          ],
          children: ["2", "3"],
        },
        "2": {
          widgetId: "2",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 4,
          type: "BUTTON_WIDGET",
          widgetName: "Button1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 4,
          mobileLeftColumn: 0,
          mobileRightColumn: 16,
          responsiveBehavior: ResponsiveBehavior.Hug,
          parentId: "1",
        },
        "3": {
          widgetId: "3",
          leftColumn: 16,
          rightColumn: 26,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 6,
          type: "BUTTON_WIDGET",
          widgetName: "Button2",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 6,
          mobileLeftColumn: 16,
          mobileRightColumn: 26,
          responsiveBehavior: ResponsiveBehavior.Hug,
          parentId: "1",
        },
      };
      const result: VerticalHighlightsPayload = generateVerticalHighlights({
        widgets,
        layer: widgets["1"].flexLayers[0],
        childCount: 0,
        layerIndex: 0,
        offsetTop: 4,

        canvasId: "1",
        columnSpace: 10,
        draggedWidgets: [],
        isMobile: false,
      });

      expect(result.highlights.length).toEqual(4);
      expect(result.childCount).toEqual(2);
    });
    it("should not render highlights for flex wrapped alignments that span multiple rows", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 64,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 70,
          type: "CANVAS_WIDGET",
          widgetName: "Canvas1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 1,
          parentRowSpace: 1,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 70,
          mobileLeftColumn: 0,
          mobileRightColumn: 640,
          responsiveBehavior: ResponsiveBehavior.Fill,
          parentId: "",
          flexLayers: [
            {
              children: [
                { id: "2", align: FlexLayerAlignment.Start },
                { id: "3", align: FlexLayerAlignment.Start },
              ],
            },
          ],
          children: ["2", "3"],
        },
        "2": {
          widgetId: "2",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 4,
          type: "BUTTON_WIDGET",
          widgetName: "Button1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 4,
          mobileLeftColumn: 0,
          mobileRightColumn: 16,
          responsiveBehavior: ResponsiveBehavior.Hug,
          parentId: "1",
        },
        "3": {
          widgetId: "3",
          leftColumn: 16,
          rightColumn: 64,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 6,
          type: "INPUT_WIDGET",
          widgetName: "Button2",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          mobileTopRow: 4,
          mobileBottomRow: 10,
          mobileLeftColumn: 0,
          mobileRightColumn: 64,
          responsiveBehavior: ResponsiveBehavior.Fill,
          parentId: "1",
        },
      };
      const result: VerticalHighlightsPayload = generateVerticalHighlights({
        widgets,
        layer: widgets["1"].flexLayers[0],
        childCount: 0,
        layerIndex: 0,
        offsetTop: 4,
        canvasId: "1",
        columnSpace: 9.875,
        draggedWidgets: [],
        isMobile: true,
      });

      expect(result.highlights.length).toEqual(3);
      expect(result.highlights[1].posY).toEqual(
        widgets["3"].mobileTopRow * widgets["3"].parentRowSpace +
          FLEXBOX_PADDING,
      );
      expect(result.highlights[1].height).toEqual(60);
      expect(result.highlights[2].posX).toEqual(634);
      expect(result.highlights[2].posY).toEqual(
        widgets["3"].mobileTopRow * widgets["3"].parentRowSpace +
          FLEXBOX_PADDING,
      );
      expect(result.childCount).toEqual(2);
    });
  });
});
