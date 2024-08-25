import { generateLayoutComponentMock } from "mocks/layoutComponents/layoutComponentMock";
import {
  addWidgetsToTemplate,
  getAffectedLayout,
  prepareWidgetsForAddition,
  updateAffectedLayout,
} from "./additionUtils";
import { mockAnvilHighlightInfo } from "mocks/mockHighlightInfo";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type {
  AnvilHighlightInfo,
  LayoutComponentProps,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { extractWidgetIdsFromLayoutProps } from "../layoutUtils";
import ButtonWidget from "widgets/ButtonWidget/widget";

describe("Layouts - additionUtils tests", () => {
  describe("getAffectedLayout", () => {
    it("should extract correct layout json from the parent layout", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      ).layout;
      const childLayoutOne: LayoutProps = layout.layout[0] as LayoutProps;
      expect(
        getAffectedLayout([layout], [layout.layoutId, childLayoutOne.layoutId]),
      ).toEqual(childLayoutOne);
    });
    it("should return undefined if order is empty", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      ).layout;
      expect(getAffectedLayout([layout], [])).toBeUndefined();
    });
  });
  describe("updateAffectedLayout", () => {
    it("should update the layout json in the correct place", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      ).layout;
      const childLayoutOne: LayoutProps = layout.layout[0] as LayoutProps;
      const updatedLayout: LayoutProps = {
        ...childLayoutOne,
        layout: [],
      };
      const res: LayoutProps[] = updateAffectedLayout([layout], updatedLayout, [
        layout.layoutId,
        updatedLayout.layoutId,
      ]);

      expect((res[0].layout[0] as LayoutProps).layout.length).toEqual(0);
    });
    it("should update the layout json in the correct place in a deeply nested layout", () => {
      /**
       * Create Parent layout
       * Row
       *  Row
       *  Row
       */
      const layoutOne: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      ).layout;
      // Create another nest layout
      const layoutTwo: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      ).layout;
      const childLayoutOne: LayoutProps = layoutTwo.layout[0] as LayoutProps;
      // Update first child layout of layoutTwo to have empty layout property
      const updatedChildLayoutOne: LayoutProps = {
        ...childLayoutOne,
        layout: [],
      };
      // Add layoutTwo to parentLayout (layoutOne)
      const updatedLayout: LayoutProps = {
        ...layoutOne,
        layout: [...(layoutOne.layout as LayoutProps[]), layoutTwo],
      };
      /**
       * Final structure:
       * Row (layoutOne)
       *  Row
       *  Row
       *  Row (layoutTwo)
       *   Row (childLayoutOne)
       *   Row
       */
      const res: LayoutProps[] = updateAffectedLayout(
        [updatedLayout],
        updatedChildLayoutOne,
        [layoutOne.layoutId, layoutTwo.layoutId, childLayoutOne.layoutId],
      );
      expect(
        ((res[0].layout[2] as LayoutProps).layout[0] as LayoutProps).layout
          .length,
      ).toEqual(0);
    });
  });
  describe("addWidgetsToTemplate", () => {
    it("should generate a layoutId for the template", () => {
      const template: LayoutComponentProps = generateLayoutComponentMock({
        layoutId: "",
      }).layout;
      expect(template.layoutId.length).toEqual(0);
      const highlight: AnvilHighlightInfo = mockAnvilHighlightInfo();
      const res: LayoutProps = addWidgetsToTemplate(template, highlight, []);
      expect(res.layoutId.length).toBeGreaterThan(0);
    });
    it("should add widgets to the layout json", () => {
      const template: LayoutComponentProps =
        generateLayoutComponentMock().layout;
      const highlight: AnvilHighlightInfo = mockAnvilHighlightInfo();
      const res: LayoutProps = addWidgetsToTemplate(
        { ...template, layout: [] }, // Empty the layout prop of the mock template.
        highlight,
        [
          {
            widgetId: "1",
            alignment: FlexLayerAlignment.Start,
            widgetType: ButtonWidget.type,
          },
        ],
      );
      expect(res.layout.length).toEqual(1);
      expect((res.layout[0] as WidgetLayoutProps).widgetId).toEqual("1");
    });
    it("should add widgets to a nested child layout", () => {
      /**
       * Row
       *  Row (insertChild)
       *  Row (insertChild)
       */
      const template: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      ).layout;
      // Remove insertChild from first child layout.
      const updatedTemplate: LayoutProps = {
        ...template,
        layout: [
          {
            ...(template.layout[0] as LayoutProps),
            insertChild: false,
          },
          {
            ...(template.layout[1] as LayoutProps),
            insertChild: true,
            layout: [],
          },
        ],
      };
      const highlight: AnvilHighlightInfo = mockAnvilHighlightInfo({
        alignment: FlexLayerAlignment.End,
      });
      const res: LayoutProps = addWidgetsToTemplate(
        updatedTemplate, // Empty the layout prop of the mock template.
        highlight,
        [
          {
            widgetId: "1",
            alignment: FlexLayerAlignment.End,
            widgetType: ButtonWidget.type,
          },
        ],
      );
      /**
       * Row
       *  Row
       *  Row
       *   "1"
       */
      expect(
        ((res.layout[1] as LayoutProps).layout as WidgetLayoutProps[]).length,
      ).toEqual(1);
      expect(
        ((res.layout[1] as LayoutProps).layout as WidgetLayoutProps[])
          .map((each: WidgetLayoutProps) => each.widgetId)
          .includes("1"),
      ).toBeTruthy();
    });
  });
  describe("prepareWidgetsForAddition", () => {
    it("should return empty array if widgets are not provided", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock().layout;
      const res: WidgetLayoutProps[] | LayoutProps[] =
        prepareWidgetsForAddition(
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {} as any,
          layout,
          mockAnvilHighlightInfo(),
          [],
        );
      expect(res.length).toEqual(0);
    });
    it("should return the list of widgets if Component doesn't have a childTemplate", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock().layout;
      const res: WidgetLayoutProps[] | LayoutProps[] =
        prepareWidgetsForAddition(
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { getChildTemplate: () => null } as any,
          layout,
          mockAnvilHighlightInfo(),
          [
            {
              widgetId: "1",
              alignment: FlexLayerAlignment.Start,
              widgetType: ButtonWidget.type,
            },
          ],
        );
      expect(res.length).toEqual(1);
    });
    it("should return updated childTemplate if present", () => {
      const layoutProps: LayoutComponentProps =
        generateLayoutComponentMock().layout;
      const res: WidgetLayoutProps[] | LayoutProps[] =
        prepareWidgetsForAddition(
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { getChildTemplate: () => ({ ...layoutProps, layout: [] }) } as any,
          layoutProps,
          mockAnvilHighlightInfo(),
          [
            {
              widgetId: "1",
              alignment: FlexLayerAlignment.Start,
              widgetType: ButtonWidget.type,
            },
          ],
        );
      expect((res[0] as LayoutProps).layoutId.length).toBeGreaterThan(0);
      expect(
        extractWidgetIdsFromLayoutProps(res[0] as LayoutProps).includes("1"),
      ).toBeTruthy();
    });
  });
});
