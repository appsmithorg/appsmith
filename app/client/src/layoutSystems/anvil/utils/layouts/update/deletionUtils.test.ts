import {
  generateAlignedRowMock,
  generateLayoutComponentMock,
} from "mocks/layoutComponents/layoutComponentMock";
import type { LayoutComponentProps } from "../../anvilTypes";
import { registerLayoutComponents } from "../layoutUtils";
import {
  deleteWidgetFromLayout,
  deleteWidgetFromPreset,
} from "./deletionUtils";

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
      const widgetId: string = layout.layout[0] as string;
      const res: LayoutComponentProps | undefined = deleteWidgetFromLayout(
        layout,
        widgetId,
      );
      if (!res) return;
      expect(res.layout.length).toEqual(originalLength - 1);
      expect((res.layout as string[]).includes(widgetId)).toBeFalsy();
    });
    it("should return undefined if layout is temporary and empty after deletion", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isPermanent: false,
      });
      // layout has two widgets
      const originalLength: number = layout.layout.length;
      let res: LayoutComponentProps | undefined = deleteWidgetFromLayout(
        layout,
        layout.layout[0] as string,
      );
      if (!res) return;
      expect(res.layout.length).toEqual(originalLength - 1);
      expect(
        (res.layout as string[]).includes(layout.layout[0] as string),
      ).toBeFalsy();

      // Delete the other widget
      res = deleteWidgetFromLayout(res, res.layout[0] as string);
      expect(res).toBeUndefined();
    });
    it("should return empty layout on deleting last widget, if the layout is permanent", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock({
        isPermanent: true,
      });
      // layout has two widgets
      const originalLength: number = layout.layout.length;
      let res: LayoutComponentProps | undefined = deleteWidgetFromLayout(
        layout,
        layout.layout[0] as string,
      );
      if (!res) return;
      expect(res.layout.length).toEqual(originalLength - 1);
      expect(
        (res.layout as string[]).includes(layout.layout[0] as string),
      ).toBeFalsy();

      // Delete the other widget
      res = deleteWidgetFromLayout(res, res.layout[0] as string);
      if (!res) return;
      expect(res.layout.length).toEqual(0);
    });
    it("should return undefined if AlignedRow is temporary and empty after deletion", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock({
        isPermanent: false,
      });
      // start alignment has two widgets
      const originalStartLength: number = (layout.layout[0] as string[]).length;
      const widgetId: string = (layout.layout[0] as string[])[0];
      let res: LayoutComponentProps | undefined = deleteWidgetFromLayout(
        layout,
        widgetId,
      );
      if (!res) return;
      expect((res.layout[0] as string[]).length).toEqual(
        originalStartLength - 1,
      );
      expect((res.layout[0] as string[]).includes(widgetId)).toBeFalsy();

      // Delete the other widget
      res = deleteWidgetFromLayout(res, (res.layout[0] as string[])[0]);
      expect(res).toBeUndefined();
    });
    it("should return empty AlignedRow on deleting last widget, if the layout is permanent", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock({
        isPermanent: true,
      });
      // start alignment has two widgets
      const originalStartLength: number = (layout.layout[0] as string[]).length;
      let res: LayoutComponentProps | undefined = deleteWidgetFromLayout(
        layout,
        (layout.layout[0] as string[])[0],
      );
      if (!res) return;

      expect((res.layout[0] as string[]).length).toEqual(
        originalStartLength - 1,
      );
      expect(
        (res.layout[0] as string[]).includes((layout.layout[0] as string[])[0]),
      ).toBeFalsy();

      // Delete the other widget
      res = deleteWidgetFromLayout(res, (res.layout[0] as string[])[0]);

      if (!res) return;
      expect((res.layout[0] as string[]).length).toEqual(0);
      expect((res.layout[1] as string[]).length).toEqual(0);
      expect((res.layout[2] as string[]).length).toEqual(0);
    });
    it("should return the layout as is if widgetId is not present in the layout", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock();
      const res: LayoutComponentProps | undefined = deleteWidgetFromLayout(
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
      const res: LayoutComponentProps[] = deleteWidgetFromPreset(
        [layout2, layout],
        (layout.layout[0] as LayoutComponentProps).layout[0] as string,
      );

      expect((res[1].layout[0] as LayoutComponentProps).layout.length).toEqual(
        (layout.layout[0] as LayoutComponentProps).layout.length - 1,
      );
      expect(res[0].layout.length).toEqual((layout2.layout as string[]).length);
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
      let res: LayoutComponentProps[] = deleteWidgetFromPreset(
        [layout2, layout],
        layout2.layout[0] as string,
      );
      expect(res.length).toEqual(2);

      // delete the other widget
      res = deleteWidgetFromPreset(res, res[0].layout[0] as string);
      expect(res.length).toEqual(1);
      expect(res[0].layoutId).toEqual(layout.layoutId);
    });
  });
});
