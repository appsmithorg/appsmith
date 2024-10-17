/* eslint-disable @typescript-eslint/no-explicit-any */
import flow from "lodash/flow";
import type { DSLWidget } from "../types";
import log from "loglevel";
import get from "lodash/get";
import isString from "lodash/isString";
import memoize from "micro-memoize";
import { isObject, isUndefined } from "lodash";
import { generateReactKey, isDynamicValue } from "../utils";

export const WidgetHeightLimits = {
  MAX_HEIGHT_IN_ROWS: 9000,
  MIN_HEIGHT_IN_ROWS: 4,
  MIN_CANVAS_HEIGHT_IN_ROWS: 10,
};

function updateMinMaxDynamicHeight(
  props: any,
  propertyName: string,
  propertyValue: unknown,
) {
  const updates = [
    {
      propertyPath: propertyName,
      propertyValue: propertyValue,
    },
  ];

  if (propertyValue === "AUTO_HEIGHT_WITH_LIMITS") {
    const minDynamicHeight = parseInt(props.minDynamicHeight, 10);

    if (
      isNaN(minDynamicHeight) ||
      minDynamicHeight < WidgetHeightLimits.MIN_HEIGHT_IN_ROWS
    ) {
      updates.push({
        propertyPath: "minDynamicHeight",
        propertyValue: WidgetHeightLimits.MIN_HEIGHT_IN_ROWS,
      });
    }

    const maxDynamicHeight = parseInt(props.maxDynamicHeight, 10);

    if (
      isNaN(maxDynamicHeight) ||
      maxDynamicHeight === WidgetHeightLimits.MAX_HEIGHT_IN_ROWS ||
      maxDynamicHeight <= WidgetHeightLimits.MIN_HEIGHT_IN_ROWS
    ) {
      updates.push({
        propertyPath: "maxDynamicHeight",
        propertyValue: props.bottomRow - props.topRow + 2,
      });
    }

    // Case where maxDynamicHeight is zero
    if (isNaN(maxDynamicHeight) || maxDynamicHeight === 0) {
      updates.push({
        propertyPath: "maxDynamicHeight",
        propertyValue: props.bottomRow - props.topRow,
      });
    }
  } else if (propertyValue === "AUTO_HEIGHT") {
    const minHeightInRows = props.isCanvas
      ? WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS
      : WidgetHeightLimits.MIN_HEIGHT_IN_ROWS;

    updates.push(
      {
        propertyPath: "minDynamicHeight",
        propertyValue: minHeightInRows,
      },
      {
        propertyPath: "maxDynamicHeight",
        propertyValue: WidgetHeightLimits.MAX_HEIGHT_IN_ROWS,
      },
    );
  }

  if (propertyValue === "FIXED") {
    updates.push({
      propertyPath: "originalBottomRow",
      propertyValue: undefined,
    });
    updates.push({
      propertyPath: "originalTopRow",
      propertyValue: undefined,
    });
  }

  // The following are updates which apply to specific widgets.
  if (
    propertyValue === "AUTO_HEIGHT" ||
    propertyValue === "AUTO_HEIGHT_WITH_LIMITS"
  ) {
    if (props.dynamicHeight === "FIXED") {
      updates.push({
        propertyPath: "originalBottomRow",
        propertyValue: props.bottomRow,
      });
      updates.push({
        propertyPath: "originalTopRow",
        propertyValue: props.topRow,
      });
    }

    if (!props.shouldScrollContents) {
      updates.push({
        propertyPath: "shouldScrollContents",
        propertyValue: true,
      });
    }

    if (props.overflow !== undefined) {
      updates.push({
        propertyPath: "overflow",
        propertyValue: "NONE",
      });
    }

    if (props.scrollContents === true) {
      updates.push({
        propertyPath: "scrollContents",
        propertyValue: false,
      });
    }

    if (props.fixedFooter === true) {
      updates.push({
        propertyPath: "fixedFooter",
        propertyValue: false,
      });
    }
  }

  return updates;
}

