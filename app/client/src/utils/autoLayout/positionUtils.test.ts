import { FlexLayerAlignment, ResponsiveBehavior } from "components/constants";
import { FlexLayer } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { RenderModes } from "constants/WidgetConstants";
import { extractAlignmentInfo } from "./positionUtils";

describe("test PositionUtils methods", () => {
  describe("test extractAlignmentInfo method", () => {
    it("should extract children and required columns for each alignment", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 4,
          type: "",
          widgetName: "",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
        },
        "2": {
          widgetId: "2",
          leftColumn: 16,
          rightColumn: 40,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 7,
          type: "",
          widgetName: "",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
        },
        "3": {
          widgetId: "3",
          leftColumn: 48,
          rightColumn: 64,
          alignment: FlexLayerAlignment.End,
          topRow: 0,
          bottomRow: 7,
          type: "",
          widgetName: "",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
        },
      };
      const layer: FlexLayer = {
        children: [
          { id: "1", align: FlexLayerAlignment.Start },
          { id: "2", align: FlexLayerAlignment.Start },
          { id: "3", align: FlexLayerAlignment.End },
        ],
        hasFillChild: false,
      };
      expect(extractAlignmentInfo(widgets, layer, false)).toEqual({
        info: [
          {
            alignment: FlexLayerAlignment.Start,
            columns: 40,
            children: [widgets["1"], widgets["2"]],
          },
          {
            alignment: FlexLayerAlignment.Center,
            columns: 0,
            children: [],
          },
          {
            alignment: FlexLayerAlignment.End,
            columns: 16,
            children: [widgets["3"]],
          },
        ],
        fillWidgetLength: 64,
      });
    });
    it("should calculate columns for fill widgets", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 4,
          type: "",
          widgetName: "",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
        "2": {
          widgetId: "2",
          leftColumn: 16,
          rightColumn: 64,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 7,
          type: "",
          widgetName: "",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
        "3": {
          widgetId: "3",
          leftColumn: 48,
          rightColumn: 64,
          alignment: FlexLayerAlignment.End,
          topRow: 0,
          bottomRow: 7,
          type: "",
          widgetName: "",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
      };
      const layer: FlexLayer = {
        children: [
          { id: "1", align: FlexLayerAlignment.Start },
          { id: "2", align: FlexLayerAlignment.Start },
          { id: "3", align: FlexLayerAlignment.End },
        ],
        hasFillChild: true,
      };
      expect(
        extractAlignmentInfo(widgets, layer, false).fillWidgetLength,
      ).toEqual(24);
    });
  });
});
