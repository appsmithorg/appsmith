import {
  generateAlignedRowMock,
  generateLayoutComponentMock,
} from "mocks/layoutComponentMock";
import {
  doesAlignedRowRenderWidgets,
  doesListIncludeWidgetIDs,
} from "./typeUtils";
import type { LayoutComponentProps } from "../anvilTypes";

describe("Layouts - typeUtils tests", () => {
  describe("doesListIncludeWidgetIDs", () => {
    it("should return true if layout prop contains widgetIds", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock();
      expect(doesListIncludeWidgetIDs(layout)).toBeTruthy();
    });
    it("should return false if layout prop contains layout components", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      );
      expect(doesListIncludeWidgetIDs(layout)).toBeFalsy();
    });
    it("should return false if layout prop is empty", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {
          layout: [],
        },
        false,
      );
      expect(doesListIncludeWidgetIDs(layout)).toBeFalsy();
    });
  });
  describe("doesAlignedRowRenderWidgets", () => {
    it("should return true if layout props contains widget ids", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock();
      expect(doesAlignedRowRenderWidgets(layout)).toBeTruthy();
    });
    it("should return false if layout props is empty", () => {
      const layout: LayoutComponentProps = generateAlignedRowMock({}, false);
      expect(doesAlignedRowRenderWidgets(layout)).toBeFalsy();
    });
  });
});
