import type {
  PropertyPaneConfig,
  ValidationConfig,
} from "constants/PropertyControlConstants";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { get, isObject, isUndefined, omitBy } from "lodash";
import memoize from "micro-memoize";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetProps } from "widgets/BaseWidget";

/**
 * @typedef {Object} Paths
 * @property {Object} configBindingPaths - The Binding Path
 * @property {Object} configReactivePaths - The Dynamic Property Path
 * @property {Object} configTriggerPaths - The Trigger Path
 * @property {Object} configValidationPaths - The Validation Path
 */

/**
 * All widget's property or paths where user can write javaScript bindings using mustache syntax are called bindingPaths.
 * Widget's meta and derived paths aren't binding paths as user can't add or remove binding for those value.
 */
type BindingPaths = Record<string, EvaluationSubstitutionType>;
/**
 * Binding paths and non-binding paths of widget/action together form reactivePaths.
 */
type ReactivePaths = Record<string, EvaluationSubstitutionType>;

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
  configBindingPaths: BindingPaths;
  configReactivePaths: ReactivePaths;
  configTriggerPaths: Record<string, true>;
  configValidationPaths: Record<string, ValidationConfig>;
} => {
  const configBindingPaths: BindingPaths = {};
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
  return {
    configBindingPaths,
    configReactivePaths: configBindingPaths, // All bindingPaths are reactivePaths.
    configTriggerPaths,
    configValidationPaths,
  };
};

// "originalWidget" param here always contains the complete widget props
// as this function's widget parameter tends to change in each iteration
const childHasPanelConfig = (
  config: any,
  widget: WidgetProps,
  basePath: string,
  originalWidget: WidgetProps,
) => {
  const panelPropertyPath = config.propertyName;
  const widgetPanelPropertyValues = get(widget, panelPropertyPath);

  let bindingPaths: BindingPaths = {};
  let reactivePaths: ReactivePaths = {};
  let triggerPaths: Record<string, true> = {};
  let validationPaths: Record<any, ValidationConfig> = {};
  if (widgetPanelPropertyValues) {
    Object.values(widgetPanelPropertyValues).forEach(
      (widgetPanelPropertyValue: any) => {
        const { panelIdPropertyName } = config.panelConfig;
        const propertyPath = `${basePath}.${widgetPanelPropertyValue[panelIdPropertyName]}`;

        let panelConfigChildren = [
          ...(config.panelConfig.contentChildren || []),
          ...(config.panelConfig.styleChildren || []),
        ];

        if (panelConfigChildren.length === 0)
          panelConfigChildren = config.panelConfig.children;

        panelConfigChildren.forEach((panelColumnConfig: any) => {
          let isSectionHidden = false;
          if ("hidden" in panelColumnConfig) {
            isSectionHidden = panelColumnConfig.hidden(
              originalWidget,
              propertyPath,
            );
          }
          if (!isSectionHidden) {
            panelColumnConfig.children.forEach(
              (panelColumnControlOrSectionConfig: any) => {
                if (
                  panelColumnControlOrSectionConfig.sectionName !== undefined
                ) {
                  panelColumnControlOrSectionConfig.children.forEach(
                    (panelColumnControlConfig: any) => {
                      const panelPropertyConfigPath = `${propertyPath}.${panelColumnControlConfig.propertyName}`;
                      let isControlHidden = false;
                      if ("hidden" in panelColumnControlConfig) {
                        isControlHidden = panelColumnControlConfig.hidden(
                          originalWidget,
                          panelPropertyConfigPath,
                        );
                      }
                      if (!isControlHidden) {
                        const {
                          configBindingPaths,
                          configReactivePaths,
                          configTriggerPaths,
                          configValidationPaths,
                        } = checkPathsInConfig(
                          panelColumnControlConfig,
                          panelPropertyConfigPath,
                        );
                        bindingPaths = {
                          ...configBindingPaths,
                          ...bindingPaths,
                        };
                        reactivePaths = {
                          ...configReactivePaths,
                          ...reactivePaths,
                        };
                        triggerPaths = {
                          ...configTriggerPaths,
                          ...triggerPaths,
                        };
                        validationPaths = {
                          ...configValidationPaths,
                          ...validationPaths,
                        };
                        // Has child Panel Config
                        if (panelColumnControlConfig.panelConfig) {
                          const {
                            bindingPaths: panelBindingPaths,
                            reactivePaths: panelReactivePaths,
                            triggerPaths: panelTriggerPaths,
                            validationPaths: panelValidationPaths,
                          } = childHasPanelConfig(
                            panelColumnControlConfig,
                            widgetPanelPropertyValue,
                            panelPropertyConfigPath,
                            originalWidget,
                          );
                          bindingPaths = {
                            ...panelBindingPaths,
                            ...bindingPaths,
                          };
                          reactivePaths = {
                            ...panelReactivePaths,
                            ...reactivePaths,
                          };
                          triggerPaths = {
                            ...panelTriggerPaths,
                            ...triggerPaths,
                          };
                          validationPaths = {
                            ...panelValidationPaths,
                            ...validationPaths,
                          };
                        }
                      }
                    },
                  );
                } else {
                  const panelPropertyConfigPath = `${propertyPath}.${panelColumnControlOrSectionConfig.propertyName}`;
                  let isControlHidden = false;
                  if ("hidden" in panelColumnControlOrSectionConfig) {
                    isControlHidden = panelColumnControlOrSectionConfig.hidden(
                      originalWidget,
                      panelPropertyConfigPath,
                    );
                  }
                  if (!isControlHidden) {
                    const {
                      configBindingPaths,
                      configReactivePaths,
                      configTriggerPaths,
                      configValidationPaths,
                    } = checkPathsInConfig(
                      panelColumnControlOrSectionConfig,
                      panelPropertyConfigPath,
                    );
                    bindingPaths = {
                      ...configBindingPaths,
                      ...bindingPaths,
                    };
                    reactivePaths = {
                      ...configReactivePaths,
                      ...reactivePaths,
                    };
                    triggerPaths = { ...configTriggerPaths, ...triggerPaths };
                    validationPaths = {
                      ...configValidationPaths,
                      ...validationPaths,
                    };
                    // Has child Panel Config
                    if (panelColumnControlOrSectionConfig.panelConfig) {
                      const {
                        bindingPaths: panelBindingPaths,
                        reactivePaths: panelReactivePaths,
                        triggerPaths: panelTriggerPaths,
                        validationPaths: panelValidationPaths,
                      } = childHasPanelConfig(
                        panelColumnControlOrSectionConfig,
                        widgetPanelPropertyValue,
                        panelPropertyConfigPath,
                        originalWidget,
                      );
                      bindingPaths = {
                        ...panelBindingPaths,
                        ...bindingPaths,
                      };
                      reactivePaths = {
                        ...panelReactivePaths,
                        ...reactivePaths,
                      };
                      triggerPaths = { ...panelTriggerPaths, ...triggerPaths };
                      validationPaths = {
                        ...panelValidationPaths,
                        ...validationPaths,
                      };
                    }
                  }
                }
              },
            );
          }
        });
      },
    );
  }

  return { reactivePaths, triggerPaths, validationPaths, bindingPaths };
};

