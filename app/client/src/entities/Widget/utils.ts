import { WidgetProps } from "widgets/BaseWidget";
import {
  PropertyPaneConfig,
  ValidationConfig,
} from "constants/PropertyControlConstants";
import { get, isObject, isUndefined, omitBy } from "lodash";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { WidgetTypes } from "constants/WidgetConstants";

export const getAllPathsFromPropertyConfig = (
  widget: WidgetProps,
  widgetConfig: readonly PropertyPaneConfig[],
  defaultProperties: Record<string, any>,
): {
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  triggerPaths: Record<string, true>;
  validationPaths: Record<string, ValidationConfig>;
} => {
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};
  Object.keys(defaultProperties).forEach(
    (property) =>
      (bindingPaths[property] = EvaluationSubstitutionType.TEMPLATE),
  );
  const triggerPaths: Record<string, true> = {};
  const validationPaths: Record<any, ValidationConfig> = {};
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
            bindingPaths[controlConfig.propertyName] =
              controlConfig.evaluationSubstitutionType ||
              EvaluationSubstitutionType.TEMPLATE;
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
                              bindingPaths[panelPropertyPath] =
                                controlConfig.evaluationSubstitutionType ||
                                EvaluationSubstitutionType.TEMPLATE;
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
          const basePropertyPath = controlConfig.propertyName;
          const widgetPropertyValue = get(widget, basePropertyPath, []);
          // Property in object structure
          if (
            !isUndefined(widgetPropertyValue) &&
            isObject(widgetPropertyValue)
          ) {
            Object.keys(widgetPropertyValue).map((key: string) => {
              const objectIndexPropertyPath = `${basePropertyPath}.${key}`;
              controlConfig.children.forEach((childPropertyConfig: any) => {
                const childArrayPropertyPath = `${objectIndexPropertyPath}.${childPropertyConfig.propertyName}`;

                if (
                  childPropertyConfig.isBindProperty &&
                  !childPropertyConfig.isTriggerProperty
                ) {
                  bindingPaths[childArrayPropertyPath] =
                    childPropertyConfig.evaluationSubstitutionType ||
                    EvaluationSubstitutionType.TEMPLATE;
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
    return widget.type === WidgetTypes.MODAL_WIDGET;
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
