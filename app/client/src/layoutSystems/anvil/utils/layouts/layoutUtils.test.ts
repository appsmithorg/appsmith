import {
  generateAlignedRowMock,
  generateLayoutComponentMock,
} from "mocks/layoutComponents/layoutComponentMock";
import type { AnvilHighlightInfo, LayoutComponentProps } from "../anvilTypes";
import {
  addChildToAlignedRow,
  addChildToLayout,
  generateLayoutId,
  removeChildFromAlignedRow,
  removeChildFromLayout,
} from "./layoutUtils";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { ButtonFactory } from "test/factories/Widgets/ButtonFactory";
import { mockAnvilHighlightInfo } from "mocks/mockHighlightInfo";

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
      const buttonWidget: BaseWidgetProps = ButtonFactory.build();
      const children: string[] = [buttonWidget.widgetId];
      // Add child at rowIndex 1. layout already contains two widgets.
      let highlight: AnvilHighlightInfo = mockAnvilHighlightInfo({
        rowIndex: 1,
      });
      let updatedLayout: LayoutComponentProps = addChildToLayout(
        layout,
        children,
        highlight,
      );
      expect(updatedLayout.layout).toContain(buttonWidget.widgetId);

      // Add child at rowIndex 0.
      highlight = mockAnvilHighlightInfo({ rowIndex: 0 });
      updatedLayout = addChildToLayout(layout, children, highlight);
      expect(updatedLayout.layout[0]).toEqual(buttonWidget.widgetId);

      // Add child at the end of the layout.
      highlight = mockAnvilHighlightInfo({
        rowIndex: updatedLayout.layout.length,
      });
      updatedLayout = addChildToLayout(layout, children, highlight);
      expect(updatedLayout.layout[updatedLayout.layout.length - 1]).toEqual(
        buttonWidget.widgetId,
      );
    });
  });
  describe("addChildToAlignedRow", () => {
    it("should add child to the defined alignment and index", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock();
      const buttonWidget: BaseWidgetProps = ButtonFactory.build();
      const children: string[] = [buttonWidget.widgetId];
      // Add child at the beginning of start alignment.
      let highlight: AnvilHighlightInfo = mockAnvilHighlightInfo();
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
      highlight = mockAnvilHighlightInfo({
        alignment: FlexLayerAlignment.Center,
      });
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
      const buttonWidget: BaseWidgetProps = ButtonFactory.build();
      const children: string[] = [buttonWidget.widgetId];
      const highlight: AnvilHighlightInfo = mockAnvilHighlightInfo({
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
        const updatedLayout: LayoutComponentProps | undefined =
          removeChildFromLayout(layout, lastChildWidgetId);
        expect(
          (updatedLayout?.layout as string[]).includes(lastChildWidgetId),
        ).toBeFalsy();
        expect(updatedLayout?.layout.length).toEqual(originalLength - 1);
      });
      it("should return undefined if layout is temporary and empty after deletion", () => {
        const layoutProps: LayoutComponentProps = generateLayoutComponentMock();
        const lastChildWidgetId: string = layoutProps.layout[
          layoutProps.layout.length - 1
        ] as string;
        // Remove last child in the layout.
        const updatedLayout: LayoutComponentProps | undefined =
          removeChildFromLayout(
            { ...layoutProps, layout: [lastChildWidgetId] },
            lastChildWidgetId,
          );
        expect(updatedLayout).toBeUndefined();
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
      const updatedLayout: LayoutComponentProps | undefined =
        removeChildFromAlignedRow(layout, lastChildWidgetId);
      expect(
        (updatedLayout?.layout[0] as string[]).includes(lastChildWidgetId),
      ).toBeFalsy();
      expect((updatedLayout?.layout[0] as string[]).length).toEqual(
        originalLength - 1,
      );
    });
    it("should return undefined if AlignedRow is temporary and empty after deletion", () => {
      const layoutProps: LayoutComponentProps = generateAlignedRowMock();
      const lastChildWidgetId: string = (layoutProps.layout[0] as string[])[
        (layoutProps.layout[0] as string[]).length - 1
      ];
      // Remove last child in the layout.
      const updatedLayout: LayoutComponentProps | undefined =
        removeChildFromAlignedRow(
          { ...layoutProps, layout: [[lastChildWidgetId], [], []] },
          lastChildWidgetId,
        );
      expect(updatedLayout).toBeUndefined();
    });
  });
});
