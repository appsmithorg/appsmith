import { WidgetProps } from "widgets/BaseWidget";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { get } from "lodash";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { VALIDATION_TYPES } from "constants/WidgetValidation";

export const getAllPathsFromPropertyConfig = (
  widget: WidgetProps,
  widgetConfig: readonly PropertyPaneConfig[],
  derivedProperties: Record<string, true>,
): {
  bindingPaths: Record<string, true>;
  triggerPaths: Record<string, true>;
  validationPaths: Record<string, VALIDATION_TYPES>;
} => {
  const bindingPaths: Record<string, true> = derivedProperties;
  const triggerPaths: Record<string, true> = {};
  const validationPaths: Record<any, VALIDATION_TYPES> = {};
  widgetConfig.forEach((config) => {
    if (config.children) {
      config.children.forEach((controlConfig: any) => {
        const basePath = controlConfig.propertyName;
        let isHidden = false;
        if ("hidden" in controlConfig) {
          isHidden = controlConfig.hidden(widget, basePath);
        }
        if (!isHidden) {
          if (
            controlConfig.isBindProperty &&
            !controlConfig.isTriggerProperty
          ) {
            bindingPaths[controlConfig.propertyName] = true;
            if (controlConfig.validation) {
              validationPaths[controlConfig.propertyName] =
                controlConfig.validation;
            }
          } else if (
            controlConfig.isBindProperty &&
            controlConfig.isTriggerProperty
          ) {
            triggerPaths[controlConfig.propertyName] = true;
          }
        }
        if (controlConfig.panelConfig) {
          const panelPropertyPath = controlConfig.propertyName;
          const widgetPanelPropertyValues = get(widget, panelPropertyPath);
          if (widgetPanelPropertyValues) {
            Object.values(widgetPanelPropertyValues).forEach(
              (widgetPanelPropertyValue: any) => {
                controlConfig.panelConfig.children.forEach(
                  (panelColumnConfig: any) => {
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
                          const panelPropertyPath = `${basePath}.${widgetPanelPropertyValue.id}.${panelColumnControlConfig.propertyName}`;
                          let isControlHidden = false;
                          if ("hidden" in panelColumnControlConfig) {
                            isControlHidden = panelColumnControlConfig.hidden(
                              widget,
                              panelPropertyPath,
                            );
                          }
                          if (!isControlHidden) {
                            if (
                              panelColumnControlConfig.isBindProperty &&
                              !panelColumnControlConfig.isTriggerProperty
                            ) {
                              bindingPaths[panelPropertyPath] = true;
                              if (panelColumnControlConfig.validation) {
                                validationPaths[panelPropertyPath] =
                                  panelColumnControlConfig.validation;
                              }
                            } else if (
                              panelColumnControlConfig.isBindProperty &&
                              panelColumnControlConfig.isTriggerProperty
                            ) {
                              triggerPaths[panelPropertyPath] = true;
                            }
                          }
                        },
                      );
                    }
                  },
                );
              },
            );
          }
        }
        if (controlConfig.children) {
          // Property in array structure
          const basePropertyPath = controlConfig.propertyName;
          const widgetPropertyValue = get(widget, basePropertyPath, []);
          if (Array.isArray(widgetPropertyValue)) {
            widgetPropertyValue.forEach(
              (arrayPropertyValue: any, index: number) => {
                const arrayIndexPropertyPath = `${basePropertyPath}[${index}]`;
                controlConfig.children.forEach((childPropertyConfig: any) => {
                  const childArrayPropertyPath = `${arrayIndexPropertyPath}.${childPropertyConfig.propertyName}`;
                  if (
                    childPropertyConfig.isBindProperty &&
                    !childPropertyConfig.isTriggerProperty
                  ) {
                    bindingPaths[childArrayPropertyPath] = true;
                    if (childPropertyConfig.validation) {
                      validationPaths[childArrayPropertyPath] =
                        childPropertyConfig.validation;
                    }
                  } else if (
                    childPropertyConfig.isBindProperty &&
                    childPropertyConfig.isTriggerProperty
                  ) {
                    triggerPaths[childArrayPropertyPath] = true;
                  }
                });
              },
            );
          }
        }
      });
    }
  });

  return { bindingPaths, triggerPaths, validationPaths };
};

export const nextAvailableRowInContainer = (
  parenContainertId: string,
  canvasWidgets: { [widgetId: string]: FlattenedWidgetProps },
) => {
  return (
    Object.values(canvasWidgets).reduce(
      (prev: number, next: any) =>
        next?.parentId === parenContainertId && next.bottomRow > prev
          ? next.bottomRow
          : prev,
      0,
    ) + 1
  );
};
