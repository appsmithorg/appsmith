import {
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import generatePanelPropertyConfig from "./generatePanelPropertyConfig";

describe(".generatePanelPropertyConfig", () => {
  it("generates nested panel property config based on level", () => {
    const level = 2;
    const result = generatePanelPropertyConfig(level);

    expect(result).not.toBeUndefined();

    let currentLevel = 1;
    let currentPropertyConfig = result;

    while (currentLevel <= level) {
      expect(currentPropertyConfig?.editableTitle).toEqual(true);
      expect(currentPropertyConfig?.titlePropertyName).toEqual("label");
      expect(currentPropertyConfig?.panelIdPropertyName).toEqual("identifier");

      const fieldConfigurationProperty = (currentPropertyConfig?.children[0]
        .children as PropertyPaneControlConfig[]).find(
        ({ propertyName }) => propertyName === "children",
      );

      expect(fieldConfigurationProperty).not.toBeUndefined();
      expect(fieldConfigurationProperty?.label).toEqual("Field Configuration");
      expect(fieldConfigurationProperty?.controlType).toEqual(
        "FIELD_CONFIGURATION",
      );
      expect(fieldConfigurationProperty?.hidden).toBeDefined();

      currentLevel += 1;
      currentPropertyConfig = fieldConfigurationProperty?.panelConfig;
    }
  });

  it("should verify customJSControl for non textual control type with isJSConvertible enabled", (done) => {
    const level = 2;
    const panelPropertyConfig = generatePanelPropertyConfig(level);
    const TEXTUAL_OR_ACTION_CONTROLS = [
      "ACTION_SELECTOR",
      "INPUT_TEXT",
      "JSON_FORM_COMPUTE_CONTROL",
    ];

    expect(panelPropertyConfig).not.toBeUndefined();

    const sections = panelPropertyConfig?.children as PropertyPaneSectionConfig[];

    sections?.forEach((section) => {
      (section.children as PropertyPaneControlConfig[])?.forEach(
        (propertyConfig) => {
          if (
            propertyConfig.isJSConvertible &&
            !TEXTUAL_OR_ACTION_CONTROLS.includes(propertyConfig.controlType) &&
            propertyConfig.customJSControl !== "JSON_FORM_COMPUTE_VALUE"
          ) {
            done.fail(
              `${section.sectionName} - ${propertyConfig.propertyName} should define "customJSControl" property as JSON_FORM_COMPUTE_VALUE`,
            );
          }
        },
      );
    });
    done();
  });
});
