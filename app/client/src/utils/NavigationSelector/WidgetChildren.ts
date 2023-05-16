import type { EntityDefinitionsOptions } from "@appsmith/utils/autocomplete/EntityDefinitions";
import type { DataTree, WidgetEntity } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { isFunction } from "lodash";
import { builderURL } from "RouteBuilder";
import type { EntityNavigationData } from "selectors/navigationSelectors";
import { createNavData } from "./common";
import WidgetFactory from "utils/WidgetFactory";

export const getWidgetChildrenNavData = (
  widgetName: string,
  widgetType: string,
  dataTree: DataTree,
  pageId: string,
) => {
  const peekData: Record<string, unknown> = {};
  const childNavData: EntityNavigationData = {};
  const dataTreeWidget: WidgetEntity = dataTree[widgetName] as WidgetEntity;
  if (widgetType === "FORM_WIDGET") {
    const children: EntityNavigationData = {};
    const formChildren: EntityNavigationData = {};
    if (dataTreeWidget) {
      Object.keys(dataTreeWidget.data || {}).forEach((childWidgetName) => {
        const childWidgetId = (dataTree[childWidgetName] as WidgetEntity)
          .widgetId;
        formChildren[childWidgetName] = createNavData({
          id: `${widgetName}.data.${childWidgetName}`,
          name: childWidgetName,
          type: ENTITY_TYPE.WIDGET,
          url: builderURL({ pageId, hash: childWidgetId }),
          peekable: false,
          peekData: undefined,
          children: {},
        });
      });
    }
    children.data = createNavData({
      id: `${widgetName}.data`,
      name: "data",
      type: ENTITY_TYPE.WIDGET,
      url: undefined,
      peekable: false,
      peekData: undefined,
      children: formChildren,
    });

    return { childNavData: children, peekData };
  }
  if (dataTreeWidget) {
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
        childNavData[prop] = createNavData({
          id: `${widgetName}.${prop}`,
          name: `${widgetName}.${prop}`,
          type: ENTITY_TYPE.WIDGET,
          url: undefined,
          peekable: true,
          peekData: undefined,
          children: {},
        });
      });
    }
    return { childNavData, peekData };
  }
};
