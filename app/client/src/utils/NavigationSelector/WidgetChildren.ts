import type { EntityDefinitionsOptions } from "ce/utils/autocomplete/EntityDefinitions";
import { entityDefinitions } from "ce/utils/autocomplete/EntityDefinitions";
import type { DataTree, WidgetEntity } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { isFunction } from "lodash";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { builderURL } from "RouteBuilder";
import type { EntityNavigationData } from "selectors/navigationSelectors";
import { createNavData } from "./common";

export const getWidgetChildrenNavData = (
  widget: FlattenedWidgetProps,
  dataTree: DataTree,
  pageId: string,
) => {
  const peekData: Record<string, unknown> = {};
  const childNavData: EntityNavigationData = {};
  const dataTreeWidget: WidgetEntity = dataTree[
    widget.widgetName
  ] as WidgetEntity;
  if (widget.type === "FORM_WIDGET") {
    const children: EntityNavigationData = {};
    const formChildren: EntityNavigationData = {};
    if (dataTreeWidget) {
      Object.keys(dataTreeWidget.data || {}).forEach((widgetName) => {
        const childWidgetId = (dataTree[widgetName] as WidgetEntity).widgetId;
        formChildren[widgetName] = createNavData({
          id: `${widget.widgetName}.data.${widgetName}`,
          name: widgetName,
          type: ENTITY_TYPE.WIDGET,
          url: builderURL({ pageId, hash: childWidgetId }),
          peekable: false,
          peekData: undefined,
          children: {},
        });
      });
    }
    children.data = createNavData({
      id: `${widget.widgetName}.data`,
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
    let config: any = entityDefinitions[type];
    if (config) {
      if (isFunction(config)) config = config(dataTreeWidget);
      const widgetProps = Object.keys(config).filter(
        (k) => k.indexOf("!") === -1,
      );
      widgetProps.forEach((prop) => {
        const data = dataTreeWidget[prop];
        peekData[prop] = data;
        childNavData[prop] = createNavData({
          id: `${widget.widgetName}.${prop}`,
          name: `${widget.widgetName}.${prop}`,
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
