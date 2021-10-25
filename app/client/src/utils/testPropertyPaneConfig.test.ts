import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  ValidationConfig,
} from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { isError } from "lodash";
import AudioWidget from "widgets/AudioWidget";
import VideoWidget from "widgets/VideoWidget";

function validatePropertyPaneConfig(config: PropertyPaneConfig[]) {
  return config.map((sectionOrControlConfig: PropertyPaneConfig) => {
    if (sectionOrControlConfig.children) {
      sectionOrControlConfig.children = sectionOrControlConfig.children.map(
        validatePropertyControl,
      );
    }
    return sectionOrControlConfig;
  });
}

function validatePropertyControl(
  config: PropertyPaneConfig,
): PropertyPaneConfig {
  const _config = config as PropertyPaneControlConfig;
  try {
    if (_config.validation !== undefined) {
      if (!_config.isBindProperty) {
        throw Error(
          "isBindProperty should be true for evaluating the validation structure",
        );
      }
      _config.validation = validateValidationStructure(_config.validation);
    }
    if (_config.isJSConvertible !== undefined) {
      if (!_config.isBindProperty && _config.isJSConvertible) {
        throw Error("isBindProperty has to be true if isJSConvertible is true");
      }
    }
    if (_config.children) {
      _config.children = _config.children.map(validatePropertyControl);
    }
  } catch (e) {
    if (isError(e)) {
      throw Error(`Error on ${_config.propertyName}: ${e.message}`);
    }
  }
  return _config;
}

function validateValidationStructure(
  config: ValidationConfig,
): ValidationConfig {
  if (
    config.type === ValidationTypes.FUNCTION &&
    config.params &&
    config.params.fn
  ) {
    config.params.fnString = config.params.fn.toString();
    if (!config.params.expected)
      console.error(
        `Error in configuration ${JSON.stringify(config)}: For a ${
          ValidationTypes.FUNCTION
        } type validation, expected type and example are mandatory`,
      );
    delete config.params.fn;
  }
  return config;
}

describe("Tests all widget's propertyPane config", () => {
  [VideoWidget, AudioWidget].forEach((widget) => {
    it(`Checks ${widget.getWidgetType()}'s propertyPaneConfig`, () => {
      const propertyPaneConfig = widget.getPropertyPaneConfig();
      const validatedPropertyPaneConfig = validatePropertyPaneConfig(
        propertyPaneConfig,
      );
      expect(validatedPropertyPaneConfig).toBeTruthy();
    });
  });
});
