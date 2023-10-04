/* eslint-disable no-console */
import {
  generateAlignedRowMock,
  generateLayoutComponentMock,
} from "mocks/layoutComponents/layoutComponentMock";
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
} from "../../anvilTypes";
import { AlignmentIndexMap } from "../../constants";

describe("Layouts - additionUtils tests", () => {
  describe("getAffectedLayout", () => {
    it("should extract correct layout json from the parent layout", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      );
      const childLayoutOne: LayoutComponentProps = layout
        .layout[0] as LayoutComponentProps;
      expect(
        getAffectedLayout([layout], [layout.layoutId, childLayoutOne.layoutId]),
      ).toEqual(childLayoutOne);
    });
    it("should return undefined if order is empty", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      );
      expect(getAffectedLayout([layout], [])).toBeUndefined();
    });
  });
  describe("updateAffectedLayout", () => {
    it("should update the layout json in the correct place", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      );
      const childLayoutOne: LayoutComponentProps = layout
        .layout[0] as LayoutComponentProps;
      const updatedLayout: LayoutComponentProps = {
        ...childLayoutOne,
        layout: [],
      };
      const res: LayoutComponentProps[] = updateAffectedLayout(
        [layout],
        updatedLayout,
        [layout.layoutId, updatedLayout.layoutId],
      );

      expect((res[0].layout[0] as LayoutComponentProps).layout.length).toEqual(
        0,
      );
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
      );
      // Create another nest layout
      const layoutTwo: LayoutComponentProps = generateLayoutComponentMock(
        {},
        false,
      );
      const childLayoutOne: LayoutComponentProps = layoutTwo
        .layout[0] as LayoutComponentProps;
      // Update first child layout of layoutTwo to have empty layout property
      const updatedChildLayoutOne: LayoutComponentProps = {
        ...childLayoutOne,
        layout: [],
      };
      // Add layoutTwo to parentLayout (layoutOne)
      const updatedLayout: LayoutComponentProps = {
        ...layoutOne,
        layout: [...(layoutOne.layout as LayoutComponentProps[]), layoutTwo],
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
      const res: LayoutComponentProps[] = updateAffectedLayout(
        [updatedLayout],
        updatedChildLayoutOne,
        [layoutOne.layoutId, layoutTwo.layoutId, childLayoutOne.layoutId],
      );
      expect(
        (
          (res[0].layout[2] as LayoutComponentProps)
            .layout[0] as LayoutComponentProps
        ).layout.length,
      ).toEqual(0);
    });
  });
  describe("addWidgetsToTemplate", () => {
    it("should generate a layoutId for the template", () => {
      const template: LayoutComponentProps = generateLayoutComponentMock();
      expect(template.layoutId.length).toEqual(0);
      const highlight: AnvilHighlightInfo = mockAnvilHighlightInfo();
      const res: LayoutComponentProps = addWidgetsToTemplate(
        template,
        highlight,
        [],
      );
      expect(res.layoutId.length).toBeGreaterThan(0);
    });
    it("should add widgets to the layout json", () => {
      const template: LayoutComponentProps = generateLayoutComponentMock();
      const highlight: AnvilHighlightInfo = mockAnvilHighlightInfo();
      const res: LayoutComponentProps = addWidgetsToTemplate(
        { ...template, layout: [] }, // Empty the layout prop of the mock template.
        highlight,
        ["1"],
      );
      expect(res.layout.length).toEqual(1);
      expect(res.layout[0]).toEqual("1");
    });
    it("should add widgets to correct alignment in an AlignedRow tempalte", () => {
      const template: LayoutComponentProps = generateAlignedRowMock();
      const highlight: AnvilHighlightInfo = mockAnvilHighlightInfo({
        alignment: FlexLayerAlignment.End,
      });
      const res: LayoutComponentProps = addWidgetsToTemplate(
        { ...template, layout: [[], [], []] }, // Empty the layout prop of the mock template.
        highlight,
        ["1"],
      );
      const index = AlignmentIndexMap[highlight.alignment];
      expect((res.layout[index] as string[]).length).toEqual(1);
      expect((res.layout[index] as string[]).includes("1")).toBeTruthy();
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
      );
      // Remove insertChild from first child layout.
      const updatedTemplate: LayoutComponentProps = {
        ...template,
        layout: [
          {
            ...(template.layout[0] as LayoutComponentProps),
            insertChild: false,
          },
          {
            ...(template.layout[1] as LayoutComponentProps),
            insertChild: true,
            layout: [],
          },
        ],
      };
      const highlight: AnvilHighlightInfo = mockAnvilHighlightInfo({
        alignment: FlexLayerAlignment.End,
      });
      const res: LayoutComponentProps = addWidgetsToTemplate(
        updatedTemplate, // Empty the layout prop of the mock template.
        highlight,
        ["1"],
      );
      /**
       * Row
       *  Row
       *  Row
       *   "1"
       */
      expect(
        ((res.layout[1] as LayoutComponentProps).layout as string[]).length,
      ).toEqual(1);
      expect(
        ((res.layout[1] as LayoutComponentProps).layout as string[]).includes(
          "1",
        ),
      ).toBeTruthy();
    });
  });
  describe("prepareWidgetsForAddition", () => {
    it("should return empty array if widgets are not provided", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock();
      const res: string[] | LayoutComponentProps[] = prepareWidgetsForAddition(
        {} as any,
        layout,
        mockAnvilHighlightInfo(),
        [],
      );
      expect(res.length).toEqual(0);
    });
    it("should return the list of widgets if Component doesn't have a childTemplate", () => {
      const layout: LayoutComponentProps = generateLayoutComponentMock();
      const res: string[] | LayoutComponentProps[] = prepareWidgetsForAddition(
        { getChildTemplate: () => undefined } as any,
        layout,
        mockAnvilHighlightInfo(),
        ["1"],
      );
      expect(res.length).toEqual(1);
    });
    it("should return updated childTemplate if present", () => {
      const layoutProps: LayoutComponentProps = generateLayoutComponentMock();
      const res: string[] | LayoutComponentProps[] = prepareWidgetsForAddition(
        { getChildTemplate: () => ({ ...layoutProps, layout: [] }) } as any,
        layoutProps,
        mockAnvilHighlightInfo(),
        ["1"],
      );
      expect((res[0] as LayoutComponentProps).layoutId.length).toBeGreaterThan(
        0,
      );
      expect(
        ((res[0] as LayoutComponentProps).layout as string[]).includes("1"),
      ).toBeTruthy();
    });
  });
});
