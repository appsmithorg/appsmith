import { WidgetProps } from "widgets/BaseWidget";
import {
  PropertyPaneConfig,
  ValidationConfig,
} from "constants/PropertyControlConstants";
import { get, isObject, isUndefined, omitBy } from "lodash";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

/**
 * @typedef {Object} Paths
 * @property {Object} configBindingPaths - The Binding Path
 * @property {Object} configTriggerPaths - The Trigger Path
 * @property {Object} configValidationPaths - The Validation Path
 */

/**
 * This function gets the binding validation and trigger paths from a config
 * @param config
 * @param path
 * @returns {Paths} Paths
 */
const checkPathsInConfig = (
  config: any,
  path: string,
): {
  configBindingPaths: Record<string, EvaluationSubstitutionType>;
  configTriggerPaths: Record<string, true>;
  configValidationPaths: Record<string, ValidationConfig>;
} => {
  const configBindingPaths: Record<string, EvaluationSubstitutionType> = {};
  const configTriggerPaths: Record<string, true> = {};
  const configValidationPaths: Record<any, ValidationConfig> = {};

  // Purely a Binding Path
  if (config.isBindProperty && !config.isTriggerProperty) {
    configBindingPaths[path] =
      config.evaluationSubstitutionType || EvaluationSubstitutionType.TEMPLATE;
    if (config.validation) {
      configValidationPaths[path] = config.validation;
    }
  } else if (config.isBindProperty && config.isTriggerProperty) {
    configTriggerPaths[path] = true;
  }
  return { configBindingPaths, configTriggerPaths, configValidationPaths };
};

const childHasPanelConfig = (
  config: any,
  widget: WidgetProps,
  basePath: string,
) => {
  const panelPropertyPath = config.propertyName;
  const widgetPanelPropertyValues = get(widget, panelPropertyPath);
  let bindingPaths: Record<string, EvaluationSubstitutionType> = {};
  let triggerPaths: Record<string, true> = {};
  let validationPaths: Record<any, ValidationConfig> = {};
  if (widgetPanelPropertyValues) {
    Object.values(widgetPanelPropertyValues).forEach(
      (widgetPanelPropertyValue: any) => {
        config.panelConfig.children.forEach((panelColumnConfig: any) => {
          let isSectionHidden = false;
          if ("hidden" in panelColumnConfig) {
            isSectionHidden = panelColumnConfig.hidden(
              widget,
              `${basePath}.${widgetPanelPropertyValue.id}`,
            );
          }
          if (!isSectionHidden) {
            panelColumnConfig.children.forEach(
              (panelColumnControlConfig: any) => {
                const panelPropertyConfigPath = `${basePath}.${widgetPanelPropertyValue.id}.${panelColumnControlConfig.propertyName}`;
                let isControlHidden = false;
                if ("hidden" in panelColumnControlConfig) {
                  isControlHidden = panelColumnControlConfig.hidden(
                    widget,
                    panelPropertyConfigPath,
                  );
                }
                if (!isControlHidden) {
                  const {
                    configBindingPaths,
                    configTriggerPaths,
                    configValidationPaths,
                  } = checkPathsInConfig(
                    panelColumnControlConfig,
                    panelPropertyConfigPath,
                  );
                  bindingPaths = { ...configBindingPaths, ...bindingPaths };
                  triggerPaths = { ...configTriggerPaths, ...triggerPaths };
                  validationPaths = {
                    ...configValidationPaths,
                    ...validationPaths,
                  };
                  // Has child Panel Config
                  if (panelColumnControlConfig.panelConfig) {
                    const {
                      bindingPaths: panelBindingPaths,
                      triggerPaths: panelTriggerPaths,
                      validationPaths: panelValidationPaths,
                    } = childHasPanelConfig(
                      panelColumnControlConfig,
                      widgetPanelPropertyValue,
                      panelPropertyConfigPath,
                    );
                    bindingPaths = { ...panelBindingPaths, ...bindingPaths };
                    triggerPaths = { ...panelTriggerPaths, ...triggerPaths };
                    validationPaths = {
                      ...panelValidationPaths,
                      ...validationPaths,
                    };
                  }
                }
              },
            );
          }
        });
      },
    );
  }

  return { bindingPaths, triggerPaths, validationPaths };
};

