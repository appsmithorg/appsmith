import { generateLayoutComponentMock } from "mocks/layoutComponents/layoutComponentMock";
import type {
  AnvilHighlightInfo,
  LayoutComponentProps,
  LayoutProps,
  WidgetLayoutProps,
} from "../anvilTypes";
import {
  addChildToLayout,
  extractWidgetIdsFromLayoutProps,
  removeChildFromLayout,
} from "./layoutUtils";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { mockAnvilHighlightInfo } from "mocks/mockHighlightInfo";
import { mockButtonProps } from "mocks/widgetProps/button";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { getAnvilLayoutDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import ButtonWidget from "widgets/ButtonWidget/widget";

describe("layoutUtils tests", () => {
  describe("getLayoutId", () => {
    it("should generate layout identifier using canvasId and layoutId", () => {
      const canvasId = "canvasId";
      const layoutId = "layoutId";
      const expectedLayoutId = `layout_${canvasId}_${layoutId}`;

      expect(getAnvilLayoutDOMId(canvasId, layoutId)).toBe(expectedLayoutId);
    });
  });
  describe("addChildToLayout", () => {
    it("should add child to layout at provided index", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock().layout;
      const buttonWidget: BaseWidgetProps = mockButtonProps();
      const children: WidgetLayoutProps[] = [
        {
          widgetId: buttonWidget.widgetId,
          alignment: FlexLayerAlignment.Start,
          widgetType: ButtonWidget.type,
        },
      ];
      // Add child at rowIndex 1. layout already contains two widgets.
      let highlight: AnvilHighlightInfo = mockAnvilHighlightInfo({
        rowIndex: 1,
      });
      let updatedLayout: LayoutProps = addChildToLayout(
        layout,
        children,
        highlight,
      );

      expect(
        extractWidgetIdsFromLayoutProps(updatedLayout).includes(
          buttonWidget.widgetId,
        ),
      ).toBeTruthy();

      // Add child at rowIndex 0.
      highlight = mockAnvilHighlightInfo({ rowIndex: 0 });
      updatedLayout = addChildToLayout(layout, children, highlight);
      expect(extractWidgetIdsFromLayoutProps(updatedLayout)[0]).toEqual(
        buttonWidget.widgetId,
      );

      // Add child at the end of the layout.
      highlight = mockAnvilHighlightInfo({
        rowIndex: updatedLayout.layout.length,
      });
      updatedLayout = addChildToLayout(layout, children, highlight);
      expect(
        extractWidgetIdsFromLayoutProps(updatedLayout).includes(
          buttonWidget.widgetId,
        ),
      ).toBeTruthy();
    });
  });
  describe("removeChildFromLayout", () => {
    it("should remove child from layout at provided index", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock().layout;
      const originalLength: number = layout.layout.length;
      const lastWidget: WidgetLayoutProps = layout.layout[
        layout.layout.length - 1
      ] as WidgetLayoutProps;

      // Remove last child in the layout.
      const updatedLayout: LayoutProps | undefined = removeChildFromLayout(
        layout,
        lastWidget,
      );

      if (!updatedLayout) return;

      expect(
        extractWidgetIdsFromLayoutProps(updatedLayout).includes(
          lastWidget.widgetId,
        ),
      ).toBeFalsy();
      expect(updatedLayout?.layout.length).toEqual(originalLength - 1);
    });
    it("should return undefined if layout is temporary and empty after deletion", () => {
      const layoutProps: LayoutComponentProps =
        generateLayoutComponentMock().layout;
      const lastWidget: WidgetLayoutProps = layoutProps.layout[
        layoutProps.layout.length - 1
      ] as WidgetLayoutProps;

      // Remove last child in the layout.
      const updatedLayout: LayoutProps | undefined = removeChildFromLayout(
        { ...layoutProps, layout: [lastWidget] },
        lastWidget,
      );

      expect(updatedLayout).toBeUndefined();
    });
  });
});
