import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import type BaseWidget from "widgets/BaseWidget";
import type { WidgetProps } from "widgets/BaseWidget";
import { addCustomStylingSection } from "ee/WidgetProvider/factory/customStylingSection";
import WidgetFactory from "../index";
import { clearAllWidgetFactoryCache } from "../decorators";
import { shouldExposeTabOrderProperty } from "../helpers";

// Keep the CE behavior (return the config unchanged) and record each call.
jest.mock("ee/WidgetProvider/factory/customStylingSection", () => ({
  addCustomStylingSection: jest.fn(
    (_type: string, config: PropertyPaneConfig[] | undefined) => config,
  ),
}));

const mockedAddCustomStylingSection = addCustomStylingSection as jest.Mock;

// "WDS_" types skip the tab order section, so the output only shows the style seam.
// The first test checks this assumption.
const WITH_STYLE = "WDS_STYLE_SEAM_TEST_WIDGET";
const WITHOUT_STYLE = "WDS_NO_STYLE_SEAM_TEST_WIDGET";
const LEGACY_CONFIG = "WDS_LEGACY_CONFIG_SEAM_TEST_WIDGET";

const makeSection = (sectionName: string): PropertyPaneConfig[] => [
  {
    sectionName,
    children: [
      {
        propertyName: "textColor",
        label: "Text color",
        controlType: "COLOR_PICKER",
        isBindProperty: true,
        isTriggerProperty: false,
      },
    ],
  } as PropertyPaneConfig,
];

const registerTestWidget = (
  type: string,
  methods: Partial<Record<string, () => unknown>>,
) => {
  WidgetFactory.widgetsMap.set(type, {
    getFeatures: () => undefined,
    ...methods,
  } as unknown as typeof BaseWidget);
};

describe("WidgetFactory custom styling seam", () => {
  beforeEach(() => {
    WidgetFactory.widgetsMap.clear();
    clearAllWidgetFactoryCache();
    mockedAddCustomStylingSection.mockClear();
  });

  afterAll(() => {
    WidgetFactory.widgetsMap.clear();
    clearAllWidgetFactoryCache();
  });

  it("uses widget types that skip the tab order section", () => {
    // The other tests assume no tab order section is added. Fail here first if that changes.
    expect(shouldExposeTabOrderProperty(WITH_STYLE)).toBe(false);
    expect(shouldExposeTabOrderProperty(WITHOUT_STYLE)).toBe(false);
    expect(shouldExposeTabOrderProperty(LEGACY_CONFIG)).toBe(false);
  });

  it("passes the style config through and keeps the enhanced output", () => {
    const styleConfig = makeSection("Color");

    registerTestWidget(WITH_STYLE, {
      getPropertyPaneStyleConfig: () => styleConfig,
    });

    const result = WidgetFactory.getWidgetPropertyPaneStyleConfig(WITH_STYLE);

    expect(mockedAddCustomStylingSection).toHaveBeenCalledWith(
      WITH_STYLE,
      styleConfig,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sectionName: "Color",
      children: [{ propertyName: "textColor", label: "Text color" }],
    });
    expect(result[0].id).toEqual(expect.any(String));
  });

  it("calls the seam with undefined and returns [] when the widget has no style config", () => {
    registerTestWidget(WITHOUT_STYLE, {
      getPropertyPaneStyleConfig: () => undefined,
    });

    const result =
      WidgetFactory.getWidgetPropertyPaneStyleConfig(WITHOUT_STYLE);

    expect(mockedAddCustomStylingSection).toHaveBeenCalledWith(
      WITHOUT_STYLE,
      undefined,
    );
    expect(result).toEqual([]);
  });

  it("passes the single property pane config through and keeps the enhanced output", () => {
    const propertyPaneConfig = makeSection("General");

    registerTestWidget(LEGACY_CONFIG, {
      getPropertyPaneConfig: () => propertyPaneConfig,
    });

    const result = WidgetFactory.getWidgetPropertyPaneConfig(
      LEGACY_CONFIG,
      {} as WidgetProps,
    );

    expect(mockedAddCustomStylingSection).toHaveBeenCalledWith(
      LEGACY_CONFIG,
      propertyPaneConfig,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sectionName: "General",
      children: [{ propertyName: "textColor", label: "Text color" }],
    });
  });

  // An edition replaces the config. These tests prove the factory uses what
  // the seam returns, not the original config.
  it("uses the config the seam returns for the style config", () => {
    mockedAddCustomStylingSection.mockReturnValueOnce(makeSection("Custom"));
    registerTestWidget(WITH_STYLE, {
      getPropertyPaneStyleConfig: () => makeSection("Color"),
    });

    const result = WidgetFactory.getWidgetPropertyPaneStyleConfig(WITH_STYLE);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ sectionName: "Custom" });
    expect(result[0].id).toEqual(expect.any(String));
  });

  it("uses the config the seam returns when the widget has no style config", () => {
    mockedAddCustomStylingSection.mockReturnValueOnce(makeSection("Custom"));
    registerTestWidget(WITHOUT_STYLE, {
      getPropertyPaneStyleConfig: () => undefined,
    });

    const result =
      WidgetFactory.getWidgetPropertyPaneStyleConfig(WITHOUT_STYLE);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ sectionName: "Custom" });
  });

  it("uses the config the seam returns for the single property pane config", () => {
    mockedAddCustomStylingSection.mockReturnValueOnce(makeSection("Custom"));
    registerTestWidget(LEGACY_CONFIG, {
      getPropertyPaneConfig: () => makeSection("General"),
    });

    const result = WidgetFactory.getWidgetPropertyPaneConfig(
      LEGACY_CONFIG,
      {} as WidgetProps,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ sectionName: "Custom" });
  });
});