export const PropertyPaneConfigTemplates: Record<string, any[]> = {
  dynamicHeight: [
    {
      helpText:
        "Auto Height: Configure the way the widget height reacts to content changes.",
      propertyName: "dynamicHeight",
      label: "Height",
      controlType: "DROP_DOWN",
      isBindProperty: false,
      isTriggerProperty: false,
      dependencies: [
        "shouldScrollContents",
        "maxDynamicHeight",
        "minDynamicHeight",
        "bottomRow",
        "topRow",
        "overflow",
        "dynamicHeight",
        "isCanvas",
      ],
      updateHook: updateMinMaxDynamicHeight,
      helperText: (props: any) => {
        return props.isCanvas && props.dynamicHeight === "AUTO_HEIGHT"
          ? "This widget shows an internal scroll when you add widgets in edit mode. It'll resize after you've added widgets. The scroll won't exist in view mode."
          : "";
      },
      options: [
        {
          label: "Auto Height",
          value: "AUTO_HEIGHT",
        },
        {
          label: "Auto Height with limits",
          value: "AUTO_HEIGHT_WITH_LIMITS",
        },
        {
          label: "Fixed",
          value: "FIXED",
        },
      ],
      postUpdateAction: "CHECK_CONTAINERS_FOR_AUTO_HEIGHT",
    },
  ],
};

function findAndUpdatePropertyPaneControlConfig(
  config: any[],
  propertyPaneUpdates: Record<string, Record<string, unknown>>,
): any[] {
  return config.map((sectionConfig: any) => {
    if (
      Array.isArray(sectionConfig.children) &&
      sectionConfig.children.length > 0
    ) {
      Object.keys(propertyPaneUpdates).forEach((propertyName: string) => {
        const controlConfigIndex: number | undefined =
          sectionConfig.children?.findIndex(
            (controlConfig: any) => controlConfig.propertyName === propertyName,
          );

        if (
          controlConfigIndex !== undefined &&
          controlConfigIndex > -1 &&
          sectionConfig.children
        ) {
          sectionConfig.children[controlConfigIndex] = {
            ...sectionConfig.children[controlConfigIndex],
            ...propertyPaneUpdates[propertyName],
          };
        }
      });
    }

    return sectionConfig;
  });
}

const WidgetFeaturePropertyPaneEnhancements: Record<
  string,
  (config: any[], widgetType?: string) => any[]
> = {
  dynamicHeight: (config: any[], widgetType?: string) => {
    function hideWhenDynamicHeightIsEnabled(props: any) {
      return (
        props.dynamicHeight === "AUTO_HEIGHT_WITH_LIMITS" ||
        props.dynamicHeight === "AUTO_HEIGHT"
      );
    }

    let update = findAndUpdatePropertyPaneControlConfig(config, {
      shouldScrollContents: {
        hidden: hideWhenDynamicHeightIsEnabled,
        dependencies: ["dynamicHeight"],
      },
      scrollContents: {
        hidden: hideWhenDynamicHeightIsEnabled,
        dependencies: ["dynamicHeight"],
      },
      fixedFooter: {
        hidden: hideWhenDynamicHeightIsEnabled,
        dependencies: ["dynamicHeight"],
      },
      overflow: {
        hidden: hideWhenDynamicHeightIsEnabled,
        dependencies: ["dynamicHeight"],
      },
    });

    if (widgetType === "MODAL_WIDGET") {
      update = findAndUpdatePropertyPaneControlConfig(update, {
        dynamicHeight: {
          options: [
            {
              label: "Auto Height",
              value: "AUTO_HEIGHT",
            },
            {
              label: "Fixed",
              value: "FIXED",
            },
          ],
        },
      });
    }

    return update;
  },
};

