import type { WidgetEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { builderURL } from "ee/RouteBuilder";
import type { EntityNavigationData } from "selectors/navigationSelectors";
import { createNavData } from "./common";

export const getWidgetChildrenNavData = (
  widgetName: string,
  widgetType: string,
  dataTree: DataTree,
  basePageId: string,
) => {
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
          url: builderURL({ basePageId, hash: childWidgetId }),
          children: {},
        });
      });
    }

    return { childNavData: children };
  }
};
