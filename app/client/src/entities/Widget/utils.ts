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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
  widget: WidgetProps,
  basePath: string,
  originalWidget: WidgetProps,
  bindingPaths: BindingPaths,
  reactivePaths: ReactivePaths,
  triggerPaths: Record<string, true>,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validationPaths: Record<any, ValidationConfig>,
) => {
  const panelPropertyPath = config.propertyName;
  const widgetPanelPropertyValues = get(widget, panelPropertyPath);

  if (widgetPanelPropertyValues) {
    Object.values(widgetPanelPropertyValues).forEach(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (widgetPanelPropertyValue: any) => {
        const { panelIdPropertyName } = config.panelConfig;
        const propertyPath = `${basePath}.${widgetPanelPropertyValue[panelIdPropertyName]}`;

        let panelConfigChildren = [
          ...(config.panelConfig.contentChildren || []),
          ...(config.panelConfig.styleChildren || []),
        ];

        if (panelConfigChildren.length === 0)
          panelConfigChildren = config.panelConfig.children;

        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (panelColumnControlOrSectionConfig: any) => {
                if (
                  panelColumnControlOrSectionConfig.sectionName !== undefined
                ) {
                  panelColumnControlOrSectionConfig.children.forEach(
                    // TODO: Fix this the next time the file is edited
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                        Object.assign(bindingPaths, configBindingPaths);
                        Object.assign(reactivePaths, configReactivePaths);
                        Object.assign(triggerPaths, configTriggerPaths);
                        Object.assign(validationPaths, configValidationPaths);

                        // Has child Panel Config
                        if (panelColumnControlConfig.panelConfig) {
                          const {
                            bindingPaths: panelBindingPaths,
                            reactivePaths: panelReactivePaths,
                            triggerPaths: panelTriggerPaths,
                            validationPaths: panelValidationPaths,
                          } = memoizedChildHasPanelConfig(
                            panelColumnControlConfig,
                            widgetPanelPropertyValue,
                            panelPropertyConfigPath,
                            originalWidget,
                            bindingPaths,
                            reactivePaths,
                            triggerPaths,
                            validationPaths,
                          );

                          Object.assign(bindingPaths, panelBindingPaths);
                          Object.assign(reactivePaths, panelReactivePaths);
                          Object.assign(triggerPaths, panelTriggerPaths);
                          Object.assign(validationPaths, panelValidationPaths);
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

                    Object.assign(bindingPaths, configBindingPaths);
                    Object.assign(reactivePaths, configReactivePaths);
                    Object.assign(triggerPaths, configTriggerPaths);
                    Object.assign(validationPaths, configValidationPaths);

                    // Has child Panel Config
                    if (panelColumnControlOrSectionConfig.panelConfig) {
                      const {
                        bindingPaths: panelBindingPaths,
                        reactivePaths: panelReactivePaths,
                        triggerPaths: panelTriggerPaths,
                        validationPaths: panelValidationPaths,
                      } = memoizedChildHasPanelConfig(
                        panelColumnControlOrSectionConfig,
                        widgetPanelPropertyValue,
                        panelPropertyConfigPath,
                        originalWidget,
                        bindingPaths,
                        reactivePaths,
                        triggerPaths,
                        validationPaths,
                      );

                      Object.assign(bindingPaths, panelBindingPaths);
                      Object.assign(reactivePaths, panelReactivePaths);
                      Object.assign(triggerPaths, panelTriggerPaths);
                      Object.assign(validationPaths, panelValidationPaths);
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

  return {
    reactivePaths: reactivePaths,
    triggerPaths: triggerPaths,
    validationPaths: validationPaths,
    bindingPaths: bindingPaths,
  };
};

const memoizedChildHasPanelConfig = memoize(childHasPanelConfig);

const getAllPathsFromPropertyConfigWithoutMemo = (
  widget: WidgetProps,
  widgetConfig: readonly PropertyPaneConfig[],
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultProperties: Record<string, any>,
): {
  bindingPaths: BindingPaths;
  reactivePaths: ReactivePaths;
  triggerPaths: Record<string, true>;
  validationPaths: Record<string, ValidationConfig>;
} => {
  const bindingPaths: BindingPaths = {};
  const reactivePaths: ReactivePaths = {};

  Object.keys(defaultProperties).forEach((property) => {
    reactivePaths[property] = EvaluationSubstitutionType.TEMPLATE;
  });
  const triggerPaths: Record<string, true> = {};
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validationPaths: Record<any, ValidationConfig> = {};

  widgetConfig.forEach((config) => {
    if (config.children) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

          Object.assign(bindingPaths, configBindingPaths);
          Object.assign(reactivePaths, configReactivePaths);
          Object.assign(triggerPaths, configTriggerPaths);
          Object.assign(validationPaths, configValidationPaths);
        }

        // Has child Panel Config
        if (controlConfig.panelConfig) {
          const resultingPaths = memoizedChildHasPanelConfig(
            controlConfig,
            widget,
            basePath,
            widget,
            {},
            {},
            {},
            {},
          );

          Object.assign(bindingPaths, resultingPaths.bindingPaths);
          Object.assign(reactivePaths, resultingPaths.reactivePaths);
          Object.assign(triggerPaths, resultingPaths.triggerPaths);
          Object.assign(validationPaths, resultingPaths.validationPaths);
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

              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                Object.assign(bindingPaths, configBindingPaths);
                Object.assign(reactivePaths, configReactivePaths);
                Object.assign(triggerPaths, configTriggerPaths);
                Object.assign(validationPaths, configValidationPaths);
              });
            });
          }
        }
      });
    }
  });

  return {
    reactivePaths: reactivePaths,
    triggerPaths: triggerPaths,
    validationPaths: validationPaths,
    bindingPaths: bindingPaths,
  };
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prev: number, next: any) =>
        next?.parentId === parentContainerId && next.bottomRow > prev
          ? next.bottomRow
          : prev,
      0,
    ) + 1
  );
};
