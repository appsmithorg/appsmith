import contentConfig from "../contentConfig";
import type { TableWidgetProps } from "../../../constants";
import type { PropertyPaneSectionConfig } from "constants/PropertyControlConstants";
import { DynamicHeight } from "utils/WidgetFeatures";

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

  describe("auto height", () => {
    const withHeight = (dynamicHeight: DynamicHeight) =>
      ({ dynamicHeight }) as unknown as TableWidgetProps;

    const getPaginationControl = (propertyName: string) => {
      const paginationSection = contentConfig.find(
        (section) =>
          (section as PropertyPaneSectionConfig).sectionName === "Pagination",
      ) as PropertyPaneSectionConfig;

      return paginationSection.children?.find(
        (child) =>
          (child as PropertyPaneSectionConfig & { propertyName: string })
            .propertyName === propertyName,
      ) as PropertyPaneSectionConfig & {
        propertyName: string;
        label: string;
        hidden: (props: TableWidgetProps, propertyPath: string) => boolean;
        shouldDisableSection: (
          props: TableWidgetProps,
          propertyPath: string,
        ) => boolean;
        disabledHelpText: string;
        dependencies: string[];
        validation: { type: string; params: Record<string, unknown> };
      };
    };

    it("shows Rows per page only when height is auto", () => {
      const rowsPerPage = getPaginationControl("autoHeightRowCount");

      expect(rowsPerPage).toBeDefined();
      expect(rowsPerPage.label).toBe("Rows per page");
      expect(rowsPerPage.dependencies).toContain("dynamicHeight");
      expect(rowsPerPage.validation.params).toEqual(
        expect.objectContaining({ min: 1, natural: true }),
      );

      expect(rowsPerPage.hidden(withHeight(DynamicHeight.FIXED), "")).toBe(
        true,
      );
      expect(rowsPerPage.hidden({} as TableWidgetProps, "")).toBe(true);
      expect(
        rowsPerPage.hidden(withHeight(DynamicHeight.AUTO_HEIGHT), ""),
      ).toBe(false);
      expect(
        rowsPerPage.hidden(
          withHeight(DynamicHeight.AUTO_HEIGHT_WITH_LIMITS),
          "",
        ),
      ).toBe(false);
    });

    it("disables infinite scroll when height is auto", () => {
      const infiniteScroll = getPaginationControl("infiniteScrollEnabled");

      expect(infiniteScroll.dependencies).toContain("dynamicHeight");
      expect(infiniteScroll.disabledHelpText).toBe(
        "Infinite scroll is unavailable while the table height is set to Auto Height",
      );
      expect(
        infiniteScroll.shouldDisableSection(
          withHeight(DynamicHeight.AUTO_HEIGHT),
          "",
        ),
      ).toBe(true);
      expect(
        infiniteScroll.shouldDisableSection(
          withHeight(DynamicHeight.AUTO_HEIGHT_WITH_LIMITS),
          "",
        ),
      ).toBe(true);
      expect(
        infiniteScroll.shouldDisableSection(
          withHeight(DynamicHeight.FIXED),
          "",
        ),
      ).toBe(false);
    });
  });
});
