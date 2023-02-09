import {
  FlexLayerAlignment,
  Positioning,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import { FlexLayer } from "./autoLayoutTypes";
import { RenderModes } from "constants/WidgetConstants";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  AlignmentInfo,
  extractAlignmentInfo,
  getAlignmentSizeInfo,
  getStartingPosition,
  getWrappedAlignmentInfo,
  getWrappedRows,
  placeWidgetsWithoutWrap,
  placeWrappedWidgets,
  Row,
  updateWidgetPositions,
} from "./positionUtils";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";

describe("test PositionUtils methods", () => {
  const mainCanvasWidth = 960;
  const columnSpace = 10;
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
      };
      expect(
        extractAlignmentInfo(widgets, layer, false).fillWidgetLength,
      ).toEqual(24);
    });
  });

  describe("test getAlignmentSizeinfo method", () => {
    it("should distribute the space evenly across alignments if they don't need more than their equal share", () => {
      const arr: AlignmentInfo[] = [
        { alignment: FlexLayerAlignment.Start, columns: 0, children: [] },
        { alignment: FlexLayerAlignment.Center, columns: 0, children: [] },
        { alignment: FlexLayerAlignment.End, columns: 0, children: [] },
      ];
      const { centerSize, endSize, startSize } = getAlignmentSizeInfo(arr);
      expect(startSize).toEqual(endSize);
      expect(startSize).toEqual(centerSize);
    });
    it("should distribute the space evenly across alignments if 1) they don't need more than their equal share, and 2) there are fewer than three alignments in the layer", () => {
      const arr: AlignmentInfo[] = [
        { alignment: FlexLayerAlignment.Center, columns: 0, children: [] },
        { alignment: FlexLayerAlignment.End, columns: 0, children: [] },
      ];
      const { centerSize, endSize, startSize } = getAlignmentSizeInfo(arr);
      expect(startSize).toEqual(0);
      expect(endSize).toEqual(32);
      expect(endSize).toEqual(centerSize);
    });
    it("should assign appropriate columns to an alignment that needs more space, and distribute the remaining space evenly amongst the other alignments", () => {
      const arr: AlignmentInfo[] = [
        { alignment: FlexLayerAlignment.Start, columns: 40, children: [] },
        { alignment: FlexLayerAlignment.Center, columns: 0, children: [] },
        { alignment: FlexLayerAlignment.End, columns: 0, children: [] },
      ];
      const { centerSize, endSize, startSize } = getAlignmentSizeInfo(arr);
      expect(startSize).toEqual(40);
      expect(endSize).toEqual(12);
      expect(endSize).toEqual(centerSize);
    });
  });
  describe("test getWrappedAlignmentInfo method", () => {
    it("should place all alignments in a single row if combined column requirement <= 64", () => {
      const arr: AlignmentInfo[] = [
        { alignment: FlexLayerAlignment.Start, columns: 16, children: [] },
        { alignment: FlexLayerAlignment.Center, columns: 20, children: [] },
        { alignment: FlexLayerAlignment.End, columns: 26, children: [] },
      ];
      const rows: AlignmentInfo[][] = getWrappedAlignmentInfo(arr);
      expect(rows.length).toEqual(3);
      expect(rows[0].length).toEqual(3);
      expect(rows.filter((row) => !row.length).length).toEqual(2);
      expect(rows[0]).toEqual(arr);
    });
    it("should wrap an alignment requiring > 64 columns in a separate row", () => {
      const arr: AlignmentInfo[] = [
        { alignment: FlexLayerAlignment.Start, columns: 80, children: [] },
        { alignment: FlexLayerAlignment.Center, columns: 20, children: [] },
        { alignment: FlexLayerAlignment.End, columns: 26, children: [] },
      ];
      const rows: AlignmentInfo[][] = getWrappedAlignmentInfo(arr);
      expect(rows.length).toEqual(3);
      expect(rows[0].length).toEqual(1);
      expect(rows[1].length).toEqual(2);
      expect(rows.filter((row) => !row.length).length).toEqual(1);
      expect(rows[0]).toEqual([arr[0]]);
      expect(rows[1]).toEqual([arr[1], arr[2]]);
    });
    it("should wrap alignments into multiple rows if combined columns requirement > 64", () => {
      const arr: AlignmentInfo[] = [
        { alignment: FlexLayerAlignment.Start, columns: 30, children: [] },
        { alignment: FlexLayerAlignment.Center, columns: 40, children: [] },
        { alignment: FlexLayerAlignment.End, columns: 10, children: [] },
      ];
      const rows: AlignmentInfo[][] = getWrappedAlignmentInfo(arr);
      expect(rows.length).toEqual(3);
      expect(rows[0].length).toEqual(1);
      expect(rows[1].length).toEqual(2);
      expect(rows.filter((row) => !row.length).length).toEqual(1);
      expect(rows[0]).toEqual([arr[0]]);
      expect(rows[1]).toEqual([arr[1], arr[2]]);
    });
  });

  describe("test getStartingPosition method", () => {
    it("should return 0 as the starting position for FlexLayerAlignment.Start", () => {
      expect(
        getStartingPosition(FlexLayerAlignment.Start, 21.3, 21.3, 21.3, 16),
      ).toEqual(0);
    });
    it("should return valid starting position for FlexLayerAlignment.Center", () => {
      expect(
        getStartingPosition(FlexLayerAlignment.Center, 20, 24, 20, 16),
      ).toEqual(24);
    });
    it("should return valid starting position for FlexLayerAlignment.End", () => {
      expect(
        getStartingPosition(FlexLayerAlignment.End, 20, 24, 20, 16),
      ).toEqual(48);
    });
  });

  describe("test getWrappedRows method", () => {
    it("should segregate an alignment's children into multiple rows if combined column requirement > 64", () => {
      const arr: AlignmentInfo = {
        alignment: FlexLayerAlignment.Start,
        columns: 80,
        children: [
          {
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
            mobileTopRow: 0,
            mobileBottomRow: 4,
            mobileLeftColumn: 0,
            mobileRightColumn: 16,
            responsiveBehavior: ResponsiveBehavior.Hug,
          },
          {
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
            mobileTopRow: 0,
            mobileBottomRow: 7,
            mobileLeftColumn: 16,
            mobileRightColumn: 80,
            responsiveBehavior: ResponsiveBehavior.Fill,
          },
        ],
      };
      const rows: Row[] = getWrappedRows(arr, [], true);
      expect(rows.length).toEqual(2);
      expect(rows[0]).toEqual({
        alignment: arr.alignment,
        columns: 16,
        children: [arr.children[0]],
        height: 4,
      });
      expect(rows[1]).toEqual({
        alignment: arr.alignment,
        columns: 64,
        children: [arr.children[1]],
        height: 7,
      });
    });
  });

  describe("test placeWidgetsWithoutWrap method", () => {
    it("should update positions of widgets - part 1", () => {
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
          leftColumn: 0,
          rightColumn: 24,
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
          leftColumn: 0,
          rightColumn: 16,
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
      const arr: AlignmentInfo[] = [
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
      ];
      const result: {
        height: number;
        widgets: CanvasWidgetsReduxState;
      } = placeWidgetsWithoutWrap(
        widgets,
        arr,
        0,
        64,
        false,
        mainCanvasWidth,
        columnSpace,
        0,
      );
      expect(result.height).toEqual(7);
      expect(result.widgets["2"].leftColumn).toEqual(16);
      expect(result.widgets["2"].rightColumn).toEqual(40);
      expect(result.widgets["3"].leftColumn).toEqual(48);
      expect(result.widgets["3"].rightColumn).toEqual(64);
    });
    it("should update positions of widgets - part 2", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.Center,
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
          leftColumn: 0,
          rightColumn: 24,
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
        "3": {
          widgetId: "3",
          leftColumn: 0,
          rightColumn: 16,
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
      const arr: AlignmentInfo[] = [
        {
          alignment: FlexLayerAlignment.Start,
          columns: 0,
          children: [],
        },
        {
          alignment: FlexLayerAlignment.Center,
          columns: 16,
          children: [widgets["1"]],
        },
        {
          alignment: FlexLayerAlignment.End,
          columns: 40,
          children: [widgets["2"], widgets["3"]],
        },
      ];
      const result: {
        height: number;
        widgets: CanvasWidgetsReduxState;
      } = placeWidgetsWithoutWrap(
        widgets,
        arr,
        0,
        64,
        false,
        mainCanvasWidth,
        columnSpace,
        0,
      );
      expect(result.height).toEqual(7);
      expect(result.widgets["1"].leftColumn).toEqual(8);
      expect(result.widgets["1"].rightColumn).toEqual(24);
      expect(result.widgets["2"].leftColumn).toEqual(24);
      expect(result.widgets["2"].rightColumn).toEqual(48);
      expect(result.widgets["3"].leftColumn).toEqual(48);
      expect(result.widgets["3"].rightColumn).toEqual(64);
    });
    it("should update positions of widgets - part 3", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.Center,
          topRow: 0,
          bottomRow: 4,
          type: "",
          widgetName: "",
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
        },
        "2": {
          widgetId: "2",
          leftColumn: 0,
          rightColumn: 24,
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
          mobileTopRow: 0,
          mobileBottomRow: 7,
          mobileLeftColumn: 0,
          mobileRightColumn: 24,
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
        "3": {
          widgetId: "3",
          leftColumn: 0,
          rightColumn: 16,
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
          mobileTopRow: 0,
          mobileBottomRow: 7,
          mobileLeftColumn: 0,
          mobileRightColumn: 16,
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      };
      const arr: AlignmentInfo[] = [
        {
          alignment: FlexLayerAlignment.Start,
          columns: 0,
          children: [],
        },
        {
          alignment: FlexLayerAlignment.Center,
          columns: 16,
          children: [widgets["1"]],
        },
        {
          alignment: FlexLayerAlignment.End,
          columns: 40,
          children: [widgets["2"], widgets["3"]],
        },
      ];
      const result: {
        height: number;
        widgets: CanvasWidgetsReduxState;
      } = placeWidgetsWithoutWrap(
        widgets,
        arr,
        0,
        64,
        true,
        mainCanvasWidth,
        columnSpace,
        0,
      );
      expect(result.height).toEqual(7);
      expect(result.widgets["1"].mobileLeftColumn).toEqual(8);
      expect(result.widgets["1"].mobileRightColumn).toEqual(24);
      expect(result.widgets["2"].mobileLeftColumn).toEqual(24);
      expect(result.widgets["2"].mobileRightColumn).toEqual(48);
      expect(result.widgets["3"].mobileLeftColumn).toEqual(48);
      expect(result.widgets["3"].mobileRightColumn).toEqual(64);
    });
  });

  describe("test placeWrappedWidgets method", () => {
    it("should update positions of widgets in a flex wrapped alignment", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.End,
          topRow: 0,
          bottomRow: 4,
          type: "",
          widgetName: "",
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
        },
        "2": {
          widgetId: "2",
          leftColumn: 0,
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
          mobileTopRow: 0,
          mobileBottomRow: 7,
          mobileLeftColumn: 0,
          mobileRightColumn: 64,
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
        "3": {
          widgetId: "3",
          leftColumn: 0,
          rightColumn: 16,
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
          mobileTopRow: 0,
          mobileBottomRow: 7,
          mobileLeftColumn: 0,
          mobileRightColumn: 16,
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      };
      const result: {
        height: number;
        widgets: CanvasWidgetsReduxState;
      } = placeWrappedWidgets(
        widgets,
        {
          alignment: FlexLayerAlignment.End,
          columns: 96,
          children: [widgets["1"], widgets["2"], widgets["3"]],
        },
        0,
        64,
        true,
        mainCanvasWidth,
      );
      expect(result.height).toEqual(18);
      expect(result.widgets["1"].mobileLeftColumn).toEqual(48);
      expect(result.widgets["1"].mobileRightColumn).toEqual(64);

      expect(result.widgets["2"].mobileLeftColumn).toEqual(0);
      expect(result.widgets["2"].mobileRightColumn).toEqual(64);
      expect(result.widgets["2"].mobileTopRow).toEqual(4);
      expect(result.widgets["2"].mobileBottomRow).toEqual(11);

      expect(result.widgets["3"].mobileLeftColumn).toEqual(48);
      expect(result.widgets["3"].mobileRightColumn).toEqual(64);
      expect(result.widgets["3"].mobileTopRow).toEqual(11);
      expect(result.widgets["3"].mobileBottomRow).toEqual(18);
    });
  });

  describe("test updateWidgetPositions method", () => {
    it("should update positions of widgets within a given parent", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.End,
          topRow: 0,
          bottomRow: 4,
          type: "",
          widgetName: "",
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
        },
        "2": {
          widgetId: "2",
          leftColumn: 0,
          rightColumn: 24,
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
          mobileTopRow: 0,
          mobileBottomRow: 7,
          mobileLeftColumn: 0,
          mobileRightColumn: 24,
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
        "3": {
          widgetId: "3",
          leftColumn: 0,
          rightColumn: 640,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 70,
          type: "CANVAS_WIDGET",
          widgetName: "",
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
          parentId: "0",
          flexLayers: [
            {
              children: [
                { id: "1", align: FlexLayerAlignment.End },
                { id: "2", align: FlexLayerAlignment.End },
              ],
            },
          ],
        },
        "0": {
          widgetId: "0",
          leftColumn: 0,
          rightColumn: 64,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 7,
          type: "CANVAS_WIDGET",
          widgetName: "",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 7,
          mobileLeftColumn: 0,
          mobileRightColumn: 64,
          responsiveBehavior: ResponsiveBehavior.Fill,
          parentId: "",
          positioning: Positioning.Vertical,
          appPositioningType: AppPositioningTypes.AUTO,
          useAutoLayout: true,
          flexLayers: [
            { children: [{ id: "3", align: FlexLayerAlignment.Start }] },
          ],
        },
      };
      const result = updateWidgetPositions(
        widgets,
        "3",
        false,
        mainCanvasWidth,
      );
      expect(result["1"].leftColumn).toEqual(24);
      expect(result["1"].rightColumn).toEqual(40);
      expect(result["2"].leftColumn).toEqual(40);
      expect(result["2"].rightColumn).toEqual(64);
    });
    it("should update height of parents if required", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 16,
          alignment: FlexLayerAlignment.End,
          topRow: 0,
          bottomRow: 4,
          type: "",
          widgetName: "",
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
          parentId: "3",
        },
        "2": {
          widgetId: "2",
          leftColumn: 0,
          rightColumn: 48,
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
          mobileTopRow: 0,
          mobileBottomRow: 7,
          mobileLeftColumn: 0,
          mobileRightColumn: 64,
          responsiveBehavior: ResponsiveBehavior.Fill,
          parentId: "3",
        },
        "3": {
          widgetId: "3",
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
          parentId: "4",
          flexLayers: [
            {
              children: [
                { id: "1", align: FlexLayerAlignment.End },
                { id: "2", align: FlexLayerAlignment.End },
              ],
            },
          ],
          children: ["1", "2"],
        },
        "4": {
          widgetId: "4",
          leftColumn: 0,
          rightColumn: 64,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 7,
          type: "CONTAINER_WIDGET",
          widgetName: "Container1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 7,
          mobileLeftColumn: 0,
          mobileRightColumn: 64,
          responsiveBehavior: ResponsiveBehavior.Fill,
          parentId: "0",
          children: ["3"],
        },
        "0": {
          widgetId: "0",
          leftColumn: 0,
          rightColumn: 64,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 700,
          type: "CANVAS_WIDGET",
          widgetName: "MainContainer",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 1,
          parentRowSpace: 1,
          isLoading: false,
          mobileTopRow: 0,
          mobileBottomRow: 700,
          mobileLeftColumn: 0,
          mobileRightColumn: 640,
          responsiveBehavior: ResponsiveBehavior.Fill,
          parentId: "4",
          flexLayers: [
            {
              children: [{ id: "4", align: FlexLayerAlignment.Start }],
            },
          ],
          children: ["4"],
          positioning: Positioning.Vertical,
          appPositioningType: AppPositioningTypes.AUTO,
          useAutoLayout: true,
        },
      };
      const result = updateWidgetPositions(widgets, "3", true, mainCanvasWidth);
      expect(result["3"].mobileBottomRow).toEqual(120);
      expect(result["4"].mobileBottomRow).toEqual(13);
    });
  });
});
