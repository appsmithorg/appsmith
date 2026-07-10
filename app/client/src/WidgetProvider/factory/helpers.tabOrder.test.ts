import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { loadAllWidgets } from "widgets";
import WidgetFactory from "WidgetProvider/factory";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  addTabOrderToPropertyPaneConfig,
  createTabOrderPropertyPaneSection,
  shouldExposeTabOrderProperty,
  TAB_ORDER_PROPERTY_NAME,
  TAB_ORDER_SECTION_NAME,
} from "./helpers";

function collectTabOrderControls(
  config: readonly PropertyPaneConfig[],
): PropertyPaneControlConfig[] {
  const controls: PropertyPaneControlConfig[] = [];

  for (const item of config) {
    const control = item as PropertyPaneControlConfig;

    if (control.propertyName === TAB_ORDER_PROPERTY_NAME) {
      controls.push(control);
    }

    if (item.children) {
      controls.push(...collectTabOrderControls(item.children));
    }
  }

  return controls;
}

function assertSharedTabOrderControl(control: PropertyPaneControlConfig) {
  expect(control.label).toBe("Tab order");
  expect(control.helpText).toBe(
    "Optional. By default, widgets are focused top to bottom, then left to right. Set a number to override this: numbered widgets come first (lowest first), then the rest in the default order. Widgets sharing the same number keep the default order between them. Leave blank to keep the default.",
  );
  expect(control.controlType).toBe("CLEARABLE_NUMERIC_INPUT");
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect((control as any).placeholderText).toBe("Auto");
  expect(control.isJSConvertible).toBe(false);
  expect(control.isBindProperty).toBe(false);
  expect(control.isTriggerProperty).toBe(false);
  expect(control.validation).toEqual({
    type: ValidationTypes.NUMBER,
    params: { min: 1, natural: true },
  });
}

describe("shouldExposeTabOrderProperty", () => {
  it("includes focusable / interactive standard non-Anvil widgets", () => {
    for (const type of [
      "BUTTON_WIDGET",
      "INPUT_WIDGET_V2",
      "TABLE_WIDGET_V2",
      "CONTAINER_WIDGET",
      "MODAL_WIDGET",
      "JSON_FORM_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
      // native <audio>/<video> controls are focusable
      "AUDIO_WIDGET",
      "VIDEO_WIDGET",
    ]) {
      expect(shouldExposeTabOrderProperty(type)).toBe(true);
    }
  });

  it("excludes Anvil-only and internal widgets", () => {
    for (const type of [
      "WDS_BUTTON_WIDGET",
      "WDS_INPUT_WIDGET",
      "WDS_MODAL_WIDGET",
      "SECTION_WIDGET",
      "ZONE_WIDGET",
      "CANVAS_WIDGET",
      "SKELETON_WIDGET",
      "TABS_MIGRATOR_WIDGET",
    ]) {
      expect(shouldExposeTabOrderProperty(type)).toBe(false);
    }
  });

  it("excludes display-only widgets that have nothing focusable", () => {
    for (const type of [
      "TEXT_WIDGET",
      "RATE_WIDGET",
      "IMAGE_WIDGET",
      "CHART_WIDGET",
      "MAP_CHART_WIDGET",
      "DIVIDER_WIDGET",
      "STATBOX_WIDGET",
      "DOCUMENT_VIEWER_WIDGET",
      "ICON_WIDGET",
      "PROGRESSBAR_WIDGET",
      "PROGRESS_WIDGET",
      "CIRCULAR_PROGRESS_WIDGET",
    ]) {
      expect(shouldExposeTabOrderProperty(type)).toBe(false);
    }
  });
});