function enhancePropertyPaneConfig(
  config: any[],
  features?: any,
  configType?: string,
  widgetType?: string,
) {
  // Enhance property pane with widget features
  // TODO(abhinav): The following "configType" check should come
  // from the features themselves.

  if (features && (configType === undefined || configType === "CONTENT")) {
    Object.keys(features).forEach((registeredFeature: string) => {
      const { sectionIndex } = features[registeredFeature];
      const sectionName = config[sectionIndex]?.sectionName;

      // This has been designed to check if the sectionIndex provided in the
      // features configuration of the widget to point to the section named "General"
      // If not, it logs an error
      // This is a sanity check, and doesn't effect the functionality of the feature
      // For consistency, we expect that all "Auto Height" property pane controls
      // be present in the "General" section of the property pane
      if (!sectionName || sectionName !== "General") {
        log.error(
          `Invalid section index for feature: ${registeredFeature} in widget: ${widgetType}`,
        );
      }

      if (
        Array.isArray(config[sectionIndex].children) &&
        PropertyPaneConfigTemplates[registeredFeature]
      ) {
        config[sectionIndex].children?.push(
          ...PropertyPaneConfigTemplates[registeredFeature],
        );
        config = WidgetFeaturePropertyPaneEnhancements[registeredFeature](
          config,
          widgetType,
        );
      }
    });
  }

  return config;
}

export function convertFunctionsToString(config: any[]) {
  return config.map((sectionOrControlConfig: any) => {
    const controlConfig = sectionOrControlConfig;

    if (
      controlConfig.validation &&
      controlConfig.validation?.type === "FUNCTION" &&
      controlConfig.validation?.params &&
      controlConfig.validation?.params.fn
    ) {
      controlConfig.validation.params.fnString =
        controlConfig.validation.params.fn.toString();
      delete controlConfig.validation.params.fn;

      return sectionOrControlConfig;
    }

    if (sectionOrControlConfig.children) {
      sectionOrControlConfig.children = convertFunctionsToString(
        sectionOrControlConfig.children,
      );
    }

    const config = sectionOrControlConfig;

    if (
      config.panelConfig &&
      config.panelConfig.children &&
      Array.isArray(config.panelConfig.children)
    ) {
      config.panelConfig.children = convertFunctionsToString(
        config.panelConfig.children,
      );

      sectionOrControlConfig = config;
    }

    if (
      config.panelConfig &&
      config.panelConfig.contentChildren &&
      Array.isArray(config.panelConfig.contentChildren)
    ) {
      config.panelConfig.contentChildren = convertFunctionsToString(
        config.panelConfig.contentChildren,
      );

      sectionOrControlConfig = config;
    }

    if (
      config.panelConfig &&
      config.panelConfig.styleChildren &&
      Array.isArray(config.panelConfig.styleChildren)
    ) {
      config.panelConfig.styleChildren = convertFunctionsToString(
        config.panelConfig.styleChildren,
      );

      sectionOrControlConfig = config;
    }

    return sectionOrControlConfig;
  });
}

export const addPropertyConfigIds = (config: any[]) => {
  return config.map((sectionOrControlConfig: any) => {
    sectionOrControlConfig.id = generateReactKey();

    if (sectionOrControlConfig.children) {
      sectionOrControlConfig.children = addPropertyConfigIds(
        sectionOrControlConfig.children,
      );
    }

    const config = sectionOrControlConfig;

    if (config.panelConfig) {
      if (
        config.panelConfig.children &&
        Array.isArray(config.panelConfig.children)
      ) {
        config.panelConfig.children = addPropertyConfigIds(
          config.panelConfig.children,
        );
      }

      if (
        config.panelConfig.contentChildren &&
        Array.isArray(config.panelConfig.contentChildren)
      ) {
        config.panelConfig.contentChildren = addPropertyConfigIds(
          config.panelConfig.contentChildren,
        );
      }

      if (
        config.panelConfig.styleChildren &&
        Array.isArray(config.panelConfig.styleChildren)
      ) {
        config.panelConfig.styleChildren = addPropertyConfigIds(
          config.panelConfig.styleChildren,
        );
      }

      sectionOrControlConfig = config;
    }

    return sectionOrControlConfig;
  });
};

