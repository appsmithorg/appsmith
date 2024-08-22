import { generateLayoutComponentMock } from "mocks/layoutComponents/layoutComponentMock";

import type { LayoutComponentProps } from "../anvilTypes";
import { doesLayoutRenderWidgets } from "./typeUtils";

describe("Layouts - typeUtils tests", () => {
  describe("doesLayoutRenderWidgets", () => {
    it("should return true if layout renders widgets", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock()
        .layout as LayoutComponentProps;
      expect(doesLayoutRenderWidgets(layout)).toBeTruthy();
    });
    it("should return false if layout renders widgets", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      ).layout as LayoutComponentProps;
      expect(doesLayoutRenderWidgets(layout)).toBeFalsy();
    });
  });
});