describe("addTabOrderToPropertyPaneConfig", () => {
  const sampleConfig = (): PropertyPaneConfig[] => [
    { sectionName: "General", children: [] } as PropertyPaneSectionConfig,
  ];

  it("appends the shared Accessibility section for eligible widgets", () => {
    const result = addTabOrderToPropertyPaneConfig(
      "BUTTON_WIDGET",
      sampleConfig(),
    );

    expect(result).toHaveLength(2);
    expect((result[1] as PropertyPaneSectionConfig).sectionName).toBe(
      TAB_ORDER_SECTION_NAME,
    );

    const controls = collectTabOrderControls(result);

    expect(controls).toHaveLength(1);
    assertSharedTabOrderControl(controls[0]);
  });

  it("returns a fresh section object on each call", () => {
    const first = createTabOrderPropertyPaneSection();
    const second = createTabOrderPropertyPaneSection();

    expect(first).not.toBe(second);
    expect(first.children[0]).not.toBe(second.children[0]);
    expect(first).toEqual(second);
  });

  it("does not touch excluded widget types", () => {
    const config = sampleConfig();

    expect(addTabOrderToPropertyPaneConfig("WDS_BUTTON_WIDGET", config)).toBe(
      config,
    );
    expect(addTabOrderToPropertyPaneConfig("CANVAS_WIDGET", config)).toBe(
      config,
    );
  });

  it("does not add a property pane to widgets without one", () => {
    expect(addTabOrderToPropertyPaneConfig("BUTTON_WIDGET", [])).toEqual([]);
  });
});

describe("shared tabOrder property exposure across all widgets", () => {
  beforeAll(async () => {
    const widgetsMap = await loadAllWidgets();

    registerWidgets(Array.from(widgetsMap.values()));
  });

  it("classifies every registered widget the same way (standard non-Anvil expose, Anvil/internal do not)", () => {
    const types = WidgetFactory.getWidgetTypes();

    expect(types.length).toBeGreaterThan(0);

    const excludedTypes = [
      // Anvil-only / internal
      "CANVAS_WIDGET",
      "SKELETON_WIDGET",
      "TABS_MIGRATOR_WIDGET",
      "SECTION_WIDGET",
      "ZONE_WIDGET",
      // display-only / non-focusable
      "TEXT_WIDGET",
      "RATE_WIDGET",
      "IMAGE_WIDGET",
      "CHART_WIDGET",
      "MAP_CHART_WIDGET",
      "DIVIDER_WIDGET",
      "STATBOX_WIDGET",
      "DOCUMENT_VIEWER_WIDGET",
      "ICON_WIDGET",
      "PROGRESSBAR_WIDGET",
      "PROGRESS_WIDGET",
      "CIRCULAR_PROGRESS_WIDGET",
    ];
    let exposedCount = 0;

    for (const type of types) {
      const expected =
        !type.startsWith("WDS_") && !excludedTypes.includes(type);

      expect({ type, expose: shouldExposeTabOrderProperty(type) }).toEqual({
        type,
        expose: expected,
      });

      if (expected) exposedCount++;
    }

    // sanity check that the shared property is broadly exposed
    expect(exposedCount).toBeGreaterThan(30);
  });

  // End-to-end wiring: the factory actually appends the shared section. Uses
  // widgets with static property panes so getWidgetPropertyPaneConfig does not
  // invoke dynamic-property generators with empty props.
  it("appends the shared section in the factory for standard widgets", () => {
    for (const type of ["BUTTON_WIDGET", "SWITCH_WIDGET", "CHECKBOX_WIDGET"]) {
      const config = WidgetFactory.getWidgetPropertyPaneConfig(
        type,
        {} as WidgetProps,
      );
      const controls = collectTabOrderControls(config);

      expect({ type, count: controls.length }).toEqual({ type, count: 1 });
      assertSharedTabOrderControl(controls[0]);

      const accessibilitySection = config.find(
        (item) =>
          (item as PropertyPaneSectionConfig).sectionName ===
          TAB_ORDER_SECTION_NAME,
      );

      expect({ type, hasSection: !!accessibilitySection }).toEqual({
        type,
        hasSection: true,
      });
    }
  });

  it("does not expose tabOrder on Anvil-only, internal, or display-only widgets", () => {
    for (const type of [
      "WDS_BUTTON_WIDGET",
      "CANVAS_WIDGET",
      "DIVIDER_WIDGET",
    ]) {
      const config = WidgetFactory.getWidgetPropertyPaneConfig(
        type,
        {} as WidgetProps,
      );

      expect(collectTabOrderControls(config)).toHaveLength(0);
    }
  });
});