function addSearchSpecificPropertiesToConfig(
  config: readonly any[],
  tag: string,
): any[] {
  return config.map((configItem) => {
    if (configItem.sectionName) {
      const sectionConfig = {
        ...configItem,
        collapsible: false,
        tag,
      };

      if (configItem.children) {
        sectionConfig.children = addSearchSpecificPropertiesToConfig(
          configItem.children,
          tag,
        );
      }

      return sectionConfig;
    } else if (configItem.controlType) {
      const controlConfig = configItem;

      if (controlConfig.panelConfig) {
        return {
          ...controlConfig,
          panelConfig: {
            ...controlConfig.panelConfig,
            searchConfig: generatePropertyPaneSearchConfig(
              controlConfig.panelConfig?.contentChildren ?? [],
              controlConfig.panelConfig?.styleChildren ?? [],
            ),
          },
        };
      }

      return controlConfig;
    }

    return configItem;
  });
}

export function generatePropertyPaneSearchConfig(
  contentConfig: readonly any[],
  styleConfig: readonly any[],
) {
  return [
    ...addSearchSpecificPropertiesToConfig(contentConfig, "CONTENT"),
    ...addSearchSpecificPropertiesToConfig(styleConfig, "STYLE"),
  ];
}

export function addSearchConfigToPanelConfig(config: readonly any[]) {
  return config.map((configItem) => {
    if (configItem.sectionName) {
      const sectionConfig = {
        ...configItem,
      };

      if (configItem.children) {
        sectionConfig.children = addSearchConfigToPanelConfig(
          configItem.children,
        );
      }

      return sectionConfig;
    } else if (configItem.controlType) {
      const controlConfig = configItem;

      if (controlConfig.panelConfig) {
        return {
          ...controlConfig,
          panelConfig: {
            ...controlConfig.panelConfig,
            searchConfig: generatePropertyPaneSearchConfig(
              controlConfig.panelConfig?.contentChildren ?? [],
              controlConfig.panelConfig?.styleChildren ?? [],
            ),
          },
        };
      }

      return controlConfig;
    }

    return configItem;
  });
}
// Cache for lazy-loaded widget configurations
let cachedWidgetConfigs: any | null = null;

/*
 Lazily load this file since it is very large and used in migrations for certain DSL versions. By lazily loading 
 this large file it can be reduce the main chunk only be loaded for certain limited conditions.
*/
const loadWidgetConfig = async () => {
  if (!cachedWidgetConfigs) {
    try {
      const { default: widgetConfigs } = await import(
        "../helpers/widget-configs.json"
      );

      cachedWidgetConfigs = widgetConfigs; // Cache the module for future use
    } catch (e) {
      log.error("Error loading SvgImportsMap", e);
    }
  }

  return cachedWidgetConfigs;
};

const getWidgetPropertyPaneContentConfig = async (
  type: string,
): Promise<readonly any[]> => {
  const widgetConfigs = await loadWidgetConfig();
  const propertyPaneContentConfig = (widgetConfigs as any)[type]
    .propertyPaneContentConfig;

  const features = (widgetConfigs as any)[type].features;

  if (propertyPaneContentConfig) {
    const enhance = flow([
      enhancePropertyPaneConfig,
      convertFunctionsToString,
      addPropertyConfigIds,
      addSearchConfigToPanelConfig,
      Object.freeze,
    ]);

    const enhancedPropertyPaneContentConfig = enhance(
      propertyPaneContentConfig,
      features,
      "CONTENT",
      type,
    );

    return enhancedPropertyPaneContentConfig;
  } else {
    return [];
  }
};

const getWidgetPropertyPaneStyleConfig = async (
  type: string,
): Promise<readonly any[]> => {
  const widgetConfigs = await loadWidgetConfig();

  const propertyPaneStyleConfig = (widgetConfigs as any)[type]
    .propertyPaneStyleConfig;

  const features = (widgetConfigs as any)[type].features;

  if (propertyPaneStyleConfig) {
    const enhance = flow([
      enhancePropertyPaneConfig,
      convertFunctionsToString,
      addPropertyConfigIds,
      addSearchConfigToPanelConfig,
      Object.freeze,
    ]);

    const enhancedPropertyPaneConfig = enhance(
      propertyPaneStyleConfig,
      features,
      "STYLE",
    );

    return enhancedPropertyPaneConfig;
  } else {
    return [];
  }
};

