import { generateLayoutComponentMock } from "mocks/layoutComponents/layoutComponentMock";
import { doesLayoutRenderWidgets } from "./typeUtils";
import type { LayoutComponentProps } from "../anvilTypes";

describe("Layouts - typeUtils tests", () => {
  describe("doesLayoutRenderWidgets", () => {
    it("should return true if layout renders widgets", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock();
      expect(doesLayoutRenderWidgets(layout)).toBeTruthy();
    });
    it("should return false if layout renders widgets", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      );
      expect(doesLayoutRenderWidgets(layout)).toBeFalsy();
    });
  });
});
