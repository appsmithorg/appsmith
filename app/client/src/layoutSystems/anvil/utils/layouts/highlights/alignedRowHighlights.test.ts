import { generateAlignedRowMock } from "mocks/layoutComponents/layoutComponentMock";
import type { LayoutComponentProps, WidgetLayoutProps } from "../../anvilTypes";
import type {
  LayoutElementPosition,
  LayoutElementPositions,
} from "layoutSystems/common/types";
import { deriveAlignedRowHighlights } from "./alignedRowHighlights";
import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { HIGHLIGHT_SIZE } from "../../constants";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import AlignedWidgetRow from "layoutSystems/anvil/layoutComponents/components/alignedWidgetRow";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { mockButtonProps } from "mocks/widgetProps/button";
import { getAlignmentLayoutId } from "../layoutUtils";
import ButtonWidget from "widgets/ButtonWidget/widget";

describe("AlignedRow highlights", () => {
  beforeAll(() => {
    LayoutFactory.initialize([AlignedWidgetRow]);
  });
  describe("initial highlights", () => {
    it("should return three initial highlights if layout is empty", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock({
        layout: [],
      }).layout;
      const { layoutId } = layout;

      const startPosition: LayoutElementPosition = {
        height: 40,
        left: 0,
        top: 0,
        width: 400,
        offsetLeft: 0,
        offsetTop: 0,
      };
      const centerPosition: LayoutElementPosition = {
        height: 40,
        left: 404,
        top: 0,
        width: 400,
        offsetLeft: 404,
        offsetTop: 0,
      };
      const endPosition: LayoutElementPosition = {
        height: 40,
        left: 808,
        top: 0,
        width: 400,
        offsetLeft: 808,
        offsetTop: 0,
      };
      const dimensions: LayoutElementPositions = {
        [layoutId]: {
          height: 40,
          left: 0,
          top: 0,
          width: 1208,
          offsetLeft: 0,
          offsetTop: 0,
        },
        [`${layoutId}-0`]: startPosition,
        [`${layoutId}-1`]: centerPosition,
        [`${layoutId}-2`]: endPosition,
      };

      const { highlights: res } = deriveAlignedRowHighlights(
        layout,
        "0",
        [],
      )(dimensions, [
        {
          widgetId: "10",
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);

      expect(res.length).toEqual(3);

      expect(res[0].alignment).toEqual(FlexLayerAlignment.Start);
      expect(res[0].posX).toEqual(startPosition.left);
      expect(res[0].posY).toEqual(startPosition.top);
      expect(res[0].height).toEqual(startPosition.height);

      expect(res[1].alignment).toEqual(FlexLayerAlignment.Center);
      expect(res[1].posX).toEqual(
        centerPosition.left + (centerPosition.width - HIGHLIGHT_SIZE) / 2,
      );
      expect(res[1].posY).toEqual(centerPosition.top);
      expect(res[1].height).toEqual(centerPosition.height);

      expect(res[2].alignment).toEqual(FlexLayerAlignment.End);
      expect(res[2].posX).toEqual(
        dimensions[layoutId].left + dimensions[layoutId].width - HIGHLIGHT_SIZE,
      );
      expect(res[2].posY).toEqual(centerPosition.top);
      expect(res[2].height).toEqual(centerPosition.height);
    });
  });

  describe("fill child widget", () => {
    it("should not render highlights for alignments", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock()
        .layout;
      const { layoutId } = layout;

      const button: string = (layout.layout[0] as WidgetLayoutProps).widgetId;
      const input: string = (layout.layout[1] as WidgetLayoutProps).widgetId;

      const layoutPosition: LayoutElementPosition = {
        height: 78,
        left: 0,
        top: 0,
        width: 1208,
        offsetLeft: 0,
        offsetTop: 0,
      };

      const dimensions: LayoutElementPositions = {
        [layoutId]: layoutPosition,
        [button]: {
          height: 40,
          left: 10,
          top: 4,
          width: 120,
          offsetLeft: 10,
          offsetTop: 4,
        },
        [input]: {
          height: 70,
          left: 140,
          top: 4,
          width: 1058,
          offsetLeft: 140,
          offsetTop: 4,
        },
      };

      const { highlights: res } = deriveAlignedRowHighlights(
        layout,
        "0",
        [],
      )(dimensions, [
        {
          widgetId: "10",
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);

      expect(res.length).toEqual(3);

      expect(res[0].alignment).toEqual(FlexLayerAlignment.Start);
      expect(res[0].posX).toEqual(dimensions[button].left - HIGHLIGHT_SIZE);
      expect(res[0].posY).toEqual(dimensions[button].top);
      expect(res[0].height).toEqual(dimensions[input].height);

      expect(res[1].alignment).toEqual(FlexLayerAlignment.Start);
      expect(res[1].posX).toBeLessThanOrEqual(
        dimensions[input].left - HIGHLIGHT_SIZE,
      );
      expect(res[1].posY).toEqual(dimensions[input].top);
      expect(res[1].height).toEqual(dimensions[input].height);

      expect(res[2].alignment).toEqual(FlexLayerAlignment.Start);
      expect(res[2].posX).toEqual(
        dimensions[input].left + dimensions[input].width,
      );
      expect(res[2].posY).toEqual(dimensions[input].top);
      expect(res[2].height).toEqual(dimensions[input].height);
    });
  });

  describe("hug child widgets", () => {
    it("should derive highlights in proper positions", () => {
      const button1: BaseWidgetProps = mockButtonProps();
      const button2: BaseWidgetProps = mockButtonProps();

      // Create AlignedWidgetRow layout with two buttons at start and center alignments.
      const layout: LayoutComponentProps = generateAlignedRowMock({
        layout: [
          {
            widgetId: button1.widgetId,
            alignment: FlexLayerAlignment.Start,
            widgetType: ButtonWidget.type,
          },
          {
            widgetId: button2.widgetId,
            alignment: FlexLayerAlignment.Center,
            widgetType: ButtonWidget.type,
          },
        ],
      }).layout;
      const { layoutId } = layout;

      const layoutPosition: LayoutElementPosition = {
        height: 48,
        left: 0,
        top: 0,
        width: 1208,
        offsetLeft: 0,
        offsetTop: 0,
      };

      const dimensions: LayoutElementPositions = {
        [layoutId]: layoutPosition,
        [getAlignmentLayoutId(layoutId, FlexLayerAlignment.Start)]: {
          height: 48,
          left: 0,
          top: 0,
          width: 400,
          offsetLeft: 0,
          offsetTop: 0,
        },
        [getAlignmentLayoutId(layoutId, FlexLayerAlignment.Center)]: {
          height: 48,
          left: 404,
          top: 0,
          width: 400,
          offsetLeft: 404,
          offsetTop: 0,
        },
        [getAlignmentLayoutId(layoutId, FlexLayerAlignment.End)]: {
          height: 48,
          left: 808,
          top: 0,
          width: 400,
          offsetLeft: 808,
          offsetTop: 0,
        },
        [button1.widgetId]: {
          height: 40,
          left: 10,
          top: 4,
          width: 120,
          offsetLeft: 10,
          offsetTop: 4,
        },
        [button2.widgetId]: {
          height: 40,
          left: 540,
          top: 4,
          width: 120,
          offsetLeft: 540,
          offsetTop: 4,
        },
      };

      const { highlights: res } = deriveAlignedRowHighlights(
        layout,
        "0",
        [],
      )(dimensions, [
        {
          widgetId: "10",
          type: "BUTTON_WIDGET",
          responsiveBehavior: ResponsiveBehavior.Hug,
        },
      ]);

      expect(res.length).toEqual(5);
      expect(res[0].alignment).toEqual(FlexLayerAlignment.Start);
      expect(res[0].posX).toEqual(
        dimensions[button1.widgetId].left - HIGHLIGHT_SIZE,
      );
      expect(res[0].posY).toEqual(dimensions[button1.widgetId].top);
      expect(res[0].height).toEqual(dimensions[button1.widgetId].height);

      expect(res[1].alignment).toEqual(FlexLayerAlignment.Start);
      expect(res[1].posX).toEqual(
        dimensions[button1.widgetId].left + dimensions[button1.widgetId].width,
      );

      expect(res[2].alignment).toEqual(FlexLayerAlignment.Center);
      expect(res[2].posX).toEqual(
        dimensions[button2.widgetId].left - HIGHLIGHT_SIZE,
      );
      expect(res[2].posY).toEqual(dimensions[button1.widgetId].top);
      expect(res[2].height).toEqual(dimensions[button1.widgetId].height);
    });
  });
});