export const getAllPathsFromPropertyConfig = (
  widget: WidgetProps,
  widgetConfig: readonly PropertyPaneConfig[],
  defaultProperties: Record<string, any>,
): {
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  triggerPaths: Record<string, true>;
  validationPaths: Record<string, ValidationConfig>;
} => {
  let bindingPaths: Record<string, EvaluationSubstitutionType> = {};
  Object.keys(defaultProperties).forEach(
    (property) =>
      (bindingPaths[property] = EvaluationSubstitutionType.TEMPLATE),
  );
  let triggerPaths: Record<string, true> = {};
  let validationPaths: Record<any, ValidationConfig> = {};
  widgetConfig.forEach((config) => {
    if (config.children) {
      config.children.forEach((controlConfig: any) => {
        const basePath = controlConfig.propertyName;
        let isHidden = false;
        if ("hidden" in controlConfig) {
          isHidden = controlConfig.hidden(widget, basePath);
        }
        if (!isHidden) {
          const path = controlConfig.propertyName;
          const {
            configBindingPaths,
            configTriggerPaths,
            configValidationPaths,
          } = checkPathsInConfig(controlConfig, path);
          // Update default path configs with the ones in the property config
          bindingPaths = { ...bindingPaths, ...configBindingPaths };
          triggerPaths = { ...triggerPaths, ...configTriggerPaths };
          validationPaths = { ...validationPaths, ...configValidationPaths };
        }
        // Has child Panel Config
        if (controlConfig.panelConfig) {
          const resultingPaths = childHasPanelConfig(
            controlConfig,
            widget,
            basePath,
          );
          bindingPaths = { ...bindingPaths, ...resultingPaths.bindingPaths };
          triggerPaths = { ...triggerPaths, ...resultingPaths.triggerPaths };
          validationPaths = {
            ...validationPaths,
            ...resultingPaths.validationPaths,
          };
        }
        if (controlConfig.children) {
          const basePropertyPath = controlConfig.propertyName;
          const widgetPropertyValue = get(widget, basePropertyPath, []);
          // Property in object structure
          if (
            !isUndefined(widgetPropertyValue) &&
            isObject(widgetPropertyValue)
          ) {
            Object.keys(widgetPropertyValue).forEach((key: string) => {
              const objectIndexPropertyPath = `${basePropertyPath}.${key}`;
              controlConfig.children.forEach((childPropertyConfig: any) => {
                const childArrayPropertyPath = `${objectIndexPropertyPath}.${childPropertyConfig.propertyName}`;
                const {
                  configBindingPaths,
                  configTriggerPaths,
                  configValidationPaths,
                } = checkPathsInConfig(
                  childPropertyConfig,
                  childArrayPropertyPath,
                );
                bindingPaths = { ...bindingPaths, ...configBindingPaths };
                triggerPaths = { ...triggerPaths, ...configTriggerPaths };
                validationPaths = {
                  ...validationPaths,
                  ...configValidationPaths,
                };
              });
            });
          }
        }
      });
    }
  });

  return { bindingPaths, triggerPaths, validationPaths };
};

/**
 * this function gets the next available row for pasting widgets
 * NOTE: this function excludes modal widget when calculating next available row
 *
 * @param parentContainerId
 * @param canvasWidgets
 * @returns
 */
export const nextAvailableRowInContainer = (
  parentContainerId: string,
  canvasWidgets: { [widgetId: string]: FlattenedWidgetProps },
) => {
  const filteredCanvasWidgets = omitBy(canvasWidgets, (widget) => {
    return widget.type === "MODAL_WIDGET";
  });

  return (
    Object.values(filteredCanvasWidgets).reduce(
      (prev: number, next: any) =>
        next?.parentId === parentContainerId && next.bottomRow > prev
          ? next.bottomRow
          : prev,
      0,
    ) + 1
  );
};
