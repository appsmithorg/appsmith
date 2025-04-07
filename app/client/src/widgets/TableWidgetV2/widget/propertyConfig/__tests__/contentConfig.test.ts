import contentConfig from "../contentConfig";
import type { TableWidgetProps } from "../../../constants";
import type { PropertyPaneSectionConfig } from "constants/PropertyControlConstants";

describe("TableWidgetV2 contentConfig tests", () => {
  it("should disable relevant sections when infinite scroll is enabled", () => {
    const sectionsToCheck = ["Search & filters", "Sorting", "Adding a row"];

    const disabledHelpText =
      "This feature is disabled because infinite scroll is enabled";

    sectionsToCheck.forEach((sectionName) => {
      const section = contentConfig.find(
        (section) =>
          (section as PropertyPaneSectionConfig).sectionName === sectionName,
      ) as PropertyPaneSectionConfig & { dependencies: string[] };

      expect(section).toBeDefined();

      if (section) {
        expect(typeof section.shouldDisableSection).toBe("function");
        expect(section.disabledHelpText).toBe(disabledHelpText);
        expect(section.dependencies).toContain("infiniteScrollEnabled");

        const enabledProps = {
          infiniteScrollEnabled: true,
        } as TableWidgetProps;
        const disabledProps = {
          infiniteScrollEnabled: false,
        } as TableWidgetProps;

        expect(section.shouldDisableSection!(enabledProps, "")).toBe(true);
        expect(section.shouldDisableSection!(disabledProps, "")).toBe(false);
      }
    });

    const paginationSection = contentConfig.find(
      (section) =>
        (section as PropertyPaneSectionConfig).sectionName === "Pagination",
    ) as PropertyPaneSectionConfig;

    expect(paginationSection).toBeDefined();

    if (paginationSection && paginationSection.children) {
      const serverSidePagination = paginationSection.children.find(
        (child) =>
          (child as PropertyPaneSectionConfig & { propertyName: string })
            .propertyName === "serverSidePaginationEnabled",
      ) as PropertyPaneSectionConfig & {
        propertyName: string;
        shouldDisableSection: (
          props: TableWidgetProps,
          propertyPath: string,
        ) => boolean;
        disabledHelpText: string;
        dependencies: string[];
      };

      expect(serverSidePagination).toBeDefined();

      if (serverSidePagination) {
        expect(typeof serverSidePagination.shouldDisableSection).toBe(
          "function",
        );
        expect(serverSidePagination.disabledHelpText).toBe(disabledHelpText);
        expect(serverSidePagination.dependencies).toContain(
          "infiniteScrollEnabled",
        );

        const enabledProps = {
          infiniteScrollEnabled: true,
        } as TableWidgetProps;
        const disabledProps = {
          infiniteScrollEnabled: false,
        } as TableWidgetProps;

        expect(
          serverSidePagination.shouldDisableSection(enabledProps, ""),
        ).toBe(true);
        expect(
          serverSidePagination.shouldDisableSection(disabledProps, ""),
        ).toBe(false);
      }
    }
  });

  it("should have proper update hooks for infiniteScrollEnabled property", () => {
    const paginationSection = contentConfig.find(
      (section) =>
        (section as PropertyPaneSectionConfig).sectionName === "Pagination",
    ) as PropertyPaneSectionConfig;

    expect(paginationSection).toBeDefined();

    if (paginationSection && paginationSection.children) {
      const infiniteScrollProperty = paginationSection.children.find(
        (child) =>
          (child as PropertyPaneSectionConfig & { propertyName: string })
            .propertyName === "infiniteScrollEnabled",
      ) as PropertyPaneSectionConfig & {
        propertyName: string;
        updateHook: unknown;
        dependencies: string[];
      };

      expect(infiniteScrollProperty).toBeDefined();

      if (infiniteScrollProperty) {
        expect(infiniteScrollProperty.updateHook).toBeDefined();
        expect(infiniteScrollProperty.dependencies).toContain("primaryColumns");
      }
    }
  });
});
