import { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
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
});
