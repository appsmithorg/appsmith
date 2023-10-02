import {
  generateAlignedRowMock,
  generateLayoutComponentMock,
} from "mocks/layoutComponentMock";
import type { LayoutComponentProps } from "../anvilTypes";
import {
  addChildToAlignedRow,
  addChildToLayout,
  generateLayoutId,
  removeChildFromAlignedRow,
  removeChildFromLayout,
} from "./layoutUtils";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { mockButtonProps } from "mocks/widgetProps/button";
import type { HighlightInfo } from "layoutSystems/common/utils/types";
import { mockHighlightInfo } from "mocks/mockHighlightInfo";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

describe("layoutUtils tests", () => {
  describe("generateLayoutId", () => {
    it("should generate layout identifier using canvasId and layoutId", () => {
      const canvasId = "canvasId";
      const layoutId = "layoutId";
      const expectedLayoutId = `layout-${canvasId}-${layoutId}`;
      expect(generateLayoutId(canvasId, layoutId)).toBe(expectedLayoutId);
    });
  });
  describe("addChildToLayout", () => {
    it("should add child to layout at provided index", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock();
      const buttonWidget: BaseWidgetProps = mockButtonProps();
      const children: string[] = [buttonWidget.widgetId];
      // Add child at rowIndex 1. layout already contains two widgets.
      let highlight: HighlightInfo = mockHighlightInfo({ rowIndex: 1 });
      let updatedLayout: LayoutComponentProps = addChildToLayout(
        layout,
        children,
        highlight,
      );
      expect(updatedLayout.layout).toContain(buttonWidget.widgetId);

      // Add child at rowIndex 0.
      highlight = mockHighlightInfo({ rowIndex: 0 });
      updatedLayout = addChildToLayout(layout, children, highlight);
      expect(updatedLayout.layout[0]).toEqual(buttonWidget.widgetId);

      // Add child at the end of the layout.
      highlight = mockHighlightInfo({ rowIndex: updatedLayout.layout.length });
      updatedLayout = addChildToLayout(layout, children, highlight);
      expect(updatedLayout.layout[updatedLayout.layout.length - 1]).toEqual(
        buttonWidget.widgetId,
      );
    });
  });
  describe("addChildToAlignedRow", () => {
    it("should add child to the defined alignment and index", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock();
      const buttonWidget: BaseWidgetProps = mockButtonProps();
      const children: string[] = [buttonWidget.widgetId];
      // Add child at the beginning of start alignment.
      let highlight: HighlightInfo = mockHighlightInfo();
      let updatedLayout: LayoutComponentProps = addChildToAlignedRow(
        layout,
        children,
        highlight,
      );
      const originalStartAlignmentLength: number = (
        layout.layout[0] as string[]
      ).length;
      expect(updatedLayout.layout[0]).toContain(buttonWidget.widgetId);
      expect((updatedLayout.layout[0] as string[]).length).toEqual(
        originalStartAlignmentLength + 1,
      );

      // Add child to center alignment.
      highlight = mockHighlightInfo({ alignment: FlexLayerAlignment.Center });
      updatedLayout = addChildToAlignedRow(layout, children, highlight);
      const originalCenterAlignmentLength: number = (
        layout.layout[1] as string[]
      ).length;
      expect(updatedLayout.layout[1]).toContain(buttonWidget.widgetId);
      expect((updatedLayout.layout[1] as string[]).length).toEqual(
        originalCenterAlignmentLength + 1,
      );
    });
    it("should add child at the end of the list, if provided rowIndex is out of bounds", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock();
      const buttonWidget: BaseWidgetProps = mockButtonProps();
      const children: string[] = [buttonWidget.widgetId];
      const highlight: HighlightInfo = mockHighlightInfo({
        alignment: FlexLayerAlignment.Center,
        rowIndex: (layout.layout[1] as string[]).length + 2,
      });
      const updatedLayout: LayoutComponentProps = addChildToAlignedRow(
        layout,
        children,
        highlight,
      );
      const originalCenterAlignmentLength: number = (
        layout.layout[1] as string[]
      ).length;

      expect(updatedLayout.layout[1]).toContain(buttonWidget.widgetId);
      expect((updatedLayout.layout[1] as string[]).length).toEqual(
        originalCenterAlignmentLength + 1,
      );
      expect((updatedLayout.layout[1] as string[])[0]).toEqual(
        buttonWidget.widgetId,
      );
    });
    describe("removeChildFromLayout", () => {
      it("should remove child from layout at provided index", () => {
        const layout: LayoutComponentProps = generateLayoutComponentMock();
        const originalLength: number = layout.layout.length;
        const lastChildWidgetId: string = layout.layout[
          layout.layout.length - 1
        ] as string;
        // Remove last child in the layout.
        const highlight: HighlightInfo = mockHighlightInfo({
          rowIndex: layout.layout.length - 1,
        });
        const updatedLayout: LayoutComponentProps = removeChildFromLayout(
          layout,
          highlight,
        );
        expect(
          (updatedLayout.layout as string[]).includes(lastChildWidgetId),
        ).toBeFalsy();
        expect(updatedLayout.layout.length).toEqual(originalLength - 1);
      });
    });
  });
  describe("removeChildFromAlignedRow", () => {
    it("should remove child from specified alignment and index", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock();
      const originalLength: number = (layout.layout[0] as string[]).length;
      const lastChildWidgetId: string = (layout.layout[0] as string[])[
        (layout.layout[0] as string[]).length - 1
      ];
      // Remove last child in the layout.
      const highlight: HighlightInfo = mockHighlightInfo({
        alignment: FlexLayerAlignment.Start,
        rowIndex: (layout.layout[0] as string[]).length - 1,
      });
      const updatedLayout: LayoutComponentProps = removeChildFromAlignedRow(
        layout,
        highlight,
      );
      expect(
        (updatedLayout.layout[0] as string[]).includes(lastChildWidgetId),
      ).toBeFalsy();
      expect((updatedLayout.layout[0] as string[]).length).toEqual(
        originalLength - 1,
      );
    });
  });
});
