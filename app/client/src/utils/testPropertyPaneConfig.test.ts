import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
  ValidationConfig,
} from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { isFunction } from "lodash";
import widgets from "ee/widgets";
import WidgetFactory from "WidgetProvider/factory";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";

function validatePropertyPaneConfig(
  config: PropertyPaneConfig[],
  isWidgetHidden: boolean,
) {
  for (const sectionOrControlConfig of config) {
    const sectionConfig = sectionOrControlConfig as PropertyPaneSectionConfig;

    if (sectionConfig.sectionName && isFunction(sectionConfig.sectionName)) {
      return ` SectionName should be a string and not a function. Search won't work for functions at the moment`;
    }

    if (sectionOrControlConfig.children) {
      for (const propertyControlConfig of sectionOrControlConfig.children) {
        const propertyControlValidation = validatePropertyControl(
          propertyControlConfig,
          isWidgetHidden,
        );

        if (propertyControlValidation !== true)
          return propertyControlValidation;
      }
    }
  }

  return true;
}

function validatePropertyControl(
  config: PropertyPaneConfig,
  isWidgetHidden: boolean,
): boolean | string {
  const _config = config as PropertyPaneControlConfig;
  const controls = ["INPUT_TEXT"];

  if (_config.label && isFunction(_config.label)) {
    return `${_config.propertyName}: Label should be a string and not a function. Search won't work for functions at the moment`;
  }

  if (
    (_config.isJSConvertible || controls.includes(_config.controlType)) &&
    !_config.isTriggerProperty
  ) {
    if (!_config.isBindProperty)
      return `${
        _config.propertyName
      }: isBindProperty should be true if isJSConvertible is true or when control type is [${controls.join(
        " | ",
      )}]`;

    if (!_config.validation)
      return `${
        _config.propertyName
      }: validation should be defined if isJSConvertible is true  or when control type is [${controls.join(
        " | ",
      )}]`;
  }

  if (controls.includes(_config.controlType) && _config.isJSConvertible) {
    return `${
      _config.propertyName
    }: No need of setting isJSConvertible since users can write JS inside [${controls.join(
      " | ",
    )}]`;
  }

  if (_config.validation !== undefined) {
    const res = validateValidationStructure(_config.validation);

    if (res !== true) return `${_config.propertyName}: ${res}`;
  }

  if (_config.children) {
    for (const child of _config.children) {
      const res = validatePropertyControl(child, isWidgetHidden);

      if (res !== true) return `${_config.propertyName}.${res}`;
    }
  }

  if (_config.panelConfig) {
    if (_config.panelConfig.children) {
      const res = validatePropertyPaneConfig(
        _config.panelConfig.children,
        isWidgetHidden,
      );

      if (res !== true) return `${_config.propertyName}.${res}`;
    }

    if (_config.panelConfig.contentChildren) {
      const res = validatePropertyPaneConfig(
        _config.panelConfig.contentChildren,
        isWidgetHidden,
      );

      if (res !== true) return `${_config.propertyName}.${res}`;
    }

    if (_config.panelConfig.styleChildren) {
      const res = validatePropertyPaneConfig(
        _config.panelConfig.styleChildren,
        isWidgetHidden,
      );

      if (res !== true) return `${_config.propertyName}.${res}`;
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
      return `For a ${ValidationTypes.FUNCTION} type validation, expected type and example are mandatory`;
  }

  return true;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isNotFloat = (n: any) => {
  return Number(n) === n && n % 1 === 0;
};

describe("Tests all widget's propertyPane config", () => {
  beforeAll(() => {
    registerWidgets(widgets);
  });

  widgets
    // Exclude WDS widgets from the tests, since they work differently
    .filter((widget) => !widget.type.includes("WDS"))
    .forEach((widget) => {
      const config = widget.getConfig();

      it(`Checks ${widget.type}'s propertyPaneConfig`, () => {
        const propertyPaneConfig = widget.getPropertyPaneConfig();

        expect(
          validatePropertyPaneConfig(propertyPaneConfig, !!config.hideCard),
        ).toStrictEqual(true);
        const propertyPaneContentConfig = widget.getPropertyPaneContentConfig();

        expect(
          validatePropertyPaneConfig(
            propertyPaneContentConfig,
            !!config.isDeprecated,
          ),
        ).toStrictEqual(true);
        const propertyPaneStyleConfig = widget.getPropertyPaneStyleConfig();

        expect(
          validatePropertyPaneConfig(
            propertyPaneStyleConfig,
            !!config.isDeprecated,
          ),
        ).toStrictEqual(true);
      });
      it(`Check if ${widget.type}'s dimensions are always integers`, () => {
        const defaults = widget.getDefaults();

        expect(isNotFloat(defaults.rows)).toBe(true);
        expect(isNotFloat(defaults.columns)).toBe(true);
      });

      if (config.isDeprecated) {
        it(`Check if ${widget.type}'s deprecation config has a proper replacement Widget`, () => {
          const widgetType = widget.type;

          if (config.replacement === undefined) {
            fail(`${widgetType}'s replacement widget is not defined`);
          }

          const replacementWidgetType = config.replacement;
          const replacementWidget = WidgetFactory.get(replacementWidgetType);
          const replacementWidgetConfig = replacementWidget?.getConfig();

          if (replacementWidgetConfig === undefined) {
            fail(
              `${widgetType}'s replacement widget ${replacementWidgetType} does not resolve to an actual widget Config`,
            );
          }

          if (replacementWidgetConfig?.isDeprecated) {
            fail(
              `${widgetType}'s replacement widget ${replacementWidgetType} itself is deprecated. Cannot have a deprecated widget as a replacement for another deprecated widget`,
            );
          }

          if (replacementWidgetConfig?.hideCard) {
            fail(
              `${widgetType}'s replacement widget ${replacementWidgetType} should be available in the entity Explorer`,
            );
          }
        });
      }

      it(`Check if ${widget.type}'s setter method are configured correctly`, () => {
        const setterConfig = widget.getSetterConfig();

        if (setterConfig) {
          expect(setterConfig).toHaveProperty("__setters");
          const setters = setterConfig.__setters;

          for (const [setterName, config] of Object.entries(setters)) {
            expect(config).toHaveProperty("type");
            expect(config).toHaveProperty("path");
            expect(setterName).toContain("set");
            const type = config.type;
            const path = config.path;

            expect(typeof type).toBe("string");
            expect(typeof path).toBe("string");
          }
        }
      });
    });
});
