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
    "Optional. Lower numbers receive keyboard focus first, among widgets in the same container. Leave blank for automatic order. Fields inside a form follow the form's own order.",
  );
  expect(control.controlType).toBe("TAB_ORDER_INPUT");
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect((control as any).placeholderText).toBe("Auto");
  expect(control.isJSConvertible).toBe(false);
  expect(control.isBindProperty).toBe(false);
  expect(control.isTriggerProperty).toBe(false);
  expect(control.validation).toEqual({
    type: ValidationTypes.NUMBER,
    params: { min: 0, natural: true },
  });
}

describe("shouldExposeTabOrderProperty", () => {
  it("includes standard non-Anvil widgets", () => {
    for (const type of [
      "BUTTON_WIDGET",
      "INPUT_WIDGET_V2",
      "TABLE_WIDGET_V2",
      "CONTAINER_WIDGET",
      "MODAL_WIDGET",
      "JSON_FORM_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
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

  it("exposes the same shared tabOrder property on standard non-Anvil widgets and on no other widget", () => {
    const types = WidgetFactory.getWidgetTypes();

    expect(types.length).toBeGreaterThan(0);

    let exposedCount = 0;

    for (const type of types) {
      const config = WidgetFactory.getWidgetPropertyPaneConfig(
        type,
        {} as WidgetProps,
      );
      const controls = collectTabOrderControls(config);

      if (shouldExposeTabOrderProperty(type) && config.length > 0) {
        expect({ type, count: controls.length }).toEqual({ type, count: 1 });
        assertSharedTabOrderControl(controls[0]);

        const accessibilitySection = config.find(
          (item) =>
            (item as PropertyPaneSectionConfig).sectionName ===
            TAB_ORDER_SECTION_NAME,
        ) as PropertyPaneSectionConfig | undefined;

        expect({ type, hasSection: !!accessibilitySection }).toEqual({
          type,
          hasSection: true,
        });
        exposedCount++;
      } else {
        expect({ type, count: controls.length }).toEqual({ type, count: 0 });
      }
    }

    // sanity check that the shared property is broadly exposed
    expect(exposedCount).toBeGreaterThan(30);
  });

  it("does not expose tabOrder on Anvil-only or internal widgets", () => {
    for (const type of [
      "WDS_BUTTON_WIDGET",
      "SECTION_WIDGET",
      "ZONE_WIDGET",
      "CANVAS_WIDGET",
      "SKELETON_WIDGET",
    ]) {
      const config = WidgetFactory.getWidgetPropertyPaneConfig(
        type,
        {} as WidgetProps,
      );

      expect(collectTabOrderControls(config)).toHaveLength(0);
    }
  });
});
