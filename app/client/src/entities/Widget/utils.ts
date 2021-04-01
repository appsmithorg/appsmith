import { WidgetProps } from "widgets/BaseWidget";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { get } from "lodash";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

export const getAllPathsFromPropertyConfig = (
  widget: WidgetProps,
  widgetConfig: readonly PropertyPaneConfig[],
  defaultProperties: Record<string, any>,
): {
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  triggerPaths: Record<string, true>;
} => {
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};
  Object.keys(defaultProperties).forEach(
    (property) =>
      (bindingPaths[property] = EvaluationSubstitutionType.TEMPLATE),
  );
  const triggerPaths: Record<string, true> = {};
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
              EvaluationSubstitutionType.TEMPLATE;
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
                                EvaluationSubstitutionType.TEMPLATE;
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
                    bindingPaths[childArrayPropertyPath] =
                      EvaluationSubstitutionType.TEMPLATE;
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

  return { bindingPaths, triggerPaths };
};

export const nextAvailableRowInContainer = (
  parentContainerId: string,
  canvasWidgets: { [widgetId: string]: FlattenedWidgetProps },
) => {
  return (
    Object.values(canvasWidgets).reduce(
      (prev: number, next: any) =>
        next?.parentId === parentContainerId && next.bottomRow > prev
          ? next.bottomRow
          : prev,
      0,
    ) + 1
  );
};
