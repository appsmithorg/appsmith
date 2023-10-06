import { generateLayoutComponentMock } from "mocks/layoutComponents/layoutComponentMock";
import type { LayoutComponentProps, WidgetLayoutProps } from "../anvilTypes";
import type { WidgetProps } from "widgets/BaseWidget";
import { getChildrenMap } from "./renderUtils";

describe("renderUtils tests", () => {
  describe("getChildrenMap", () => {
    it("should extract proper children data for each layout", () => {
      /**
       * This will create a Layout Component that renders two layouts, each of which renders two widgets.
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
      const childLayoutOne: LayoutComponentProps = layout
        .layout[0] as LayoutComponentProps;
      const childLayoutTwo: LayoutComponentProps = layout
        .layout[1] as LayoutComponentProps;
      const childLayoutOneWidgets: WidgetLayoutProps[] =
        childLayoutOne.layout as WidgetLayoutProps[];
      const childLayoutTwoWidgets: WidgetLayoutProps[] =
        childLayoutTwo.layout as WidgetLayoutProps[];

      // Create aggregate map of children
      const map: Record<string, WidgetProps> = {
        ...childLayoutOne.childrenMap,
        ...childLayoutTwo.childrenMap,
      };
      // Extract childrenMap for child layout one.
      let res: LayoutComponentProps["childrenMap"] = getChildrenMap(
        childLayoutOne,
        map,
        {},
      );

      expect(Object.keys(res || {}).length).toEqual(2);
      expect(
        Object.keys(res || {}).includes(childLayoutOneWidgets[0].widgetId),
      ).toBeTruthy();

      // Extract childrenMap for child layout two.
      res = getChildrenMap(childLayoutTwo, map, {});
      expect(
        Object.keys(res || {}).includes(childLayoutTwoWidgets[1].widgetId),
      ).toBeTruthy();

      res = getChildrenMap(layout, map, {});
      expect(Object.keys(res || {}).length).toEqual(4);
    });
  });
});
