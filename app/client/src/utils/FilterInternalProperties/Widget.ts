import type { EntityDefinitionsOptions } from "ce/utils/autocomplete/EntityDefinitions";
import type {
  ConfigTree,
  DataTree,
  WidgetEntity,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import { isFunction } from "lodash";
import type { Def } from "tern";
import WidgetFactory from "utils/WidgetFactory";
import { addSettersToDefinitions } from "utils/autocomplete/dataTreeTypeDefCreator";

export const getWidgetChildrenPeekData = (
  widgetName: string,
  widgetType: string,
  dataTree: DataTree,
  configTree: ConfigTree,
) => {
  const peekData: Record<string, unknown> = {};
  const dataTreeWidget: WidgetEntity = dataTree[widgetName] as WidgetEntity;
  const widgetConfig = configTree[widgetName];

  if (widgetType !== "FORM_WIDGET" && dataTreeWidget) {
    const type: Exclude<
      EntityDefinitionsOptions,
      | "CANVAS_WIDGET"
      | "ICON_WIDGET"
      | "SKELETON_WIDGET"
      | "TABS_MIGRATOR_WIDGET"
    > = dataTreeWidget.type as any;
    let config: any = WidgetFactory.getAutocompleteDefinitions(type);
    if (config) {
      if (isFunction(config)) config = config(dataTreeWidget);

      addSettersToDefinitions(
        config as Def,
        configTree[widgetName] as WidgetEntityConfig,
      );

      const widgetProps = Object.keys(config).filter(
        (k) => k.indexOf("!") === -1,
      );

      widgetProps.forEach((prop) => {
        const data = dataTreeWidget[prop];

        let setterNames: string[] = [];

        if (widgetConfig.__setters) {
          setterNames = Object.keys(widgetConfig.__setters);
        }
        if (setterNames.includes(prop)) {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          peekData[prop] = function () {}; // tern inference required here
        } else {
          peekData[prop] = data;
        }
      });
    }
  }
  return { peekData };
};