const getAllPathsFromPropertyConfigWithoutMemo = (
  widget: WidgetProps,
  widgetConfig: readonly PropertyPaneConfig[],
  defaultProperties: Record<string, any>,
): {
  bindingPaths: BindingPaths;
  reactivePaths: ReactivePaths;
  triggerPaths: Record<string, true>;
  validationPaths: Record<string, ValidationConfig>;
} => {
  let bindingPaths: BindingPaths = {};
  let reactivePaths: ReactivePaths = {};
  Object.keys(defaultProperties).forEach((property) => {
    reactivePaths[property] = EvaluationSubstitutionType.TEMPLATE;
  });
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
            configReactivePaths,
            configTriggerPaths,
            configValidationPaths,
          } = checkPathsInConfig(controlConfig, path);
          bindingPaths = {
            ...bindingPaths,
            ...configBindingPaths,
          };
          // Update default path configs with the ones in the property config
          reactivePaths = {
            ...reactivePaths,
            ...configReactivePaths,
          };
          triggerPaths = { ...triggerPaths, ...configTriggerPaths };
          validationPaths = { ...validationPaths, ...configValidationPaths };
        }
        // Has child Panel Config
        if (controlConfig.panelConfig) {
          const resultingPaths = childHasPanelConfig(
            controlConfig,
            widget,
            basePath,
            widget,
          );
          bindingPaths = {
            ...bindingPaths,
            ...resultingPaths.bindingPaths,
          };
          reactivePaths = {
            ...reactivePaths,
            ...resultingPaths.reactivePaths,
          };
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
                  configReactivePaths,
                  configTriggerPaths,
                  configValidationPaths,
                } = checkPathsInConfig(
                  childPropertyConfig,
                  childArrayPropertyPath,
                );
                bindingPaths = {
                  ...bindingPaths,
                  ...configBindingPaths,
                };
                reactivePaths = {
                  ...reactivePaths,
                  ...configReactivePaths,
                };
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

  return { reactivePaths, triggerPaths, validationPaths, bindingPaths };
};

export const getAllPathsFromPropertyConfig = memoize(
  getAllPathsFromPropertyConfigWithoutMemo,
  { maxSize: 1000 },
);

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
