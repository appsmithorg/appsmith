import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  ValidationConfig,
} from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { ALL_WDIGETS_AND_CONFIG } from "./WidgetRegistry";

function validatePropertyPaneConfig(config: PropertyPaneConfig[]) {
  for (const sectionOrControlConfig of config) {
    if (sectionOrControlConfig.children) {
      for (const propertyControlConfig of sectionOrControlConfig.children) {
        const propertyControlValidation = validatePropertyControl(
          propertyControlConfig,
        );
        if (propertyControlValidation !== true)
          return propertyControlValidation;
      }
    }
  }

  return true;
}

function validatePropertyControl(config: PropertyPaneConfig): boolean | string {
  const _config = config as PropertyPaneControlConfig;
  if (_config.validation !== undefined) {
    if (!_config.isBindProperty) {
      return "isBindProperty should be true for evaluating the validation structure";
    }
    const res = validateValidationStructure(_config.validation);
    if (res !== true) return res;
  }
  if (_config.isJSConvertible !== undefined) {
    if (!_config.isBindProperty && _config.isJSConvertible) {
      return "isBindProperty has to be true if isJSConvertible is true";
    }
  }
  if (_config.children) {
    for (const child of _config.children) {
      const res = validatePropertyControl(child);
      if (res !== true) return res;
    }
  }
  return true;
}

function validateValidationStructure(
  config: ValidationConfig,
): boolean | string {
  if (
    config.type === ValidationTypes.FUNCTION &&
    config.params &&
    config.params.fn
  ) {
    if (!config.params.expected)
      return `Error in configuration ${JSON.stringify(config)}: For a ${
        ValidationTypes.FUNCTION
      } type validation, expected type and example are mandatory`;
  }
  return true;
}

describe("Tests all widget's propertyPane config", () => {
  ALL_WDIGETS_AND_CONFIG.forEach((widgetAndConfig) => {
    const widget: any = widgetAndConfig[0];
    it(`Checks ${widget.getWidgetType()}'s propertyPaneConfig`, () => {
      const propertyPaneConfig = widget.getPropertyPaneConfig();
      const validatedPropertyPaneConfig = validatePropertyPaneConfig(
        propertyPaneConfig,
      );
      expect(validatedPropertyPaneConfig).toStrictEqual(true);
    });
  });
});