const getWidgetPropertyPaneCombinedConfig = async (
  type: string,
): Promise<readonly any[]> => {
  const contentConfig = await getWidgetPropertyPaneContentConfig(type);
  const styleConfig = await getWidgetPropertyPaneStyleConfig(type);

  return [...contentConfig, ...styleConfig];
};

const getWidgetPropertyPaneConfig = async (
  type: string,
): Promise<readonly any[]> => {
  const widgetConfigs = await loadWidgetConfig();

  const propertyPaneConfig = (widgetConfigs as any)[type].propertyPaneConfig;

  const features = (widgetConfigs as any)[type].features;

  if (Array.isArray(propertyPaneConfig) && propertyPaneConfig.length > 0) {
    const enhance = flow([
      enhancePropertyPaneConfig,
      convertFunctionsToString,
      addPropertyConfigIds,
      Object.freeze,
    ]);
    const enhancedPropertyPaneConfig = enhance(propertyPaneConfig, features);

    return enhancedPropertyPaneConfig;
  } else {
    const config = await getWidgetPropertyPaneCombinedConfig(type);

    if (config === undefined) {
      log.error("Widget property pane config not defined", type);

      return [];
    } else {
      return config;
    }
  }
};

const checkPathsInConfig = (
  config: any,
  path: string,
): {
  configBindingPaths: any;
  configReactivePaths: any;
  configTriggerPaths: Record<string, true>;
  configValidationPaths: Record<string, any>;
} => {
  const configBindingPaths: any = {};
  const configTriggerPaths: Record<string, true> = {};
  const configValidationPaths: Record<any, any> = {};

  // Purely a Binding Path
  if (config.isBindProperty && !config.isTriggerProperty) {
    configBindingPaths[path] = config.evaluationSubstitutionType || "TEMPLATE";

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

const childHasPanelConfig = (
  config: any,
  widget: any,
  basePath: string,
  originalWidget: any,
) => {
  const panelPropertyPath = config.propertyName;
  const widgetPanelPropertyValues = get(widget, panelPropertyPath);

  let bindingPaths: any = {};
  let reactivePaths: any = {};
  let triggerPaths: Record<string, true> = {};
  let validationPaths: Record<any, any> = {};

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
  widget: any,
  widgetConfig: readonly any[],
  defaultProperties: Record<string, any>,
): {
  bindingPaths: any;
  reactivePaths: any;
  triggerPaths: Record<string, true>;
  validationPaths: Record<string, any>;
} => {
  let bindingPaths: any = {};
  let reactivePaths: any = {};

  Object.keys(defaultProperties).forEach((property) => {
    reactivePaths[property] = "TEMPLATE";
  });
  let triggerPaths: Record<string, true> = {};
  let validationPaths: Record<any, any> = {};

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

const getAllPathsFromPropertyConfig = memoize(
  getAllPathsFromPropertyConfigWithoutMemo,
  { maxSize: 1000 },
);

export const migrateIncorrectDynamicBindingPathLists = async (
  currentDSL: Readonly<DSLWidget>,
): Promise<DSLWidget> => {
  const migratedDsl = {
    ...currentDSL,
  };
  const dynamicBindingPathList: any[] = [];
  const propertyPaneConfig = await getWidgetPropertyPaneConfig(currentDSL.type);
  const { bindingPaths } = getAllPathsFromPropertyConfig(
    currentDSL,
    propertyPaneConfig,
    {},
  );

  Object.keys(bindingPaths).forEach((bindingPath) => {
    const pathValue = get(migratedDsl, bindingPath);

    if (pathValue && isString(pathValue)) {
      if (isDynamicValue(pathValue)) {
        dynamicBindingPathList.push({ key: bindingPath });
      }
    }
  });

  migratedDsl.dynamicBindingPathList = dynamicBindingPathList;

  if (currentDSL.children) {
    migratedDsl.children = await Promise.all(
      currentDSL.children.map(async (value) =>
        migrateIncorrectDynamicBindingPathLists(value),
      ),
    );
  }

  return migratedDsl;
};
