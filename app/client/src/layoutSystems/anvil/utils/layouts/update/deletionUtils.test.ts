import {
  generateAlignedRowMock,
  generateLayoutComponentMock,
} from "mocks/layoutComponents/layoutComponentMock";
import type {
  LayoutComponentProps,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import {
  extractWidgetIdsFromLayoutProps,
  registerLayoutComponents,
} from "../layoutUtils";
import {
  deleteWidgetFromLayout,
  deleteWidgetFromPreset,
} from "./deletionUtils";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

describe("Layouts - deletionUtils tests", () => {
  beforeAll(() => {
    registerLayoutComponents();
  });
  describe("deleteWidgetFromLayout", () => {
    it("should return layoutProps as is, if widgetId is falsy", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock();
      expect(deleteWidgetFromLayout(layout, "")).toEqual(layout);
    });
    it("should remove widget from the layout", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock();

      const originalLength: number = layout.layout.length;
      const widgetId: string = (layout.layout[0] as WidgetLayoutProps).widgetId;
      const res: LayoutProps | undefined = deleteWidgetFromLayout(
        layout as LayoutProps,
        widgetId,
      );
      if (!res) return;
      expect(res.layout.length).toEqual(originalLength - 1);
      expect(
        extractWidgetIdsFromLayoutProps(res).includes(widgetId),
      ).toBeFalsy();
    });
    it("should return undefined if layout is temporary and empty after deletion", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isPermanent: false,
      });
      // layout has two widgets
      const originalLength: number = layout.layout.length;
      let res: LayoutProps | undefined = deleteWidgetFromLayout(
        layout,
        (layout.layout[0] as WidgetLayoutProps).widgetId,
      );
      if (!res) return;
      expect(res.layout.length).toEqual(originalLength - 1);
      expect(
        extractWidgetIdsFromLayoutProps(res).includes(
          (layout.layout[0] as WidgetLayoutProps).widgetId,
        ),
      ).toBeFalsy();

      // Delete the other widget
      res = deleteWidgetFromLayout(
        res,
        (res.layout[0] as WidgetLayoutProps).widgetId,
      );
      expect(res).toBeUndefined();
    });
    it("should return empty layout on deleting last widget, if the layout is permanent", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isPermanent: true,
      });
      // layout has two widgets
      const originalLength: number = layout.layout.length;
      let res: LayoutProps | undefined = deleteWidgetFromLayout(
        layout,
        (layout.layout[0] as WidgetLayoutProps).widgetId,
      );
      if (!res) return;
      expect(res.layout.length).toEqual(originalLength - 1);
      expect(
        extractWidgetIdsFromLayoutProps(res).includes(
          (layout.layout[0] as WidgetLayoutProps).widgetId,
        ),
      ).toBeFalsy();

      // Delete the other widget
      res = deleteWidgetFromLayout(
        res,
        (res.layout[0] as WidgetLayoutProps).widgetId,
      );
      if (!res) return;
      expect(res.layout.length).toEqual(0);
    });
    it("should return undefined if AlignedRow is temporary and empty after deletion", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock({
        isPermanent: false,
      });
      // start alignment has two widgets
      const originalStartLength: number = (
        layout.layout as WidgetLayoutProps[]
      ).filter(
        (each: WidgetLayoutProps) =>
          each.alignment === FlexLayerAlignment.Start,
      ).length;
      const widgetId: string = (layout.layout[0] as WidgetLayoutProps).widgetId;
      let res: LayoutProps | undefined = deleteWidgetFromLayout(
        layout,
        widgetId,
      );
      if (!res) return;
      expect((res.layout as WidgetLayoutProps[]).length).toEqual(
        originalStartLength - 1,
      );
      expect(
        extractWidgetIdsFromLayoutProps(res).includes(widgetId),
      ).toBeFalsy();

      // Delete the other widget
      res = deleteWidgetFromLayout(
        res,
        (res.layout[0] as WidgetLayoutProps).widgetId,
      );
      expect(res).toBeUndefined();
    });
    it("should return empty AlignedRow on deleting last widget, if the layout is permanent", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock({
        isPermanent: true,
      });
      // start alignment has two widgets
      const originalStartLength: number = (
        layout.layout as WidgetLayoutProps[]
      ).filter(
        (each: WidgetLayoutProps) =>
          each.alignment === FlexLayerAlignment.Start,
      ).length;
      let res: LayoutProps | undefined = deleteWidgetFromLayout(
        layout,
        (layout.layout[0] as WidgetLayoutProps).widgetId,
      );
      if (!res) return;

      expect((res.layout as WidgetLayoutProps[]).length).toEqual(
        originalStartLength - 1,
      );
      expect(
        extractWidgetIdsFromLayoutProps(res).includes(
          (layout.layout[0] as WidgetLayoutProps).widgetId,
        ),
      ).toBeFalsy();

      // Delete the other widget
      res = deleteWidgetFromLayout(
        res,
        (res.layout[0] as WidgetLayoutProps).widgetId,
      );

      if (!res) return;
      expect(res.layout.length).toEqual(0);
    });
    it("should return the layout as is if widgetId is not present in the layout", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock();
      const res: LayoutProps | undefined = deleteWidgetFromLayout(
        layout,
        "randomWidgetId",
      );
      expect(res).toEqual(layout);
      expect(res?.layout.length).toEqual(layout.layout.length);
    });
  });
  describe("deleteWidgetFromPreset", () => {
    it("should delete widget from appropriate child layout", () => {
      /**
       * Row
       *  Row
       *   Button
       *   Input
       *  Row
       *   Button
       *   Input
       */
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      );
      const layout2: LayoutComponentProps = generateLayoutComponentMock();
      const res: LayoutProps[] = deleteWidgetFromPreset(
        [layout2, layout],
        ((layout.layout[0] as LayoutProps).layout[0] as WidgetLayoutProps)
          .widgetId,
      );

      expect((res[1].layout[0] as LayoutProps).layout.length).toEqual(
        (layout.layout[0] as LayoutProps).layout.length - 1,
      );
      expect(res[0].layout.length).toEqual(
        (layout2.layout as WidgetLayoutProps[]).length,
      );
    });
    it("should filter empty temporary layouts after deletion", () => {
      /**
       * Row
       *  Row
       *   Button
       *   Input
       *  Row
       *   Button
       *   Input
       */
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      );
      // layout2 has two child widgets
      const layout2: LayoutComponentProps = generateLayoutComponentMock({
        isPermanent: false,
      });
      // delete the first widget
      let res: LayoutProps[] = deleteWidgetFromPreset(
        [layout2, layout],
        (layout2.layout[0] as WidgetLayoutProps).widgetId,
      );
      expect(res.length).toEqual(2);

      // delete the other widget
      res = deleteWidgetFromPreset(
        res,
        (res[0].layout[0] as WidgetLayoutProps).widgetId,
      );
      expect(res.length).toEqual(1);
      expect(res[0].layoutId).toEqual(layout.layoutId);
    });
  });
});
