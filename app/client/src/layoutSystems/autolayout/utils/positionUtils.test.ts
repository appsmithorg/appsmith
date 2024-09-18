import {
  FlexLayerAlignment,
  Positioning,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type { AlignmentInfo, Row } from "../../autolayout/utils/types";
import { RenderModes } from "constants/WidgetConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  extractAlignmentInfo,
  getAlignmentSizeInfo,
  getStartingPosition,
  getWrappedAlignmentInfo,
  getWrappedRows,
  placeWidgetsWithoutWrap,
  placeWrappedWidgets,
  updateWidgetPositions,
} from "./positionUtils";
import { LayoutSystemTypes } from "layoutSystems/types";
import { LabelPosition } from "components/constants";
import * as utils from "./flexWidgetUtils";
import type { FlexLayer } from "./types";

describe("test PositionUtils methods", () => {
  const mainCanvasWidth = 960;

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

      expect(extractAlignmentInfo(widgets, layer, false, 64, 1, false)).toEqual(
        {
          info: [
            {
              alignment: FlexLayerAlignment.Start,
              columns: 40,
              children: [
                { widget: widgets["1"], columns: 16, rows: 4 },
                { widget: widgets["2"], columns: 24, rows: 7 },
              ],
            },
            {
              alignment: FlexLayerAlignment.Center,
              columns: 0,
              children: [],
            },
            {
              alignment: FlexLayerAlignment.End,
              columns: 16,
              children: [{ widget: widgets["3"], columns: 16, rows: 7 }],
            },
          ],
          fillWidgetLength: 64,
        },
      );
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
        extractAlignmentInfo(widgets, layer, false, 64, 1, false)
          .fillWidgetLength,
      ).toEqual(24);
    });
    it("should assign 64 columns to each fill widget on mobile viewport", () => {
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
          responsiveBehavior: ResponsiveBehavior.Fill,
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
      const { fillWidgetLength, info } = extractAlignmentInfo(
        widgets,
        layer,
        true,
        64,
        1,
        true,
      );

      expect(fillWidgetLength).toEqual(64);
      expect(info[0].columns).toEqual(128);
    });
    it("should allocate columns for fill widgets that match min widths if enough space is unavailable", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 32,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 4,
          type: "DOCUMENT_VIEWER_WIDGET",
          widgetName: "",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          responsiveBehavior: ResponsiveBehavior.Hug,
          autoLayout: {
            widgetSize: [
              {
                viewportMinWidth: 0,
                configuration: () => {
                  return {
                    minWidth: "280px",
                    minHeight: "280px",
                  };
                },
              },
            ],
          },
        },
        "2": {
          widgetId: "2",
          leftColumn: 32,
          rightColumn: 64,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 7,
          type: "CURRENCY_INPUT_WIDGET",
          widgetName: "Currency1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          responsiveBehavior: ResponsiveBehavior.Fill,
          autoLayout: {
            disabledPropsDefaults: {
              labelPosition: LabelPosition.Top,
              labelTextSize: "0.875rem",
            },
            defaults: {
              rows: 6.6,
            },
            autoDimension: {
              height: true,
            },
            widgetSize: [
              {
                viewportMinWidth: 0,
                configuration: () => {
                  return {
                    minWidth: "120px",
                  };
                },
              },
            ],
            disableResizeHandles: {
              vertical: true,
            },
          },
        },
        "3": {
          widgetId: "3",
          leftColumn: 64,
          rightColumn: 96,
          alignment: FlexLayerAlignment.End,
          topRow: 0,
          bottomRow: 7,
          type: "CONTAINER_WIDGET",
          widgetName: "Container1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
      };

      jest
        .spyOn(utils, "getWidgetMinMaxDimensionsInPixel")
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation((widget: any) => {
          if (
            ["DOCUMENT_VIEWER_WIDGET", "CONTAINER_WIDGET"].includes(
              widget?.type,
            )
          )
            return {
              minWidth: 280,
              minHeight: 280,
              maxWidth: undefined,
              maxHeight: undefined,
            };

          if (widget?.type === "CURRENCY_INPUT_WIDGET")
            return {
              minWidth: 120,
              minHeight: 40,
              maxWidth: undefined,
              maxHeight: undefined,
            };

          return {
            minWidth: undefined,
            minHeight: undefined,
            maxWidth: undefined,
            maxHeight: undefined,
          };
        });
      const layer: FlexLayer = {
        children: [
          { id: "1", align: FlexLayerAlignment.Start },
          { id: "2", align: FlexLayerAlignment.Start },
          { id: "3", align: FlexLayerAlignment.End },
        ],
      };
      const result = extractAlignmentInfo(widgets, layer, false, 600, 1, false);

      /**
       * Canvas width = 600
       * # of fill widgets = 3
       * standard fill widget length (f) = 600 / 3 = 200
       * min widths in descending order -> 280, 280, 120.
       *
       * In descending order of min widths:
       * available space: 600
       * 1st fill widget length (DocumentViewer) -> 280 > 200 -> 280
       * available space: 600 - 280 = 320
       * standard fill widget length (f) = 320 / 2 = 160
       *
       * 2nd fill widget length (ContainerWidget) -> 280 > 160 -> 280
       * available space: 320 - 280 = 40
       * standard fill widget length (f) = 40 / 1 = 40
       *
       * 3rd fill widget length (CurrencyInput) -> 120 > 40 -> 120
       *
       * => widgets will overflow the canvas.
       */

      // DocumnetViewer + CurrencyInput
      expect(result.info[0].columns).toEqual(280 + 120);
      // ContainerWidget
      expect(result.info[2].columns).toEqual(280);
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
            widget: {
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
            columns: 16,
            rows: 4,
          },
          {
            widget: {
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
            columns: 64,
            rows: 7,
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
          children: [
            { widget: widgets["1"], columns: 16, rows: 4 },
            { widget: widgets["2"], columns: 24, rows: 7 },
          ],
        },
        {
          alignment: FlexLayerAlignment.Center,
          columns: 0,
          children: [],
        },
        {
          alignment: FlexLayerAlignment.End,
          columns: 16,
          children: [{ widget: widgets["3"], columns: 16, rows: 7 }],
        },
      ];
      const result: {
        height: number;
        widgets: CanvasWidgetsReduxState;
      } = placeWidgetsWithoutWrap(widgets, arr, 0, false, 0);

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
          children: [{ widget: widgets["1"], columns: 16, rows: 4 }],
        },
        {
          alignment: FlexLayerAlignment.End,
          columns: 40,
          children: [
            { widget: widgets["2"], columns: 24, rows: 7 },
            { widget: widgets["3"], columns: 16, rows: 7 },
          ],
        },
      ];
      const result: {
        height: number;
        widgets: CanvasWidgetsReduxState;
      } = placeWidgetsWithoutWrap(widgets, arr, 0, false, 0);

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
          children: [{ widget: widgets["1"], columns: 16, rows: 4 }],
        },
        {
          alignment: FlexLayerAlignment.End,
          columns: 40,
          children: [
            { widget: widgets["2"], columns: 24, rows: 7 },
            { widget: widgets["3"], columns: 16, rows: 7 },
          ],
        },
      ];
      const result: {
        height: number;
        widgets: CanvasWidgetsReduxState;
      } = placeWidgetsWithoutWrap(widgets, arr, 0, true, 0);

      expect(result.height).toEqual(7);
      expect(result.widgets["1"].mobileLeftColumn).toEqual(8);
      expect(result.widgets["1"].mobileRightColumn).toEqual(24);
      expect(result.widgets["2"].mobileLeftColumn).toEqual(24);
      expect(result.widgets["2"].mobileRightColumn).toEqual(48);
      expect(result.widgets["3"].mobileLeftColumn).toEqual(48);
      expect(result.widgets["3"].mobileRightColumn).toEqual(64);
    });

    it("should allocate columns for fill widgets in descending order of their min width requirement", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 32,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 4,
          type: "DOCUMENT_VIEWER_WIDGET",
          widgetName: "",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          responsiveBehavior: ResponsiveBehavior.Fill,
          autoLayout: {
            widgetSize: [
              {
                viewportMinWidth: 0,
                configuration: () => {
                  return {
                    minWidth: "280px",
                    minHeight: "280px",
                  };
                },
              },
            ],
          },
        },
        "2": {
          widgetId: "2",
          leftColumn: 32,
          rightColumn: 64,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 7,
          type: "CURRENCY_INPUT_WIDGET",
          widgetName: "Currency1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          responsiveBehavior: ResponsiveBehavior.Fill,
          autoLayout: {
            disabledPropsDefaults: {
              labelPosition: LabelPosition.Top,
              labelTextSize: "0.875rem",
            },
            defaults: {
              rows: 6.6,
            },
            autoDimension: {
              height: true,
            },
            widgetSize: [
              {
                viewportMinWidth: 0,
                configuration: () => {
                  return {
                    minWidth: "120px",
                  };
                },
              },
            ],
            disableResizeHandles: {
              vertical: true,
            },
          },
        },
        "3": {
          widgetId: "3",
          leftColumn: 64,
          rightColumn: 96,
          alignment: FlexLayerAlignment.End,
          topRow: 0,
          bottomRow: 7,
          type: "CONTAINER_WIDGET",
          widgetName: "Container1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
      };

      jest
        .spyOn(utils, "getWidgetMinMaxDimensionsInPixel")
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation((widget: any) => {
          if (
            ["DOCUMENT_VIEWER_WIDGET", "CONTAINER_WIDGET"].includes(
              widget?.type,
            )
          )
            return {
              minWidth: 280,
              minHeight: 280,
              maxWidth: undefined,
              maxHeight: undefined,
            };

          if (widget?.type === "CURRENCY_INPUT_WIDGET")
            return {
              minWidth: 120,
              minHeight: 40,
              maxWidth: undefined,
              maxHeight: undefined,
            };

          return {
            minWidth: undefined,
            minHeight: undefined,
            maxWidth: undefined,
            maxHeight: undefined,
          };
        });
      const layer: FlexLayer = {
        children: [
          { id: "1", align: FlexLayerAlignment.Start },
          { id: "2", align: FlexLayerAlignment.Start },
          { id: "3", align: FlexLayerAlignment.End },
        ],
      };
      const alignmentInfo = extractAlignmentInfo(
        widgets,
        layer,
        false,
        640,
        10,
        false,
      );
      const res = placeWidgetsWithoutWrap(
        widgets,
        alignmentInfo.info,
        0,
        false,
      );

      /**
       * available columns: 64
       * column space: 10
       * # of fill widgets = 3
       * standard fill widget length (f) = 64 / 3 = 21.3333
       * min widths in descending order -> 28 (minWidth / columnSpace), 28, 12.
       *
       * In descending order of min widths:
       * available columns: 64
       * 1st fill widget length (DocumentViewer) -> 28 > 21.3333 -> 28
       * available columns: 64 - 28 = 36
       * standard fill widget length (f) = 36 / 2 = 18
       *
       * 2nd fill widget length (ContainerWidget) -> 28 > 18 -> 28
       * available columns: 36 - 28 = 8
       * standard fill widget length (f) = 8 / 1 = 8
       *
       * 3rd fill widget length (CurrencyInput) -> 12 > 8 -> 12
       *
       * => widgets will overflow the canvas.
       * => min widths of each widget is respected.
       */

      // DocumentViewer
      expect(res.widgets["1"].leftColumn).toEqual(0);
      expect(res.widgets["1"].rightColumn).toEqual(28);
      // CurrencyInput
      expect(res.widgets["2"].leftColumn).toEqual(28);
      expect(res.widgets["2"].rightColumn).toEqual(40);
      // ContainerWidget
      expect(res.widgets["3"].leftColumn).toEqual(40);
      expect(res.widgets["3"].rightColumn).toEqual(68);
    });

    it("should allocate columns for fill widgets in descending order of their min width requirement - Part 2", () => {
      const widgets = {
        "1": {
          widgetId: "1",
          leftColumn: 0,
          rightColumn: 21.3333,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 4,
          type: "DOCUMENT_VIEWER_WIDGET",
          widgetName: "",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
        "2": {
          widgetId: "2",
          leftColumn: 21.33333,
          rightColumn: 42.66666,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 7,
          type: "CURRENCY_INPUT_WIDGET",
          widgetName: "Currency1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
        "3": {
          widgetId: "3",
          leftColumn: 42.66666,
          rightColumn: 63.99999,
          alignment: FlexLayerAlignment.Start,
          topRow: 0,
          bottomRow: 7,
          type: "CURRENCY_INPUT_WIDGET",
          widgetName: "Currency2",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 10,
          parentRowSpace: 10,
          isLoading: false,
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
      };

      jest
        .spyOn(utils, "getWidgetMinMaxDimensionsInPixel")
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation((widget: any) => {
          if (
            ["DOCUMENT_VIEWER_WIDGET", "CONTAINER_WIDGET"].includes(
              widget?.type,
            )
          )
            return {
              minWidth: 280,
              minHeight: 280,
              maxWidth: undefined,
              maxHeight: undefined,
            };

          if (widget?.type === "CURRENCY_INPUT_WIDGET")
            return {
              minWidth: 120,
              minHeight: 40,
              maxWidth: undefined,
              maxHeight: undefined,
            };

          return {
            minWidth: undefined,
            minHeight: undefined,
            maxWidth: undefined,
            maxHeight: undefined,
          };
        });
      const layer: FlexLayer = {
        children: [
          { id: "1", align: FlexLayerAlignment.Start },
          { id: "2", align: FlexLayerAlignment.Start },
          { id: "3", align: FlexLayerAlignment.End },
        ],
      };
      const alignmentInfo = extractAlignmentInfo(
        widgets,
        layer,
        false,
        640,
        10,
        false,
      );
      const res = placeWidgetsWithoutWrap(
        widgets,
        alignmentInfo.info,
        0,
        false,
      );

      /**
       * total available columns = 64
       * # of fill widgets = 3
       * columnSpace = 10
       * standard fill widget length (f) = 64 / 3 = 21.333
       * min widths in descending order of columns  -> 28 (280 / 10), 12, 12.
       *
       * In descending order of min widths:
       * available columns: 64
       * 1st fill widget length (DocumentViewer) -> 28 > 21.3333 -> 28
       * available columns: 64 - 28 = 36
       * standard fill widget length (f) = 36 / 2 = 18
       *
       * 2nd fill widget length (CurrencyInput) -> 12 < 18 -> 18
       * available columns: 36 - 18 = 18
       * standard fill widget length (f) = 18 / 1 = 18
       *
       * 3rd fill widget length (CurrencyInput) -> 12 < 18 -> 180
       *
       * => widgets don't overflow the canvas.
       * => DocumentViewer gets more columns (28) to address its min width requirement.
       * => rest of the space gets evenly distributed among the remaining fill widgets, as the it is larger than their min width requirement.
       */

      // DocumentViewer
      expect(res.widgets["1"].leftColumn).toEqual(0);
      expect(res.widgets["1"].rightColumn).toEqual(28);
      // CurrencyInput1
      expect(res.widgets["2"].leftColumn).toEqual(28);
      expect(res.widgets["2"].rightColumn).toEqual(46);
      // CurrencyInput2
      expect(res.widgets["3"].leftColumn).toEqual(46);
      expect(res.widgets["3"].rightColumn).toEqual(64);
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
          children: [
            { widget: widgets["1"], columns: 16, rows: 4 },
            { widget: widgets["2"], columns: 64, rows: 7 },
            { widget: widgets["3"], columns: 16, rows: 7 },
          ],
        },
        0,
        true,
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
          layoutSystemType: LayoutSystemTypes.AUTO,
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
  });
});
