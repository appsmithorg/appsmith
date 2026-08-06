import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { loadAllWidgets } from "widgets";
import WidgetFactory from "WidgetProvider/factory";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
import type { WidgetProps } from "widgets/BaseWidget";
import { DynamicHeight, RegisteredWidgetFeatures } from "utils/WidgetFeatures";
import { clearAllWidgetFactoryCache } from "../decorators";
import { enhancePropertyPaneConfig, PropertyPaneConfigTypes } from "../helpers";

const DYNAMIC_HEIGHT_PROPERTY_NAME = "dynamicHeight";

function countDynamicHeightControls(
  config: readonly PropertyPaneConfig[],
): number {
  let count = 0;

  for (const item of config) {
    if (
      (item as PropertyPaneControlConfig).propertyName ===
      DYNAMIC_HEIGHT_PROPERTY_NAME
    ) {
      count++;
    }

    if (item.children) count += countDynamicHeightControls(item.children);
  }

  return count;
}

const features = {
  [RegisteredWidgetFeatures.DYNAMIC_HEIGHT]: {
    sectionIndex: 0,
    active: true,
    defaultValue: DynamicHeight.AUTO_HEIGHT,
  },
};

describe("enhancePropertyPaneConfig", () => {
  it("adds the dynamic height control to the configured section", () => {
    const config: PropertyPaneConfig[] = [
      { sectionName: "General", children: [] },
    ];

    const enhanced = enhancePropertyPaneConfig(
      config,
      features,
      PropertyPaneConfigTypes.CONTENT,
      "CONTAINER_WIDGET",
    );

    expect(countDynamicHeightControls(enhanced)).toBe(1);
  });

  // The widget's own config object is shared across calls when
  // getPropertyPaneContentConfig returns a module-level array, so enhancing it
  // must not write the feature controls back into it.
  it("does not mutate the config it is given", () => {
    const config: PropertyPaneConfig[] = [
      { sectionName: "General", children: [] },
    ];

    enhancePropertyPaneConfig(
      config,
      features,
      PropertyPaneConfigTypes.CONTENT,
      "CONTAINER_WIDGET",
    );

    expect(config[0].children).toHaveLength(0);
  });

  it("still applies the feature's enhancements to the section it copied", () => {
    const config: PropertyPaneConfig[] = [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "shouldScrollContents",
            label: "Scroll contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
    ];

    const enhanced = enhancePropertyPaneConfig(
      config,
      features,
      PropertyPaneConfigTypes.CONTENT,
      "CONTAINER_WIDGET",
    );

    const scrollContents = enhanced[0].children?.find(
      (child) =>
        (child as PropertyPaneControlConfig).propertyName ===
        "shouldScrollContents",
    ) as PropertyPaneControlConfig;

    expect(scrollContents.dependencies).toEqual([DYNAMIC_HEIGHT_PROPERTY_NAME]);
    expect(
      (scrollContents.hidden as (props: WidgetProps) => boolean)({
        dynamicHeight: DynamicHeight.AUTO_HEIGHT,
      } as unknown as WidgetProps),
    ).toBe(true);
  });

  it("adds exactly one dynamic height control when run repeatedly on the same config", () => {
    const config: PropertyPaneConfig[] = [
      { sectionName: "General", children: [] },
    ];

    for (let run = 0; run < 3; run++) {
      const enhanced = enhancePropertyPaneConfig(
        config,
        features,
        PropertyPaneConfigTypes.CONTENT,
        "CONTAINER_WIDGET",
      );

      expect(countDynamicHeightControls(enhanced)).toBe(1);
    }
  });
});

describe("dynamic height controls in the widget factory", () => {
  beforeAll(async () => {
    const widgetsMap = await loadAllWidgets();

    registerWidgets(Array.from(widgetsMap.values()));
  });

  afterAll(() => {
    clearAllWidgetFactoryCache();
  });

  function declaresDynamicHeight(type: string): boolean {
    return Boolean(
      WidgetFactory.widgetsMap.get(type)?.getFeatures?.()?.[
        RegisteredWidgetFeatures.DYNAMIC_HEIGHT
      ],
    );
  }

  // The memoized property pane configs are dropped during app initialisation
  // (clearAllWidgetFactoryCache), so every widget's config is built more than
  // once per browser session. Rebuilding must not accumulate feature controls.
  //
  // Asserting the exact expected count rather than "the count is stable" is
  // deliberate: a widget permanently stuck at two Height controls is the very
  // bug this guards, and it would pass a stability-only check.
  it("builds exactly the expected number of Height controls for every widget on every rebuild", () => {
    const widgetProperties = { events: [] } as unknown as WidgetProps;
    const types = WidgetFactory.getWidgetTypes();

    // Guard against a vacuous pass if widget registration ever regresses.
    expect(types.length).toBeGreaterThan(50);
    expect(types).toContain("CARD_WIDGET");
    expect(types).toContain("JSON_FORM_WIDGET");

    const wrong: string[] = [];
    const threw: string[] = [];

    for (const type of types) {
      const expected = declaresDynamicHeight(type) ? 1 : 0;

      for (let run = 0; run < 3; run++) {
        try {
          const count = countDynamicHeightControls(
            WidgetFactory.getWidgetPropertyPaneContentConfig(
              type,
              widgetProperties,
            ),
          );

          if (count !== expected) {
            wrong.push(`${type} run ${run}: ${count} (expected ${expected})`);
          }
        } catch (error) {
          threw.push(`${type} run ${run}: ${(error as Error).message}`);
        }

        clearAllWidgetFactoryCache();
      }
    }

    expect(wrong).toEqual([]);
    // No widget may be silently skipped — a throw would otherwise hide a leak.
    expect(threw).toEqual([]);
  });

  // The two widgets whose configs actually regressed, named explicitly so this
  // survives changes to the widget registry.
  it.each(["CARD_WIDGET", "JSON_FORM_WIDGET"])(
    "keeps a single Height control in the General section for %s across cache clears",
    (type) => {
      const widgetProperties = {} as WidgetProps;

      for (let run = 0; run < 3; run++) {
        const config = WidgetFactory.getWidgetPropertyPaneContentConfig(
          type,
          widgetProperties,
        );

        expect(countDynamicHeightControls(config)).toBe(1);

        // The feature is injected by positional sectionIndex, so also pin where
        // it lands — inserting a section above "General" would silently move it.
        const owningSections = config
          .filter((section) =>
            section.children?.some(
              (child) =>
                (child as PropertyPaneControlConfig).propertyName ===
                DYNAMIC_HEIGHT_PROPERTY_NAME,
            ),
          )
          .map((section) => (section as PropertyPaneSectionConfig).sectionName);

        expect(owningSections).toEqual(["General"]);

        clearAllWidgetFactoryCache();
      }
    },
  );
});
