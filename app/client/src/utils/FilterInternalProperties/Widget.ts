import type { EntityDefinitionsOptions } from "@appsmith/utils/autocomplete/EntityDefinitions";
import type { DataTree, WidgetEntity } from "entities/DataTree/dataTreeFactory";
import { isFunction } from "lodash";
import WidgetFactory from "utils/WidgetFactory";

export const getWidgetChildrenPeekData = (
  widgetName: string,
  widgetType: string,
  dataTree: DataTree,
) => {
  const peekData: Record<string, unknown> = {};
  const dataTreeWidget: WidgetEntity = dataTree[widgetName] as WidgetEntity;
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
      const widgetProps = Object.keys(config).filter(
        (k) => k.indexOf("!") === -1,
      );
      widgetProps.forEach((prop) => {
        const data = dataTreeWidget[prop];
        peekData[prop] = data;
      });
    }
  }
  return { peekData };
};
