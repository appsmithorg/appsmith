import { WidgetProps } from "widgets/BaseWidget";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { get } from "lodash";

export const getAllPathsFromPropertyConfig = (
  widget: WidgetProps,
  widgetConfig: readonly PropertyPaneConfig[],
  derivedProperties: Record<string, true>,
): {
  bindingPaths: Record<string, true>;
  triggerPaths: Record<string, true>;
} => {
  const bindingPaths: Record<string, true> = derivedProperties;
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
            bindingPaths[controlConfig.propertyName] = true;
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
          widgetPanelPropertyValues.forEach(
            (widgetPanelPropertyValue: any, index: number) => {
              controlConfig.panelConfig.children.forEach(
                (panelColumnConfig: any) => {
                  let isSectionHidden = false;
                  if ("hidden" in panelColumnConfig) {
                    isSectionHidden = panelColumnConfig.hidden(
                      widget,
                      `${basePath}[${index}]`,
                    );
                  }
                  if (!isSectionHidden) {
                    panelColumnConfig.children.forEach(
                      (panelColumnControlConfig: any) => {
                        const panelPropertyPath = `${basePath}[${index}].${panelColumnControlConfig.propertyName}`;
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
      });
    }
  });

  return { bindingPaths, triggerPaths };
};
