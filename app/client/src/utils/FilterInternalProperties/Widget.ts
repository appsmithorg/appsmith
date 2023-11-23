import type {
  WidgetEntity,
  WidgetEntityConfig,
} from "@appsmith/entities/DataTree/types";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";
import type { EntityDefinitionsOptions } from "@appsmith/utils/autocomplete/EntityDefinitions";
import { isFunction } from "lodash";
import type { Def } from "tern";
import WidgetFactory from "WidgetProvider/factory";
import { addSettersToDefinitions } from "utils/autocomplete/defCreatorUtils";

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

      // Need to add this in order to add the setters to the definitions which will appear in the peekOverlay
      addSettersToDefinitions(
        config as Def,
        dataTreeWidget,
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
